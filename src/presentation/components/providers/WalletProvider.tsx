"use client";

import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { mainnet } from 'viem/chains';
import { http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import { useWalletSync } from '../../../hooks/useWalletSync';

// Create Query Client for data fetching
const queryClient = new QueryClient();

// Create wagmi config using Privy's createConfig
const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

// Solana configuration
const solanaNetwork = WalletAdapterNetwork.Devnet;
const solanaEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(solanaNetwork);
const solanaWallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
];

interface WalletProviderProps {
  children: React.ReactNode;
}

function WalletStateSync({ children }: { children: React.ReactNode }) {
  useWalletSync();
  return <>{children}</>;
}

export default function WalletProvider({ children }: WalletProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    throw new Error('NEXT_PUBLIC_PRIVY_APP_ID environment variable is not set');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={appId}
        config={{
          appId,
          loginMethods: ['wallet'] as const,
          appearance: {
            theme: 'dark',
            accentColor: '#676767',
            showWalletLoginFirst: true,
            walletChainType: 'ethereum-and-solana',
          },
          embeddedWallets: {
            createOnLogin: 'users-without-wallets'
          },
          supportedChains: [mainnet],
          defaultChain: mainnet
        }}
      >
        <WagmiProvider config={config}>
          <ConnectionProvider endpoint={solanaEndpoint}>
            <SolanaWalletProvider wallets={solanaWallets} autoConnect={false}>
              <WalletModalProvider>
                <WalletStateSync>
                  {children}
                </WalletStateSync>
              </WalletModalProvider>
            </SolanaWalletProvider>
          </ConnectionProvider>
        </WagmiProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
} 