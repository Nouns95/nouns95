"use client";

import React from 'react';
import Image from 'next/image';
import { useBalance } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import styles from '../WalletApp.module.css';

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
  const { data: balanceData } = useBalance({
    address: address as `0x${string}`,
    chainId: mainnet.id,
    query: {
      enabled: !!address && network === 'ethereum',
    },
  });

  const shortAddress = address ? (
    `${address.slice(0, 6)}...${address.slice(-4)}`
  ) : 'Not Connected';

  const displayName = ensName || shortAddress;
  const formattedBalance = balanceData ? Number(balanceData.formatted).toFixed(3) : '0.000';

  return (
    <div className={styles.addressDisplay}>
      <div className={styles.addressAvatar}>
        <Image 
          src={ensAvatar || "/icons/shell/TaskBar/StartMenu/StartMenu.png"} 
          alt="Profile" 
          width={48} 
          height={48}
          priority
        />
      </div>
      <div className={styles.addressInfo}>
        <div className={styles.fullAddress}>{displayName}</div>
        {network === 'ethereum' && <div className={styles.balanceDisplay}>{formattedBalance} Ξ</div>}
        {!ensName && <div className={styles.shortAddress}>{shortAddress}</div>}
      </div>
    </div>
  );
}