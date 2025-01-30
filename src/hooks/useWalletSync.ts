import { useEffect, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWalletStore } from '../data/stores/WalletStore';

export function useWalletSync() {
  const { ready, authenticated, user, wallets = [] } = usePrivy();
  const { setChainConnection, disconnect, disconnectAll } = useWalletStore();
  
  // Track previous wallet states to prevent unnecessary updates
  const prevEthAddressRef = useRef<string | null>(null);
  const prevSolAddressRef = useRef<string | null>(null);

  useEffect(() => {
    // Wait for Privy to be ready
    if (!ready) return;

    // If not authenticated, disconnect all and reset refs
    if (!authenticated || !wallets) {
      if (prevEthAddressRef.current || prevSolAddressRef.current) {
        disconnectAll();
        prevEthAddressRef.current = null;
        prevSolAddressRef.current = null;
      }
      return;
    }

    // Find Ethereum wallet
    const ethWallet = wallets.find(w => w?.chainName === 'ethereum');
    const currentEthAddress = ethWallet?.address || null;

    // Only update Ethereum if address changed
    if (currentEthAddress !== prevEthAddressRef.current) {
      if (ethWallet?.address) {
        setChainConnection('ethereum', {
          user: {
            id: user?.id || '',
            wallet: {
              address: ethWallet.address,
              chainId: ethWallet.chainId
            }
          },
          wallet: {
            address: ethWallet.address,
            chainId: ethWallet.chainId
          }
        });
      } else {
        disconnect('ethereum');
      }
      prevEthAddressRef.current = currentEthAddress;
    }

    // Find Solana wallet
    const solWallet = wallets.find(w => w?.chainName === 'solana');
    const currentSolAddress = solWallet?.address || null;

    // Only update Solana if address changed
    if (currentSolAddress !== prevSolAddressRef.current) {
      if (solWallet?.address) {
        setChainConnection('solana', {
          user: {
            id: user?.id || '',
            wallet: {
              address: solWallet.address,
              publicKey: solWallet.publicKey
            }
          },
          wallet: {
            address: solWallet.address,
            publicKey: solWallet.publicKey
          }
        });
      } else {
        disconnect('solana');
      }
      prevSolAddressRef.current = currentSolAddress;
    }
  }, [ready, authenticated, user, wallets, setChainConnection, disconnect, disconnectAll]);
} 