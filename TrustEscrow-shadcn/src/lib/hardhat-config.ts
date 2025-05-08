import { hardhat } from 'wagmi/chains'

// Customize the hardhat chain configuration 
export const customHardhatChain = {
  ...hardhat,
  // Override the default gas settings
  fees: {
    // Override to set very low gas prices for local testing
    defaultPriorityFee: 0n,
    baseFeePerGas: 1000000000n, // 1 gwei
  }
}

// Export a helper for gas limit configuration
export const localGasLimit = 5000000n
