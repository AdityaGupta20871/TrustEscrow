export const escrowAbi = [
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "_participants",
        "type": "address[]"
      },
      {
        "internalType": "uint256",
        "name": "_requiredConfirmations",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_timelock",
        "type": "uint256"
      },
      {
        "internalType": "uint256[]",
        "name": "_milestones",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "payable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "participant",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "milestoneId",
        "type": "uint256"
      }
    ],
    "name": "MilestoneConfirmed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "milestoneId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "MilestoneReleased",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_milestoneId",
        "type": "uint256"
      }
    ],
    "name": "confirmMilestone",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getEscrowInfo",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "requiredConfirmations",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timelock",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalMilestones",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_milestoneId",
        "type": "uint256"
      }
    ],
    "name": "getMilestoneInfo",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "enum TrustEscrow.MilestoneStatus",
        "name": "milestoneStatus",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "confirmations",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getParticipants",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_milestoneId",
        "type": "uint256"
      }
    ],
    "name": "releaseMilestone",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_arbitratorAddress",
        "type": "address"
      }
    ],
    "name": "setArbitrator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_milestoneId",
        "type": "uint256"
      }
    ],
    "name": "startDispute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
