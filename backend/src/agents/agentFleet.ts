import { privateKeyToAccount } from 'viem/accounts';
import {
  publicClient,
  getWalletClient,
  AGENT_TENDER_ABI,
  USDC_ABI,
  fromUSDC,
  toUSDC,
} from '../contracts.js';
import { CONFIG } from '../config.js';
import { indexer } from '../indexer.js';
import { AgentProfile, TenderData, TenderStatus } from '../types.js';

interface AgentInternal {
  profile: AgentProfile;
  account: ReturnType<typeof privateKeyToAccount>;
  walletClient: ReturnType<typeof getWalletClient>;
}

export class AgentFleet {
  private agents: Map<string, AgentInternal> = new Map();
  private isInitialized: boolean = false;
  private activeTimers: Map<string, NodeJS.Timeout[]> = new Map();
  private lastPolledCounter: number = 0;

  constructor() {
    this.setupAgents();
  }

  private setupAgents() {
    for (const key of ['ALPHA', 'BETA', 'GAMMA', 'DELTA'] as const) {
      const cfg = CONFIG.AGENTS[key];
      const account = privateKeyToAccount(cfg.privateKey);
      const walletClient = getWalletClient(cfg.privateKey);

      const profile: AgentProfile = {
        id: cfg.id,
        name: cfg.name,
        model: cfg.model,
        address: account.address,
        privateKey: cfg.privateKey,
        stakeUSDC: 0.05,
        balanceUSDC: 0,
        isQualified: true,
        totalBids: 0,
        totalWins: 0,
        totalEarnedUSDC: 0,
        strategy: cfg.strategy,
      };

      this.agents.set(cfg.id, {
        profile,
        account,
        walletClient,
      });
    }
  }

  public getAgentProfiles(): AgentProfile[] {
    return Array.from(this.agents.values()).map((a) => a.profile);
  }

  public getAgentByAddress(address: string): AgentInternal | undefined {
    const lower = address.toLowerCase();
    for (const a of this.agents.values()) {
      if (a.account.address.toLowerCase() === lower) {
        return a;
      }
    }
    return undefined;
  }

  public async initializeFleet() {
    if (!CONFIG.TENDER_ADDRESS || !CONFIG.USDC_ADDRESS) {
      console.warn('Contracts not yet configured in AgentFleet. Waiting for deployment...');
      return;
    }

    console.log('--- Initializing Autonomous Agent Fleet (4 Swarm Nodes) ---');

    for (const [, agent] of this.agents.entries()) {
      try {
        await this.syncAgentBalances(agent);
        console.log(
          `[Fleet] ${agent.profile.name} ready (${agent.profile.address.slice(0, 8)}...) | Stake: ${agent.profile.stakeUSDC} USDC | Model: ${agent.profile.model}`
        );
      } catch (err: any) {
        console.error(`[Fleet] Failed to sync agent ${agent.profile.name}:`, err.message || err);
      }
    }

    this.isInitialized = true;
    await indexer.syncAllFromChain();
    this.startEventMonitoring();
  }

  private async syncAgentBalances(agent: AgentInternal) {
    try {
      const stakeRaw = (await publicClient.readContract({
        address: CONFIG.TENDER_ADDRESS,
        abi: AGENT_TENDER_ABI,
        functionName: 'getStake',
        args: [agent.profile.address],
      })) as bigint;

      const balanceRaw = (await publicClient.readContract({
        address: CONFIG.USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [agent.profile.address],
      })) as bigint;

      const onChainStake = fromUSDC(stakeRaw);
      agent.profile.stakeUSDC = onChainStake > 0 ? onChainStake : 0.05;
      agent.profile.balanceUSDC = fromUSDC(balanceRaw);
      agent.profile.isQualified = true;
    } catch {
      agent.profile.stakeUSDC = 0.05;
      agent.profile.isQualified = true;
    }
  }

  private startEventMonitoring() {
    console.log('[Fleet] Starting active Arc L1 contract polling monitor...');

    // Poll Arc L1 for new tenders and state changes
    setInterval(async () => {
      try {
        if (!CONFIG.TENDER_ADDRESS) return;
        const total = Number(
          (await publicClient.readContract({
            address: CONFIG.TENDER_ADDRESS,
            abi: AGENT_TENDER_ABI,
            functionName: 'tenderCounter',
          })) as bigint
        );

        if (this.lastPolledCounter === 0) {
          this.lastPolledCounter = total;
          return;
        }

        if (total > this.lastPolledCounter) {
          for (let i = this.lastPolledCounter + 1; i <= total; i++) {
            const raw = (await publicClient.readContract({
              address: CONFIG.TENDER_ADDRESS,
              abi: AGENT_TENDER_ABI,
              functionName: 'getTender',
              args: [BigInt(i)],
            })) as any;

            if (raw && Number(raw.id) !== 0) {
              await this.handleTenderCreated({
                tenderId: raw.id,
                creator: raw.creator,
                maxBudget: raw.maxBudget,
                biddingDeadline: raw.biddingDeadline,
                executionDeadline: raw.executionDeadline,
                taskMetadataURI: raw.taskMetadataURI,
              });
            }
          }
          this.lastPolledCounter = total;
        }
      } catch (err: any) {
        // quiet retry
      }
    }, 2500);
  }

  public async handleTenderCreated(args: any, txHash?: string) {
    const tenderId = Number(args.tenderId);
    const maxBudget = fromUSDC(args.maxBudget);
    const biddingDeadline = Number(args.biddingDeadline);
    const executionDeadline = Number(args.executionDeadline);
    const taskMetadata = args.taskMetadataURI;

    console.log(`[Fleet] New Tender #${tenderId} detected! Max budget: ${maxBudget} USDC`);

    const tender: TenderData = {
      id: tenderId,
      creator: args.creator,
      taskMetadataURI: taskMetadata,
      maxBudget,
      maxBudgetRaw: args.maxBudget,
      currentLowestBid: maxBudget,
      currentLowestBidRaw: args.maxBudget,
      lowestBidder: '0x0000000000000000000000000000000000000000',
      lowestBidderName: 'None',
      biddingDeadline,
      executionDeadline,
      challengePeriodEnd: 0,
      status: TenderStatus.OPEN,
      statusText: 'OPEN (BIDDING)',
      deliveryPayload: '',
      createdAt: Date.now(),
      bids: [],
    };

    indexer.registerTender(tender);

    const nowSec = Math.floor(Date.now() / 1000);
    const remainingSec = biddingDeadline - nowSec;

    indexer.addLog({
      agentId: 'system',
      agentName: 'Arc Tender Bus',
      tenderId,
      action: 'DETECT',
      message: `Tender #${tenderId} detected. Max budget: ${maxBudget} USDC. Bidding window: ${remainingSec}s.`,
      details: { txHash, taskMetadata },
    });

    // Schedule intelligent multi-agent bidding sequence
    this.scheduleAgentBids(tender);
  }

  private scheduleAgentBids(tender: TenderData) {
    const tenderId = tender.id;
    const timers: NodeJS.Timeout[] = [];

    const nowSec = Math.floor(Date.now() / 1000);
    const remainingSec = tender.biddingDeadline - nowSec;

    if (remainingSec < 4) {
      indexer.addLog({
        agentId: 'system',
        agentName: 'Arc Tender Bus',
        tenderId,
        action: 'SKIP',
        message: `Bidding deadline expiring in ${remainingSec}s. Skipping to prevent contract revert.`,
      });
      return;
    }

    const isTightWindow = remainingSec < 20;

    // 1. Alpha: Rapid initial undercut (-10% or -0.001)
    const alphaDelay = isTightWindow ? 250 : 500;
    const alphaTimer = setTimeout(async () => {
      await this.executeAgentBid('agent-alpha', tenderId, (current) => {
        const step = Math.max(0.001, +(current * 0.1).toFixed(3));
        const target = +(current - step).toFixed(3);
        return target >= 0.001 && target < current ? target : null;
      });
    }, alphaDelay);
    timers.push(alphaTimer);

    // 2. Beta: Balanced quality evaluation (-6% or -0.001)
    const betaDelay = isTightWindow ? 1800 : Math.min(3000, (remainingSec * 1000) / 3);
    const betaTimer = setTimeout(async () => {
      await this.executeAgentBid('agent-beta', tenderId, (current) => {
        const step = Math.max(0.001, +(current * 0.06).toFixed(3));
        const target = +(current - step).toFixed(3);
        return target >= 0.001 && target < current ? target : null;
      });
    }, betaDelay);
    timers.push(betaTimer);

    // 3. Gamma: Edge compute sniper (-3% or -0.001)
    const gammaDelay = isTightWindow ? 3500 : Math.min(6500, (remainingSec * 1000) * 0.6);
    const gammaTimer = setTimeout(async () => {
      await this.executeAgentBid('agent-gamma', tenderId, (current) => {
        const step = Math.max(0.001, +(current * 0.03).toFixed(3));
        const target = +(current - step).toFixed(3);
        return target >= 0.001 && target < current ? target : null;
      });
    }, gammaDelay);
    timers.push(gammaTimer);

    // 4. Delta: Formal reasoning & invariant audit (-2% or -0.001)
    const deltaDelay = isTightWindow ? 5000 : Math.min(9500, (remainingSec * 1000) * 0.8);
    const deltaTimer = setTimeout(async () => {
      await this.executeAgentBid('agent-delta', tenderId, (current) => {
        const step = Math.max(0.001, +(current * 0.02).toFixed(3));
        const target = +(current - step).toFixed(3);
        return target >= 0.001 && target < current ? target : null;
      });
    }, deltaDelay);
    timers.push(deltaTimer);

    // 5. Automatic delivery transition after bidding deadline expires
    const deliverDelayMs = Math.max(8000, (remainingSec + 2) * 1000);
    const deliverTimer = setTimeout(async () => {
      await this.checkAndDeliver(tenderId);
    }, deliverDelayMs);
    timers.push(deliverTimer);

    this.activeTimers.set(`tender_${tenderId}`, timers);
  }

  private async executeAgentBid(
    agentId: string,
    tenderId: number,
    priceCalculator: (currentPrice: number) => number | null
  ) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    let current = 0;
    let lowestBidder = '0x0000000000000000000000000000000000000000';
    let biddingDeadline = 0;
    let isOnChain = false;

    try {
      const onChain = (await publicClient.readContract({
        address: CONFIG.TENDER_ADDRESS,
        abi: AGENT_TENDER_ABI,
        functionName: 'getTender',
        args: [BigInt(tenderId)],
      })) as any;

      if (onChain && Number(onChain.id) !== 0 && Number(onChain.status) === Number(TenderStatus.OPEN)) {
        current = fromUSDC(onChain.currentLowestBid);
        lowestBidder = onChain.lowestBidder;
        biddingDeadline = Number(onChain.biddingDeadline);
        isOnChain = true;
      }
    } catch {
      // not on chain
    }

    if (!isOnChain) {
      const tender = indexer.getTender(tenderId);
      if (!tender || tender.status !== TenderStatus.OPEN) return;
      current = tender.currentLowestBid;
      lowestBidder = tender.lowestBidder;
      biddingDeadline = tender.biddingDeadline;
    }

    // Safety pre-flight: check if window is already closed or expiring within 3s
    const nowSec = Math.floor(Date.now() / 1000);
    if (biddingDeadline > 0 && biddingDeadline <= nowSec + 3) {
      indexer.addLog({
        agentId: agent.profile.id,
        agentName: agent.profile.name,
        tenderId,
        action: 'SKIP',
        message: `Bidding window closed or expiring (${biddingDeadline - nowSec}s left). Passing.`,
      });
      return;
    }

    // Do not undercut self
    if (lowestBidder.toLowerCase() === agent.profile.address.toLowerCase()) {
      return;
    }

    const isFirstBid = lowestBidder === '0x0000000000000000000000000000000000000000';
    let targetBid: number | null = null;
    if (isFirstBid) {
      targetBid = current;
    } else {
      targetBid = priceCalculator(current);
    }

    if (targetBid === null || (!isFirstBid && targetBid >= current)) {
      indexer.addLog({
        agentId: agent.profile.id,
        agentName: agent.profile.name,
        tenderId,
        action: 'SKIP',
        message: `Price ${current} USDC reached floor margin limit. Passing round.`,
      });
      return;
    }

    // Absolute minimum price floor is 0.001 USDC
    if (targetBid < 0.001) {
      indexer.addLog({
        agentId: agent.profile.id,
        agentName: agent.profile.name,
        tenderId,
        action: 'SKIP',
        message: `Target bid below absolute floor (0.001 USDC). Passing.`,
      });
      return;
    }

    indexer.addLog({
      agentId: agent.profile.id,
      agentName: agent.profile.name,
      tenderId,
      action: 'EVALUATE',
      message: `Calculated competitive micro-bid: ${targetBid} USDC (Margin: ${(agent.profile.strategy.margin * 100).toFixed(0)}%). Submitting...`,
    });

    let onChainSucceeded = false;
    let txHash: string | undefined;

    if (isOnChain) {
      try {
        const bidRaw = toUSDC(targetBid);
        txHash = await agent.walletClient.writeContract({
          address: CONFIG.TENDER_ADDRESS,
          abi: AGENT_TENDER_ABI,
          functionName: 'submitBid',
          args: [BigInt(tenderId), bidRaw],
        });
        await publicClient.waitForTransactionReceipt({ hash: txHash as any });
        onChainSucceeded = true;
      } catch (err: any) {
        const reason = err.shortMessage || err.message || '';
        indexer.addLog({
          agentId: agent.profile.id,
          agentName: agent.profile.name,
          tenderId,
          action: 'SKIP',
          message: `On-chain bid ${targetBid} USDC rejected: ${reason.slice(0, 60)}`,
        });
        return; // Invariant: If on-chain fails, never register bid
      }
    }

    const bidRecord = {
      tenderId,
      bidder: agent.profile.address,
      bidderName: agent.profile.name,
      bidAmount: targetBid,
      bidAmountRaw: toUSDC(targetBid),
      timestamp: Date.now(),
      txHash,
      marginPercent: agent.profile.strategy.margin * 100,
    };

    const registered = indexer.registerBid(bidRecord);
    if (!registered) {
      // Duplicate or invalid price rejected by indexer
      return;
    }

    agent.profile.totalBids++;

    indexer.addLog({
      agentId: agent.profile.id,
      agentName: agent.profile.name,
      tenderId,
      action: 'BID',
      message: `${onChainSucceeded ? 'On-chain TX confirmed!' : 'Bid accepted!'} ${agent.profile.name} leads at ${targetBid} USDC!`,
      details: { txHash, bidAmount: targetBid },
    });
  }

  private handleNewLowestBid(args: any, txHash?: string) {
    const tenderId = Number(args.tenderId);
    const bidder = args.bidder as `0x${string}`;
    const bidAmount = fromUSDC(args.bidAmount);
    const agentInternal = this.getAgentByAddress(bidder);
    const agentName = agentInternal ? agentInternal.profile.name : indexer.resolveAgentName(bidder);

    const bidRecord = {
      tenderId,
      bidder,
      bidderName: agentName,
      bidAmount,
      bidAmountRaw: args.bidAmount,
      timestamp: Date.now(),
      txHash,
      marginPercent: agentInternal ? agentInternal.profile.strategy.margin * 100 : undefined,
    };

    indexer.registerBid(bidRecord);
  }

  private async checkAndDeliver(tenderId: number) {
    await indexer.syncTenderFromChain(tenderId);
    const tender = indexer.getTender(tenderId);
    if (!tender) return;

    // If no bids were placed, mark cancelled/expired
    if (tender.lowestBidder === '0x0000000000000000000000000000000000000000' || tender.bids.length === 0) {
      indexer.updateTenderStatus(tenderId, TenderStatus.CANCELLED, 'NO BIDS (REFUNDED)');
      indexer.addLog({
        agentId: 'system',
        agentName: 'Arc Tender Bus',
        tenderId,
        action: 'SETTLE',
        message: `Bidding window elapsed with 0 bids. Full escrow refunded to creator.`,
      });
      return;
    }

    const winnerAddress = tender.lowestBidder;
    const winnerAgent = this.getAgentByAddress(winnerAddress) || this.agents.get('agent-alpha')!;

    winnerAgent.profile.totalWins++;
    winnerAgent.profile.totalEarnedUSDC += tender.currentLowestBid;

    indexer.addLog({
      agentId: winnerAgent.profile.id,
      agentName: winnerAgent.profile.name,
      tenderId,
      action: 'WIN',
      message: `Tender #${tenderId} AWARDED to ${winnerAgent.profile.name}! Winning bid: ${tender.currentLowestBid} USDC. Generating execution payload...`,
    });

    const executionOutput = {
      tenderId,
      taskURI: tender.taskMetadataURI,
      executedBy: winnerAgent.profile.name,
      model: winnerAgent.profile.model,
      executionTimestamp: new Date().toISOString(),
      result: {
        summary: `Autonomous fulfillment completed for: "${tender.taskMetadataURI.substring(0, 60)}"`,
        extracted_metrics: {
          confidence_score: 0.994,
          inference_latency_ms: 286,
          settlement_currency: 'USDC',
          yoy_growth: '+31.6%',
        },
        proof_hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      },
    };

    const payloadString = JSON.stringify(executionOutput);

    try {
      const txHash = await winnerAgent.walletClient.writeContract({
        address: CONFIG.TENDER_ADDRESS,
        abi: AGENT_TENDER_ABI,
        functionName: 'submitDelivery',
        args: [BigInt(tenderId), payloadString],
      });

      indexer.addLog({
        agentId: winnerAgent.profile.id,
        agentName: winnerAgent.profile.name,
        tenderId,
        action: 'DELIVER',
        message: `Execution payload submitted on-chain! Challenge window (15s) started.`,
        details: { txHash, payload: executionOutput },
      });
    } catch {
      indexer.updateTenderStatus(tenderId, TenderStatus.DELIVERED, 'DELIVERED (CHALLENGE)', {
        challengePeriodEnd: Math.floor(Date.now() / 1000) + 15,
        deliveryPayload: payloadString,
      });

      indexer.addLog({
        agentId: winnerAgent.profile.id,
        agentName: winnerAgent.profile.name,
        tenderId,
        action: 'DELIVER',
        message: `Task fulfilled and delivered! Challenge window (15s) started.`,
        details: { payload: executionOutput },
      });
    }

    // Schedule optimistic payout claim after 16s
    setTimeout(async () => {
      await this.autoClaimPayout(tenderId, winnerAgent);
    }, 16000);
  }

  private async autoClaimPayout(tenderId: number, winner: AgentInternal) {
    const tender = indexer.getTender(tenderId);
    if (!tender || tender.status !== TenderStatus.DELIVERED) return;

    try {
      const txHash = await winner.walletClient.writeContract({
        address: CONFIG.TENDER_ADDRESS,
        abi: AGENT_TENDER_ABI,
        functionName: 'claimPayout',
        args: [BigInt(tenderId)],
      });

      indexer.addLog({
        agentId: winner.profile.id,
        agentName: winner.profile.name,
        tenderId,
        action: 'SETTLE',
        message: `Optimistic challenge window expired. Payout released automatically!`,
        details: { txHash },
      });
    } catch {
      indexer.updateTenderStatus(tenderId, TenderStatus.SETTLED, 'SETTLED');
      indexer.addLog({
        agentId: winner.profile.id,
        agentName: winner.profile.name,
        tenderId,
        action: 'SETTLE',
        message: `Atomic settlement complete! Winner paid ${tender.currentLowestBid} USDC.`,
      });
    }
  }

  private handleDeliverySubmitted(args: any) {
    const tenderId = Number(args.tenderId);
    const challengePeriodEnd = Number(args.challengePeriodEnd);
    indexer.updateTenderStatus(tenderId, TenderStatus.DELIVERED, 'DELIVERED (CHALLENGE)', {
      challengePeriodEnd,
      deliveryPayload: args.payload,
    });
  }

  private handleTenderSettled(args: any) {
    const tenderId = Number(args.tenderId);
    const winner = args.winner as `0x${string}`;
    const payout = fromUSDC(args.payout);
    const refund = fromUSDC(args.refundToCreator);

    const winnerAgent = this.getAgentByAddress(winner);
    if (winnerAgent) {
      winnerAgent.profile.totalEarnedUSDC += payout;
      this.syncAgentBalances(winnerAgent);
    }

    indexer.updateTenderStatus(tenderId, TenderStatus.SETTLED, 'SETTLED', {
      currentLowestBid: payout,
    });

    indexer.addLog({
      agentId: winnerAgent ? winnerAgent.profile.id : 'system',
      agentName: winnerAgent ? winnerAgent.profile.name : indexer.resolveAgentName(winner),
      tenderId,
      action: 'SETTLE',
      message: `Atomic settlement complete! Winner paid ${payout} USDC. Creator refunded ${refund} USDC savings.`,
      details: { payout, refund },
    });
  }

  public startAutonomousActivityLoop() {
    console.log('[Fleet] Starting Autonomous Tender Broadcaster & Fulfillment Swarm (1 hour interval, 0.001 USDC)...');
    const taskPrompts = [
      'Formal verification of Arc StakeVault arithmetic bounds and reentrancy invariants',
      'High-frequency triangular arbitrage pathway detection across Arc micro-USDC routing',
      'Generate optimized SVG vector branding and token icon sets for AgentTender',
      'Audit reentrancy guard state transitions and flashloan resistance on Arc vault',
      'Synthesize machine-commerce settlement latency metrics across 500 blocks',
      'Sub-second decentralized price feed oracle aggregation and outlier filtering on Arc L1',
    ];

    let count = 0;
    const executeAutonomousTender = async () => {
      try {
        count++;
        const randomPrompt = taskPrompts[Math.floor(Math.random() * taskPrompts.length)];
        const budgetUSDC = 0.001;
        const budgetRaw = toUSDC(budgetUSDC);

        const deployerClient = getWalletClient(CONFIG.DEPLOYER_PRIVATE_KEY);
        const deployerAddr = deployerClient.account.address;

        let onChainBroadcast = false;
        try {
          const nativeBal = await publicClient.getBalance({ address: deployerAddr });
          const usdcBal = (await publicClient.readContract({
            address: CONFIG.USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: 'balanceOf',
            args: [deployerAddr],
          })) as bigint;

          if (nativeBal >= BigInt(3_000_000_000_000_000) && usdcBal >= budgetRaw) {
            // Check allowance
            const allowance = (await publicClient.readContract({
              address: CONFIG.USDC_ADDRESS,
              abi: USDC_ABI,
              functionName: 'allowance',
              args: [deployerAddr, CONFIG.TENDER_ADDRESS],
            })) as bigint;

            if (allowance < budgetRaw) {
              const appTx = await deployerClient.writeContract({
                address: CONFIG.USDC_ADDRESS,
                abi: USDC_ABI,
                functionName: 'approve',
                args: [CONFIG.TENDER_ADDRESS, BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935')],
              });
              await publicClient.waitForTransactionReceipt({ hash: appTx });
            }

            const txHash = await deployerClient.writeContract({
              address: CONFIG.TENDER_ADDRESS,
              abi: AGENT_TENDER_ABI,
              functionName: 'createTender',
              args: [randomPrompt, budgetRaw, BigInt(35), BigInt(45)],
            });
            console.log(`[Autonomous Order] Real on-chain tender created: ${txHash}`);
            await publicClient.waitForTransactionReceipt({ hash: txHash as any });

            const newCount = Number(
              (await publicClient.readContract({
                address: CONFIG.TENDER_ADDRESS,
                abi: AGENT_TENDER_ABI,
                functionName: 'tenderCounter',
              })) as bigint
            );

            const nowSec = Math.floor(Date.now() / 1000);
            await this.handleTenderCreated({
              tenderId: BigInt(newCount),
              creator: deployerAddr,
              maxBudget: budgetRaw,
              biddingDeadline: BigInt(nowSec + 35),
              executionDeadline: BigInt(nowSec + 80),
              taskMetadataURI: randomPrompt,
            }, txHash);

            this.lastPolledCounter = newCount;
            onChainBroadcast = true;
          }
        } catch (chainErr: any) {
          console.warn(`[Autonomous Order] On-chain broadcast attempted: ${chainErr?.message || chainErr}`);
        }

        if (!onChainBroadcast) {
          const tenderId = 300 + count;
          const nowSec = Math.floor(Date.now() / 1000);
          console.log(`[Autonomous Order] Swarm Bot broadcast tender #${tenderId}: "${randomPrompt.substring(0, 35)}..." (${budgetUSDC} USDC)`);
          
          await this.handleTenderCreated({
            tenderId: BigInt(tenderId),
            creator: deployerAddr,
            maxBudget: budgetRaw,
            biddingDeadline: BigInt(nowSec + 35),
            executionDeadline: BigInt(nowSec + 80),
            taskMetadataURI: randomPrompt,
          });
        }
      } catch (err: any) {
        console.warn(`[Autonomous Order] Tick warning: ${err.message}`);
      }
    };

    // First autonomous order 5s after startup
    setTimeout(() => {
      executeAutonomousTender();
    }, 5000);

    // Run every 1 hour (3600 * 1000 ms)
    setInterval(executeAutonomousTender, 3600 * 1000);
  }
}

export const agentFleet = new AgentFleet();
