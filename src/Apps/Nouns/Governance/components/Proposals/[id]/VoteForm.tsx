import React, { useState } from 'react';
import { ethers } from 'ethers';
import styles from './ProposalDetails.module.css';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

// ABI for the Governor contract
const GOVERNOR_ABI = [
  'function castVote(uint256 proposalId, uint8 support) returns (uint256)',
  'function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)',
  'function state(uint256 proposalId) view returns (uint8)',
  'function hasVoted(uint256 proposalId, address account) view returns (bool)'
];

interface VoteFormProps {
  proposalId: string;
  status: string;
}

type VoteError = {
  message: string;
  code?: number;
}

export function VoteForm({ proposalId, status }: VoteFormProps) {
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async () => {
    if (selectedVote === null) {
      setError('Please select a vote option');
      return;
    }

    setIsVoting(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error('No Ethereum wallet found. Please install MetaMask.');
      }

      // Request account access
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      
      // Get the Governor contract
      const governorAddress = process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS;
      if (!governorAddress) {
        throw new Error('Governor contract address not configured');
      }
      
      const governor = new ethers.Contract(governorAddress, GOVERNOR_ABI, signer);
      
      // Cast vote
      let tx;
      if (reason) {
        tx = await governor.castVoteWithReason(proposalId, selectedVote, reason);
      } else {
        tx = await governor.castVote(proposalId, selectedVote);
      }
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Clear form
      setSelectedVote(null);
      setReason('');
      
    } catch (err: unknown) {
      const voteError = err as VoteError;
      setError(voteError.message || 'Failed to cast vote');
    } finally {
      setIsVoting(false);
    }
  };

  const isActive = status === 'ACTIVE';

  return (
    <div className={styles.voteForm}>
      <h3 className={styles.sectionTitle}>Cast Your Vote</h3>
      {isActive ? (
        <div className={styles.formContent}>
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
            placeholder="Optional: Add a reason for your vote"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isVoting}
          />
          
          <button
            className={styles.submitButton}
            onClick={handleVote}
            disabled={isVoting || selectedVote === null}
          >
            {isVoting ? 'Submitting...' : 'Submit Vote'}
          </button>
          
          {error && (
            <div className={styles.error}>{error}</div>
          )}
        </div>
      ) : (
        <div className={styles.inactiveMessage}>
          This proposal is not currently active for voting
        </div>
      )}
    </div>
  );
} 