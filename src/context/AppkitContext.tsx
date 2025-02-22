'use client'

import React, { type ReactNode } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { bitcoinAdapter, wagmiAdapter, solanaWeb3JsAdapter, projectId, networks } from '../config/appkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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
      ],
      allWallets: 'SHOW',
      debug: true,
      features: {
        analytics: false,
        email: false,
        connectMethodsOrder: ['wallet', 'social'],
        socials: ['farcaster'],
      },
      themeMode: 'light',
      themeVariables: {
        '--w3m-accent': '#000000',
      }
    });

// Wrapper component to handle initialization
function AppkitContext({ children }: { children: ReactNode }) {
  // Only render children when window is defined (client-side)
  if (typeof window === 'undefined') {
    return null; // Or a loading state if needed
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default AppkitContext;
