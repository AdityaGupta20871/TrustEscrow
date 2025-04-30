// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Arbitration.sol";

/**
 * @title TrustEscrow
 * @dev Core escrow contract with multi-signature, time-lock, and milestone features
 */
contract TrustEscrow {
    // Escrow status
    enum Status {
        Active,
        Completed,
        Cancelled,
        Disputed
    }
    
    // Milestone status
    enum MilestoneStatus {
        Pending,
        Approved,
        Rejected,
        Released
    }
    
    // Milestone structure
    struct Milestone {
        uint256 amount;
        MilestoneStatus status;
        uint256 confirmations;
        mapping(address => bool) isConfirmed;
    }
    
    // State variables
    address[] public participants;
    uint256 public requiredConfirmations;
    uint256 public timelock;
    uint256 public totalAmount;
    Status public status;
    address public factory;
    address public arbitrator;
    uint256 public currentMilestone;
    bool public isDisputed;
    
    // Milestone tracking
    uint256[] public milestoneAmounts;
    mapping(uint256 => Milestone) public milestones;
    
    // Events
    event Deposited(address indexed sender, uint256 amount);
    event MilestoneConfirmed(address indexed participant, uint256 milestoneId);
    event FundsReleased(uint256 milestoneId, uint256 amount, address indexed recipient);
    event EscrowDisputed(address indexed disputer);
    event DisputeResolved(address indexed arbitrator, bool isSellerFavored);
    event EscrowCancelled();
    event EscrowCompleted();
    event ArbitratorAssigned(address indexed arbitrator);
    
    constructor(
        address[] memory _participants,
        uint256 _requiredConfirmations,
        uint256 _timelock,
        uint256[] memory _milestoneAmounts,
        address _factory
    ) payable {
        require(_participants.length > 0, "No participants provided");
        require(_requiredConfirmations > 0 && _requiredConfirmations <= _participants.length, "Invalid confirmation count");
        require(_timelock > block.timestamp, "Timelock must be in the future");
        require(_milestoneAmounts.length > 0, "No milestones provided");
        require(msg.value > 0, "Must include funds");
        
        participants = _participants;
        requiredConfirmations = _requiredConfirmations;
        timelock = _timelock;
        factory = _factory;
        totalAmount = msg.value;
        status = Status.Active;
        currentMilestone = 0;
        
        // Initialize milestones
        uint256 totalMilestoneAmount = 0;
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            milestoneAmounts.push(_milestoneAmounts[i]);
            totalMilestoneAmount += _milestoneAmounts[i];
            
            Milestone storage milestone = milestones[i];
            milestone.amount = _milestoneAmounts[i];
            milestone.status = MilestoneStatus.Pending;
            milestone.confirmations = 0;
        }
        
        require(totalMilestoneAmount == msg.value, "Milestone amounts must equal total escrow amount");
        
        emit Deposited(msg.sender, msg.value);
    }
    
    /**
     * @dev Confirms a milestone as completed
     * @param _milestoneId ID of the milestone to confirm
     */
    function confirmMilestone(uint256 _milestoneId) external onlyParticipant {
        require(status == Status.Active, "Escrow is not active");
        require(_milestoneId == currentMilestone, "Can only confirm current milestone");
        require(!isDisputed, "Escrow is disputed");
        
        Milestone storage milestone = milestones[_milestoneId];
        require(milestone.status == MilestoneStatus.Pending, "Milestone is not pending");
        require(!milestone.isConfirmed[msg.sender], "Already confirmed");
        
        milestone.isConfirmed[msg.sender] = true;
        milestone.confirmations++;
        
        emit MilestoneConfirmed(msg.sender, _milestoneId);
        
        // If we have enough confirmations, release funds for this milestone
        if (milestone.confirmations >= requiredConfirmations) {
            releaseMilestone(_milestoneId);
        }
    }
    
    /**
     * @dev Releases funds for a milestone
     * @param _milestoneId ID of the milestone to release
     */
    function releaseMilestone(uint256 _milestoneId) internal {
        Milestone storage milestone = milestones[_milestoneId];
        milestone.status = MilestoneStatus.Released;
        
        // Determine recipient (assuming last participant is recipient/seller)
        address recipient = participants[participants.length - 1];
        
        // Transfer funds to recipient
        (bool sent, ) = recipient.call{value: milestone.amount}("");
        require(sent, "Failed to send funds");
        
        emit FundsReleased(_milestoneId, milestone.amount, recipient);
        
        // Move to next milestone or complete the escrow
        if (_milestoneId < milestoneAmounts.length - 1) {
            currentMilestone++;
        } else {
            status = Status.Completed;
            emit EscrowCompleted();
        }
    }
    
    /**
     * @dev Initiates a dispute for arbitration
     */
    function initiateDispute() external onlyParticipant {
        require(status == Status.Active, "Escrow is not active");
        require(!isDisputed, "Dispute already initiated");
        
        isDisputed = true;
        status = Status.Disputed;
        
        emit EscrowDisputed(msg.sender);
    }
    
    /**
     * @dev Assigns an arbitrator to the dispute
     * @param _arbitrator Address of the arbitrator
     */
    function assignArbitrator(address _arbitrator) external {
        require(msg.sender == factory, "Only factory can assign arbitrator");
        require(status == Status.Disputed, "Escrow is not disputed");
        require(arbitrator == address(0), "Arbitrator already assigned");
        
        arbitrator = _arbitrator;
        
        emit ArbitratorAssigned(_arbitrator);
    }
    
    /**
     * @dev Resolves a dispute
     * @param _isSellerFavored Whether the resolution favors the seller
     */
    function resolveDispute(bool _isSellerFavored) external {
        require(msg.sender == arbitrator, "Only arbitrator can resolve");
        require(status == Status.Disputed, "Escrow is not disputed");
        
        isDisputed = false;
        
        if (_isSellerFavored) {
            // Release all remaining milestones
            address recipient = participants[participants.length - 1];
            uint256 remainingAmount = 0;
            
            for (uint256 i = currentMilestone; i < milestoneAmounts.length; i++) {
                if (milestones[i].status != MilestoneStatus.Released) {
                    remainingAmount += milestones[i].amount;
                    milestones[i].status = MilestoneStatus.Released;
                }
            }
            
            if (remainingAmount > 0) {
                (bool sent, ) = recipient.call{value: remainingAmount}("");
                require(sent, "Failed to send funds");
            }
            
            status = Status.Completed;
            emit EscrowCompleted();
        } else {
            // Refund all remaining milestones to the buyer
            address buyer = participants[0];
            uint256 remainingAmount = 0;
            
            for (uint256 i = currentMilestone; i < milestoneAmounts.length; i++) {
                if (milestones[i].status != MilestoneStatus.Released) {
                    remainingAmount += milestones[i].amount;
                    milestones[i].status = MilestoneStatus.Rejected;
                }
            }
            
            if (remainingAmount > 0) {
                (bool sent, ) = buyer.call{value: remainingAmount}("");
                require(sent, "Failed to send funds");
            }
            
            status = Status.Cancelled;
            emit EscrowCancelled();
        }
        
        emit DisputeResolved(arbitrator, _isSellerFavored);
    }
    
    /**
     * @dev Cancels the escrow and refunds if timelock has passed
     */
    function cancelByTimeout() external onlyParticipant {
        require(status == Status.Active, "Escrow is not active");
        require(block.timestamp > timelock, "Timelock not yet passed");
        require(!isDisputed, "Escrow is disputed");
        
        // Refund remaining funds to the buyer
        address buyer = participants[0];
        uint256 remainingAmount = 0;
        
        for (uint256 i = currentMilestone; i < milestoneAmounts.length; i++) {
            if (milestones[i].status != MilestoneStatus.Released) {
                remainingAmount += milestones[i].amount;
                milestones[i].status = MilestoneStatus.Rejected;
            }
        }
        
        if (remainingAmount > 0) {
            (bool sent, ) = buyer.call{value: remainingAmount}("");
            require(sent, "Failed to send funds");
        }
        
        status = Status.Cancelled;
        
        emit EscrowCancelled();
    }
    
    /**
     * @dev Checks if an address is a participant
     */
    modifier onlyParticipant() {
        bool isParticipant = false;
        for (uint i = 0; i < participants.length; i++) {
            if (participants[i] == msg.sender) {
                isParticipant = true;
                break;
            }
        }
        require(isParticipant, "Not a participant");
        _;
    }
    
    /**
     * @dev Returns milestone information (workaround for struct with mapping)
     * @param _milestoneId Milestone ID to query
     */
    function getMilestoneInfo(uint256 _milestoneId) external view returns (
        uint256 amount,
        MilestoneStatus milestoneStatus,
        uint256 confirmations
    ) {
        require(_milestoneId < milestoneAmounts.length, "Invalid milestone ID");
        
        Milestone storage milestone = milestones[_milestoneId];
        return (
            milestone.amount,
            milestone.status,
            milestone.confirmations
        );
    }
    
    /**
     * @dev Checks if a participant has confirmed a milestone
     * @param _milestoneId Milestone ID to query
     * @param _participant Participant address to check
     */
    function hasConfirmedMilestone(uint256 _milestoneId, address _participant) external view returns (bool) {
        require(_milestoneId < milestoneAmounts.length, "Invalid milestone ID");
        return milestones[_milestoneId].isConfirmed[_participant];
    }
    
    /**
     * @dev Returns all participants
     */
    function getParticipants() external view returns (address[] memory) {
        return participants;
    }
    
    /**
     * @dev Returns all milestone amounts
     */
    function getMilestoneAmounts() external view returns (uint256[] memory) {
        return milestoneAmounts;
    }
}
