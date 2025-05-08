// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./TrustEscrow.sol";

/**
 * @title TrustEscrowFactory
 * @dev Factory contract for creating new TrustEscrow instances
 */
contract TrustEscrowFactory {
    // Array to track all created escrows
    address[] public escrows;
    
    // Mapping from escrow address to creator
    mapping(address => address) public escrowToCreator;
    
    // Mapping from user to their escrows
    mapping(address => address[]) public userEscrows;
    
    // Fee percentage in basis points (1% = 100)
    uint16 public feeRate = 50; // 0.5%
    
    // Platform owner
    address public owner;
    
    // Events
    event EscrowCreated(address indexed escrowAddress, address indexed creator, uint256 value);
    event FeeRateChanged(uint16 oldFeeRate, uint16 newFeeRate);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Creates a new escrow contract
     * @param _participants Array of participant addresses
     * @param _requiredConfirmations Number of required confirmations to release funds
     * @param _timelock Timestamp after which the escrow can be released or reverted
     * @param _milestones Array of milestone amounts (in wei)
     * @return Address of the newly created escrow contract
     */
    function createEscrow(
        address[] memory _participants,
        uint256 _requiredConfirmations,
        uint256 _timelock,
        uint256[] memory _milestones
    ) external payable returns (address) {
        require(_participants.length > 0, "No participants provided");
        require(_requiredConfirmations > 0 && _requiredConfirmations <= _participants.length, "Invalid confirmation count");
        require(msg.value > 0, "Must include funds");
        
        // Calculate fee
        uint256 fee = (msg.value * feeRate) / 10000;
        uint256 escrowAmount = msg.value - fee;
        
        // Create new escrow contract
        TrustEscrow escrow = new TrustEscrow{value: escrowAmount}(
            _participants,
            _requiredConfirmations,
            _timelock,
            _milestones,
            address(this)
        );
        
        // Track the new escrow
        address escrowAddress = address(escrow);
        escrows.push(escrowAddress);
        escrowToCreator[escrowAddress] = msg.sender;
        userEscrows[msg.sender].push(escrowAddress);
        
        // Add the escrow to each participant's list
        for (uint i = 0; i < _participants.length; i++) {
            if (_participants[i] != msg.sender) {
                userEscrows[_participants[i]].push(escrowAddress);
            }
        }
        
        // Transfer fee to owner if there is any fee
        if (fee > 0) {
            (bool sent, ) = owner.call{value: fee}("");
            require(sent, "Failed to send fee");
        }
        
        emit EscrowCreated(escrowAddress, msg.sender, escrowAmount);
        
        return escrowAddress;
    }
    
    /**
     * @dev Updates the fee rate (only owner)
     * @param _newFeeRate New fee rate in basis points
     */
    function setFeeRate(uint16 _newFeeRate) external {
        require(msg.sender == owner, "Only owner can change fee");
        require(_newFeeRate <= 1000, "Fee cannot exceed 10%");
        
        uint16 oldFeeRate = feeRate;
        feeRate = _newFeeRate;
        
        emit FeeRateChanged(oldFeeRate, _newFeeRate);
    }
    
    /**
     * @dev Transfers ownership of the factory
     * @param _newOwner Address of the new owner
     */
    function transferOwnership(address _newOwner) external {
        require(msg.sender == owner, "Only owner can transfer ownership");
        require(_newOwner != address(0), "New owner cannot be zero address");
        
        address oldOwner = owner;
        owner = _newOwner;
        
        emit OwnershipTransferred(oldOwner, _newOwner);
    }
    
    /**
     * @dev Retrieves all escrows created by a user
     * @param _user Address to check
     * @return Array of escrow addresses
     */
    function getUserEscrows(address _user) external view returns (address[] memory) {
        return userEscrows[_user];
    }
    
    /**
     * @dev Retrieves all escrows
     * @return Array of all escrow addresses
     */
    function getAllEscrows() external view returns (address[] memory) {
        return escrows;
    }
    
    /**
     * @dev Retrieves count of all escrows
     * @return Count of escrows
     */
    function getEscrowCount() external view returns (uint256) {
        return escrows.length;
    }
}
