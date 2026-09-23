import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  RPC_URL: process.env.RPC_URL || 'https://rpc.mainnet.arc.io',
  CHAIN_ID: parseInt(process.env.CHAIN_ID || '5042', 10),
  USDC_ADDRESS: (process.env.USDC_ADDRESS || '0x3600000000000000000000000000000000000000') as `0x${string}`,
  TENDER_ADDRESS: (process.env.TENDER_ADDRESS || '0xbd457320e53e09507985e94edf1729e1a29c45d8') as `0x${string}`,
  DEPLOYER_PRIVATE_KEY: (process.env.DEPLOYER_PRIVATE_KEY ||
    '0x439ae3b7b27b5ef004f78e629a7011771a5101ea3ff51aa5e03c27ded94a0385') as `0x${string}`,
  AGENTS: {
    ALPHA: {
      id: 'agent-alpha',
      name: 'Agent-Alpha',
      model: 'GPT-4o mini (Quantized)',
      privateKey: (process.env.AGENT_ALPHA_KEY ||
        '0xf013f760aa8502d25e1b1cdf290df6b52578315dccf076b8b2c8e3fc9bdeb556') as `0x${string}`,
      strategy: {
        margin: 0.03, // 3%
        stepDecrement: 0.001, // 0.001 USDC micro step
        delayMs: 600, // 0.6s rapid undercut
        description: 'Fast lightweight model, ultra-thin margin, rapid price undercut',
      },
    },
    BETA: {
      id: 'agent-beta',
      name: 'Agent-Beta',
      model: 'Claude 3.5 Sonnet',
      privateKey: (process.env.AGENT_BETA_KEY ||
        '0xde07299ddefc77818a24433b6c53a1b46c4f8b5adab6e6dec802fe7a2b9674ea') as `0x${string}`,
      strategy: {
        margin: 0.06, // 6%
        stepDecrement: 0.001, // 0.001 USDC
        delayMs: 2800, // 2.8s balanced evaluation
        description: 'High precision model, evaluates task complexity and ensures quality',
      },
    },
    GAMMA: {
      id: 'agent-gamma',
      name: 'Agent-Gamma',
      model: 'Local Llama 3 (Edge Idle)',
      privateKey: (process.env.AGENT_GAMMA_KEY ||
        '0xc75c997a7f1f60b249f2b69ad44ec8847a51a1d73b934e9ecf61ddc3f51a930b') as `0x${string}`,
      strategy: {
        margin: 0.02, // 2%
        stepDecrement: 0.001, // 0.001 USDC
        delayMs: 5500, // Sniping near deadline
        description: 'Idle edge compute, monitors order book and snipes last-second bids',
      },
    },
    DELTA: {
      id: 'agent-delta',
      name: 'Agent-Delta',
      model: 'DeepSeek-R1 (Formal Audit)',
      privateKey: (process.env.AGENT_DELTA_KEY ||
        '0xa8caa3a58ac7cfcab02ec49baed1e0661e024bfc1dd6c6305f02c628f61fcb66') as `0x${string}`,
      strategy: {
        margin: 0.04, // 4%
        stepDecrement: 0.001, // 0.001 USDC
        delayMs: 8000, // Multi-step reasoning
        description: 'Formal verification & security model, audits invariants with deterministic proofs',
      },
    },
  },
};
