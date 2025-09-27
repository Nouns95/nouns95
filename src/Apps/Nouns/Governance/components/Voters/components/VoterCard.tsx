import React from 'react';
import { AddressAvatar } from '../../Common/AddressAvatar';
import styles from './VoterCard.module.css';
import type { Delegate } from '@/src/Apps/Nouns/domain/graphql/queries/delegates';

interface VoterCardProps {
  delegate: Delegate;
  onClick: (id: string) => void;
}

export function VoterCard({ delegate, onClick }: VoterCardProps) {
  const formatVoteCount = (votes: string) => {
    const num = parseInt(votes);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div
      className={styles.delegateCard}
      onClick={() => onClick(delegate.id)}
    >
      <div className={styles.delegateHeader}>
        <AddressAvatar address={delegate.id} size={24} />
        <div className={styles.delegateInfo}>
          {/* Removed voting power from here */}
        </div>
        <a
          href={`https://etherscan.io/address/${delegate.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.etherscanLink}
          onClick={(e) => e.stopPropagation()}
        >
          etherscan ↗
        </a>
      </div>
      
      <div className={styles.delegateStats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Voting Power</span>
          <span className={styles.statValue}>
            {formatVoteCount(delegate.delegatedVotes)}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Represents</span>
          <span className={styles.statValue}>
            {delegate.tokenHoldersRepresented.length} holder{delegate.tokenHoldersRepresented.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {delegate.votes.length > 0 && (
        <div className={styles.recentActivity}>
          <div className={styles.activityLabel}>Recent vote:</div>
          <div className={styles.lastVote}>
            {getSupportText(delegate.votes[0].supportDetailed)} on &ldquo;{truncateText(delegate.votes[0].proposal.title, 40)}&rdquo;
          </div>
        </div>
      )}

      {delegate.proposals.length > 0 && (
        <div className={styles.proposalInfo}>
          <div className={styles.proposalLabel}>Latest proposal:</div>
          <div className={styles.proposalTitle}>
            &ldquo;{truncateText(delegate.proposals[0].title, 40)}&rdquo;
          </div>
        </div>
      )}
    </div>
  );
}
