import React, { useState, useEffect } from 'react';
import { useWriteContract } from 'wagmi';
import { 
  BaseError, 
  ContractFunctionExecutionError,
  TransactionExecutionError,
  UserRejectedRequestError
} from 'viem';
import styles from './ProposalDetails.module.css';

// ABI for the Governor contract
const GOVERNOR_ABI = [
  {
    name: 'castRefundableVote',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'uint8' },
      { name: 'clientId', type: 'uint32' }
    ],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'castRefundableVoteWithReason',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'uint8' },
      { name: 'reason', type: 'string' },
      { name: 'clientId', type: 'uint32' }
    ],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'state',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [{ type: 'uint8' }]
  },
  {
    name: 'hasVoted',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'account', type: 'address' }
    ],
    outputs: [{ type: 'bool' }]
  }
];

// Governor contract address from constants
const GOVERNOR_ADDRESS = '0x6f3E6272A167e8AcCb32072d08E0957F9c79223d';
const CLIENT_ID = 11; // Our client ID

interface VoteFormProps {
  proposalId: string;
  startBlock?: string;
  endBlock?: string;
}

type BidState = 'idle' | 'confirming' | 'pending' | 'error' | 'success';

// Get the first available RPC URL
const getRpcUrl = (): string => {
  const RPC_URLS = [
    process.env.NEXT_PUBLIC_RPC_URL,
    'https://eth-mainnet.g.alchemy.com/v2/demo',  // Fallback to Alchemy demo key
    'https://cloudflare-eth.com',  // Cloudflare's public endpoint as last resort
  ];

  // Filter out undefined values and return the first available URL
  return RPC_URLS.filter(Boolean)[0] as string || 'https://eth-mainnet.g.alchemy.com/v2/demo';
};

export function VoteForm({ proposalId, startBlock, endBlock }: VoteFormProps) {
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [isCommentOnly, setIsCommentOnly] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voteState, setVoteState] = useState<BidState>('idle');

  // Use Wagmi's useWriteContract hook
  const {
    writeContract,
    isPending: isVoting,
    reset: resetVoteState,
    isSuccess: isVoteSuccess
  } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setVoteState('success');
        setSelectedVote(null);
        setReason('');
      },
      onError: (error: Error | BaseError) => {
        console.error('Vote error:', error);
        setVoteState('error');
        
        // Handle user rejection
        if (error instanceof UserRejectedRequestError) {
          setErrorMessage('Transaction was cancelled by user');
          return;
        }

        // Handle contract execution errors
        if (error instanceof ContractFunctionExecutionError) {
          const message = error.message;
          
          if (message.includes('already voted')) {
            setErrorMessage('You have already voted on this proposal');
          } else if (message.includes('voting is closed')) {
            setErrorMessage('Voting period has ended');
          } else if (message.includes('voting not started')) {
            setErrorMessage('Voting period has not started yet');
          } else if (message.includes('An unknown RPC error occurred')) {
            // Handle RPC errors more gracefully
            setErrorMessage('Transaction failed. Please try again or check your wallet connection.');
          } else {
            // Extract a cleaner error message
            const cleanMessage = message.split('Details:')[0]?.trim() || message;
            setErrorMessage('Failed to cast vote: ' + cleanMessage);
          }
          return;
        }

        // Handle transaction execution errors
        if (error instanceof TransactionExecutionError) {
          const message = error.message;
          if (message.includes('rejected') || message.includes('cancelled') || message.includes('denied')) {
            setErrorMessage('Transaction was cancelled');
          } else if (message.includes('insufficient funds')) {
            setErrorMessage('Insufficient funds to complete the transaction');
          } else if (message.includes('nonce')) {
            setErrorMessage('Transaction nonce error. Please reset your wallet connection and try again');
          } else if (message.includes('gas')) {
            setErrorMessage('Gas estimation failed. The transaction may fail or the network could be congested');
          } else {
            setErrorMessage('Transaction failed: ' + message);
          }
          return;
        }

        // Handle other errors
        const errorMessage = error?.message || 'An unknown error occurred';
        if (errorMessage.includes('user rejected') || errorMessage.includes('cancelled')) {
          setErrorMessage('Transaction was cancelled');
        } else if (errorMessage.includes('network')) {
          setErrorMessage('Network error. Please check your connection and try again');
        } else {
          setErrorMessage('Failed to cast vote. Please try again.');
        }
      }
    }
  });

  // Effect to handle success state
  useEffect(() => {
    if (isVoteSuccess) {
      // Clear any error messages
      setErrorMessage(null);
      
      // Set success state
      setVoteState('success');
    }
  }, [isVoteSuccess]);

  useEffect(() => {
    const fetchCurrentBlock = async () => {
      try {
        // Use a simple fetch to get the current block number
        const response = await fetch(getRpcUrl(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1,
          }),
        });
        
        const data = await response.json();
        if (data.result) {
          const blockNumber = parseInt(data.result, 16);
          setCurrentBlock(blockNumber);
        }
      } catch (error) {
        console.warn('Error fetching current block:', error);
      }
    };

    fetchCurrentBlock();
    const interval = setInterval(fetchCurrentBlock, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Determine if this is a comment-only vote (outside voting period)
    if (startBlock && endBlock && currentBlock > 0) {
      const startBlockNum = parseInt(startBlock);
      const endBlockNum = parseInt(endBlock);
      
      setIsCommentOnly(currentBlock < startBlockNum || currentBlock > endBlockNum);
    }
  }, [startBlock, endBlock, currentBlock]);

  const handleVote = async () => {
    if (selectedVote === null) {
      setErrorMessage('Please select a vote option');
      return;
    }

    setErrorMessage(null);
    resetVoteState?.();

    // If this is a comment-only vote (outside voting period), just log the reason
    if (isCommentOnly) {
      // In a real implementation, you would save this to a database or other storage
      console.log(`Comment on proposal ${proposalId}: Vote ${selectedVote}, Reason: ${reason}`);
      
      // For demo purposes, we'll just show a success message
      setErrorMessage('Your comment has been recorded. Note that this is not an on-chain vote.');
      setSelectedVote(null);
      setReason('');
      return;
    }
    
    try {
      setVoteState('confirming');
      
      // Ensure proposalId is a valid number
      const proposalIdBigInt = BigInt(proposalId);
      
      // Cast vote using Wagmi's writeContract
      if (reason) {
        await writeContract({
          address: GOVERNOR_ADDRESS,
          abi: GOVERNOR_ABI,
          functionName: 'castRefundableVoteWithReason',
          args: [proposalIdBigInt, selectedVote, reason, CLIENT_ID],
        });
      } else {
        await writeContract({
          address: GOVERNOR_ADDRESS,
          abi: GOVERNOR_ABI,
          functionName: 'castRefundableVote',
          args: [proposalIdBigInt, selectedVote, CLIENT_ID],
        });
      }
      
      setVoteState('pending');
    } catch (err: unknown) {
      console.error('Error submitting vote:', err);
      setVoteState('error');
      
      // More detailed error handling
      if (err instanceof Error) {
        if (err.message.includes('user rejected transaction')) {
          setErrorMessage('Transaction was rejected');
        } else if (err.message.includes('insufficient funds')) {
          setErrorMessage('Insufficient funds for transaction');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage('Failed to cast vote. Please try again.');
      }
    }
  };

  const formatBlockTime = (blockNumber: string) => {
    // This is a simplified version - in a real implementation, you would use a more accurate method
    // to convert block numbers to timestamps
    const date = new Date();
    date.setSeconds(date.getSeconds() + (parseInt(blockNumber) - currentBlock) * 12); // Assuming 12 seconds per block
    
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderVotingPeriod = () => {
    if (!startBlock || !endBlock || currentBlock === 0) return null;
    
    const startBlockNum = parseInt(startBlock);
    const endBlockNum = parseInt(endBlock);
    
    if (currentBlock < startBlockNum) {
      return (
        <div className={styles.votingPeriodInfo}>
          <span className={styles.votingPeriodLabel}>Voting starts:</span> 
          <span className={styles.votingPeriodValue}>{formatBlockTime(startBlock)}</span>
        </div>
      );
    } else if (currentBlock <= endBlockNum) {
      return (
        <div className={styles.votingPeriodInfo}>
          <span className={styles.votingPeriodLabel}>Voting ends:</span> 
          <span className={styles.votingPeriodValue}>{formatBlockTime(endBlock)}</span>
        </div>
      );
    } else {
      return (
        <div className={styles.votingPeriodInfo}>
          <span className={styles.votingPeriodLabel}>Voting ended:</span> 
          <span className={styles.votingPeriodValue}>{formatBlockTime(endBlock)}</span>
        </div>
      );
    }
  };

  return (
    <div className={styles.voteForm}>
      <h3 className={styles.sectionTitle}>Cast Your Vote</h3>
        <div className={styles.formContent}>
        {isCommentOnly && (
          <div className={styles.commentNotice}>
            Note: Voting period {currentBlock < parseInt(startBlock || '0') ? 'has not started' : 'has ended'}. 
            Your input will be recorded as a comment only, not an on-chain vote.
          </div>
        )}
        
        {renderVotingPeriod()}
        
          <div className={styles.voteOptions}>
            <button
              className={`${styles.voteButton} ${selectedVote === 1 ? styles.selected : ''}`}
              onClick={() => setSelectedVote(1)}
              disabled={isVoting}
            >
              For
            </button>
            <button
              className={`${styles.voteButton} ${selectedVote === 0 ? styles.selected : ''}`}
              onClick={() => setSelectedVote(0)}
              disabled={isVoting}
            >
              Against
            </button>
            <button
              className={`${styles.voteButton} ${selectedVote === 2 ? styles.selected : ''}`}
              onClick={() => setSelectedVote(2)}
              disabled={isVoting}
            >
              Abstain
            </button>
          </div>
          
          <textarea
            className={styles.reasonInput}
          placeholder={isCommentOnly ? "Add your comment on this proposal" : "Optional: Add a reason for your vote"}
            value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (errorMessage) setErrorMessage(null);
            if (voteState === 'error') {
              setVoteState('idle');
              resetVoteState?.();
            }
          }}
            disabled={isVoting}
          />
          
          <button
            className={styles.submitButton}
            onClick={handleVote}
            disabled={isVoting || selectedVote === null}
          >
          {isVoting ? 'Submitting...' : isCommentOnly ? 'Submit Comment' : 'Submit Vote'}
          </button>
          
        {errorMessage && (
          <div className={styles.error}>{errorMessage}</div>
        )}
        
        {voteState === 'success' && (
          <div className={styles.success}>
            Your vote has been successfully cast on proposal #{proposalId}!
        </div>
      )}
      </div>
    </div>
  );
} 