"use client";

import React from 'react';
import Image from 'next/image';
import { useAppKit } from '@reown/appkit/react';
import { getAppIcon } from '../../../../Shell/Desktop/icons';
import styles from '../WalletApp.module.css';

interface NetworkDisplayProps {
  chainId?: number;
  networkId?: string;
}

const getNetworkInfo = (chainId?: number, networkId?: string) => {
  if (chainId === 1 || networkId?.includes('eip155:1')) {
    return {
      name: 'Ethereum Mainnet',
      iconId: 'network-ethereum',
      symbol: 'ETH'
    };
  }
  if (chainId === 8453 || networkId?.includes('eip155:8453')) {
    return {
      name: 'Base',
      iconId: 'network-base',
      symbol: 'ETH'
    };
  }
  if (networkId?.includes('solana:')) {
    return {
      name: 'Solana',
      iconId: 'network-solana',
      symbol: 'SOL'
    };
  }
  if (networkId?.includes('bip122:')) {
    return {
      name: 'Bitcoin',
      iconId: 'network-bitcoin',
      symbol: 'BTC'
    };
  }
  return {
    name: 'Unknown Network',
    iconId: 'network-ethereum',
    symbol: 'ETH'
  };
};

export function NetworkDisplay({ chainId, networkId }: NetworkDisplayProps) {
  const { open } = useAppKit();
  const networkInfo = getNetworkInfo(chainId, networkId);
  const networkIcon = getAppIcon(networkInfo.iconId);

  return (
    <div className={styles.networkDisplay}>
      <div className={styles.networkInfo}>
        <div className={styles.networkIcon}>
          <Image 
            src={networkIcon.icon as string} 
            alt={networkIcon.alt} 
            width={80} 
            height={80}
            priority
          />
        </div>
        <div className={styles.networkName}>
          {networkInfo.name}
        </div>
      </div>
      <div className={`${styles.walletActions} ${styles.noBorder}`}>
        <button onClick={() => open({ view: 'Networks' })} className="win95-btn">
          Switch Network
        </button>
      </div>
    </div>
  );
}