"use client";

import React, { useEffect, useState } from 'react';
import WalletInterface from '../WalletInterface';
import { Transaction } from '@/src/domain/blockchain/models/Transaction';
import { NFT } from '@/src/domain/blockchain/models/NFT';
import { SolanaService } from '@/src/domain/blockchain/services/SolanaService';
// @ts-expect-error - Missing type definitions for solana wallet adapter
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { sendTransaction } from '@solana/web3.js';

const SolanaWallet: React.FC = () => {
  const [balance, setBalance] = useState('0');
  const [address, setAddress] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const { connected, publicKey, connect, disconnect } = useWallet();

  useEffect(() => {
    const fetchData = async () => {
      if (publicKey) {
        const solanaService = SolanaService.getInstance();
        try {
          const [balance, txs, nftList] = await Promise.all([
            solanaService.getBalance(publicKey),
            solanaService.getTransactions(publicKey),
            solanaService.getNFTs(publicKey)
          ]);
          setBalance(balance);
          setTransactions(txs);
          setNfts(nftList);
        } catch (error) {
          console.error('Error fetching Solana wallet data:', error);
        }
      }
    };

    if (publicKey) {
      setAddress(publicKey.toString());
      fetchData();
    } else {
      setAddress(null);
      setBalance('0');
      setTransactions([]);
      setNfts([]);
    }
  }, [publicKey]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await connect();
    } catch (error) {
      console.error('Failed to connect Solana wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setAddress(null);
      setBalance('0');
      setTransactions([]);
      setNfts([]);
    } catch (error) {
      console.error('Failed to disconnect Solana wallet:', error);
    }
  };

  // @ts-expect-error - Solana connection types need to be properly handled
  const connection = new Connection(clusterApiUrl('devnet'));

  // @ts-expect-error - Solana transaction types need to be properly handled
  const signature = await sendTransaction(transaction, connection);

  return (
    <WalletInterface
      network="solana"
      address={address}
      balance={balance}
      transactions={transactions}
      nfts={nfts}
      isConnecting={isConnecting}
      isConnected={connected}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
    />
  );
};

export default SolanaWallet; 