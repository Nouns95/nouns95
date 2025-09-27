import React from 'react';
import { AddressAvatar } from '../../Common/AddressAvatar';
import { MarkdownReason } from '../../Proposals/components/MarkdownReason';
import styles from './VoterActivity.module.css';
import type { DelegateActivity } from '@/src/Apps/Nouns/domain/graphql/queries/delegates';

interface VoterActivityProps {
  activity: DelegateActivity;
  onVoterClick: (id: string) => void;
}

export function VoterActivity({ activity, onVoterClick }: VoterActivityProps) {
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

  const getSupportClass = (supportDetailed: number) => {
    switch (supportDetailed) {
      case 0:
        return styles.against;
      case 1:
        return styles.for;
      case 2:
        return styles.abstain;
      default:
        return '';
    }
  };

  return (
    <div 
      className={styles.activityItem}
      onClick={() => onVoterClick(activity.voter.id)}
    >
      <div className={styles.activityHeader}>
        <AddressAvatar address={activity.voter.id} size={20} />
        <div className={styles.activityInfo}>
          <span className={styles.voterAddress}>
            {activity.voter.id}
          </span>
          <div className={styles.voteAction}>
            Voted <span className={`${styles.support} ${getSupportClass(activity.supportDetailed)}`}>
              {getSupportText(activity.supportDetailed)}
            </span> with <span className={styles.voteCount}>{formatVoteCount(activity.votes)}</span> votes
          </div>
        </div>
      </div>
      
      <div className={styles.proposalInfo}>
        <span className={styles.proposalLabel}>on</span>
        <span className={styles.proposalTitle}>&ldquo;{activity.proposal.title}&rdquo;</span>
      </div>

      {activity.reason && (
        <div className={styles.reasonContainer}>
          <MarkdownReason content={activity.reason} />
        </div>
      )}
      
      <div className={styles.activityFooter}>
        <span className={styles.timestamp}>
          {formatTimestamp(activity.blockTimestamp)}
        </span>
        {activity.nouns && activity.nouns.length > 0 && (
          <span className={styles.nounsCount}>
            Using {activity.nouns.length} Noun{activity.nouns.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
