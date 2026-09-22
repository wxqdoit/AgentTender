// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TestERC20} from "./TestERC20.sol";
import {AgentTender} from "../src/AgentTender.sol";

contract AgentTenderTest is Test {
    TestERC20 public usdc;
    AgentTender public tenderContract;

    address public creator = address(0x100);
    address public agentAlpha = address(0x201);
    address public agentBeta = address(0x202);
    address public agentGamma = address(0x203);
    address public maliciousAgent = address(0x999);

    uint256 public constant INITIAL_BALANCE = 10_000 * 10 ** 6; // 10,000 USDC
    uint256 public constant STAKE_AMOUNT = 10 * 10 ** 6; // 10 USDC

    function setUp() public {
        usdc = new TestERC20();
        tenderContract = new AgentTender(address(usdc));

        // Fund accounts
        usdc.mint(creator, INITIAL_BALANCE);
        usdc.mint(agentAlpha, INITIAL_BALANCE);
        usdc.mint(agentBeta, INITIAL_BALANCE);
        usdc.mint(agentGamma, INITIAL_BALANCE);
        usdc.mint(maliciousAgent, INITIAL_BALANCE);

        // Creator approves contract
        vm.prank(creator);
        usdc.approve(address(tenderContract), type(uint256).max);

        // Agents approve and deposit stake
        address[3] memory agents = [agentAlpha, agentBeta, agentGamma];
        for (uint256 i = 0; i < agents.length; i++) {
            vm.startPrank(agents[i]);
            usdc.approve(address(tenderContract), type(uint256).max);
            tenderContract.depositStake(STAKE_AMOUNT);
            vm.stopPrank();
        }
    }

    // --- STAKE VAULT TESTS ---

    function test_DepositAndWithdrawStake() public {
        vm.startPrank(maliciousAgent);
        usdc.approve(address(tenderContract), 1 * 10 ** 6);
        tenderContract.depositStake(1 * 10 ** 6);
        assertEq(tenderContract.getStake(maliciousAgent), 1 * 10 ** 6);
        assertTrue(tenderContract.isQualifiedAgent(maliciousAgent));

        tenderContract.withdrawStake(500_000);
        assertEq(tenderContract.getStake(maliciousAgent), 500_000);

        vm.expectRevert("Insufficient stake balance");
        tenderContract.withdrawStake(600_000);
        vm.stopPrank();
    }

    // --- CREATION AND CANCELLATION ---

    function test_CreateTenderSuccess() public {
        vm.prank(creator);
        uint256 tenderId = tenderContract.createTender(
            "ipfs://QmTaskMetadata1",
            500_000, // 0.50 USDC
            8, // 8 seconds
            15 // 15 seconds
        );

        AgentTender.Tender memory t = tenderContract.getTender(tenderId);
        assertEq(t.id, 1);
        assertEq(t.creator, creator);
        assertEq(t.maxBudget, 500_000);
        assertEq(t.currentLowestBid, 500_000);
        assertEq(t.lowestBidder, address(0));
        assertEq(uint256(t.status), uint256(AgentTender.TenderStatus.OPEN));
        assertEq(usdc.balanceOf(address(tenderContract)), 3 * STAKE_AMOUNT + 500_000);
    }

    function test_CancelTenderSuccess() public {
        uint256 balanceBefore = usdc.balanceOf(creator);

        vm.prank(creator);
        uint256 tenderId = tenderContract.createTender("ipfs://Task", 500_000, 8, 15);

        assertEq(usdc.balanceOf(creator), balanceBefore - 500_000);

        vm.prank(creator);
        tenderContract.cancelTender(tenderId);

        AgentTender.Tender memory t = tenderContract.getTender(tenderId);
        assertEq(uint256(t.status), uint256(AgentTender.TenderStatus.CANCELLED));
        assertEq(usdc.balanceOf(creator), balanceBefore);
    }

    function test_CannotCancelAfterBid() public {
        vm.prank(creator);
        uint256 tenderId = tenderContract.createTender("ipfs://Task", 500_000, 8, 15);

        vm.prank(agentAlpha);
        tenderContract.submitBid(tenderId, 410_000);

        vm.prank(creator);
        vm.expectRevert("Cannot cancel after bids received");
        tenderContract.cancelTender(tenderId);
    }

    // --- BIDDING TESTS ---

    function test_ReverseBiddingSequence() public {
        vm.prank(creator);
        uint256 tenderId = tenderContract.createTender("ipfs://Task", 500_000, 8, 15);

        // Alpha bids 0.42 USDC
        vm.prank(agentAlpha);
        tenderContract.submitBid(tenderId, 420_000);
        AgentTender.Tender memory t = tenderContract.getTender(tenderId);
        assertEq(t.currentLowestBid, 420_000);
        assertEq(t.lowestBidder, agentAlpha);

        // Beta attempts insufficient decrement -> revert
        vm.prank(agentBeta);
        vm.expectRevert("Bid decrease insufficient");
        tenderContract.submitBid(tenderId, 415_000); // Only 5k diff, needs at least 10k

        // Beta bids 0.35 USDC (valid)
        vm.prank(agentBeta);
        tenderContract.submitBid(tenderId, 310_000);
        t = tenderContract.getTender(tenderId);
        assertEq(t.currentLowestBid, 310_000);
        assertEq(t.lowestBidder, agentBeta);

        // Gamma snipes at 0.28 USDC
        vm.prank(agentGamma);
        tenderContract.submitBid(tenderId, 280_000);
        t = tenderContract.getTender(tenderId);
        assertEq(t.currentLowestBid, 280_000);
        assertEq(t.lowestBidder, agentGamma);
    }

    function test_UnstakedAgentCannotBid() public {
        vm.prank(creator);
        uint256 tenderId = tenderContract.createTender("ipfs://Task", 500_000, 8, 15);

        // Malicious unstaked agent attempts to bid
        vm.prank(maliciousAgent);
        vm.expectRevert("Insufficient agent stake");
        tenderContract.submitBid(tenderId, 400_000);
    }

    // --- DELIVERY & SETTLEMENT TESTS ---

    function test_FullLifecycleInstantConfirm() public {
        uint256 creatorStart = usdc.balanceOf(creator);
        uint256 gammaStart = usdc.balanceOf(agentGamma);

        vm.prank(creator);
        uint256 tenderId = tenderContract.createTender("ipfs://Task", 500_000, 8, 15);

        // Bidding
        vm.prank(agentAlpha);
        tenderContract.submitBid(tenderId, 420_000);

        vm.prank(agentGamma);
        tenderContract.submitBid(tenderId, 280_000);

        // Fast-forward past bidding deadline (8 seconds)
        vm.warp(block.timestamp + 9);

        // Agent Gamma delivers payload
        string memory outputPayload = "{\"result\":\"Financial Net Profit YoY: +28.4%\"}";
        vm.prank(agentGamma);
        tenderContract.submitDelivery(tenderId, outputPayload);

        AgentTender.Tender memory t = tenderContract.getTender(tenderId);
        assertEq(uint256(t.status), uint256(AgentTender.TenderStatus.DELIVERED));
        assertEq(t.deliveryPayload, outputPayload);

        // Creator confirms immediately
        vm.prank(creator);
        tenderContract.confirmDelivery(tenderId);

        t = tenderContract.getTender(tenderId);
        assertEq(uint256(t.status), uint256(AgentTender.TenderStatus.SETTLED));

        // Payout to Gamma: 280_000
        assertEq(usdc.balanceOf(agentGamma), gammaStart + 280_000);
        // Refund to Creator: 500_000 - 280_000 = 220_000
        assertEq(usdc.balanceOf(creator), creatorStart - 280_000);
    }

    function test_OptimisticClaimPayoutAfterChallengeWindow() public {
        uint256 creatorStart = usdc.balanceOf(creator);
        uint256 betaStart = usdc.balanceOf(agentBeta);

        vm.prank(creator);
        uint256 tenderId = tenderContract.createTender("ipfs://Task", 600_000, 5, 20);

        vm.prank(agentBeta);
        tenderContract.submitBid(tenderId, 310_000);

        // Warp past bidding deadline
        vm.warp(block.timestamp + 6);

        // Beta delivers
        vm.prank(agentBeta);
        tenderContract.submitDelivery(tenderId, "{\"summary\":\"extracted_data\"}");

        // Attempt claim before challenge window ends -> revert
        vm.prank(agentBeta);
        vm.expectRevert("Challenge period still active");
        tenderContract.claimPayout(tenderId);

        // Warp past 15-second challenge window
        vm.warp(block.timestamp + 16);

        // Now any caller (even agentBeta) can trigger claimPayout
        tenderContract.claimPayout(tenderId);

        AgentTender.Tender memory t = tenderContract.getTender(tenderId);
        assertEq(uint256(t.status), uint256(AgentTender.TenderStatus.SETTLED));
        assertEq(usdc.balanceOf(agentBeta), betaStart + 310_000);
        assertEq(usdc.balanceOf(creator), creatorStart - 310_000);
    }

    // --- TIMEOUT & SLASHING TESTS ---

    function test_BiddingTimeoutRefundsCreator() public {
        uint256 creatorStart = usdc.balanceOf(creator);

        vm.prank(creator);
        uint256 tenderId = tenderContract.createTender("ipfs://Task", 500_000, 8, 15);

        // No bids submitted. Warp past bidding deadline
        vm.warp(block.timestamp + 9);

        tenderContract.handleBiddingTimeout(tenderId);

        AgentTender.Tender memory t = tenderContract.getTender(tenderId);
        assertEq(uint256(t.status), uint256(AgentTender.TenderStatus.CANCELLED));
        assertEq(usdc.balanceOf(creator), creatorStart);
    }

    function test_ExecutionTimeoutSlashesWinnerAndCompensatesCreator() public {
        uint256 creatorStart = usdc.balanceOf(creator);

        vm.prank(creator);
        uint256 tenderId = tenderContract.createTender("ipfs://Task", 500_000, 8, 15);

        vm.prank(agentAlpha);
        tenderContract.submitBid(tenderId, 300_000);

        // Fast forward past execution deadline (8 + 15 = 23 seconds)
        vm.warp(block.timestamp + 25);

        uint256 alphaStakeBefore = tenderContract.getStake(agentAlpha);

        // Handle execution timeout
        tenderContract.handleExecutionTimeout(tenderId);

        AgentTender.Tender memory t = tenderContract.getTender(tenderId);
        assertEq(uint256(t.status), uint256(AgentTender.TenderStatus.EXPIRED));

        // Alpha's stake slashed by MIN_AGENT_STAKE (10_000)
        assertEq(tenderContract.getStake(agentAlpha), alphaStakeBefore - 10_000);

        // Creator receives full budget (500_000) + penalty (10_000)
        assertEq(usdc.balanceOf(creator), creatorStart + 10_000);
    }

    function test_ConservationOfFundsUnderMultipleTenders() public {
        uint256 contractUsdcBefore = usdc.balanceOf(address(tenderContract));
        
        vm.prank(creator);
        uint256 id1 = tenderContract.createTender("ipfs://Task1", 1_000_000, 5, 10);

        vm.prank(creator);
        uint256 id2 = tenderContract.createTender("ipfs://Task2", 800_000, 5, 10);

        // Alpha bids on 1, Beta bids on 2
        vm.prank(agentAlpha);
        tenderContract.submitBid(id1, 810_000);

        vm.prank(agentBeta);
        tenderContract.submitBid(id2, 600_000);

        // Warp past bidding
        vm.warp(block.timestamp + 6);

        // Alpha delivers on 1, Beta delivers on 2
        vm.prank(agentAlpha);
        tenderContract.submitDelivery(id1, "payload1");

        vm.prank(agentBeta);
        tenderContract.submitDelivery(id2, "payload2");

        // Creator confirms both
        vm.startPrank(creator);
        tenderContract.confirmDelivery(id1);
        tenderContract.confirmDelivery(id2);
        vm.stopPrank();

        // Contract balance should be back to exact stake reserve
        assertEq(usdc.balanceOf(address(tenderContract)), contractUsdcBefore);
    }
}
