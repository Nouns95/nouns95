"use client";

import React from 'react';
import Image from 'next/image';
import { useEnsName, useEnsAvatar, useEnsAddress, useBalance } from 'wagmi';
import { mainnet } from 'wagmi/chains';

interface AddressDisplayProps {
  address?: string;
  network: 'ethereum' | 'base' | 'solana' | 'bitcoin';
}

export function AddressDisplay({ address = '', network }: AddressDisplayProps) {
  const isEthNetwork = network === 'ethereum' || network === 'base';
  const chainId = network === 'ethereum' ? mainnet.id : undefined;
  
  // Get ENS name from address (reverse resolution)
  const { data: ensName } = useEnsName({
    address: isEthNetwork ? (address as `0x${string}`) : undefined,
    chainId,
    gatewayUrls: ['https://ccip.ens.eth.limo', 'https://universal-offchain-unwrapper.ens-cf.workers.dev']
  });

  // Verify forward resolution
  const { data: resolvedAddress } = useEnsAddress({
    name: ensName || undefined,
    chainId,
    gatewayUrls: ['https://ccip.ens.eth.limo', 'https://universal-offchain-unwrapper.ens-cf.workers.dev']
  });

  // Get balance
  const { data: balanceData } = useBalance({
    address: isEthNetwork ? (address as `0x${string}`) : undefined,
    chainId
  });

  // Only use ENS name if forward resolution matches
  const verifiedEnsName = resolvedAddress === address ? ensName : undefined;

  // Get avatar only if ENS name is verified
  const { data: ensAvatar } = useEnsAvatar({
    name: verifiedEnsName || undefined,
    chainId,
    gatewayUrls: ['https://ccip.ens.eth.limo', 'https://universal-offchain-unwrapper.ens-cf.workers.dev'],
    assetGatewayUrls: {
      ipfs: 'https://cloudflare-ipfs.com',
      arweave: 'https://arweave.net'
    }
  });

  // Format short address
  const shortAddress = address ? (
    network === 'bitcoin' || network === 'solana'
      ? `${address.slice(0, 4)}...${address.slice(-4)}`
      : `${address.slice(0, 6)}...${address.slice(-4)}`
  ) : 'Not Connected';

  const displayName = verifiedEnsName || shortAddress;
  const formattedBalance = balanceData ? Number(balanceData.formatted).toFixed(3) : '0.000';

  return (
    <div className="address-display">
      <div className="address-avatar">
        {ensAvatar && (
          <Image 
            src={ensAvatar} 
            alt="Profile" 
            width={48} 
            height={48}
            priority
          />
        )}
      </div>
      <div className="address-info">
        <div className="full-address">{displayName}</div>
        {isEthNetwork && <div className="balance-display">{formattedBalance} Ξ</div>}
        <div className="short-address">{shortAddress}</div>
      </div>
    </div>
  );
} 