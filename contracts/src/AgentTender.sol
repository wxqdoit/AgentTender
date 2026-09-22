// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentTender
 * @notice Autonomous Reverse-Auction & Machine Commerce Tender Protocol.
 * Facilitates sub-second machine micro-bidding, optimistic escrow, and atomic settlement for AI agents.
 */
contract AgentTender is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- ENUMS & STRUCTS ---

    enum TenderStatus {
        OPEN,       // Accepting bids from qualified agents
        AWARDED,    // Bidding window ended, winner locked, awaiting delivery
        DELIVERED,  // Delivery submitted by winner, in optimistic challenge window
        SETTLED,    // Payout and refund distributed atomically
        CANCELLED,  // Cancelled by creator (only allowed before any bids or on zero-bid timeout)
        EXPIRED     // Defaulted by winner (slashed)
    }

    struct Tender {
        uint256 id;                 // Unique tender ID
        address creator;            // Task creator address
        string taskMetadataURI;     // Task metadata (e.g., prompt, requirements, IPFS URI)
        uint256 maxBudget;          // Escrowed USDC budget (6 decimals)
        uint256 currentLowestBid;   // Current winning bid amount
        address lowestBidder;       // Current winning agent address
        uint256 biddingDeadline;    // Timestamp when bidding closes
        uint256 executionDeadline;  // Timestamp when winner must deliver payload
        uint256 challengePeriodEnd; // Timestamp when optimistic challenge window ends
        TenderStatus status;        // Current state
        string deliveryPayload;     // Completed output/result payload or URI
    }

    // --- CONSTANTS & IMMUTABLES ---

    IERC20 public immutable usdc;

    /// @notice Minimum stake required for an agent to participate in bidding (0.05 USDC = 50,000)
    uint256 public constant MIN_AGENT_STAKE = 10_000;

    /// @notice Minimum absolute decrement per new bid (0.01 USDC = 10,000)
    uint256 public constant MIN_ABSOLUTE_DECREMENT = 1_000;

    /// @notice Minimum percentage decrement per new bid (2% = 200 basis points)
    uint256 public constant MIN_PERCENT_DECREMENT_BPS = 200;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    /// @notice Optimistic challenge period (seconds) before automatic payout can be claimed
    uint256 public constant CHALLENGE_WINDOW_SECONDS = 15;

    // --- STATE VARIABLES ---

    uint256 public tenderCounter;
    mapping(uint256 => Tender) public tenders;
    mapping(address => uint256) public stakes;

    // --- EVENTS ---

    event StakeDeposited(address indexed agent, uint256 amount, uint256 newTotalStake);
    event StakeWithdrawn(address indexed agent, uint256 amount, uint256 remainingStake);

    event TenderCreated(
        uint256 indexed tenderId,
        address indexed creator,
        uint256 maxBudget,
        uint256 biddingDeadline,
        uint256 executionDeadline,
        string taskMetadataURI
    );

    event NewLowestBid(
        uint256 indexed tenderId,
        address indexed bidder,
        uint256 bidAmount,
        uint256 previousLowestBid
    );

    event TenderAwarded(
        uint256 indexed tenderId,
        address indexed winner,
        uint256 winningBid
    );

    event DeliverySubmitted(
        uint256 indexed tenderId,
        address indexed winner,
        string payload,
        uint256 challengePeriodEnd
    );

    event TenderSettled(
        uint256 indexed tenderId,
        address indexed winner,
        uint256 payout,
        uint256 refundToCreator
    );

    event TenderCancelled(uint256 indexed tenderId, address indexed creator, uint256 refundedBudget);

    event TenderExecutionFailed(
        uint256 indexed tenderId,
        address indexed slasheee,
        uint256 slashedAmount,
        address indexed creator,
        uint256 totalCompensated
    );

    // --- CONSTRUCTOR ---

    constructor(address _usdc) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
    }

    // --- STAKE VAULT FUNCTIONS ---

    /**
     * @notice Deposit stake into the contract to qualify for bidding across tenders.
     * @param amount The amount of USDC to deposit (must be > 0).
     */
    function depositStake(uint256 amount) external nonReentrant {
        require(amount > 0, "Stake amount must be > 0");
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        stakes[msg.sender] += amount;
        emit StakeDeposited(msg.sender, amount, stakes[msg.sender]);
    }

    /**
     * @notice Withdraw available stake back to agent's wallet.
     * @param amount The amount of USDC to withdraw.
     */
    function withdrawStake(uint256 amount) external nonReentrant {
        require(amount > 0, "Withdraw amount must be > 0");
        require(stakes[msg.sender] >= amount, "Insufficient stake balance");
        stakes[msg.sender] -= amount;
        usdc.safeTransfer(msg.sender, amount);
        emit StakeWithdrawn(msg.sender, amount, stakes[msg.sender]);
    }

    // --- TENDER LIFECYCLE FUNCTIONS ---

    /**
     * @notice Creates a new reverse tender with escrowed USDC budget.
     * @param taskMetadataURI Metadata description of the task (e.g. Prompt, schema, CID).
     * @param maxBudget Maximum USDC willingness to pay (must be >= MIN_ABSOLUTE_DECREMENT).
     * @param biddingWindowSeconds Duration of bidding phase (3s - 300s).
     * @param executionWindowSeconds Duration for winner to deliver after bidding ends (5s - 600s).
     */
    function createTender(
        string calldata taskMetadataURI,
        uint256 maxBudget,
        uint256 biddingWindowSeconds,
        uint256 executionWindowSeconds
    ) external nonReentrant returns (uint256 tenderId) {
        require(maxBudget >= MIN_ABSOLUTE_DECREMENT, "Budget below minimum step");
        require(biddingWindowSeconds >= 3 && biddingWindowSeconds <= 300, "Invalid bidding window");
        require(executionWindowSeconds >= 5 && executionWindowSeconds <= 600, "Invalid execution window");
        require(bytes(taskMetadataURI).length > 0, "Task metadata required");

        // Escrow USDC from creator
        usdc.safeTransferFrom(msg.sender, address(this), maxBudget);

        tenderCounter++;
        tenderId = tenderCounter;

        uint256 biddingDeadline = block.timestamp + biddingWindowSeconds;
        uint256 executionDeadline = biddingDeadline + executionWindowSeconds;

        tenders[tenderId] = Tender({
            id: tenderId,
            creator: msg.sender,
            taskMetadataURI: taskMetadataURI,
            maxBudget: maxBudget,
            currentLowestBid: maxBudget,
            lowestBidder: address(0),
            biddingDeadline: biddingDeadline,
            executionDeadline: executionDeadline,
            challengePeriodEnd: 0,
            status: TenderStatus.OPEN,
            deliveryPayload: ""
        });

        emit TenderCreated(
            tenderId,
            msg.sender,
            maxBudget,
            biddingDeadline,
            executionDeadline,
            taskMetadataURI
        );
    }

    /**
     * @notice Cancel tender before any bids have been submitted, refunding escrowed USDC.
     */
    function cancelTender(uint256 tenderId) external nonReentrant {
        Tender storage tender = tenders[tenderId];
        require(tender.id != 0, "Tender does not exist");
        require(msg.sender == tender.creator, "Only creator can cancel");
        require(tender.status == TenderStatus.OPEN, "Not in OPEN status");
        require(tender.lowestBidder == address(0), "Cannot cancel after bids received");

        tender.status = TenderStatus.CANCELLED;
        uint256 refundAmount = tender.maxBudget;
        usdc.safeTransfer(tender.creator, refundAmount);

        emit TenderCancelled(tenderId, tender.creator, refundAmount);
    }

    /**
     * @notice Submit a competitive reverse bid for a tender.
     * @param tenderId The ID of the target tender.
     * @param bidAmount The bid amount in USDC (must beat current lowest bid by minimum step).
     */
    function submitBid(uint256 tenderId, uint256 bidAmount) external nonReentrant {
        Tender storage tender = tenders[tenderId];
        require(tender.id != 0, "Tender does not exist");
        require(tender.status == TenderStatus.OPEN, "Tender not open for bidding");
        require(block.timestamp <= tender.biddingDeadline, "Bidding window expired");
        require(stakes[msg.sender] >= MIN_AGENT_STAKE, "Insufficient agent stake");
        require(msg.sender != tender.creator, "Creator cannot bid on own tender");

        uint256 previousLowest = tender.currentLowestBid;

        if (tender.lowestBidder == address(0)) {
            // First bid must be at or below maxBudget
            require(bidAmount <= tender.maxBudget, "Bid exceeds max budget");
        } else {
            // Subsequent bids must strictly decrease by at least min decrement
            // min decrement is min(MIN_ABSOLUTE_DECREMENT, (previousLowest * MIN_PERCENT_DECREMENT_BPS) / BPS_DENOMINATOR)
            uint256 pctDec = (previousLowest * MIN_PERCENT_DECREMENT_BPS) / BPS_DENOMINATOR;
            uint256 requiredDec = pctDec > MIN_ABSOLUTE_DECREMENT ? pctDec : MIN_ABSOLUTE_DECREMENT;
            require(previousLowest > requiredDec && bidAmount <= previousLowest - requiredDec, "Bid decrease insufficient");
        }

        require(bidAmount > 0, "Bid must be > 0");

        tender.currentLowestBid = bidAmount;
        tender.lowestBidder = msg.sender;

        emit NewLowestBid(tenderId, msg.sender, bidAmount, previousLowest);
    }

    /**
     * @notice Submit execution results / delivery payload. Only callable by the winning agent.
     * @param tenderId Target tender ID.
     * @param deliveryPayload Output string, JSON, or IPFS URI containing task fulfillment.
     */
    function submitDelivery(uint256 tenderId, string calldata deliveryPayload) external nonReentrant {
        Tender storage tender = tenders[tenderId];
        require(tender.id != 0, "Tender does not exist");

        // Lazy status transition to AWARDED if bidding window has closed
        if (tender.status == TenderStatus.OPEN) {
            require(block.timestamp > tender.biddingDeadline, "Bidding still active");
            require(tender.lowestBidder != address(0), "No bids submitted");
            tender.status = TenderStatus.AWARDED;
            emit TenderAwarded(tenderId, tender.lowestBidder, tender.currentLowestBid);
        }

        require(tender.status == TenderStatus.AWARDED, "Tender not awarded");
        require(msg.sender == tender.lowestBidder, "Only awarded winner can deliver");
        require(block.timestamp <= tender.executionDeadline, "Execution deadline passed");
        require(bytes(deliveryPayload).length > 0, "Delivery payload cannot be empty");

        tender.status = TenderStatus.DELIVERED;
        tender.deliveryPayload = deliveryPayload;
        tender.challengePeriodEnd = block.timestamp + CHALLENGE_WINDOW_SECONDS;

        emit DeliverySubmitted(tenderId, msg.sender, deliveryPayload, tender.challengePeriodEnd);
    }

    /**
     * @notice Creator confirms and approves the delivery immediately, triggering instant settlement.
     */
    function confirmDelivery(uint256 tenderId) external nonReentrant {
        Tender storage tender = tenders[tenderId];
        require(tender.id != 0, "Tender does not exist");
        require(msg.sender == tender.creator, "Only creator can confirm");
        require(tender.status == TenderStatus.DELIVERED, "Tender not in DELIVERED status");

        _settleTender(tender);
    }

    /**
     * @notice Anyone can claim payout once optimistic challenge window has elapsed without dispute.
     */
    function claimPayout(uint256 tenderId) external nonReentrant {
        Tender storage tender = tenders[tenderId];
        require(tender.id != 0, "Tender does not exist");
        require(tender.status == TenderStatus.DELIVERED, "Tender not in DELIVERED status");
        require(block.timestamp >= tender.challengePeriodEnd, "Challenge period still active");

        _settleTender(tender);
    }

    /**
     * @notice Refund creator if bidding window closed with zero bids.
     */
    function handleBiddingTimeout(uint256 tenderId) external nonReentrant {
        Tender storage tender = tenders[tenderId];
        require(tender.id != 0, "Tender does not exist");
        require(tender.status == TenderStatus.OPEN, "Tender not in OPEN status");
        require(block.timestamp > tender.biddingDeadline, "Bidding window not closed");
        require(tender.lowestBidder == address(0), "Tender has bids; cannot timeout as empty");

        tender.status = TenderStatus.CANCELLED;
        uint256 refundAmount = tender.maxBudget;
        usdc.safeTransfer(tender.creator, refundAmount);

        emit TenderCancelled(tenderId, tender.creator, refundAmount);
    }

    /**
     * @notice Slash winner stake and refund creator if winner failed to deliver before executionDeadline.
     */
    function handleExecutionTimeout(uint256 tenderId) external nonReentrant {
        Tender storage tender = tenders[tenderId];
        require(tender.id != 0, "Tender does not exist");

        // Lazy transition if needed
        if (tender.status == TenderStatus.OPEN && block.timestamp > tender.biddingDeadline && tender.lowestBidder != address(0)) {
            tender.status = TenderStatus.AWARDED;
            emit TenderAwarded(tenderId, tender.lowestBidder, tender.currentLowestBid);
        }

        require(tender.status == TenderStatus.AWARDED, "Tender not in AWARDED status");
        require(block.timestamp > tender.executionDeadline, "Execution deadline not passed");

        address defaulter = tender.lowestBidder;
        tender.status = TenderStatus.EXPIRED;

        // Slash penalty from defaulter's stake (up to MIN_AGENT_STAKE)
        uint256 agentStake = stakes[defaulter];
        uint256 penalty = agentStake >= MIN_AGENT_STAKE ? MIN_AGENT_STAKE : agentStake;
        if (penalty > 0) {
            stakes[defaulter] -= penalty;
        }

        // Total compensation to creator: full escrow budget + slashed penalty
        uint256 totalCompensate = tender.maxBudget + penalty;
        usdc.safeTransfer(tender.creator, totalCompensate);

        emit TenderExecutionFailed(
            tenderId,
            defaulter,
            penalty,
            tender.creator,
            totalCompensate
        );
    }

    // --- INTERNAL FUNCTIONS ---

    function _settleTender(Tender storage tender) internal {
        tender.status = TenderStatus.SETTLED;

        uint256 payout = tender.currentLowestBid;
        uint256 refund = tender.maxBudget - payout;

        // Conservation of funds: payout + refund == maxBudget
        assert(payout + refund == tender.maxBudget);

        address winner = tender.lowestBidder;
        address creator = tender.creator;

        // Pay winner
        usdc.safeTransfer(winner, payout);

        // Refund savings to creator
        if (refund > 0) {
            usdc.safeTransfer(creator, refund);
        }

        emit TenderSettled(tender.id, winner, payout, refund);
    }

    // --- VIEW / GETTER FUNCTIONS ---

    function getTender(uint256 tenderId) external view returns (Tender memory) {
        return tenders[tenderId];
    }

    function getStake(address agent) external view returns (uint256) {
        return stakes[agent];
    }

    function isQualifiedAgent(address agent) external view returns (bool) {
        return stakes[agent] >= MIN_AGENT_STAKE;
    }

    function getTenderCurrentStatus(uint256 tenderId) external view returns (TenderStatus) {
        Tender memory tender = tenders[tenderId];
        if (tender.status == TenderStatus.OPEN && block.timestamp > tender.biddingDeadline) {
            if (tender.lowestBidder != address(0)) {
                return TenderStatus.AWARDED;
            } else {
                return TenderStatus.EXPIRED;
            }
        }
        return tender.status;
    }
}
