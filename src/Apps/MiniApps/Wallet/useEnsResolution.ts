import { useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'wagmi/chains';

// Create a dedicated mainnet client for ENS resolution with fallback RPCs
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL, {
    timeout: 10000,
    retryCount: 3,
    retryDelay: 1000,
  })
});

interface EnsData {
  ensName: string | null;
  ensAvatar: string | null;
}

export function useEnsResolution(address?: string): EnsData {
  const [ensData, setEnsData] = useState<EnsData>({
    ensName: null,
    ensAvatar: null
  });

  useEffect(() => {
    async function resolveEns() {
      if (!address) return;
      
      console.log('Resolving ENS for address:', address);
      
      try {
        // Resolve ENS name
        const name = await mainnetClient.getEnsName({
          address: address as `0x${string}`
        });
        console.log('Resolved ENS name:', name);
        
        let avatar = null;
        // If we have a name, get the avatar
        if (name) {
          console.log('Fetching avatar for:', name);
          avatar = await mainnetClient.getEnsAvatar({
            name
          });
          console.log('Resolved avatar:', avatar);
        }

        setEnsData({
          ensName: name,
          ensAvatar: avatar
        });
      } catch (error) {
        console.error('Error resolving ENS:', error);
        // Log the full error details
        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            cause: error.cause
          });
        }
      }
    }

    resolveEns();
  }, [address]);

  return ensData;
} 