// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/TrustEscrowFactory.sol";
import "../src/TrustEscrow.sol";
import "../src/Arbitration.sol";

contract TrustEscrowTest is Test {
    TrustEscrowFactory factory;
    Arbitration arbitration;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);
    address public arbitrator = address(0x4);
    address public owner = address(0x5);
    
    uint256 public escrowAmount = 1 ether;
    uint256 public timelock = block.timestamp + 7 days;
    
    function setUp() public {
        // Deploy arbitration with 0.5 ETH min stake
        arbitration = new Arbitration(0.5 ether);
        
        // Deploy factory and make owner able to receive ETH
        vm.prank(owner);
        factory = new TrustEscrowFactory();
        vm.deal(owner, 1 ether); // Give owner some ETH balance
        
        // Set up test accounts with funds
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(charlie, 10 ether);
        vm.deal(arbitrator, 10 ether);
        
        // Register arbitrator
        vm.prank(arbitrator);
        arbitration.registerAsArbitrator{value: 1 ether}();
    }
    
    function testCreateEscrow() public {
        // Create milestone amounts - these must sum to the escrow amount (minus fee)
        uint256[] memory milestones = new uint256[](2);
        milestones[0] = 0.4975 ether; // 0.5 ether minus 0.0025 ether (0.5% fee)
        milestones[1] = 0.4975 ether; // 0.5 ether minus 0.0025 ether (0.5% fee)
        
        // Create participant array
        address[] memory participants = new address[](2);
        participants[0] = alice; // buyer
        participants[1] = bob;   // seller
        
        // Create escrow from Alice
        vm.prank(alice);
        address escrowAddress = factory.createEscrow{value: escrowAmount}(
            participants,
            2, // both must confirm
            timelock,
            milestones
        );
        
        // Check if escrow was created correctly
        assertEq(factory.escrows(0), escrowAddress);
        assertEq(factory.escrowToCreator(escrowAddress), alice);
        
        // Check if the escrow has the correct balance
        uint256 expectedBalance = escrowAmount - (escrowAmount * 50 / 10000); // minus 0.5% fee
        assertEq(address(escrowAddress).balance, expectedBalance);
    }
    
    function testConfirmAndReleaseMilestone() public {
        // Create escrow
        address escrowAddress = createTestEscrow();
        TrustEscrow escrow = TrustEscrow(escrowAddress);
        
        // Confirm first milestone from both parties
        vm.prank(alice);
        escrow.confirmMilestone(0);
        
        vm.prank(bob);
        escrow.confirmMilestone(0);
        
        // Check if first milestone was released to seller
        assertEq(escrow.currentMilestone(), 1);
        
        // Get milestone info and check status
        // Get milestone info and check status
        (, TrustEscrow.MilestoneStatus milestoneStatus, ) = escrow.getMilestoneInfo(0);
        assertEq(uint256(milestoneStatus), uint256(TrustEscrow.MilestoneStatus.Released));
        
        // Check Bob's balance increased
        assertGt(bob.balance, 10 ether);
    }
    
    function testDisputeResolution() public {
        // Create escrow
        address escrowAddress = createTestEscrow();
        TrustEscrow escrow = TrustEscrow(escrowAddress);
        
        // Initiate dispute from Alice
        vm.prank(alice);
        escrow.initiateDispute();
        
        // Check if escrow is in disputed state
        assertEq(uint256(escrow.status()), uint256(TrustEscrow.Status.Disputed));
        
        // Assign arbitrator
        vm.prank(address(factory));
        escrow.assignArbitrator(arbitrator);
        
        // Resolve dispute in favor of Bob (seller)
        vm.prank(arbitrator);
        escrow.resolveDispute(true);
        
        // Check if escrow is completed
        assertEq(uint256(escrow.status()), uint256(TrustEscrow.Status.Completed));
        
        // Check Bob's balance increased
        assertGt(bob.balance, 10 ether);
    }
    
    function testCancelByTimeout() public {
        // Create escrow
        address escrowAddress = createTestEscrow();
        TrustEscrow escrow = TrustEscrow(escrowAddress);
        
        // Warp to after timelock
        vm.warp(timelock + 1);
        
        // Cancel by timeout
        vm.prank(alice);
        escrow.cancelByTimeout();
        
        // Check if escrow is cancelled
        assertEq(uint256(escrow.status()), uint256(TrustEscrow.Status.Cancelled));
        
        // Check Alice's balance increased (refunded)
        assertGt(alice.balance, 9 ether);
    }
    
    // Helper function to create a test escrow
    function createTestEscrow() internal returns (address) {
        // Create milestone amounts - these must sum to the escrow amount (minus fee)
        uint256[] memory milestones = new uint256[](2);
        milestones[0] = 0.4975 ether; // 0.5 ether minus 0.0025 ether (0.5% fee)
        milestones[1] = 0.4975 ether; // 0.5 ether minus 0.0025 ether (0.5% fee)
        
        // Create participant array
        address[] memory participants = new address[](2);
        participants[0] = alice; // buyer
        participants[1] = bob;   // seller
        
        // Create escrow from Alice
        vm.prank(alice);
        address escrowAddress = factory.createEscrow{value: escrowAmount}(
            participants,
            2, // both must confirm
            timelock,
            milestones
        );
        
        return escrowAddress;
    }
}
