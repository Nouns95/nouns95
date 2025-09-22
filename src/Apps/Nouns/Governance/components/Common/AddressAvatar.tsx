import React from 'react';
import { useEnsName, useEnsAvatar } from 'wagmi';
import Image from 'next/image';
import styles from './AddressAvatar.module.css';

interface AddressAvatarProps {
  address: string;
  size?: number;
}

export function AddressAvatar({ address, size = 20 }: AddressAvatarProps) {
  const { data: ensName } = useEnsName({
    address: address as `0x${string}`,
    chainId: 1
  });

  const { data: ensAvatar } = useEnsAvatar({
    name: ensName || undefined,
    chainId: 1
  });

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className={styles.container}>
      {ensAvatar ? (
        <Image
          src={ensAvatar}
          alt={ensName || address}
          width={size}
          height={size}
          className={styles.avatar}
        />
      ) : (
        <Image
          src="/icons/shell/TaskBar/StartMenu/StartMenu.png"
          alt={ensName || address}
          width={size}
          height={size}
          className={styles.avatar}
        />
      )}
      <span className={styles.name}>
        {ensName || formatAddress(address)}
      </span>
    </div>
  );
} 