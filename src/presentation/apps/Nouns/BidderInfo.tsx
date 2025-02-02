'use client';

import React from 'react';
import Image from 'next/image';
import { useEnsName, useEnsAvatar, useEnsAddress } from 'wagmi';
import { mainnet } from 'wagmi/chains';

interface BidderInfoProps {
  address: string;
}

export function BidderInfo({ address }: BidderInfoProps) {
  // Get ENS name from address (reverse resolution)
  const { data: ensName } = useEnsName({
    address: address as `0x${string}`,
    chainId: mainnet.id
  });

  // Verify forward resolution
  const { data: resolvedAddress } = useEnsAddress({
    name: ensName || undefined,
    chainId: mainnet.id
  });

  // Only use ENS name if forward resolution matches
  const verifiedEnsName = resolvedAddress === address ? ensName : undefined;

  // Get avatar only if ENS name is verified
  const { data: ensAvatar } = useEnsAvatar({
    name: verifiedEnsName || undefined,
    chainId: mainnet.id
  });

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const displayName = verifiedEnsName || shortAddress;

  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
        {ensAvatar && (
          <Image
            src={ensAvatar}
            alt="Profile"
            width={32}
            height={32}
            priority
          />
        )}
      </div>
      <span className="font-mono">{displayName}</span>
    </div>
  );
} 