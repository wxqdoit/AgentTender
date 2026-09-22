import { publicClient, AGENT_TENDER_ABI } from './contracts.js';
import { CONFIG } from './config.js';

async function main() {
  const count = await publicClient.readContract({
    address: CONFIG.TENDER_ADDRESS,
    abi: AGENT_TENDER_ABI,
    functionName: 'tenderCounter',
  }) as bigint;
  console.log('Total tenders count on contract:', count);
  for (let i = 1; i <= Number(count); i++) {
    const t = await publicClient.readContract({
      address: CONFIG.TENDER_ADDRESS,
      abi: AGENT_TENDER_ABI,
      functionName: 'getTender',
      args: [BigInt(i)],
    }) as any;
    console.log(`Tender #${i}: creator=${t.creator.slice(0, 6)}... status=${t.status} deadline=${t.biddingDeadline} lowestBidder=${t.lowestBidder.slice(0, 6)}... currentBid=${t.currentLowestBid}`);
  }
}
main();
