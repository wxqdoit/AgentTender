import { EventEmitter } from 'events';
import { privateKeyToAccount } from 'viem/accounts';
import {
  publicClient,
  AGENT_TENDER_ABI,
  fromUSDC,
} from './contracts.js';
import { CONFIG } from './config.js';
import { TenderData, BidRecord, MachineLog, TenderStatus } from './types.js';

export class TenderIndexer extends EventEmitter {
  private tenders: Map<number, TenderData> = new Map();
  private logs: MachineLog[] = [];
  private maxLogs: number = 200;
  private agentAddressMap: Map<string, string> = new Map();

  constructor() {
    super();
    this.initAgentMap();
  }

  private initAgentMap() {
    for (const key of Object.keys(CONFIG.AGENTS) as (keyof typeof CONFIG.AGENTS)[]) {
      const agent = CONFIG.AGENTS[key];
      try {
        const acc = privateKeyToAccount(agent.privateKey);
        this.agentAddressMap.set(acc.address.toLowerCase(), agent.name);
      } catch {
        // ignore
      }
    }
  }

  public getTenders(): TenderData[] {
    return Array.from(this.tenders.values()).sort((a, b) => b.id - a.id);
  }

  public getTender(id: number): TenderData | undefined {
    return this.tenders.get(id);
  }

  public getLogs(): MachineLog[] {
    return this.logs;
  }

  public addLog(log: Omit<MachineLog, 'id' | 'timestamp'>): MachineLog {
    const fullLog: MachineLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    this.logs.unshift(fullLog);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    this.emit('log', fullLog);
    return fullLog;
  }

  public registerTender(tender: TenderData) {
    this.tenders.set(tender.id, tender);
    this.emit('tenderUpdated', tender);
  }

  public registerBid(bid: BidRecord) {
    const tender = this.tenders.get(bid.tenderId);
    if (tender) {
      // Invariant: Strictly forbid duplicate or non-undercutting bid prices
      const isDuplicate = tender.bids.some((b) => Math.abs(b.bidAmount - bid.bidAmount) < 0.0001);
      const isNotUndercutting = tender.bids.length > 0 && bid.bidAmount >= tender.currentLowestBid;

      if (isDuplicate || isNotUndercutting) {
        console.warn(
          `[Indexer] Rejected invalid bid for tender #${bid.tenderId}: ${bid.bidAmount} USDC (Current lowest: ${tender.currentLowestBid}, Duplicate: ${isDuplicate})`
        );
        return false;
      }

      tender.bids.push(bid);
      tender.currentLowestBid = bid.bidAmount;
      tender.currentLowestBidRaw = bid.bidAmountRaw;
      tender.lowestBidder = bid.bidder;
      tender.lowestBidderName = bid.bidderName;
      this.emit('tenderUpdated', tender);
      this.emit('newBid', bid);
      return true;
    }
    return false;
  }

  public updateTenderStatus(
    tenderId: number,
    status: TenderStatus,
    statusText: string,
    extra?: Partial<TenderData>
  ) {
    const tender = this.tenders.get(tenderId);
    if (tender) {
      tender.status = status;
      tender.statusText = statusText;
      if (extra) {
        Object.assign(tender, extra);
      }
      this.emit('tenderUpdated', tender);
    }
  }

  public async syncTenderFromChain(tenderId: number) {
    if (!CONFIG.TENDER_ADDRESS) return;
    try {
      const raw = (await publicClient.readContract({
        address: CONFIG.TENDER_ADDRESS,
        abi: AGENT_TENDER_ABI,
        functionName: 'getTender',
        args: [BigInt(tenderId)],
      })) as any;

      if (!raw || Number(raw.id) === 0) return;

      const status = Number(raw.status) as TenderStatus;
      const statusMap: Record<TenderStatus, string> = {
        [TenderStatus.OPEN]: 'OPEN (BIDDING)',
        [TenderStatus.AWARDED]: 'AWARDED',
        [TenderStatus.DELIVERED]: 'DELIVERED (CHALLENGE)',
        [TenderStatus.SETTLED]: 'SETTLED',
        [TenderStatus.CANCELLED]: 'CANCELLED',
        [TenderStatus.EXPIRED]: 'EXPIRED',
      };

      const existing = this.tenders.get(tenderId);
      const updated: TenderData = {
        id: Number(raw.id),
        creator: raw.creator,
        taskMetadataURI: raw.taskMetadataURI,
        maxBudget: fromUSDC(raw.maxBudget),
        maxBudgetRaw: raw.maxBudget,
        currentLowestBid: fromUSDC(raw.currentLowestBid),
        currentLowestBidRaw: raw.currentLowestBid,
        lowestBidder: raw.lowestBidder,
        lowestBidderName: this.resolveAgentName(raw.lowestBidder),
        biddingDeadline: Number(raw.biddingDeadline),
        executionDeadline: Number(raw.executionDeadline),
        challengePeriodEnd: Number(raw.challengePeriodEnd),
        status,
        statusText: statusMap[status] || 'UNKNOWN',
        deliveryPayload: raw.deliveryPayload || '',
        createdAt: existing?.createdAt || Date.now(),
        bids: existing?.bids || [],
      };

      this.tenders.set(tenderId, updated);
      this.emit('tenderUpdated', updated);
      return updated;
    } catch (err) {
      console.error(`Error syncing tender #${tenderId} from chain:`, err);
    }
  }

  public resolveAgentName(address: string): string {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      return 'None';
    }
    const lower = address.toLowerCase();
    if (this.agentAddressMap.has(lower)) {
      return this.agentAddressMap.get(lower)!;
    }
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
}

export const indexer = new TenderIndexer();
