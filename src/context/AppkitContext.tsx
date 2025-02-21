'use client'

import React, { type ReactNode } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { bitcoinAdapter, wagmiAdapter, solanaWeb3JsAdapter, projectId, networks } from '../config/appkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { AppkitProvider } from '@appkit/react'

// Set up queryClient
const queryClient = new QueryClient()

// Set up metadata
const metadata = {
  name: 'next-reown-appkit',
  description: 'next-reown-appkit',
  url: 'https://nouns95.wtf',
  icons: ['https://nouns95.wtf/icons/shell/TaskBar/StartMenu/StartMenu.png']
}

// Create the modal
export const modal = createAppKit({
  adapters: [bitcoinAdapter, wagmiAdapter, solanaWeb3JsAdapter],
  projectId: projectId as string,
  networks,
  metadata,
  debug: true,
  themeMode: 'light',
  features: {
    analytics: false,
    email: false,
    connectMethodsOrder: ['wallet', 'social'],
    socials: ['farcaster'],
  },
  themeVariables: {
    '--w3m-accent': '#000000',
  }
})

interface AppkitContextProps {
  cookies?: string | null;
  children: React.ReactNode;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export default function AppkitContext({ cookies, children }: AppkitContextProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const initializeAppkit = async () => {
    try {
      const initialState = cookies ? await cookieToInitialState(cookies) : undefined;
      
      return (
        <AppkitProvider
          projectId={process.env.NEXT_PUBLIC_WALLET_CONNECT_ID!}
          initialState={initialState}
          onError={(error) => {
            console.error('Appkit error:', error);
            if (error.message.includes('ECONNRESET') && retryCount < MAX_RETRIES) {
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
                initializeAppkit();
              }, RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
            } else {
              setError(error);
            }
          }}
        >
          {children}
        </AppkitProvider>
      );
    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          initializeAppkit();
        }, RETRY_DELAY * Math.pow(2, retryCount));
        return null;
      }
      setError(err as Error);
      return null;
    }
  };

  if (error) {
    // Render a fallback UI that still allows the app to function
    return (
      <div style={{ display: 'none' }}>
        {children}
      </div>
    );
  }

  return initializeAppkit();
}
