"use client";

import React, { useEffect, useState } from 'react';
import WalletInterface from '../WalletInterface';
import { SolanaService } from '@/src/domain/blockchain/services/SolanaService';
import { Transaction } from '@/src/domain/blockchain/models/Transaction';
import { NFT } from '@/src/domain/blockchain/models/NFT';

const SolanaWallet: React.FC = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState('0');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);

  useEffect(() => {
    const checkWallet = async () => {
      // @ts-ignore - Phantom types
      const provider = window?.phantom?.solana;
      if (provider?.isPhantom && provider.isConnected) {
        const address = provider.publicKey.toString();
        setAddress(address);
        setIsConnected(true);
        await fetchData(address);
      }
    };

    checkWallet();
  }, []);

  const fetchData = async (walletAddress: string) => {
    const solanaService = SolanaService.getInstance();
    const [balance, txs, nftList] = await Promise.all([
      solanaService.getBalance(walletAddress),
      solanaService.getTransactions(walletAddress),
      solanaService.getNFTs(walletAddress),
    ]);
    setBalance(balance);
    setTransactions(txs);
    setNfts(nftList);
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      // @ts-ignore - Phantom types
      const provider = window?.phantom?.solana;
      if (provider?.isPhantom) {
        const response = await provider.connect();
        const address = response.publicKey.toString();
        setAddress(address);
        setIsConnected(true);
        await fetchData(address);
      } else {
        window.open('https://phantom.app/', '_blank');
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      // @ts-ignore - Phantom types
      const provider = window?.phantom?.solana;
      if (provider?.isPhantom) {
        await provider.disconnect();
        setAddress(null);
        setIsConnected(false);
        setBalance('0');
        setTransactions([]);
        setNfts([]);
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  return (
    <WalletInterface
      network="solana"
      address={address}
      balance={balance}
      transactions={transactions}
      nfts={nfts}
      isConnected={isConnected}
      isConnecting={isConnecting}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
    />
  );
};

export default SolanaWallet; 