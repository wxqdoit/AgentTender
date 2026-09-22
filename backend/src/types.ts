export enum TenderStatus {
  OPEN = 0,
  AWARDED = 1,
  DELIVERED = 2,
  SETTLED = 3,
  CANCELLED = 4,
  EXPIRED = 5,
}

export interface BidRecord {
  tenderId: number;
  bidder: `0x${string}`;
  bidderName: string;
  bidAmount: number; // in USDC (e.g. 0.42)
  bidAmountRaw: bigint;
  timestamp: number;
  txHash?: string;
  marginPercent?: number;
}

export interface TenderData {
  id: number;
  creator: `0x${string}`;
  taskMetadataURI: string;
  maxBudget: number; // in USDC
  maxBudgetRaw: bigint;
  currentLowestBid: number; // in USDC
  currentLowestBidRaw: bigint;
  lowestBidder: `0x${string}`;
  lowestBidderName: string;
  biddingDeadline: number;
  executionDeadline: number;
  challengePeriodEnd: number;
  status: TenderStatus;
  statusText: string;
  deliveryPayload: string;
  createdAt: number;
  bids: BidRecord[];
}

export interface MachineLog {
  id: string;
  timestamp: number;
  agentId: string;
  agentName: string;
  tenderId?: number;
  action: 'DETECT' | 'EVALUATE' | 'BID' | 'WIN' | 'DELIVER' | 'SETTLE' | 'SKIP' | 'ERROR';
  message: string;
  details?: Record<string, any>;
}

export interface AgentProfile {
  id: string;
  name: string;
  model: string;
  address: `0x${string}`;
  privateKey: `0x${string}`;
  stakeUSDC: number;
  balanceUSDC: number;
  isQualified: boolean;
  totalBids: number;
  totalWins: number;
  totalEarnedUSDC: number;
  strategy: {
    margin: number;
    stepDecrement: number;
    delayMs: number;
    description: string;
  };
}
