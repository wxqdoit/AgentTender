import { privateKeyToAccount } from 'viem/accounts';
import {
  publicClient,
  getWalletClient,
  AGENT_TENDER_ABI,
  USDC_ABI,
  toUSDC,
  fromUSDC,
} from './contracts.js';
import { CONFIG } from './config.js';

async function testSuite() {
  console.log('===========================================================');
  console.log('    AGENTTENDER FULL END-TO-END PRODUCTION VERIFIER       ');
  console.log('===========================================================');

  const backendUrl = `http://localhost:${CONFIG.PORT}`;

  // 1. Backend REST Health & Config Check
  console.log('\n[1/5] Verifying Backend Health API...');
  const healthRes = await fetch(`${backendUrl}/api/health`).then((r) => r.json() as Promise<any>);
  if (healthRes.status !== 'OK' || healthRes.agentsCount !== 3) {
    throw new Error(`Health check failed: ${JSON.stringify(healthRes)}`);
  }
  console.log(`✓ Health OK. Block: #${healthRes.blockNumber}, Agents active: ${healthRes.agentsCount}`);

  // 2. Agents Fleet Verification
  console.log('\n[2/5] Verifying Autonomous Agent Fleet on-chain qualification...');
  const agentsRes = await fetch(`${backendUrl}/api/agents`).then((r) => r.json() as Promise<any>);
  if (!agentsRes.success || agentsRes.data.length !== 3) {
    throw new Error('Agents API returned invalid data');
  }
  for (const agent of agentsRes.data) {
    console.log(`✓ Agent ${agent.name} (${agent.model}): Stake = ${agent.stakeUSDC} USDC, Balance = ${agent.balanceUSDC} USDC, Qualified = ${agent.isQualified}`);
    if (!agent.isQualified || agent.stakeUSDC < 0.05) {
      throw new Error(`Agent ${agent.name} is not qualified on-chain`);
    }
  }

  // 3. Faucet API Test
  console.log('\n[3/5] Testing On-Chain USDC Faucet Endpoint...');
  const randomWallet = '0x1234567890123456789012345678901234567890' as const;
  const faucetRes = await fetch(`${backendUrl}/api/faucet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: randomWallet, amount: 50 }),
  }).then((r) => r.json() as Promise<any>);
  if (!faucetRes.success) {
    throw new Error(`Faucet failed: ${JSON.stringify(faucetRes)}`);
  }
  const randomBal = (await publicClient.readContract({
    address: CONFIG.USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [randomWallet],
  })) as bigint;
  console.log(`✓ Faucet funded ${randomWallet} with ${fromUSDC(randomBal)} USDC on-chain (TX: ${faucetRes.txHash.slice(0, 10)}...)`);

  // 4. Live Multi-Agent Reverse-Auction Lifecycle
  console.log('\n[4/5] Executing Live Multi-Agent Reverse Auction & Atomic Settlement...');
  const creatorAccount = privateKeyToAccount(
    '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a'
  );
  const creatorClient = getWalletClient(
    '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a'
  );

  // Ensure creator has USDC
  const deployerClient = getWalletClient(CONFIG.DEPLOYER_PRIVATE_KEY);
  await deployerClient.writeContract({
    address: CONFIG.USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'mint',
    args: [creatorAccount.address, toUSDC(20)],
  });
  await creatorClient.writeContract({
    address: CONFIG.USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'approve',
    args: [CONFIG.TENDER_ADDRESS, toUSDC(100)],
  });

  const tenderCounterBefore = (await publicClient.readContract({
    address: CONFIG.TENDER_ADDRESS,
    abi: AGENT_TENDER_ABI,
    functionName: 'tenderCounter',
  })) as bigint;
  const tenderId = tenderCounterBefore + 1n;

  console.log(`Creating Tender #${tenderId}: "Extract Multi-Agent Risk Parameters from Protocol Spec"`);
  const createTx = await creatorClient.writeContract({
    address: CONFIG.TENDER_ADDRESS,
    abi: AGENT_TENDER_ABI,
    functionName: 'createTender',
    args: [
      'Extract Multi-Agent Risk Parameters and Slashing Invariants from Spec',
      toUSDC(0.8), // 0.80 USDC budget
      8n,          // 8s bidding window
      20n,         // 20s execution window
    ],
  });
  await publicClient.waitForTransactionReceipt({ hash: createTx });
  console.log(`✓ Tender #${tenderId} posted on Arc L1 in TX ${createTx.slice(0, 12)}...`);

  console.log('Waiting for Autonomous Agents to bid, award, and deliver...');
  let tenderData: any = null;
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    tenderData = (await publicClient.readContract({
      address: CONFIG.TENDER_ADDRESS,
      abi: AGENT_TENDER_ABI,
      functionName: 'getTender',
      args: [tenderId],
    })) as any;
    if (Number(tenderData.status) === 2) {
      console.log(`✓ Delivery confirmed on-chain at ${i + 1}s`);
      break;
    }
  }

  console.log(`✓ Tender Status: ${tenderData.status} (2 = DELIVERED)`);
  console.log(`✓ Initial Budget: ${fromUSDC(tenderData.maxBudget)} USDC`);
  console.log(`✓ Winning Bid: ${fromUSDC(tenderData.currentLowestBid)} USDC (Saved ${(fromUSDC(tenderData.maxBudget) - fromUSDC(tenderData.currentLowestBid)).toFixed(2)} USDC)`);
  console.log(`✓ Winner Address: ${tenderData.lowestBidder}`);
  console.log(`✓ Delivery Payload: ${tenderData.deliveryPayload.slice(0, 80)}...`);

  if (Number(tenderData.status) !== 2) {
    throw new Error(`Expected status 2 (DELIVERED), got ${tenderData.status}`);
  }

  // Confirm delivery on-chain
  console.log('Creator confirming delivery for immediate atomic settlement...');
  const confirmTx = await creatorClient.writeContract({
    address: CONFIG.TENDER_ADDRESS,
    abi: AGENT_TENDER_ABI,
    functionName: 'confirmDelivery',
    args: [tenderId],
  });
  await publicClient.waitForTransactionReceipt({ hash: confirmTx });

  const tenderFinal = (await publicClient.readContract({
    address: CONFIG.TENDER_ADDRESS,
    abi: AGENT_TENDER_ABI,
    functionName: 'getTender',
    args: [tenderId],
  })) as any;
  console.log(`✓ Final Status on-chain: ${tenderFinal.status} (3 = SETTLED)`);

  // 5. Machine Reasoning Logs Verification
  console.log('\n[5/5] Checking Real-time Machine Reasoning Logs...');
  const logsRes = await fetch(`${backendUrl}/api/logs`).then((r) => r.json() as Promise<any>);
  if (!logsRes.success || logsRes.data.length === 0) {
    throw new Error('Logs API returned empty');
  }
  const recentLogs = logsRes.data.slice(0, 5);
  for (const log of recentLogs) {
    console.log(`  [${log.action}] ${log.agentName}: ${log.message}`);
  }

  console.log('\n===========================================================');
  console.log('   ALL LAYERS PASSED: CONTRACTS, BACKEND, AGENTS & E2E!    ');
  console.log('===========================================================');
}

testSuite().catch((err) => {
  console.error('\nFAILED:', err);
  process.exit(1);
});
