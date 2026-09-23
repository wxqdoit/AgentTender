import {
  createPublicClient,
  createWalletClient,
  http,
  fallback,
  formatUnits,
  parseUnits,
  type PublicClient,
  type WalletClient,
  type Address,
  defineChain,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read ABIs
const tenderAbiPath = path.resolve(__dirname, 'abi/AgentTender.json');
const usdcAbiPath = path.resolve(__dirname, 'abi/IERC20.json');

export const AGENT_TENDER_ABI = JSON.parse(fs.readFileSync(tenderAbiPath, 'utf-8'));
export const USDC_ABI = JSON.parse(fs.readFileSync(usdcAbiPath, 'utf-8'));

export const customChain = defineChain({
  id: CONFIG.CHAIN_ID,
  name: CONFIG.CHAIN_ID === 31337 ? 'Local Arc Devnet' : 'Arc Mainnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        CONFIG.RPC_URL,
        'https://rpc.mainnet.arc.io',
        'https://rpc.blockdaemon.mainnet.arc.io',
        'https://rpc.quicknode.mainnet.arc.io',
      ],
    },
  },
});

const rpcTransports = [
  http(CONFIG.RPC_URL, { retryCount: 3, retryDelay: 1000 }),
  http('https://rpc.mainnet.arc.io', { retryCount: 3, retryDelay: 1000 }),
  http('https://rpc.blockdaemon.mainnet.arc.io', { retryCount: 3, retryDelay: 1000 }),
  http('https://rpc.quicknode.mainnet.arc.io', { retryCount: 3, retryDelay: 1000 }),
];

export const publicClient = createPublicClient({
  chain: customChain,
  transport: fallback(rpcTransports),
});

export function getWalletClient(privateKey: `0x${string}`) {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: customChain,
    transport: fallback(rpcTransports),
  });
}

export function fromUSDC(amountRaw: bigint): number {
  return parseFloat(formatUnits(amountRaw, 6));
}

export function toUSDC(amount: number | string): bigint {
  return parseUnits(amount.toString(), 6);
}
