'use client';

import React, { useState, useEffect } from 'react';
import { useWriteContract, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { NounsAuctionHouseABI } from '../../../domain/nouns/abis/AuctionHouse';
import styles from './Auction.module.css';

const AUCTION_HOUSE_ADDRESS = '0x830BD73E4184ceF73443C15111a1DF14e495C706';

interface AuctionData {
  nounId: bigint;
  amount: bigint;
  startTime: number;
  endTime: number;
  bidder: string;
  settled: boolean;
}

interface ContractReadResult {
  data: AuctionData | undefined;
  isError: boolean;
  isPending: boolean;
  isFetching: boolean;
  refetch: () => Promise<{ data: AuctionData | undefined }>;
}

const BidButton = () => {
  const [bidAmount, setBidAmount] = useState('');
  const [isAuctionOver, setIsAuctionOver] = useState(false);
  const [lastValidAuctionData, setLastValidAuctionData] = useState<AuctionData | null>(null);

  const {
    data: auctionData,
    isError,
    isPending,
    isFetching,
    refetch
  } = useReadContract({
    address: AUCTION_HOUSE_ADDRESS,
    abi: NounsAuctionHouseABI,
    functionName: 'auction',
    query: {
      enabled: true,
      refetchInterval: 12000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: false,
      staleTime: 11000,
    }
  }) as ContractReadResult;

  useEffect(() => {
    console.log('Contract read state:', {
      auctionData,
      isError,
      isPending,
      isFetching,
      lastValidAuctionData
    });
    
    if (auctionData && !isPending && !isFetching && !isError) {
      console.log('Setting lastValidAuctionData:', auctionData);
      setLastValidAuctionData(auctionData);
    }
  }, [auctionData, isPending, isFetching, isError, lastValidAuctionData]);

  useEffect(() => {
    if (!lastValidAuctionData || isPending || isFetching || isError) {
      console.log('Skipping auction status check:', {
        hasLastValidData: !!lastValidAuctionData,
        isPending,
        isFetching,
        isError
      });
      return;
    }

    const checkAuctionStatus = async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const auctionEndTime = Number(lastValidAuctionData.endTime);
      const timeRemaining = auctionEndTime - currentTime;

      if (timeRemaining <= 300 || timeRemaining <= 0) {
        refetch();
      }

      setIsAuctionOver(currentTime > auctionEndTime);
    };

    checkAuctionStatus();

    const intervalId = setInterval(checkAuctionStatus, 6000);

    return () => clearInterval(intervalId);
  }, [lastValidAuctionData, isPending, isFetching, refetch, isError]);

  const { writeContract: bidOnAuction } = useWriteContract();
  const { writeContract: settleAuction } = useWriteContract();

  const handleBidSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bidOnAuction || !lastValidAuctionData) return;
    try {
      const result = await bidOnAuction({
        address: AUCTION_HOUSE_ADDRESS,
        abi: NounsAuctionHouseABI,
        functionName: 'createBid',
        args: [lastValidAuctionData.nounId, 11],
        value: parseEther(bidAmount),
      });
      console.log('Bid submitted successfully', result);
    } catch (error) {
      console.error('Error submitting bid:', error);
    } finally {
      setBidAmount('');
    }
  };

  const handleSettleAuction = async () => {
    if (!settleAuction) return;
    try {
      const result = await settleAuction({
        address: AUCTION_HOUSE_ADDRESS,
        abi: NounsAuctionHouseABI,
        functionName: 'settleCurrentAndCreateNewAuction',
      });
      console.log('Auction settled successfully', result);
    } catch (error) {
      console.error('Error settling auction:', error);
    }
  };

  return (
    <div className={styles['bid-input-container']}>
      {isAuctionOver ? (
        <button 
          className={styles['settle-button']} 
          onClick={handleSettleAuction}
          disabled={!lastValidAuctionData}
        >
          Settle Auction
        </button>
      ) : (
        <form onSubmit={handleBidSubmit} className={styles['bid-form']}>
          <input
            type="text"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="0.000000000000069420Ξ"
            className={styles['bid-input']}
            disabled={!lastValidAuctionData}
          />
          <button 
            type="submit" 
            className={styles['bid-button']}
            disabled={!lastValidAuctionData}
          >
            Bid
          </button>
        </form>
      )}
    </div>
  );
};

export default BidButton;