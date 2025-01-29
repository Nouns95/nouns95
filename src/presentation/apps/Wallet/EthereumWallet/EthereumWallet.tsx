"use client";

import React, { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useBalance } from 'wagmi';
import WalletInterface from '../WalletInterface';
import { EthereumService } from '@/src/domain/blockchain/services/EthereumService';
import { Transaction } from '@/src/domain/blockchain/models/Transaction';
import { NFT } from '@/src/domain/blockchain/models/NFT';

const EthereumWallet: React.FC = () => {
  const { login, logout, ready, authenticated, user } = usePrivy();
  const { isConnected, address, isConnecting } = useAccount();
  const { data: balanceData } = useBalance({
    address: address,
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (address && authenticated) {
        const ethService = EthereumService.getInstance();
        const [txs, nftList] = await Promise.all([
          ethService.getTransactions(address),
          ethService.getNFTs(address),
        ]);
        setTransactions(txs);
        setNfts(nftList);
      }
    };

    fetchData();
  }, [address, authenticated]);

  const handleConnect = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  if (!ready) {
    return null; // or loading state
  }

  return (
    <WalletInterface
      network="ethereum"
      address={address || null}
      balance={balanceData?.formatted || '0'}
      transactions={transactions}
      nfts={nfts}
      isConnected={authenticated}
      isConnecting={isConnecting}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
    />
  );
};

export default EthereumWallet; 