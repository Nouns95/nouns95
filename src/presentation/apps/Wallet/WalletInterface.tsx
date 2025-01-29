"use client";

import React from 'react';
import { Transaction } from '@/src/domain/blockchain/models/Transaction';
import { NFT } from '@/src/domain/blockchain/models/NFT';

interface WalletInterfaceProps {
  network: 'ethereum' | 'solana';
  address: string | null;
  balance: string;
  transactions: Transaction[];
  nfts: NFT[];
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}

const WalletInterface: React.FC<WalletInterfaceProps> = ({
  network,
  address,
  balance,
  transactions,
  nfts,
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
}) => {
  return (
    <div className="win95-window p-4">
      <div className="mb-4">
        <h2 className="text-xl mb-2">{network.toUpperCase()} Wallet</h2>
        {!isConnected ? (
          <button 
            className="win95-btn"
            onClick={onConnect}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <div>
            <div className="mb-2">
              <strong>Address:</strong> {address}
            </div>
            <div className="mb-2">
              <strong>Balance:</strong> {balance} {network === 'ethereum' ? 'ETH' : 'SOL'}
            </div>
            <button 
              className="win95-btn"
              onClick={onDisconnect}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {isConnected && (
        <>
          <div className="mb-4">
            <h3 className="mb-2">Recent Transactions</h3>
            {transactions.length > 0 ? (
              <div className="border border-gray-300">
                {transactions.map((tx) => (
                  <div key={tx.hash} className="p-2 border-b border-gray-300">
                    <div>Hash: {tx.hash}</div>
                    <div>Value: {tx.value}</div>
                    <div>Status: {tx.status}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>No transactions found</div>
            )}
          </div>

          <div>
            <h3 className="mb-2">NFTs</h3>
            {nfts.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {nfts.map((nft) => (
                  <div key={nft.id} className="win95-window p-2">
                    <img 
                      src={nft.metadata.image} 
                      alt={nft.metadata.name}
                      className="w-full h-auto mb-2"
                    />
                    <div>{nft.metadata.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>No NFTs found</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default WalletInterface; 