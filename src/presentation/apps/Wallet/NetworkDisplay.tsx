"use client";

import React from 'react';

interface NetworkDisplayProps {
  chainId?: string | number;
  networkId?: string;
}

const NETWORKS: Record<string | number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  'mainnet-beta': 'Solana',
  'bitcoin': 'Bitcoin'
};

export function NetworkDisplay({ chainId, networkId }: NetworkDisplayProps) {
  const networkName = chainId ? NETWORKS[chainId] : networkId ? NETWORKS[networkId] : 'Not Connected';

  return (
    <div className="network-display">
      <div className="network-info">
        <div className="network-name">{networkName}</div>
        <div className="network-details">
          <div className="network-id">Network: {networkName}</div>
        </div>
      </div>
    </div>
  );
} 