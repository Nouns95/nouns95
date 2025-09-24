'use client'

import React, { type ReactNode, useEffect, useState } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { bitcoinAdapter, wagmiAdapter, solanaWeb3JsAdapter, projectId, networks } from '../lib/config/appkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'

// AppKit will handle phosphor icons internally

// Set up queryClient with retry configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5000,
    },
  },
})

// Set up metadata
const metadata = {
  name: 'Nouns 95',
  description: 'Start me up.',
  url: 'https://nouns95.wtf',
  icons: ['https://nouns95.wtf/icons/shell/TaskBar/StartMenu/StartMenu.png']
}

// Create the modal with dynamic initialization
export const modal = typeof window === 'undefined' 
  ? null // Return null during SSR
  : createAppKit({
      adapters: [bitcoinAdapter, wagmiAdapter, solanaWeb3JsAdapter],
      projectId: projectId as string,
      networks,
      metadata,
      enableWalletConnect: true,
      includeWalletIds: [
        'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393', // Phantom
        'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase
        '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
        '225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f', // Safe
      ],
      allWallets: 'SHOW',
      debug: true,
      features: {
        analytics: false,
      },
      themeMode: 'light',
      themeVariables: {
        '--w3m-accent': '#000000',
      }
    });

// Wrapper component to handle initialization
function AppkitContext({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Use a small delay to prevent hydration issues
    const timer = setTimeout(() => {
      setIsClient(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  // Always render QueryClientProvider to maintain React tree structure
  return (
    <QueryClientProvider client={queryClient}>
      {isClient ? (
        // Only render WagmiProvider on the client
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
          {children}
        </WagmiProvider>
      ) : (
        // During SSR, render children without web3 context
        children
      )}
    </QueryClientProvider>
  );
}

export default AppkitContext;
