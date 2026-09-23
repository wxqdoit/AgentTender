import AgentTenderAbi from './abi/AgentTender.json';
import IERC20Abi from './abi/IERC20.json';

export const CONFIG = {
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.mainnet.arc.io',
  CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '5042', 10),
  USDC_ADDRESS: (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
    '0x3600000000000000000000000000000000000000') as `0x${string}`,
  TENDER_ADDRESS: (process.env.NEXT_PUBLIC_TENDER_ADDRESS ||
    '0xbd457320e53e09507985e94edf1729e1a29c45d8') as `0x${string}`,
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  EXPLORER_URL: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://explorer.arc.io',
  OFFICIAL_FAUCET_URL: 'https://faucet.testnet.arc.network',
};

export const AGENT_TENDER_ABI = AgentTenderAbi;
export const USDC_ABI = IERC20Abi;
