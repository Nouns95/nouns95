"use client";

import React from 'react';
import './styles.css';

interface WalletInterfaceProps {
  network: 'ethereum' | 'solana';
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}

const WalletInterface: React.FC<WalletInterfaceProps> = ({
  network,
  address,
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
}) => {
  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="wallet-app">
      <div className="wallet-content">
        <div className="win95-window p-4 mb-4">
          <div className="win95-window-title mb-2">
            {network.toUpperCase()} Wallet
          </div>
          {!isConnected ? (
            <button 
              className="win95-btn w-full"
              onClick={onConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="win95-window-content">
              <div className="mb-2 p-2 border-b border-gray-400">
                <strong>Address:</strong> 
                <div className="text-sm break-all">
                  {address ? shortenAddress(address) : ''}
                </div>
              </div>
              <button 
                className="win95-btn w-full mt-4"
                onClick={onDisconnect}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletInterface; 