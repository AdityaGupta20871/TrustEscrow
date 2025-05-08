import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { WagmiProvider, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';

// Define Anvil local chain
const anvilChain = defineChain({
  id: 31337,
  name: 'Anvil',
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
  // Prioritize anvilChain for local testing
  chains: [anvilChain, sepolia],
  transports: {
    [anvilChain.id]: http('http://127.0.0.1:8545'),
    [sepolia.id]: http('https://rpc.sepolia.org', { 
      timeout: 60000,
      retryCount: 5,
      retryDelay: 2000
    }),
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
