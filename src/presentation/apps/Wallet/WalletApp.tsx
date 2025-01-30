"use client";

import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import EthereumWallet from './EthereumWallet/EthereumWallet';
import SolanaWallet from './SolanaWallet/SolanaWallet';
import './styles.css';

export type WalletType = 'ethereum' | 'solana';

interface WalletAppProps {
  network?: WalletType;
}

export default function WalletApp({ network = 'ethereum' }: WalletAppProps) {
  const { ready } = usePrivy();
  const [activeNetwork, setActiveNetwork] = useState<WalletType>(network);

  if (!ready) {
    return <div className="wallet-loading">Loading wallets...</div>;
  }

  return (
    <div className="wallet-app">
      <div className="wallet-tabs">
        <button 
          className={`wallet-tab ${activeNetwork === 'ethereum' ? 'active' : ''}`}
          onClick={() => setActiveNetwork('ethereum')}
        >
          Ethereum
        </button>
        <button 
          className={`wallet-tab ${activeNetwork === 'solana' ? 'active' : ''}`}
          onClick={() => setActiveNetwork('solana')}
        >
          Solana
        </button>
      </div>
      
      <div className="wallet-content">
        {activeNetwork === 'ethereum' ? (
          <div className="wallet-section">
            <h3>Ethereum Wallet</h3>
            <EthereumWallet />
          </div>
        ) : (
          <div className="wallet-section">
            <h3>Solana Wallet</h3>
            <SolanaWallet />
          </div>
        )}
      </div>
    </div>
  );
} 