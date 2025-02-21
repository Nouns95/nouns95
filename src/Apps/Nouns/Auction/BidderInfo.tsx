'use client';

import React from 'react';
import Image from 'next/image';
import { useEnsName, useEnsAvatar } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import styles from './BidderInfo.module.css';

interface BidderInfoProps {
  address: string;
}

export function BidderInfo({ address }: BidderInfoProps) {
  // Get ENS name from address (reverse resolution)
  const { data: ensName } = useEnsName({
    address: address as `0x${string}`,
    chainId: mainnet.id
  });

  // Get avatar
  const { data: ensAvatar } = useEnsAvatar({
    name: ensName || undefined,
    chainId: mainnet.id
  });

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const displayName = ensName || shortAddress;

  return (
    <div className={styles.container}>
      <div className={styles['avatar-container']}>
        {ensAvatar && (
          <Image
            src={ensAvatar}
            alt="Profile"
            width={32}
            height={32}
            priority
          />
        )}
      </div>
      <span className={styles['bidder-name']}>{displayName}</span>
    </div>
  );
} 