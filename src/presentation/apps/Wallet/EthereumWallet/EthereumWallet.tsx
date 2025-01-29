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
  const account = useAccount();
  const { data: balanceData } = useBalance({
    address: account.address,
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (account.address && authenticated) {
        const ethService = EthereumService.getInstance();
        const [txs, nftList] = await Promise.all([
          ethService.getTransactions(account.address),
          ethService.getNFTs(account.address),
        ]);
        setTransactions(txs);
        setNfts(nftList);
      }
    };

    fetchData();
  }, [account.address, authenticated]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await login();
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
      setTransactions([]);
      setNfts([]);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  if (!ready) {
    return null; // or loading state
  }

  return (
    <WalletInterface
      network="ethereum"
      address={account.address || null}
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