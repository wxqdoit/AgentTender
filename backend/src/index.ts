import { CONFIG } from './config.js';
import { createApiServer } from './server.js';
import { agentFleet } from './agents/agentFleet.js';

async function bootstrap() {
  console.log('====================================================');
  console.log('   AgentTender Backend & Autonomous Agent Fleet   ');
  console.log('   Machine Commerce Reverse-Auction Protocol       ');
  console.log('====================================================');
  console.log(`RPC URL:         ${CONFIG.RPC_URL}`);
  console.log(`Chain ID:        ${CONFIG.CHAIN_ID}`);
  console.log(`Tender Contract: ${CONFIG.TENDER_ADDRESS || 'Not set (will await)'}`);
  console.log(`USDC Contract:   ${CONFIG.USDC_ADDRESS || 'Not set (will await)'}`);
  console.log(`Server Port:     ${CONFIG.PORT}`);

  const { httpServer } = createApiServer();

  httpServer.listen(CONFIG.PORT, async () => {
    console.log(`[HTTP/WS] Server listening on http://0.0.0.0:${CONFIG.PORT}`);
    console.log(`[HTTP/WS] WebSocket endpoint ws://0.0.0.0:${CONFIG.PORT}`);

    if (CONFIG.TENDER_ADDRESS && CONFIG.USDC_ADDRESS) {
      await agentFleet.initializeFleet();
      agentFleet.startAutonomousActivityLoop();
    } else {
      console.log('[Fleet] Contracts not configured in .env. Waiting for deploy script...');
    }
  });
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
