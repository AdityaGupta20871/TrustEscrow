import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { WagmiProvider, http } from 'wagmi';
import { mainnet, sepolia, goerli } from 'wagmi/chains';
import { defineChain } from 'viem';

// Define Citrea testnet
const citreaTestnet = defineChain({
  id: 42_069,
  name: 'Citrea Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-testnet.citrea.io'],
    },
    public: {
      http: ['https://rpc-testnet.citrea.io'],
    },
  },
  blockExplorers: {
    default: { name: 'Citrea Explorer', url: 'https://explorer-testnet.citrea.io' },
  },
});

// Define Local Hardhat chain
const hardhatChain = defineChain({
  id: 31337,
  name: 'Hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
});

// Configure RainbowKit with supported chains
export const config = getDefaultConfig({
  appName: 'TrustEscrow',
  projectId: '91c269b670f7f8ae8d1643239fd41a08', // Replace with your WalletConnect project ID
  // Include all chains but prioritize hardhatChain for local Anvil testing
  chains: [hardhatChain, sepolia, goerli, citreaTestnet, mainnet],
  transports: {
    [hardhatChain.id]: http('http://127.0.0.1:8545'),
    [goerli.id]: http(),
    [sepolia.id]: http('https://rpc.sepolia.org', { 
      timeout: 60000,
      retryCount: 5,
      retryDelay: 2000
    }),
    [citreaTestnet.id]: http('https://rpc-testnet.citrea.io'),
    [mainnet.id]: http(),
  },
  ssr: false,
});

// Create a React-Query client
const queryClient = new QueryClient();

// RainbowKit and Wagmi provider component
export function WagmiConfig({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
