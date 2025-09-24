"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useBalance } from 'wagmi';
import { useAppKitNetwork } from '@reown/appkit/react';
import { mainnet, base } from 'wagmi/chains';
import styles from '../WalletApp.module.css';

interface AddressDisplayProps {
  address?: string;
  network: 'ethereum' | 'base' | 'solana' | 'bitcoin';
  ensName?: string | null;
  ensAvatar?: string | null;
}

export function AddressDisplay({ 
  address = '', 
  network, 
  ensName = null, 
  ensAvatar = null 
}: AddressDisplayProps) {
  const { chainId } = useAppKitNetwork();
  
  // Get the current chain info
  const getCurrentChain = () => {
    if (chainId === mainnet.id || network === 'ethereum') {
      return { id: mainnet.id, symbol: 'ETH', name: 'Ethereum' };
    }
    if (chainId === base.id || network === 'base') {
      return { id: base.id, symbol: 'ETH', name: 'Base' };
    }
    // For Solana and Bitcoin, we can't use wagmi useBalance
    if (network === 'solana') {
      return { id: null, symbol: 'SOL', name: 'Solana' };
    }
    if (network === 'bitcoin') {
      return { id: null, symbol: 'BTC', name: 'Bitcoin' };
    }
    // Default to Ethereum
    return { id: mainnet.id, symbol: 'ETH', name: 'Ethereum' };
  };

  const currentChain = getCurrentChain();
  const canUseWagmiBalance = currentChain.id !== null;

  const { data: balanceData, isLoading, error } = useBalance({
    address: address as `0x${string}`,
    chainId: currentChain.id || mainnet.id,
    query: {
      enabled: !!address && canUseWagmiBalance,
    },
  });

  // Debug logging
  useEffect(() => {
    console.log('AddressDisplay Debug:', {
      address,
      network,
      chainId,
      currentChain,
      balanceData,
      isLoading,
      error,
      canUseWagmiBalance
    });
  }, [address, network, chainId, currentChain, balanceData, isLoading, error, canUseWagmiBalance]);

  const shortAddress = address ? (
    `${address.slice(0, 6)}...${address.slice(-4)}`
  ) : 'Not Connected';

  const displayName = ensName || shortAddress;
  const formattedBalance = isLoading ? '...' : 
                          balanceData ? Number(balanceData.formatted).toFixed(3) : '0.000';
  const balanceSymbol = currentChain.symbol;

  return (
    <div className={styles.addressDisplay}>
      <div className={styles.addressAvatar}>
        <Image 
          src={ensAvatar || "/icons/shell/TaskBar/StartMenu/StartMenu.png"} 
          alt="Profile" 
          width={48} 
          height={48}
          priority
        />
      </div>
      <div className={styles.addressInfo}>
        <div className={styles.fullAddress}>{displayName}</div>
        {canUseWagmiBalance && <div className={styles.balanceDisplay}>{formattedBalance} {balanceSymbol}</div>}
        {!canUseWagmiBalance && network === 'solana' && <div className={styles.balanceDisplay}>Solana Balance</div>}
        {!canUseWagmiBalance && network === 'bitcoin' && <div className={styles.balanceDisplay}>Bitcoin Balance</div>}
        {!ensName && <div className={styles.shortAddress}>{shortAddress}</div>}
      </div>
    </div>
  );
}