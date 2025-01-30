'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { mainnet, base } from 'viem/chains';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

export default function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
  const solanaConnectors = toSolanaWalletConnectors();
  
  return (
    <PrivyProvider
      appId={appId}
      config={{
        appId,
        loginMethods: ['wallet', 'farcaster'],
        externalWallets: { 
          solana: {
            connectors: solanaConnectors
          },
          coinbaseWallet: { 
            connectionOptions: 'all', 
          }, 
        }, 
        appearance: {
          landingHeader: 'Nouns 95', 
          loginMessage: 'Welcome to Nouns 95.', 
          theme: 'light',
          showWalletLoginFirst: true,
          walletChainType: 'ethereum-and-solana',
        },
        supportedChains: [mainnet, base],
      }}
    >
      {children}
    </PrivyProvider>
  );
} 