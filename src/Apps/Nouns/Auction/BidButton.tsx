'use client';

import React, { useState, useEffect } from 'react';
import { useWriteContract, useReadContract } from 'wagmi';
import { 
  parseEther, 
  BaseError, 
  ContractFunctionExecutionError,
  TransactionExecutionError,
  UserRejectedRequestError
} from 'viem';
import { NounsAuctionHouseABI } from '../domain/abis/AuctionHouse';
import styles from './Auction.module.css';

const AUCTION_HOUSE_ADDRESS = '0x830BD73E4184ceF73443C15111a1DF14e495C706';
const MIN_BID_AMOUNT = '0.000000000000069420';

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

type BidState = 'idle' | 'confirming' | 'pending' | 'error' | 'success';

const BidButton = () => {
  const [bidAmount, setBidAmount] = useState('');
  const [isAuctionOver, setIsAuctionOver] = useState(false);
  const [lastValidAuctionData, setLastValidAuctionData] = useState<AuctionData | null>(null);
  const [bidState, setBidState] = useState<BidState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    // Monitor contract read state
    
    if (auctionData && !isPending && !isFetching && !isError) {
      // Set last valid auction data
      setLastValidAuctionData(auctionData);
    }
  }, [auctionData, isPending, isFetching, isError, lastValidAuctionData]);

  useEffect(() => {
    if (!lastValidAuctionData || isPending || isFetching || isError) {
      // Skip auction status check
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

  const {
    writeContract: bidOnAuction,
    isPending: isBidPending,
    isError: isBidError,
    reset: resetBidState
  } = useWriteContract({
    mutation: {
      onError: (error: Error | BaseError) => {
        // Bid error handled
        setBidState('error');
        
        // Handle user rejection
        if (error instanceof UserRejectedRequestError) {
          setErrorMessage('Transaction rejected by user');
          return;
        }

        // Handle contract execution errors
        if (error instanceof ContractFunctionExecutionError) {
          // Get the root cause of the error
          const message = error.message;
          const details = error.details || '';
          
          // Try to extract error code from details
          const codeMatch = details.match(/code=(-?\d+)/);
          if (codeMatch) {
            const code = parseInt(codeMatch[1]);
            switch (code) {
              case -32000:
                setErrorMessage('Insufficient funds in wallet');
                return;
              case -32603:
                setErrorMessage('Transaction cannot be completed. Please check your bid amount.');
                return;
              case 4001:
                setErrorMessage('Transaction rejected by user');
                return;
            }
          }

          // Handle known error messages
          if (message.includes('insufficient funds')) {
            setErrorMessage('Insufficient funds in wallet');
          } else if (message.includes('already ended')) {
            setErrorMessage('Auction has ended');
          } else if (message.includes('value below current bid')) {
            setErrorMessage('Bid amount too low');
          } else {
            // Try to extract useful information from the error message
            const bidValueMatch = message.match(/value: (\d+(?:\.\d+)?\s*ETH)/i);
            const nounIdMatch = message.match(/args: \((\d+)\)/);
            
            if (bidValueMatch || nounIdMatch) {
              let errorMsg = 'Failed to submit bid';
              if (bidValueMatch) {
                errorMsg += ` of ${bidValueMatch[1]}`;
              }
              if (nounIdMatch) {
                errorMsg += ` for Noun ${nounIdMatch[1]}`;
              }
              errorMsg += '. Please try a different amount.';
              setErrorMessage(errorMsg);
            } else {
              // If we can't extract specific details, provide a generic but helpful message
              setErrorMessage('Unable to process bid. Please verify the amount and try again.');
            }
          }
          return;
        }

        // Handle transaction execution errors
        if (error instanceof TransactionExecutionError) {
          const message = error.message;
          if (message.includes('insufficient funds')) {
            setErrorMessage('Insufficient funds for gas');
          } else {
            setErrorMessage('Transaction failed: ' + message);
          }
          return;
        }

        // Handle other viem errors
        if (error instanceof BaseError) {
          const message = error.shortMessage || error.message;
          setErrorMessage(message.replace(/^(Error|Viem Error):\s*/, ''));
          return;
        }

        // Handle unknown errors
        setErrorMessage('Failed to place bid. Please try again.');
      }
    }
  });

  const { writeContract: settleAuction } = useWriteContract({
    mutation: {
      onError: () => {
        // Settlement error handled
      }
    }
  });

  // Reset error state when input changes
  const handleBidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBidAmount(e.target.value);
    setErrorMessage(null);
    if (bidState === 'error') {
      setBidState('idle');
      resetBidState?.();
    }
  };

  const handleBidSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setBidState('idle');
    resetBidState?.();

    if (!bidOnAuction || !lastValidAuctionData || !bidAmount) {
      setErrorMessage('Missing required data for bid');
      return;
    }

    try {
      const parsedBidAmount = parseFloat(bidAmount);
      const minBidAmount = parseFloat(MIN_BID_AMOUNT);
      if (isNaN(parsedBidAmount) || parsedBidAmount < minBidAmount) {
        setErrorMessage(`Bid must be at least ${MIN_BID_AMOUNT}Ξ`);
        return;
      }

      setBidState('confirming');

      await bidOnAuction({
        address: AUCTION_HOUSE_ADDRESS,
        abi: NounsAuctionHouseABI,
        functionName: 'createBid',
        args: [lastValidAuctionData.nounId, 11],
        value: parseEther(bidAmount),
      });

      setBidState('pending');
    } catch {
      // The error will be handled by onError callback
      // Unexpected error handled
    }
  };

  // Handle transaction completion
  useEffect(() => {
    if (!isBidPending && bidState !== 'idle') {
      if (bidState === 'pending' && !isBidError) {
        setBidState('success');
        setBidAmount('');
        setErrorMessage(null);
        const timer = setTimeout(() => {
          setBidState('idle');
          resetBidState?.();
        }, 3000);
        return () => clearTimeout(timer);
      } else if (bidState === 'confirming' && !isBidError) {
        setBidState('idle');
      }
      refetch();
    }
  }, [isBidPending, bidState, isBidError, refetch, resetBidState]);

  const handleSettleAuction = async () => {
    if (!settleAuction) return;
    try {
      await settleAuction({
        address: AUCTION_HOUSE_ADDRESS,
        abi: NounsAuctionHouseABI,
        functionName: 'settleCurrentAndCreateNewAuction',
      });
      // Auction settled successfully
    } catch {
      // Error settling auction
    }
  };

  const getBidButtonText = () => {
    switch (bidState) {
      case 'confirming':
        return 'Confirm in Wallet...';
      case 'pending':
        return 'Processing...';
      case 'error':
        return 'Try Again';
      case 'success':
        return 'Bid Placed!';
      default:
        return 'Place Bid';
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
          <div className={styles['bid-input-wrapper']}>
            <input
              type="number"
              step="0.000000000000000001"
              min={MIN_BID_AMOUNT}
              value={bidAmount}
              onChange={handleBidAmountChange}
              placeholder={`${MIN_BID_AMOUNT}Ξ`}
              className={`${styles['bid-input']} ${errorMessage ? styles['error'] : ''}`}
              disabled={!lastValidAuctionData || bidState === 'confirming' || bidState === 'pending'}
            />
            {errorMessage && (
              <div className={styles['error-message']}>{errorMessage}</div>
            )}
          </div>
          <button 
            type="submit" 
            className={`${styles['bid-button']} ${styles[bidState]}`}
            disabled={!lastValidAuctionData || !bidAmount || parseFloat(bidAmount) < parseFloat(MIN_BID_AMOUNT) || bidState === 'confirming' || bidState === 'pending'}
          >
            {getBidButtonText()}
          </button>
        </form>
      )}
    </div>
  );
};

export default BidButton;