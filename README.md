# TrustEscrow: Decentralized Multi-Signature Escrow Platform

## Project Overview

TrustEscrow is a decentralized escrow service built on blockchain technology that enables trustless transactions via smart contracts on the Ethereum network. The platform supports multi-signature verification, time-lock mechanisms, arbitration, and milestone-based fund releases.

TrustEscrow is a decentralized escrow service built on blockchain technology that allows parties to engage in trustless transactions through smart contracts. It features multi-signature verification, time-lock mechanisms, an arbitration system, and conditional milestone-based releases.

## Project Structure

This project consists of two main components:

1. `TrustEscrow-contracts/`: Solidity smart contracts built with Foundry
2. `TrustEscrow-frontend/`: React/Vite frontend with wagmi hooks for Ethereum interaction

## Smart Contracts (Foundry)

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) - Smart contract development toolkit

### Setup and Installation

1. Navigate to the contracts directory:

```bash
cd TrustEscrow-contracts
```

2. Install dependencies:

```bash
forge install
```

3. Compile the contracts:

```bash
forge build
```

4. Run tests:

```bash
forge test
```

### Deployment

1. To deploy contracts to a local development network:

```bash
# Start a local Anvil chain
anvil

# In a separate terminal
forge script script/Deploy.s.sol:DeployScript --fork-url http://localhost:8545 --broadcast
```

2. To deploy to a testnet (e.g., Sepolia):

```bash
forge script script/Deploy.s.sol:DeployScript --fork-url $SEPOLIA_RPC_URL --broadcast --verify
```

## Frontend (React/Vite)

### Prerequisites

- Node.js (version 16+)
- npm or yarn

### Setup and Installation

1. Navigate to the frontend directory:

```bash
cd TrustEscrow-frontend
```

2. Install dependencies:

```bash
npm install
# or
yarn
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

4. The application will be available at `http://localhost:3000`

## Smart Contract Architecture

### TrustEscrowFactory.sol

The factory contract responsible for creating new escrow instances. It handles:
- Creating new escrow contracts
- Tracking all created escrows
- Collecting platform fees
- Maintaining user-to-escrow mappings

### TrustEscrow.sol

The core escrow implementation with:
- Multi-signature approval logic
- Time-lock functionality
- Milestone tracking and releases
- Dispute resolution mechanisms

### Arbitration.sol

Manages the arbitration system including:
- Arbitrator registration and staking
- Dispute assignment
- Dispute resolution
- Fee distribution

## Frontend Features

- **Dashboard**: Overview of active escrows and their statuses
- **Escrow Creation**: Intuitive wizard for setting up new escrows
- **Milestone Tracker**: Visual timeline of escrow progress
- **Dispute Management**: Interface for submitting and resolving disputes
- **Arbitration**: Portal to become an arbitrator and resolve disputes

## How to Use TrustEscrow

1. **Creating an Escrow**:
   - Connect your wallet
   - Navigate to "Create Escrow"
   - Add participants (buyer, seller, optional additional parties)
   - Define milestones and amounts
   - Set timelock period
   - Deposit funds

2. **Confirming Milestones**:
   - Navigate to the escrow details
   - Review the milestone
   - Confirm completion
   - Once required confirmations are met, funds are released

3. **Dispute Resolution**:
   - If there's a disagreement, any participant can initiate a dispute
   - An arbitrator will be assigned
   - The arbitrator reviews evidence and makes a binding decision
   - Funds are allocated based on the decision

4. **Becoming an Arbitrator**:
   - Navigate to the Arbitration section
   - Stake the required amount of ETH
   - Your status changes to "Active"
   - You'll be assigned disputes based on reputation and availability

## Development Roadmap

1. **Phase 1**: Implement core escrow functionality with Ethereum support
2. **Phase 2**: Add arbitration system and milestone-based releases
3. **Phase 3**: Implement cross-chain functionality via bridges or Layer 2 solutions
4. **Phase 4**: Create a decentralized marketplace for escrow templates and arbitrators

## Complete Setup Guide for New Users

### Setting Up Development Environment (Windows)

1. **Install Required Tools**:
   - Install [Node.js](https://nodejs.org/) (v16+)
   - Install [Git](https://git-scm.com/download/win)
   - Install [Visual Studio Code](https://code.visualstudio.com/) (recommended)

2. **Setup Windows Subsystem for Linux (WSL)**:
   - Open PowerShell as Administrator and run:
     ```powershell
     wsl --install
     ```
   - After installation, restart your computer
   - Launch Ubuntu (or your chosen Linux distro) from the Start menu
   - Create a username and password when prompted

3. **Install Foundry in WSL**:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

4. **Clone the Repository**:
   ```bash
   # In WSL terminal
   cd /mnt/c/Users/YourUsername/desired/path
   git clone https://github.com/your-username/TrustEscrow.git
   cd TrustEscrow
   ```

### Setting Up Smart Contracts

1. **Navigate to Contracts Directory**:
   ```bash
   cd TrustEscrow-contracts
   ```

2. **Install Dependencies and Build**:
   ```bash
   forge install
   forge build
   ```

3. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your preferred text editor to add private keys & RPC URLs
   # For local testing, use the default Anvil private key
   ```

4. **Run Local Blockchain**:
   ```bash
   # In a separate terminal
   anvil
   ```

5. **Deploy Contracts Locally**:
   ```bash
   forge script script/Deploy.s.sol:DeployScript --fork-url http://localhost:8545 --broadcast
   ```

### Setting Up Frontend

1. **Navigate to Frontend Directory**:
   ```bash
   cd ../TrustEscrow-shadcn
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   # or
   yarn
   ```

3. **Configure Contract Addresses**:
   - Update the contract addresses in `src/lib/contracts.ts` with those from your deployment

4. **Start Development Server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Access the Application**:
   - Open your browser and go to `http://localhost:3000` or the URL shown in your terminal

### Testing with MetaMask

1. **Install MetaMask Extension**:
   - Install from [MetaMask website](https://metamask.io/download.html)

2. **Configure MetaMask for Local Network**:
   - Open MetaMask
   - Add a new network with these settings:
     - Network Name: Anvil Local
     - RPC URL: http://127.0.0.1:8545
     - Chain ID: 31337
     - Currency Symbol: ETH

3. **Import Test Account**:
   - In MetaMask, click "Import Account"
   - Copy a private key from your Anvil output (shown when you started anvil)
   - Paste it to import an account with test ETH

## GitHub Setup and Deployment

### Pushing to GitHub

To push your project to GitHub (excluding PDFs and other unwanted files):

1. **Initialize Git Repository** (if not already done):
   ```bash
   # In WSL terminal, in project root
   git init
   ```

2. **Add Files**:
   ```bash
   git add .
   # This will respect the .gitignore file and exclude PDFs
   ```

3. **Commit Changes**:
   ```bash
   git commit -m "Initial commit of TrustEscrow platform"
   ```

4. **Create a GitHub Repository**:
   - Go to [GitHub](https://github.com/) and create a new repository
   - Do not initialize with README, .gitignore, or license

5. **Add Remote and Push**:
   ```bash
   git remote add origin https://github.com/your-username/TrustEscrow.git
   git branch -M main
   git push -u origin main
   ```

### Deploying to Testnet

After successful local testing, deploy to a testnet:

1. **Ensure You Have Testnet ETH**:
   - Use a faucet to get Sepolia ETH: [Sepolia Faucet](https://sepoliafaucet.com/)

2. **Update .env with Private Key**:
   - Add your testnet wallet's private key to `.env` file

3. **Deploy to Testnet**:
   ```bash
   cd TrustEscrow-contracts
   forge script script/Deploy.s.sol:DeployScript --fork-url $SEPOLIA_RPC_URL --broadcast
   ```

4. **Update Frontend Contract Addresses**:
   - Copy the deployed contract addresses
   - Update them in `TrustEscrow-shadcn/src/lib/contracts.ts`

## License

This project is licensed under the MIT License.
