import React from 'react';
import { useQuery } from '@apollo/client';
import styles from './VoterDetails.module.css';
import { AddressAvatar } from '../../Common/AddressAvatar';
import { StaticNounImage } from '@/src/Apps/Nouns/Auction/StaticNounImage';
import { 
  DELEGATE_DETAIL_QUERY,
  type Delegate
} from '@/src/Apps/Nouns/domain/graphql/queries/delegates';

interface VoterDetailsProps {
  id: string;
  onBackToList: () => void;
}

export function VoterDetails({ id, onBackToList }: VoterDetailsProps) {

  const { loading, error, data } = useQuery(DELEGATE_DETAIL_QUERY, {
    variables: { id },
    pollInterval: 30000,
  });

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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (timestamp: string) => {
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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onBackToList}>
            ← Back to Voters
          </button>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <div>Loading voter details...</div>
        </div>
      </div>
    );
  }

  if (error || !data?.delegate) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onBackToList}>
            ← Back to Voters
          </button>
        </div>
        <div className={styles.errorState}>
          Error loading voter details: {error?.message || 'Voter not found'}
        </div>
      </div>
    );
  }

  const delegate: Delegate = data.delegate;


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBackToList}>
          ← Back to Voters
        </button>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          {/* ENS and Address Section */}
          <div className={styles.identitySection}>
            <div className={styles.ensName}>
              <div className={styles.ensInfo}>
                <AddressAvatar address={delegate.id} size={24} />
              </div>
              <a
                href={`https://etherscan.io/address/${delegate.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.etherscanLink}
              >
                etherscan ↗
              </a>
            </div>
          </div>

          {/* Nouns Represented Section */}
          <div className={styles.nounsSection}>
            <h3 className={styles.sectionTitle}>
              {delegate.nounsRepresented.length} nouns represented (~{formatVoteCount(delegate.delegatedVotes)} of quorum)
            </h3>
            <div className={styles.nounsGrid}>
              {[...delegate.nounsRepresented]
                .sort((a, b) => parseInt(a.id) - parseInt(b.id))
                .map((noun) => (
                  <div key={noun.id} className={styles.nounItem}>
                    <StaticNounImage 
                      nounId={noun.id}
                      width={64}
                      height={64}
                      className={styles.nounImage}
                    />
                    <span className={styles.nounId}>{noun.id}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Proposals Section */}
          <div className={styles.proposalsSection}>
            <h3 className={styles.sectionTitle}>Proposals ({delegate.proposals.length})</h3>
            <div className={styles.proposalsList}>
              {delegate.proposals.length > 0 ? (
                delegate.proposals.map((proposal) => (
                  <div key={proposal.id} className={styles.proposalItem}>
                    <div className={styles.proposalHeader}>
                      <span className={styles.proposalId}>Prop {proposal.id}</span>
                      <span className={`${styles.status} ${styles[proposal.status.toLowerCase()]}`}>
                        {proposal.status}
                      </span>
                      <span className={styles.proposalDate}>
                        {formatTimestamp(proposal.createdTimestamp)}
                      </span>
                    </div>
                    <div className={styles.proposalTitle}>
                      {proposal.title}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>No proposals created</div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          {/* Voting Stats */}
          <div className={styles.votingStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>For</span>
              <span className={styles.statValue}>
                {delegate.votes.filter(v => v.supportDetailed === 1).length}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Abstain</span>
              <span className={styles.statValue}>
                {delegate.votes.filter(v => v.supportDetailed === 2).length}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Against</span>
              <span className={styles.statValue}>
                {delegate.votes.filter(v => v.supportDetailed === 0).length}
              </span>
            </div>
          </div>

          {/* Voting History */}
          <div className={styles.votesSection}>
            <h3 className={styles.sectionTitle}>
              Voting History ({delegate.votes.length} votes, {Math.round((delegate.votes.filter(v => v.reason && v.reason.trim().length > 0).length / Math.max(1, delegate.votes.length)) * 100)}% with reason)
            </h3>
            <div className={styles.votesList}>
              {delegate.votes.map((vote) => (
                <div key={vote.id} className={styles.voteItem}>
                  <div className={styles.voteHeader}>
                    <span className={`${styles.voteSupport} ${getSupportClass(vote.supportDetailed)}`}>
                      {getSupportText(vote.supportDetailed)}
                    </span>
                    <span className={styles.voteId}>({vote.proposal.id})</span>
                    <span className={styles.voteTime}>{formatRelativeTime(vote.blockTimestamp)}</span>
                  </div>
                  <div className={styles.voteProposal}>
                    {vote.proposal.title}
                  </div>
                  {vote.reason && vote.reason.trim() && (
                    <div className={styles.voteReason}>
                      {vote.reason.length > 250 ? `${vote.reason.substring(0, 250)}...` : vote.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
