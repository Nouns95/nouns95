"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useBalance } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { createPublicClient, http } from 'viem';

interface AddressDisplayProps {
  address?: string;
  network: 'ethereum' | 'base' | 'solana' | 'bitcoin';
}

// Create a dedicated mainnet client for ENS resolution with fallback RPCs
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL, {
    timeout: 10000,
    retryCount: 3,
    retryDelay: 1000,
  })
});

export function AddressDisplay({ address = '', network }: AddressDisplayProps) {
  const [ensName, setEnsName] = useState<string | null>(null);
  const [ensAvatar, setEnsAvatar] = useState<string | null>(null);

  // Get ENS data using the dedicated mainnet client
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
        setEnsName(name);

        // If we have a name, get the avatar
        if (name) {
          console.log('Fetching avatar for:', name);
          const avatar = await mainnetClient.getEnsAvatar({
            name
          });
          console.log('Resolved avatar:', avatar);
          setEnsAvatar(avatar);
        }
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

  // Get balance (only for Ethereum networks)
  const { data: balanceData } = useBalance({
    address: network === 'ethereum' ? (address as `0x${string}`) : undefined,
    chainId: mainnet.id
  });

  // Format short address
  const shortAddress = address ? (
    network === 'bitcoin' || network === 'solana'
      ? `${address.slice(0, 4)}...${address.slice(-4)}`
      : `${address.slice(0, 6)}...${address.slice(-4)}`
  ) : 'Not Connected';

  const displayName = ensName || shortAddress;
  const formattedBalance = balanceData ? Number(balanceData.formatted).toFixed(3) : '0.000';

  return (
    <div className="address-display">
      <div className="address-avatar">
        {ensAvatar && (
          <Image 
            src={ensAvatar} 
            alt="Profile" 
            width={48} 
            height={48}
            priority
          />
        )}
      </div>
      <div className="address-info">
        <div className="full-address">{displayName}</div>
        {network === 'ethereum' && <div className="balance-display">{formattedBalance} Ξ</div>}
        <div className="short-address">{shortAddress}</div>
      </div>
    </div>
  );
} 