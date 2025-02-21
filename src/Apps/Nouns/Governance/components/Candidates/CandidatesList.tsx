import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import styles from './CandidatesList.module.css';
import { AddressAvatar } from '../Common/AddressAvatar';
import { 
  PROPOSAL_CANDIDATES_QUERY,
  CANDIDATE_FEEDBACK_QUERY,
  type ProposalCandidatesQuery,
  type CandidateFeedbackQuery,
  type ProposalCandidate
} from '@/src/Apps/Nouns/domain/graphql/queries/candidates';

interface CandidatesListProps {
  onCandidateClick: (id: string) => void;
}

export function CandidatesList({ onCandidateClick }: CandidatesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  // Query for all candidates
  const { data: candidatesData, loading: candidatesLoading, error: candidatesError } = useQuery<ProposalCandidatesQuery['data']>(
    PROPOSAL_CANDIDATES_QUERY,
    {
      variables: { first: 100, skip: 0 },
      pollInterval: 30000,
    }
  );

  // Query for selected candidate's feedback
  const { data: feedbackData } = useQuery<CandidateFeedbackQuery['data']>(
    CANDIDATE_FEEDBACK_QUERY,
    {
      variables: { candidateId: selectedCandidate || '', first: 100 },
      skip: !selectedCandidate,
      pollInterval: 30000,
    }
  );

  const filteredCandidates = candidatesData?.proposalCandidates?.filter(candidate => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    
    return candidate.proposer.toLowerCase().includes(searchLower) ||
           candidate.number.toString().includes(searchQuery);
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

  const renderLoadingItems = () => {
    return Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className={styles.loadingItem}>
        <div className={styles.loadingText} style={{ width: '60%' }} />
        <div className={styles.loadingText} style={{ width: '40%' }} />
        <div className={styles.loadingText} style={{ width: '80%' }} />
      </div>
    ));
  };

  const handleSearchSubmit = () => {
    const searchId = Number(searchQuery);
    if (isNaN(searchId) || searchId < 1) {
      return; // Invalid ID
    }
    onCandidateClick(String(searchId));
    setSearchQuery('');
  };

  const handleCandidateClick = (candidate: ProposalCandidate) => {
    setSelectedCandidate(candidate.id);
    onCandidateClick(candidate.id);
  };

  const renderFeedback = (candidate: ProposalCandidate) => {
    if (!feedbackData?.candidateFeedbacks || candidate.id !== selectedCandidate) return null;

    const feedback = feedbackData.candidateFeedbacks;
    if (!feedback.length) return null;

    return (
      <div className={styles.feedback}>
        <h4>Feedback ({feedback.length})</h4>
        {feedback.map(item => (
          <div key={item.id} className={styles.feedbackItem}>
            <div className={styles.feedbackHeader}>
              <AddressAvatar address={item.voter.id} size={16} />
              <span className={styles.votes}>
                {item.votes} votes
              </span>
              <span className={styles.supportType}>
                {item.supportDetailed === 1 ? 'For' : item.supportDetailed === 0 ? 'Against' : 'Abstain'}
              </span>
            </div>
            {item.reason && (
              <div className={styles.feedbackReason}>
                {item.reason}
              </div>
            )}
            <span className={styles.timestamp}>
              {formatTimestamp(item.createdTimestamp)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Candidates</h2>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by proposer or candidate number..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className={styles.searchButton} onClick={handleSearchSubmit}>Search</button>
        </div>
        <div className={styles.candidatesList}>
          {candidatesLoading ? (
            renderLoadingItems()
          ) : candidatesError ? (
            <div className={styles.emptyState}>Error loading candidates</div>
          ) : !filteredCandidates?.length ? (
            <div className={styles.emptyState}>No candidates found</div>
          ) : (
            filteredCandidates.map(candidate => (
              <div
                key={candidate.id}
                className={`${styles.candidateItem} ${selectedCandidate === candidate.id ? styles.selected : ''}`}
                onClick={() => handleCandidateClick(candidate)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.candidateHeader}>
                  <span className={styles.candidateId}>
                    Candidate #{candidate.number}
                  </span>
                  <span className={styles.timestamp}>
                    {formatTimestamp(candidate.createdTimestamp)}
                  </span>
                </div>
                <div className={styles.proposerInfo}>
                  <span>Proposed by </span>
                  <AddressAvatar address={candidate.proposer} size={16} />
                </div>
                <div className={styles.candidateFooter}>
                  <span className={styles.status}>
                    {candidate.canceled ? 'Canceled' : 'Active'}
                  </span>
                  <span className={styles.timestamp}>
                    Last updated {formatTimestamp(candidate.lastUpdatedTimestamp)}
                  </span>
                </div>
                {renderFeedback(candidate)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 