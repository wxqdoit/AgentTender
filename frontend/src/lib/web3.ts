import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseUnits,
  formatUnits,
  defineChain,
  type PublicClient,
  type Address,
} from 'viem';
import { arcTestnet, arc } from 'viem/chains';
import { CONFIG, AGENT_TENDER_ABI, USDC_ABI } from '../config';

export const arcDevnet = defineChain({
  id: 31337,
  name: 'Arc Local Devnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
});

export const activeChain =
  CONFIG.CHAIN_ID === 5042002
    ? arcTestnet
    : CONFIG.CHAIN_ID === 5042
    ? arc
    : arcDevnet;

export const publicClient: PublicClient = createPublicClient({
  chain: activeChain,
  transport: http(CONFIG.RPC_URL, { retryCount: 5, retryDelay: 1500, timeout: 20000 }),
});

export function getInjectedWalletClient() {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return createWalletClient({
      chain: activeChain,
      transport: custom((window as any).ethereum),
    });
  }
  return null;
}

export async function ensureWalletOnArcChain(): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    const ethereum = (window as any).ethereum;
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + CONFIG.CHAIN_ID.toString(16) }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902 || switchError.message?.includes('Unrecognized')) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x' + CONFIG.CHAIN_ID.toString(16),
              chainName: activeChain.name,
              nativeCurrency: activeChain.nativeCurrency,
              rpcUrls: [CONFIG.RPC_URL],
              blockExplorerUrls: activeChain.blockExplorers?.default?.url
                ? [activeChain.blockExplorers.default.url]
                : [],
            },
          ],
        });
      }
    }
  }
}

export async function fetchUSDCBalance(address: Address): Promise<number> {
  try {
    const raw = (await publicClient.readContract({
      address: CONFIG.USDC_ADDRESS,
      abi: USDC_ABI as any,
      functionName: 'balanceOf',
      args: [address],
    })) as bigint;
    return parseFloat(formatUnits(raw, 6));
  } catch (err) {
    console.warn('Failed to fetch USDC balance:', err);
    return 0;
  }
}

export async function fetchUserStake(address: Address): Promise<number> {
  try {
    const raw = (await publicClient.readContract({
      address: CONFIG.TENDER_ADDRESS,
      abi: AGENT_TENDER_ABI as any,
      functionName: 'stakes',
      args: [address],
    })) as bigint;
    return parseFloat(formatUnits(raw, 6));
  } catch (err) {
    console.warn('Failed to fetch stake balance:', err);
    return 0;
  }
}

export async function requestFaucet(address: Address, amount: number = 100): Promise<boolean> {
  try {
    const res = await fetch(`${CONFIG.BACKEND_URL}/api/faucet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, amount }),
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

export async function publishTender(params: {
  taskMetadataURI: string;
  maxBudgetUSDC: number;
  biddingWindowSeconds: number;
  executionWindowSeconds: number;
}): Promise<{ txHash: string; tenderId: number }> {
  const walletClient = getInjectedWalletClient();
  if (!walletClient) throw new Error('No wallet extension detected. Please connect your wallet.');
  await ensureWalletOnArcChain();
  const [account] = await walletClient.getAddresses();
  if (!account) throw new Error('Wallet not connected');

  const rawBudget = parseUnits(params.maxBudgetUSDC.toString(), 6);

  const allowance = (await publicClient.readContract({
    address: CONFIG.USDC_ADDRESS,
    abi: USDC_ABI as any,
    functionName: 'allowance',
    args: [account, CONFIG.TENDER_ADDRESS],
  })) as bigint;

  if (allowance < rawBudget) {
    const approveTx = await walletClient.writeContract({
      account,
      address: CONFIG.USDC_ADDRESS,
      abi: USDC_ABI as any,
      functionName: 'approve',
      args: [CONFIG.TENDER_ADDRESS, parseUnits('1000000', 6)],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });
  }

  const hash = await walletClient.writeContract({
    account,
    address: CONFIG.TENDER_ADDRESS,
    abi: AGENT_TENDER_ABI as any,
    functionName: 'createTender',
    args: [
      params.taskMetadataURI,
      rawBudget,
      BigInt(params.biddingWindowSeconds),
      BigInt(params.executionWindowSeconds),
    ],
  });
  await publicClient.waitForTransactionReceipt({ hash });

  const counter = (await publicClient.readContract({
    address: CONFIG.TENDER_ADDRESS,
    abi: AGENT_TENDER_ABI as any,
    functionName: 'tenderCounter',
  })) as bigint;

  return { txHash: hash, tenderId: Number(counter) };
}

export async function confirmDeliveryOnChain(tenderId: number): Promise<string> {
  const walletClient = getInjectedWalletClient();
  if (!walletClient) throw new Error('No wallet extension found');
  await ensureWalletOnArcChain();
  const [account] = await walletClient.getAddresses();
  if (!account) throw new Error('Wallet not connected');

  const hash = await walletClient.writeContract({
    account,
    address: CONFIG.TENDER_ADDRESS,
    abi: AGENT_TENDER_ABI as any,
    functionName: 'confirmDelivery',
    args: [BigInt(tenderId)],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function claimPayoutOnChain(tenderId: number): Promise<string> {
  const walletClient = getInjectedWalletClient();
  if (!walletClient) throw new Error('No wallet extension found');
  await ensureWalletOnArcChain();
  const [account] = await walletClient.getAddresses();
  if (!account) throw new Error('Wallet not connected');

  const hash = await walletClient.writeContract({
    account,
    address: CONFIG.TENDER_ADDRESS,
    abi: AGENT_TENDER_ABI as any,
    functionName: 'claimPayout',
    args: [BigInt(tenderId)],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function depositStakeOnChain(amountUSDC: number): Promise<string> {
  const raw = parseUnits(amountUSDC.toString(), 6);
  const walletClient = getInjectedWalletClient();
  if (!walletClient) throw new Error('No wallet extension found');
  await ensureWalletOnArcChain();
  const [account] = await walletClient.getAddresses();
  if (!account) throw new Error('Wallet not connected');

  const allowance = (await publicClient.readContract({
    address: CONFIG.USDC_ADDRESS,
    abi: USDC_ABI as any,
    functionName: 'allowance',
    args: [account, CONFIG.TENDER_ADDRESS],
  })) as bigint;

  if (allowance < raw) {
    const approveTx = await walletClient.writeContract({
      account,
      address: CONFIG.USDC_ADDRESS,
      abi: USDC_ABI as any,
      functionName: 'approve',
      args: [CONFIG.TENDER_ADDRESS, parseUnits('1000000', 6)],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });
  }

  const hash = await walletClient.writeContract({
    account,
    address: CONFIG.TENDER_ADDRESS,
    abi: AGENT_TENDER_ABI as any,
    functionName: 'depositStake',
    args: [raw],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function withdrawStakeOnChain(amountUSDC: number): Promise<string> {
  const raw = parseUnits(amountUSDC.toString(), 6);
  const walletClient = getInjectedWalletClient();
  if (!walletClient) throw new Error('No wallet extension found');
  await ensureWalletOnArcChain();
  const [account] = await walletClient.getAddresses();
  if (!account) throw new Error('Wallet not connected');

  const hash = await walletClient.writeContract({
    account,
    address: CONFIG.TENDER_ADDRESS,
    abi: AGENT_TENDER_ABI as any,
    functionName: 'withdrawStake',
    args: [raw],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
