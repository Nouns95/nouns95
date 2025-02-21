import React from 'react';
import { useQuery, gql } from '@apollo/client';
import styles from './ProposalDetails.module.css';
import { AddressAvatar } from '../../Common/AddressAvatar';
import { MarkdownReason } from '../MarkdownReason';

interface Vote {
  id: string;
  support: boolean;
  supportDetailed: number;
  votesRaw: string;
  votes: string;
  reason: string | null;
  voter: {
    id: string;
    delegatedVotes: string;
  };
  nouns: {
    id: string;
  }[];
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

const PROPOSAL_VOTES_QUERY = gql`
  query ProposalVotes($proposalId: String!) {
    votes(
      where: { proposal: $proposalId }
      orderBy: blockNumber
      orderDirection: desc
    ) {
      id
      support
      supportDetailed
      votesRaw
      votes
      reason
      voter {
        id
        delegatedVotes
      }
      nouns {
        id
      }
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

interface VoteHistoryProps {
  proposalId: string;
}

export function VoteHistory({ proposalId }: VoteHistoryProps) {
  const { data, loading } = useQuery(PROPOSAL_VOTES_QUERY, {
    variables: { proposalId },
    pollInterval: 30000,
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} days ago`;
    }
  };

  const getSupportText = (supportDetailed: number) => {
    switch (supportDetailed) {
      case 0:
        return 'Against';
      case 1:
        return 'For';
      case 2:
        return 'Abstain';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading votes...</div>;
  }

  const votes = data?.votes || [];

  return (
    <div className={styles.voteHistory}>
      <h3 className={styles.sectionTitle}>Vote History</h3>
      <div className={styles.votesList}>
        {votes.map((vote: Vote) => (
          <div key={vote.id} className={styles.voteItem}>
            <div className={styles.voteHeader}>
              <AddressAvatar address={vote.voter.id} />
              <span className={styles.voteInfo}>
                Voted {getSupportText(vote.supportDetailed)} with {vote.votes} votes
              </span>
            </div>
            {vote.reason && (
              <MarkdownReason content={vote.reason} />
            )}
            <span className={styles.timestamp}>
              {formatTimestamp(vote.blockTimestamp)}
            </span>
          </div>
        ))}
        {votes.length === 0 && (
          <div className={styles.emptyState}>No votes yet</div>
        )}
      </div>
    </div>
  );
} 