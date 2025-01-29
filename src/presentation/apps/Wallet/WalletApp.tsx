"use client";

import React, { useState } from 'react';
import EthereumWallet from './EthereumWallet/EthereumWallet';
import SolanaWallet from './SolanaWallet/SolanaWallet';
import './styles.css';

const WalletApp: React.FC = () => {
  const [activeNetwork, setActiveNetwork] = useState<'ethereum' | 'solana'>('ethereum');

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
        {activeNetwork === 'ethereum' ? <EthereumWallet /> : <SolanaWallet />}
      </div>
    </div>
  );
};

export default WalletApp; 