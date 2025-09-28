import React, { useState, useRef, RefObject } from 'react';
import { useQuery, gql } from '@apollo/client';
import styles from './CandidatesList.module.css';
import { AddressAvatar } from '../Common/AddressAvatar';
import { MarkdownReason } from '../Proposals/components/MarkdownReason';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { 
  PROPOSAL_CANDIDATES_QUERY,
  type ProposalCandidate,
  type CandidateFeedback
} from '@/src/Apps/Nouns/domain/graphql/queries/candidates';

interface CandidatesListProps {
  onCandidateClick: (id: string) => void;
}

// Pagination constants
const INITIAL_CANDIDATES_TO_SHOW = 10;
const INITIAL_FEEDBACK_TO_SHOW = 15;
const LOAD_MORE_CANDIDATES = 10;
const LOAD_MORE_FEEDBACK = 15;

// Updated queries for infinite scroll
const RECENT_CANDIDATE_FEEDBACK_QUERY = gql`
  query RecentCandidateFeedback($first: Int!, $skip: Int!) {
    candidateFeedbacks(
      first: $first,
      skip: $skip,
      orderBy: createdTimestamp,
      orderDirection: desc
    ) {
      id
      createdTimestamp
      createdBlock
      candidate {
        id
        number
        slug
      }
      voter {
        id
        delegatedVotes
      }
      supportDetailed
      votes
      reason
    }
  }
`;

export function CandidatesList({ onCandidateClick }: CandidatesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Refs for infinite scroll containers
  const feedbackContainerRef = useRef<HTMLDivElement>(null);
  const candidatesContainerRef = useRef<HTMLDivElement>(null);
  
  // Pagination state
  const [hasMoreFeedback, setHasMoreFeedback] = useState(true);
  const [hasMoreCandidates, setHasMoreCandidates] = useState(true);
  const [isFetchingMoreFeedback, setIsFetchingMoreFeedback] = useState(false);
  const [isFetchingMoreCandidates, setIsFetchingMoreCandidates] = useState(false);

  // Query for candidate feedback
  const { loading: feedbackLoading, error: feedbackError, data: feedbackData, fetchMore: fetchMoreFeedback } = useQuery(RECENT_CANDIDATE_FEEDBACK_QUERY, {
    variables: { 
      first: INITIAL_FEEDBACK_TO_SHOW,
      skip: 0
    },
    onCompleted: (data) => {
      if (data.candidateFeedbacks.length < INITIAL_FEEDBACK_TO_SHOW) {
        setHasMoreFeedback(false);
      }
    }
  });

  // Query for candidates
  const { loading: candidatesLoading, error: candidatesError, data: candidatesData, fetchMore: fetchMoreCandidates } = useQuery(PROPOSAL_CANDIDATES_QUERY, {
    variables: {
      first: INITIAL_CANDIDATES_TO_SHOW,
      skip: 0
    },
    pollInterval: 30000,
    onCompleted: (data) => {
      if (data.proposalCandidates.length < INITIAL_CANDIDATES_TO_SHOW) {
        setHasMoreCandidates(false);
      }
    }
  });

  // Fetch more functions for infinite scroll
  const handleFetchMoreFeedback = async () => {
    if (isFetchingMoreFeedback) return; // Prevent multiple simultaneous fetches
    
    setIsFetchingMoreFeedback(true);
    try {
      await fetchMoreFeedback({
        variables: {
          first: LOAD_MORE_FEEDBACK,
          skip: feedbackData?.candidateFeedbacks?.length || 0
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult || !fetchMoreResult.candidateFeedbacks.length) {
            setHasMoreFeedback(false);
            return prev;
          }
          if (fetchMoreResult.candidateFeedbacks.length < LOAD_MORE_FEEDBACK) {
            setHasMoreFeedback(false);
          }
          // Deduplicate feedback by ID to prevent duplicate keys
          const existingFeedbackIds = new Set(prev.candidateFeedbacks.map((feedback: CandidateFeedback) => feedback.id));
          const newFeedback = fetchMoreResult.candidateFeedbacks.filter((feedback: CandidateFeedback) => !existingFeedbackIds.has(feedback.id));
          return {
            ...prev,
            candidateFeedbacks: [...prev.candidateFeedbacks, ...newFeedback]
          };
        }
      });
    } catch {
      // Error fetching more feedback
      setHasMoreFeedback(false);
    } finally {
      setIsFetchingMoreFeedback(false); // Always reset loading state
    }
  };

  const handleFetchMoreCandidates = async () => {
    if (isFetchingMoreCandidates) return; // Prevent multiple simultaneous fetches
    
    setIsFetchingMoreCandidates(true);
    try {
      await fetchMoreCandidates({
        variables: {
          first: LOAD_MORE_CANDIDATES,
          skip: candidatesData?.proposalCandidates?.length || 0
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult || !fetchMoreResult.proposalCandidates.length) {
            setHasMoreCandidates(false);
            return prev;
          }
          if (fetchMoreResult.proposalCandidates.length < LOAD_MORE_CANDIDATES) {
            setHasMoreCandidates(false);
          }
          // Deduplicate candidates by ID to prevent duplicate keys
          const existingCandidateIds = new Set(prev.proposalCandidates.map((candidate: ProposalCandidate) => candidate.id));
          const newCandidates = fetchMoreResult.proposalCandidates.filter((candidate: ProposalCandidate) => !existingCandidateIds.has(candidate.id));
          return {
            ...prev,
            proposalCandidates: [...prev.proposalCandidates, ...newCandidates]
          };
        }
      });
    } catch {
      // Error fetching more candidates
      setHasMoreCandidates(false);
    } finally {
      setIsFetchingMoreCandidates(false); // Always reset loading state
    }
  };

  // Infinite scroll hooks
  useInfiniteScroll(
    feedbackContainerRef as RefObject<HTMLElement | null>,
    handleFetchMoreFeedback,
    {
      hasMore: hasMoreFeedback,
      loading: isFetchingMoreFeedback
    }
  );

  useInfiniteScroll(
    candidatesContainerRef as RefObject<HTMLElement | null>,
    handleFetchMoreCandidates,
    {
      hasMore: hasMoreCandidates,
      loading: isFetchingMoreCandidates
    }
  );

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

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchQuery(searchInput);
    
    // If it's a valid candidate number, navigate to it
    if (searchInput.trim() && !isNaN(Number(searchInput))) {
      onCandidateClick(searchInput.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Filter candidates based on search query
  const filteredCandidates = candidatesData?.proposalCandidates?.filter((candidate: ProposalCandidate) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const title = candidate.latestVersion?.content?.title?.toLowerCase() || '';
    const description = candidate.latestVersion?.content?.description?.toLowerCase() || '';
    
    return candidate.id.includes(searchQuery) || 
           candidate.number.toString().includes(searchQuery) ||
           candidate.proposer.toLowerCase().includes(query) ||
           title.includes(query) ||
           description.includes(query);
  });

  const renderLoadingCandidate = () => (
    <div className={styles.loadingItem}>
      <div className={styles.candidateHeader}>
        <div className={styles.loadingText} />
        <div className={styles.loadingText} style={{ width: '30%' }} />
      </div>
      <div className={styles.loadingText} />
      <div className={styles.loadingText} style={{ width: '70%' }} />
    </div>
  );

  const renderLoadingFeedback = () => (
    <div className={styles.loadingItem}>
      <div className={styles.feedbackHeader}>
        <div className={styles.loadingText} style={{ width: '40%' }} />
        <div className={styles.loadingText} style={{ width: '20%' }} />
      </div>
    </div>
  );

  // Show loading state if both queries are loading
  if (feedbackLoading && candidatesLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.column}>
                  <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recent Candidate Feedback</h3>
          <div className={styles.feedbackList}>
              {Array(5).fill(0).map((_, i) => (
                <React.Fragment key={`loading-feedback-${i}`}>
                  {renderLoadingFeedback()}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.column}>
                  <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recent Candidates</h3>
          <div className={styles.candidatesList}>
              {Array(3).fill(0).map((_, i) => (
                <React.Fragment key={`loading-candidate-${i}`}>
                  {renderLoadingCandidate()}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (candidatesError || feedbackError) return <div>Error loading candidates</div>;

  const feedback = feedbackData?.candidateFeedbacks || [];
  const recentCandidates = filteredCandidates || [];



  return (
    <div className={styles.container}>

      <div className={styles.column}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recent Candidate Feedback</h3>
          <div 
            className={styles.feedbackList} 
            ref={feedbackContainerRef}
            style={{
              height: 'calc(100% - 1.5rem)', /* Adjust for better container fit */
              overflowY: 'auto',
              overflowX: 'hidden',
              /* Ensure Safari uses our scrollbar styles */
              scrollbarWidth: 'auto'
            }}
          >
            {feedbackLoading ? (
              Array(5).fill(0).map((_, i) => (
                <React.Fragment key={`loading-feedback-${i}`}>
                  {renderLoadingFeedback()}
                </React.Fragment>
              ))
            ) : feedback.length ? (
              <>
                {feedback.map((item: CandidateFeedback) => (
                  <div 
                    key={item.id} 
                    className={styles.feedbackItem}
                    onClick={() => onCandidateClick(item.candidate.id)}
                    style={{ cursor: 'pointer' }}
                  >
            <div className={styles.feedbackHeader}>
                      <AddressAvatar address={item.voter.id} />
                      <span className={styles.comment}>
                        Voted {getSupportText(item.supportDetailed)} with {item.votes} votes on Candidate #{item.candidate.number}
              </span>
            </div>
            {item.reason && (
                      <MarkdownReason content={item.reason} />
            )}
            <span className={styles.timestamp}>
              {formatTimestamp(item.createdTimestamp)}
            </span>
          </div>
        ))}
                {isFetchingMoreFeedback && (
                  <div className={styles.loadingMore}>
                    <div className={styles.loadingIndicator}>Loading more feedback...</div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>No recent feedback</div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.column}>
      <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recent Candidates</h3>
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.searchInput}
              placeholder="Search candidates by number, title, or proposer..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className={styles.searchButton} onClick={() => handleSearch()}>
              Search
            </button>
        </div>
          <div className={styles.candidatesList} ref={candidatesContainerRef}>
          {candidatesLoading ? (
              Array(3).fill(0).map((_, i) => (
                <React.Fragment key={`loading-candidate-${i}`}>
                  {renderLoadingCandidate()}
                </React.Fragment>
              ))
            ) : recentCandidates?.length ? (
              <>
                {recentCandidates.map((candidate: ProposalCandidate) => {
                  const content = candidate.latestVersion?.content;
                  const title = content?.title || `Candidate #${candidate.number}`;
                  const signatureCount = content?.contentSignatures?.filter(sig => !sig.canceled).length || 0;
                  
                  return (
                    <div
                      key={candidate.id}
                      className={styles.candidateItem}
                      onClick={() => onCandidateClick(candidate.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.candidateHeader}>
                        <span className={styles.candidateId}>Candidate #{candidate.number}</span>
                        <span className={`${styles.status} ${candidate.canceled ? styles.canceled : styles.active}`}>
                          {candidate.canceled ? 'Canceled' : 'Active'}
                        </span>
                      </div>
                      
                      {content?.title && (
                        <div className={styles.candidateTitle}>
                          {title}
                        </div>
                      )}
                      
                      <div className={styles.proposerInfo}>
                        <span>Proposed by </span>
                        <AddressAvatar address={candidate.proposer} size={16} />
                      </div>
                      
                      {signatureCount > 0 && (
                        <div className={styles.signatureCount}>
                          {signatureCount} sponsor signature{signatureCount !== 1 ? 's' : ''}
                        </div>
                      )}
                      
                      <div className={styles.candidateFooter}>
                        <span className={styles.timestamp}>
                          {formatTimestamp(candidate.createdTimestamp)}
                        </span>
                        <span className={styles.timestamp}>
                          Last updated {formatTimestamp(candidate.lastUpdatedTimestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {isFetchingMoreCandidates && (
                  <div className={styles.loadingMore}>
                    <div className={styles.loadingIndicator}>Loading more candidates...</div>
              </div>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>No active candidates</div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
} 