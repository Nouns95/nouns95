"use client";

import React from 'react';
import Image from 'next/image';
import { useAppKit } from '@reown/appkit/react';

interface NetworkDisplayProps {
  chainId?: string | number;
  networkId?: string;
}

const NETWORKS: Record<string | number, { name: string; icon: string }> = {
  1: { 
    name: 'Ethereum',
    icon: '/icons/apps/wallet/networks/ethereum.png'
  },
  8453: { 
    name: 'Base',
    icon: '/icons/apps/wallet/networks/base.png'
  },
  'mainnet-beta': { 
    name: 'Solana',
    icon: '/icons/apps/wallet/networks/solana.png'
  },
  'bitcoin': { 
    name: 'Bitcoin',
    icon: '/icons/apps/wallet/networks/bitcoin.png'
  }
};

export function NetworkDisplay({ chainId, networkId }: NetworkDisplayProps) {
  const network = chainId ? NETWORKS[chainId] : networkId ? NETWORKS[networkId] : null;
  const { open } = useAppKit();

  if (!network) {
    return (
      <div className="network-display">
        <div className="network-info">
          <div className="network-name">Not Connected</div>
        </div>
      </div>
    );
  }

  return (
    <div className="network-display">
      <div className="network-info">
        <div className="network-icon">
          <Image
            src={network.icon}
            alt={`${network.name} icon`}
            width={96}
            height={96}
            priority
          />
        </div>
        <div className="network-name">{network.name}</div>
      </div>
      <div className="wallet-actions no-border">
        <button onClick={() => open({ view: 'Networks' })} className="win95-btn network-switch-btn">
          Switch Network
        </button>
      </div>
    </div>
  );
} 