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

async function runTestFlow() {
  console.log('>>> [TestFlow] Starting End-to-End On-chain Flow test...');

  // Creator Account (Anvil account 4)
  const creatorKey = '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a' as const;
  const creatorAccount = privateKeyToAccount(creatorKey);
  const creatorClient = getWalletClient(creatorKey);
  const deployerClient = getWalletClient(CONFIG.DEPLOYER_PRIVATE_KEY);

  console.log(`Creator Address: ${creatorAccount.address}`);

  // Fund creator with 10 USDC
  const fundTx = await deployerClient.writeContract({
    address: CONFIG.USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'mint',
    args: [creatorAccount.address, toUSDC(10)],
  });
  await publicClient.waitForTransactionReceipt({ hash: fundTx });

  // Creator approves USDC
  const approveTx = await creatorClient.writeContract({
    address: CONFIG.USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'approve',
    args: [CONFIG.TENDER_ADDRESS, toUSDC(10)],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveTx });

  // Query current tender count to know the new tenderId
  const tenderCounterBefore = (await publicClient.readContract({
    address: CONFIG.TENDER_ADDRESS,
    abi: AGENT_TENDER_ABI,
    functionName: 'tenderCounter',
  })) as bigint;

  const newTenderId = tenderCounterBefore + 1n;

  // Create Tender (0.50 USDC, 5s bidding window, 15s execution window)
  console.log(`Publishing Tender #${newTenderId} on-chain (Max Budget: 0.50 USDC, Window: 5s)...`);
  const createTx = await creatorClient.writeContract({
    address: CONFIG.TENDER_ADDRESS,
    abi: AGENT_TENDER_ABI,
    functionName: 'createTender',
    args: ['Extract Q2 2026 GAAP Net Profit YoY from Alphabet 10-Q filing', toUSDC(0.5), 5n, 15n],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: createTx });
  console.log(`Tender created in TX: ${receipt.transactionHash}`);

  console.log('Waiting 8 seconds for Autonomous Agents to bid, award, and deliver...');
  await new Promise((r) => setTimeout(r, 8000));

  // Query tender state
  const tender = (await publicClient.readContract({
    address: CONFIG.TENDER_ADDRESS,
    abi: AGENT_TENDER_ABI,
    functionName: 'getTender',
    args: [newTenderId],
  })) as any;

  console.log('----------------------------------------------------');
  console.log(`Tender ID:           ${tender.id}`);
  console.log(`Status:              ${tender.status} (2 = DELIVERED)`);
  console.log(`Max Budget:          ${fromUSDC(tender.maxBudget)} USDC`);
  console.log(`Winning Bid:         ${fromUSDC(tender.currentLowestBid)} USDC`);
  console.log(`Winner Address:      ${tender.lowestBidder}`);
  console.log(`Delivery Payload:    ${tender.deliveryPayload}`);
  console.log('----------------------------------------------------');

  if (Number(tender.status) === 2) {
    // Creator confirms delivery
    console.log('Creator calling confirmDelivery to trigger atomic settlement...');
    const confirmTx = await creatorClient.writeContract({
      address: CONFIG.TENDER_ADDRESS,
      abi: AGENT_TENDER_ABI,
      functionName: 'confirmDelivery',
      args: [newTenderId],
    });
    await publicClient.waitForTransactionReceipt({ hash: confirmTx });

    const tenderFinal = (await publicClient.readContract({
      address: CONFIG.TENDER_ADDRESS,
      abi: AGENT_TENDER_ABI,
      functionName: 'getTender',
      args: [newTenderId],
    })) as any;

    console.log(`Final Status:        ${tenderFinal.status} (3 = SETTLED)`);
    console.log('>>> [TestFlow] SUCCESS! Machine Commerce reverse auction fully verified on-chain!');
  } else {
    console.log(`Tender status is ${tender.status}, check logs.`);
  }
}

runTestFlow().catch(console.error);
