// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./TrustEscrow.sol";

/**
 * @title Arbitration
 * @dev Contract to manage arbitrators and dispute resolution
 */
contract Arbitration {
    // Minimum stake required to become an arbitrator
    uint256 public minStake;
    
    // Fee percentage in basis points (1% = 100)
    uint16 public arbitrationFee = 200; // 2%
    
    // Platform owner
    address public owner;
    
    // Arbitrator status
    enum ArbitratorStatus {
        Inactive,
        Active,
        Suspended
    }
    
    // Arbitrator information
    struct ArbitratorInfo {
        uint256 stake;
        uint256 disputesResolved;
        uint256 reputationScore; // 0-100
        ArbitratorStatus status;
        uint256 totalEarnings;
    }
    
    // Dispute information
    struct DisputeInfo {
        address escrowAddress;
        address arbitrator;
        bool isResolved;
        uint256 timestamp;
    }
    
    // Mappings
    mapping(address => ArbitratorInfo) public arbitrators;
    mapping(address => DisputeInfo) public disputes;
    address[] public arbitratorList;
    
    // Events
    event ArbitratorRegistered(address indexed arbitrator, uint256 stake);
    event ArbitratorStakeIncreased(address indexed arbitrator, uint256 additionalStake);
    event ArbitratorStakeWithdrawn(address indexed arbitrator, uint256 amount);
    event ArbitratorStatusChanged(address indexed arbitrator, ArbitratorStatus status);
    event DisputeAssigned(address indexed escrow, address indexed arbitrator);
    event DisputeResolved(address indexed escrow, address indexed arbitrator, bool isSellerFavored);
    event ArbitrationFeeChanged(uint16 oldFee, uint16 newFee);
    event MinStakeChanged(uint256 oldMinStake, uint256 newMinStake);
    
    constructor(uint256 _minStake) {
        owner = msg.sender;
        minStake = _minStake;
    }
    
    /**
     * @dev Register as an arbitrator by staking funds
     */
    function registerAsArbitrator() external payable {
        require(msg.value >= minStake, "Stake too low");
        require(arbitrators[msg.sender].status == ArbitratorStatus.Inactive, "Already registered");
        
        arbitrators[msg.sender] = ArbitratorInfo({
            stake: msg.value,
            disputesResolved: 0,
            reputationScore: 50, // Start with neutral score
            status: ArbitratorStatus.Active,
            totalEarnings: 0
        });
        
        arbitratorList.push(msg.sender);
        
        emit ArbitratorRegistered(msg.sender, msg.value);
    }
    
    /**
     * @dev Increase arbitrator stake
     */
    function increaseStake() external payable {
        require(arbitrators[msg.sender].status != ArbitratorStatus.Inactive, "Not an arbitrator");
        require(msg.value > 0, "Must send funds");
        
        arbitrators[msg.sender].stake += msg.value;
        
        emit ArbitratorStakeIncreased(msg.sender, msg.value);
    }
    
    /**
     * @dev Withdraw stake (if not assigned to active disputes)
     * @param _amount Amount to withdraw
     */
    function withdrawStake(uint256 _amount) external {
        ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        require(arbitrator.status != ArbitratorStatus.Inactive, "Not an arbitrator");
        require(_amount <= arbitrator.stake, "Amount exceeds stake");
        
        // Ensure minimum stake is maintained
        require(arbitrator.stake - _amount >= minStake, "Must maintain minimum stake");
        
        arbitrator.stake -= _amount;
        
        (bool sent, ) = msg.sender.call{value: _amount}("");
        require(sent, "Failed to send funds");
        
        emit ArbitratorStakeWithdrawn(msg.sender, _amount);
    }
    
    /**
     * @dev Assign arbitrator to a dispute
     * @param _escrowAddress Address of the disputed escrow
     */
    function assignArbitrator(address _escrowAddress) external {
        require(msg.sender == owner, "Only owner can assign");
        require(disputes[_escrowAddress].arbitrator == address(0), "Already assigned");
        
        // Find an available arbitrator with highest reputation
        address selectedArbitrator = address(0);
        uint256 highestReputation = 0;
        
        for (uint i = 0; i < arbitratorList.length; i++) {
            address arbitratorAddress = arbitratorList[i];
            ArbitratorInfo storage arbitrator = arbitrators[arbitratorAddress];
            
            if (arbitrator.status == ArbitratorStatus.Active && arbitrator.reputationScore > highestReputation) {
                selectedArbitrator = arbitratorAddress;
                highestReputation = arbitrator.reputationScore;
            }
        }
        
        require(selectedArbitrator != address(0), "No available arbitrators");
        
        // Assign the arbitrator
        disputes[_escrowAddress] = DisputeInfo({
            escrowAddress: _escrowAddress,
            arbitrator: selectedArbitrator,
            isResolved: false,
            timestamp: block.timestamp
        });
        
        // Update escrow with arbitrator
        TrustEscrow(_escrowAddress).assignArbitrator(selectedArbitrator);
        
        emit DisputeAssigned(_escrowAddress, selectedArbitrator);
    }
    
    /**
     * @dev Resolve a dispute
     * @param _escrowAddress Address of the disputed escrow
     * @param _isSellerFavored Whether the resolution favors the seller
     */
    function resolveDispute(address _escrowAddress, bool _isSellerFavored) external {
        DisputeInfo storage dispute = disputes[_escrowAddress];
        require(msg.sender == dispute.arbitrator, "Not assigned arbitrator");
        require(!dispute.isResolved, "Already resolved");
        
        // Resolve the dispute on the escrow contract
        TrustEscrow escrow = TrustEscrow(_escrowAddress);
        escrow.resolveDispute(_isSellerFavored);
        
        dispute.isResolved = true;
        
        // Update arbitrator stats
        ArbitratorInfo storage arbitrator = arbitrators[msg.sender];
        arbitrator.disputesResolved++;
        
        // Calculate arbitration fee
        uint256 escrowBalance = address(escrow).balance;
        uint256 fee = (escrowBalance * arbitrationFee) / 10000;
        
        // Transfer fee to arbitrator
        if (fee > 0) {
            (bool sent, ) = msg.sender.call{value: fee}("");
            require(sent, "Failed to send funds");
            arbitrator.totalEarnings += fee;
        }
        
        emit DisputeResolved(_escrowAddress, msg.sender, _isSellerFavored);
    }
    
    /**
     * @dev Update arbitrator status (only owner)
     * @param _arbitrator Address of arbitrator
     * @param _status New status
     */
    function updateArbitratorStatus(address _arbitrator, ArbitratorStatus _status) external {
        require(msg.sender == owner, "Only owner can update");
        require(arbitrators[_arbitrator].status != ArbitratorStatus.Inactive, "Not an arbitrator");
        
        arbitrators[_arbitrator].status = _status;
        
        emit ArbitratorStatusChanged(_arbitrator, _status);
    }
    
    /**
     * @dev Set arbitration fee (only owner)
     * @param _newFee New fee in basis points
     */
    function setArbitrationFee(uint16 _newFee) external {
        require(msg.sender == owner, "Only owner can change fee");
        require(_newFee <= 500, "Fee cannot exceed 5%");
        
        uint16 oldFee = arbitrationFee;
        arbitrationFee = _newFee;
        
        emit ArbitrationFeeChanged(oldFee, _newFee);
    }
    
    /**
     * @dev Set minimum stake (only owner)
     * @param _newMinStake New minimum stake
     */
    function setMinStake(uint256 _newMinStake) external {
        require(msg.sender == owner, "Only owner can change min stake");
        
        uint256 oldMinStake = minStake;
        minStake = _newMinStake;
        
        emit MinStakeChanged(oldMinStake, _newMinStake);
    }
    
    /**
     * @dev Get all registered arbitrators
     */
    function getAllArbitrators() external view returns (address[] memory) {
        return arbitratorList;
    }
    
    /**
     * @dev Get count of registered arbitrators
     */
    function getArbitratorCount() external view returns (uint256) {
        return arbitratorList.length;
    }
}
