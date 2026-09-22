import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { CONFIG } from './config.js';
import { indexer } from './indexer.js';
import { agentFleet } from './agents/agentFleet.js';
import {
  publicClient,
  getWalletClient,
  USDC_ABI,
  toUSDC,
  fromUSDC,
} from './contracts.js';

export function createApiServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.set("json replacer", (_: any, v: any) => (typeof v === "bigint" ? v.toString() : v));

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  function safeJsonStringify(obj: any) {
    return JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
  }

  // Broadcast to all connected clients
  function broadcast(event: { type: string; data: any }) {
    const payload = safeJsonStringify(event);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  // Subscribe to indexer events
  indexer.on('log', (log) => broadcast({ type: 'LOG', data: log }));
  indexer.on('tenderUpdated', (tender) => broadcast({ type: 'TENDER_UPDATE', data: tender }));
  indexer.on('newBid', (bid) => broadcast({ type: 'NEW_BID', data: bid }));

  // WebSocket connections
  wss.on('connection', (ws) => {
    // Send full initial state snapshot
    ws.send(
      safeJsonStringify({
        type: 'INIT',
        data: {
          tenders: indexer.getTenders(),
          agents: agentFleet.getAgentProfiles(),
          logs: indexer.getLogs(),
          config: {
            usdcAddress: CONFIG.USDC_ADDRESS,
            tenderAddress: CONFIG.TENDER_ADDRESS,
            chainId: CONFIG.CHAIN_ID,
            rpcUrl: CONFIG.RPC_URL,
          },
        },
      })
    );
  });

  // REST API Routes

  // Health check
  app.get('/api/health', async (req, res) => {
    try {
      const blockNumber = await publicClient.getBlockNumber();
      res.json({
        status: 'OK',
        blockNumber: blockNumber.toString(),
        chainId: CONFIG.CHAIN_ID,
        tenderAddress: CONFIG.TENDER_ADDRESS,
        usdcAddress: CONFIG.USDC_ADDRESS,
        agentsCount: agentFleet.getAgentProfiles().length,
      });
    } catch (err: any) {
      res.status(500).json({ status: 'ERROR', message: err.message });
    }
  });

  // Get tenders
  app.get('/api/tenders', (req, res) => {
    res.json({
      success: true,
      data: indexer.getTenders(),
    });
  });

  // Get specific tender
  app.get('/api/tenders/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    let tender = indexer.getTender(id);
    if (!tender) {
      tender = await indexer.syncTenderFromChain(id);
    }
    if (!tender) {
      return res.status(404).json({ success: false, error: 'Tender not found' });
    }
    res.json({ success: true, data: tender });
  });

  // Get machine logs
  app.get('/api/logs', (req, res) => {
    res.json({
      success: true,
      data: indexer.getLogs(),
    });
  });

  // Get agent profiles
  app.get('/api/agents', (req, res) => {
    res.json({
      success: true,
      data: agentFleet.getAgentProfiles(),
    });
  });

  // USDC Faucet endpoint (for local development or testnet testing)
  // Official Arc Testnet USDC faucet router
  app.post('/api/faucet', async (req, res) => {
    const { address, amount } = req.body;
    if (!address) return res.status(400).json({ success: false, error: 'Address is required' });
    const fundAmount = amount ? parseFloat(amount) : 0.1;
    try {
      const deployerClient = getWalletClient(CONFIG.DEPLOYER_PRIVATE_KEY);
      const txHash = await deployerClient.writeContract({
        address: CONFIG.USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [address as `0x${string}`, toUSDC(fundAmount)],
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
      res.json({ success: true, message: `Transferred official USDC`, txHash });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return { app, httpServer, wss };
}
