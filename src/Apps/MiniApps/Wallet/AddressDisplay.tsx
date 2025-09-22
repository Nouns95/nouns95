"use client";

import React from 'react';
import Image from 'next/image';
import { useBalance } from 'wagmi';
import { mainnet } from 'wagmi/chains';

interface AddressDisplayProps {
  address?: string;
  network: 'ethereum' | 'base' | 'solana' | 'bitcoin';
  ensName?: string | null;
  ensAvatar?: string | null;
}

export function AddressDisplay({ 
  address = '', 
  network, 
  ensName = null, 
  ensAvatar = null 
}: AddressDisplayProps) {
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
        <Image 
          src={ensAvatar || "/icons/shell/TaskBar/StartMenu/StartMenu.png"} 
          alt="Profile" 
          width={48} 
          height={48}
          priority
        />
      </div>
      <div className="address-info">
        <div className="full-address">{displayName}</div>
        {network === 'ethereum' && <div className="balance-display">{formattedBalance} Ξ</div>}
        <div className="short-address">{shortAddress}</div>
      </div>
    </div>
  );
} 