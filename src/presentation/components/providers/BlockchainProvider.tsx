"use client";

import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { mainnet } from 'viem/chains';
import { http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create wagmi config using Privy's createConfig
const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

// Create Query Client for data fetching
const queryClient = new QueryClient();

// Privy configuration
const privyConfig = {
  loginMethods: ['email', 'wallet'],
  appearance: {
    theme: 'dark',
    accentColor: '#676767',
    showWalletLoginFirst: true,
  },
  supportedChains: [mainnet],
};

interface BlockchainProviderProps {
  children: React.ReactNode;
}

const BlockchainProvider: React.FC<BlockchainProviderProps> = ({ children }) => {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
};

export default BlockchainProvider; 