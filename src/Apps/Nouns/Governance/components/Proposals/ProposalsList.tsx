import React, { useState, useEffect, useRef, RefObject } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useAccount } from 'wagmi';
import styles from './ProposalsList.module.css';
import { AddressAvatar } from '../Common/AddressAvatar';
import { MarkdownReason } from './components/MarkdownReason';
import { providers } from 'ethers';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

interface Vote {
  id: string;
  voter: {
    id: string;
    delegatedVotes: string;
  };
  support: boolean;
  supportDetailed: number;
  votes: string;
  votesRaw: string;
  reason: string | null;
  proposal: {
    id: string;
  };
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
  clientId: number;
  nouns: Array<{
    id: string;
  }>;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: string;
  proposer: {
    id: string;
  };
  quorumVotes: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  createdTimestamp: string;
  startBlock: string;
  endBlock: string;
  executionETA: string | null;
  totalSupply: string;
  createdBlock: string;
}

const INITIAL_PROPOSALS_TO_SHOW = 10;
const INITIAL_VOTES_TO_SHOW = 15;
const LOAD_MORE_PROPOSALS = 10;
const LOAD_MORE_VOTES = 15;

const RECENT_VOTES_QUERY = gql`
  query RecentVotes($first: Int!, $skip: Int!) {
    votes(
      first: $first,
      skip: $skip,
      orderBy: blockNumber,
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
      proposal {
        id
      }
      blockNumber
      blockTimestamp
      transactionHash
      clientId
    }
  }
`;

const ACTIVE_PROPOSALS_QUERY = gql`
  query ActiveProposals($first: Int!, $skip: Int!) {
    proposals(
      first: $first,
      skip: $skip,
      orderBy: createdTimestamp,
      orderDirection: desc
    ) {
      id
      title
      description
      status
      proposer {
        id
      }
      quorumVotes
      forVotes
      againstVotes
      abstainVotes
      createdTimestamp
      createdBlock
      startBlock
      endBlock
      executionETA
      totalSupply
    }
  }
`;

const calculateVotePercentages = (proposal: Proposal) => {
  const forVotes = parseInt(proposal.forVotes);
  const againstVotes = parseInt(proposal.againstVotes);
  const abstainVotes = parseInt(proposal.abstainVotes);
  const quorumVotes = parseInt(proposal.quorumVotes);
  const totalVotes = forVotes + againstVotes + abstainVotes;
  
  if (totalVotes === 0) return { for: 0, against: 0, abstain: 0 };
  
  // If we haven't met quorum, scale all bars relative to quorum
  if (totalVotes < quorumVotes) {
    return {
      for: (forVotes / quorumVotes) * 75, // Scale to 75% max width when below quorum
      against: (againstVotes / quorumVotes) * 75,
      abstain: (abstainVotes / quorumVotes) * 75
    };
  }
  
  // If we've met quorum, show proportions of total votes
  return {
    for: (forVotes / totalVotes) * 100,
    against: (againstVotes / totalVotes) * 100,
    abstain: (abstainVotes / totalVotes) * 100
  };
};

const calculateQuorumPosition = (proposal: Proposal) => {
  const forVotes = parseInt(proposal.forVotes);
  const againstVotes = parseInt(proposal.againstVotes);
  const abstainVotes = parseInt(proposal.abstainVotes);
  const quorumVotes = parseInt(proposal.quorumVotes);
  const totalVotes = forVotes + againstVotes + abstainVotes;

  // If no votes, position at 75% of the bar
  if (totalVotes === 0) return 75;

  // If votes exceed quorum, position the line proportionally
  if (totalVotes >= quorumVotes) {
    // Calculate what percentage of the total votes the quorum represents
    const quorumPercent = (quorumVotes / totalVotes) * 100;
    // Position the line at that percentage point
    return Math.min(Math.max(quorumPercent, 30), 75);
  }

  // If votes are less than quorum, fix at 75%
  return 75;
};

// Add this new function to determine real proposal status
const getRealProposalStatus = (proposal: Proposal, currentBlock: number) => {
  // If the proposal is not marked as active by the subgraph, return its current status
  if (proposal.status !== 'ACTIVE') {
    return proposal.status;
  }

  // If we're past the end block
  if (currentBlock > parseInt(proposal.endBlock)) {
    const forVotes = parseInt(proposal.forVotes);
    const againstVotes = parseInt(proposal.againstVotes);
    const quorumVotes = parseInt(proposal.quorumVotes);

    // Check defeat conditions:
    // 1. Didn't reach quorum
    // 2. More against votes than for votes
    if (forVotes < quorumVotes || againstVotes >= forVotes) {
      return 'DEFEATED';
    }
  }

  // If none of the above conditions are met, keep it as ACTIVE
  return proposal.status;
};

interface ProposalsListProps {
  onProposalClick: (proposalId: string) => void;
  onEditProposal?: (proposalId: string) => void;
}

const getProvider = () => {
  const RPC_URLS = [
    process.env.NEXT_PUBLIC_RPC_URL,
    'https://eth-mainnet.g.alchemy.com/v2/demo',  // Fallback to Alchemy demo key
    'https://cloudflare-eth.com',  // Cloudflare's public endpoint as last resort
  ];

  // Create a provider that will try each RPC URL in sequence
  return new providers.FallbackProvider(
    RPC_URLS.filter(Boolean).map(url => new providers.JsonRpcProvider(url)),
    1  // Only need 1 successful response
  );
};

export function ProposalsList({ onProposalClick, onEditProposal }: ProposalsListProps) {
  const { address } = useAccount();
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // Refs for infinite scroll containers
  const votesContainerRef = useRef<HTMLDivElement>(null);
  const proposalsContainerRef = useRef<HTMLDivElement>(null);
  
  // Pagination state
  const [hasMoreVotes, setHasMoreVotes] = useState(true);
  const [hasMoreProposals, setHasMoreProposals] = useState(true);
  const [isFetchingMoreVotes, setIsFetchingMoreVotes] = useState(false);
  const [isFetchingMoreProposals, setIsFetchingMoreProposals] = useState(false);

  // Update the effect to use the new provider
  useEffect(() => {
    const fetchCurrentBlock = async () => {
      try {
        const provider = getProvider();
        const block = await provider.getBlockNumber();
        setCurrentBlock(block);
      } catch {
        // Error fetching current block
        // Don't update currentBlock if there's an error
        // The existing value will be used
      }
    };

    fetchCurrentBlock();
    const interval = setInterval(fetchCurrentBlock, 30000);

    return () => clearInterval(interval);
  }, []);

  const { loading: proposalsLoading, error: proposalsError, data: proposalsData, fetchMore: fetchMoreProposals } = useQuery(ACTIVE_PROPOSALS_QUERY, {
    variables: {
      first: INITIAL_PROPOSALS_TO_SHOW,
      skip: 0
    },
    pollInterval: 30000,
    onCompleted: (data) => {
      if (data.proposals.length < INITIAL_PROPOSALS_TO_SHOW) {
        setHasMoreProposals(false);
      }
    }
  });

  const { loading: votesLoading, error: votesError, data: votesData, fetchMore: fetchMoreVotes } = useQuery(RECENT_VOTES_QUERY, {
    variables: { 
      first: INITIAL_VOTES_TO_SHOW,
      skip: 0
    },
    onCompleted: (data) => {
      if (data.votes.length < INITIAL_VOTES_TO_SHOW) {
        setHasMoreVotes(false);
      }
    }
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

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getBlockTimestamp = (proposal: Proposal, blockNumber: string) => {
    const createdTime = parseInt(proposal.createdTimestamp);
    const createdBlock = parseInt(proposal.createdBlock);
    const targetBlock = parseInt(blockNumber);
    const blockDiff = targetBlock - createdBlock;
    
    // Assuming 12 second block time
    const timeDiff = blockDiff * 12;
    return createdTime + timeDiff;
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

  const formatVoteCount = (votes: string) => {
    const num = parseInt(votes);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const canEditProposal = (proposal: Proposal) => {
    if (!address || !onEditProposal) return false;
    
    // Only proposer can edit
    if (proposal.proposer.id.toLowerCase() !== address.toLowerCase()) return false;
    
    // Can only edit proposals that are still in updatable period
    const realStatus = getRealProposalStatus(proposal, currentBlock);
    
    // For now, allow editing of ACTIVE proposals (we'd need updatePeriodEndBlock for precise timing)
    return realStatus === 'ACTIVE' || realStatus === 'PENDING';
  };

  const renderLoadingProposal = () => (
    <div className={styles.loadingItem}>
      <div className={styles.proposalHeader}>
        <div className={styles.loadingText} />
        <div className={styles.loadingText} style={{ width: '20%' }} />
      </div>
      <div className={styles.loadingTitle} />
      <div className={styles.loadingText} />
      <div className={styles.votingProgress}>
        <div className={styles.loadingBar} />
        <div className={styles.voteStats}>
          <div className={styles.loadingText} style={{ width: '30%' }} />
          <div className={styles.loadingText} style={{ width: '30%' }} />
        </div>
      </div>
    </div>
  );

  const renderLoadingVote = () => (
    <div className={styles.loadingItem}>
      <div className={styles.voteHeader}>
        <div className={styles.loadingText} style={{ width: '40%' }} />
        <div className={styles.loadingText} style={{ width: '20%' }} />
      </div>
    </div>
  );

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchQuery(searchInput);
    
    // If it's a valid proposal number, navigate to it
    if (searchInput.trim() && !isNaN(Number(searchInput))) {
      onProposalClick(searchInput.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Filter proposals based on search query
  const filteredProposals = proposalsData?.proposals?.filter((proposal: Proposal) => {
    if (!searchQuery) return true;
    return proposal.id.includes(searchQuery) || 
           proposal.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Fetch more functions for infinite scroll
  const handleFetchMoreVotes = async () => {
    if (isFetchingMoreVotes) return; // Prevent multiple simultaneous fetches
    
    setIsFetchingMoreVotes(true);
    try {
      await fetchMoreVotes({
        variables: {
          first: LOAD_MORE_VOTES,
          skip: votesData?.votes?.length || 0
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult || !fetchMoreResult.votes.length) {
            setHasMoreVotes(false);
            return prev;
          }
          
          if (fetchMoreResult.votes.length < LOAD_MORE_VOTES) {
            setHasMoreVotes(false);
          }

          // Deduplicate votes by ID to prevent duplicate keys
          const existingVoteIds = new Set(prev.votes.map((vote: Vote) => vote.id));
          const newVotes = fetchMoreResult.votes.filter((vote: Vote) => !existingVoteIds.has(vote.id));

          return {
            ...prev,
            votes: [...prev.votes, ...newVotes]
          };
        }
      });
    } catch {
      // Error fetching more votes
      setHasMoreVotes(false);
    } finally {
      setIsFetchingMoreVotes(false);
    }
  };

  const handleFetchMoreProposals = async () => {
    if (isFetchingMoreProposals) return; // Prevent multiple simultaneous fetches
    
    setIsFetchingMoreProposals(true);
    try {
      await fetchMoreProposals({
        variables: {
          first: LOAD_MORE_PROPOSALS,
          skip: proposalsData?.proposals?.length || 0
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult || !fetchMoreResult.proposals.length) {
            setHasMoreProposals(false);
            return prev;
          }
          
          if (fetchMoreResult.proposals.length < LOAD_MORE_PROPOSALS) {
            setHasMoreProposals(false);
          }

          // Deduplicate proposals by ID to prevent duplicate keys
          const existingProposalIds = new Set(prev.proposals.map((proposal: Proposal) => proposal.id));
          const newProposals = fetchMoreResult.proposals.filter((proposal: Proposal) => !existingProposalIds.has(proposal.id));

          return {
            ...prev,
            proposals: [...prev.proposals, ...newProposals]
          };
        }
      });
    } catch {
      // Error fetching more proposals
      setHasMoreProposals(false);
    } finally {
      setIsFetchingMoreProposals(false);
    }
  };

  // Infinite scroll hooks
  useInfiniteScroll(
    votesContainerRef as RefObject<HTMLElement | null>,
    handleFetchMoreVotes,
    {
      hasMore: hasMoreVotes,
      loading: isFetchingMoreVotes
    }
  );

  useInfiniteScroll(
    proposalsContainerRef as RefObject<HTMLElement | null>,
    handleFetchMoreProposals,
    {
      hasMore: hasMoreProposals,
      loading: isFetchingMoreProposals
    }
  );

  if (proposalsLoading || votesLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.column}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Recent Voter Feedback</h3>
            <div className={styles.feedbackList}>
              {Array(5).fill(0).map((_, i) => (
                <React.Fragment key={`loading-vote-${i}`}>
                  {renderLoadingVote()}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.column}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Recent Proposals</h3>
            <div className={styles.searchContainer}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by proposal number..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className={styles.searchButton} onClick={() => handleSearch()}>
                Search
              </button>
            </div>
            <div className={styles.proposalsList}>
              {Array(3).fill(0).map((_, i) => (
                <React.Fragment key={`loading-proposal-${i}`}>
                  {renderLoadingProposal()}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (proposalsError || votesError) return <div>Error loading proposals</div>;

  // Filter out votes with 0 weight that have no reason (noise reduction)
  const votes = (votesData?.votes || []).filter((vote: Vote) => {
    // Keep votes with weight > 0
    if (parseInt(vote.votes) > 0) return true;
    
    // For votes with 0 weight, only keep if they have a meaningful reason
    return vote.reason && vote.reason.trim().length > 0;
  });

  const recentProposals = filteredProposals || [];

  return (
    <div className={styles.container}>
      <div className={styles.column}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recent Voter Feedback</h3>
          <div className={styles.feedbackList} ref={votesContainerRef}>
            {votesLoading ? (
              Array(5).fill(0).map((_, i) => (
                <React.Fragment key={`loading-vote-${i}`}>
                  {renderLoadingVote()}
                </React.Fragment>
              ))
            ) : votes.length ? (
              <>
                {votes.map((vote: Vote) => (
                  <div 
                    key={vote.id} 
                    className={styles.feedbackItem}
                    onClick={() => onProposalClick(vote.proposal.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.voteHeader}>
                      <AddressAvatar address={vote.voter.id} />
                      <span className={styles.comment}>
                        Voted {getSupportText(vote.supportDetailed)} with {vote.votes} votes on Proposal #{vote.proposal.id}
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
                {isFetchingMoreVotes && (
                  <div className={styles.loadingMore}>
                    <div className={styles.loadingIndicator}>Loading more votes...</div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>No recent votes</div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.column}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recent Proposals</h3>
          <div className={styles.searchContainer}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by proposal number..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className={styles.searchButton} onClick={() => handleSearch()}>
              Search
            </button>
          </div>
          <div className={styles.proposalsList} ref={proposalsContainerRef}>
            {proposalsLoading ? (
              Array(3).fill(0).map((_, i) => (
                <React.Fragment key={`loading-proposal-${i}`}>
                  {renderLoadingProposal()}
                </React.Fragment>
              ))
            ) : recentProposals?.length ? (
              <>
                {recentProposals.map((proposal: Proposal) => {
                const realStatus = getRealProposalStatus(proposal, currentBlock);
                return (
                  <div 
                    key={proposal.id} 
                    className={styles.proposalItem}
                    onClick={() => onProposalClick(proposal.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.proposalHeader}>
                      <span className={styles.proposalId}>Proposal #{proposal.id}</span>
                      <div className={styles.proposalActions}>
                        {canEditProposal(proposal) && (
                          <button
                            className={styles.editButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditProposal!(proposal.id);
                            }}
                            title="Edit proposal"
                          >
                            ✏️ Edit
                          </button>
                        )}
                        <span className={`${styles.status} ${styles[realStatus.toLowerCase()]}`}>
                          {realStatus}
                        </span>
                      </div>
                    </div>
                    <span className={styles.title}>{proposal.title}</span>
                    <div className={styles.proposerInfo}>
                      <span>Proposed by </span>
                      <AddressAvatar address={proposal.proposer.id} size={16} />
                    </div>
                    <div className={styles.votingProgress}>
                      <div 
                        className={styles.quorumMarker} 
                        style={{ 
                          left: `${calculateQuorumPosition(proposal)}%` 
                        }}
                      >
                        {formatVoteCount(proposal.quorumVotes)}
                      </div>
                      <div className={styles.progressBar}>
                        {(() => {
                          const percentages = calculateVotePercentages(proposal);
                          
                          return (
                            <>
                              <div 
                                className={`${styles.progressFill} ${styles.forVotes}`}
                                style={{ width: `${percentages.for}%` }}
                              />
                              <div 
                                className={`${styles.progressFill} ${styles.againstVotes}`}
                                style={{ 
                                  width: `${percentages.against}%`,
                                  left: `${percentages.for}%`
                                }}
                              />
                              <div 
                                className={`${styles.progressFill} ${styles.abstainVotes}`}
                                style={{ 
                                  width: `${percentages.abstain}%`,
                                  left: `${percentages.for + percentages.against}%`
                                }}
                              />
                            </>
                          );
                        })()}
                        <div 
                          className={styles.quorumLine}
                          style={{ 
                            left: `${calculateQuorumPosition(proposal)}%` 
                          }}
                        />
                      </div>
                      <div className={styles.voteStats}>
                        <span className={styles.votes}>
                          <span className={styles.voteLabel}>For:</span> {formatVoteCount(proposal.forVotes)}
                        </span>
                        <span className={styles.votes}>
                          <span className={styles.voteLabel}>Against:</span> {formatVoteCount(proposal.againstVotes)}
                        </span>
                        <span className={styles.votes}>
                          <span className={styles.voteLabel}>Abstain:</span> {formatVoteCount(proposal.abstainVotes)}
                        </span>
                      </div>
                    </div>
                    <div className={styles.proposalFooter}>
                      <span className={styles.timestamp}>
                        {formatTimestamp(proposal.createdTimestamp)}
                      </span>
                      <span className={styles.blocks}>
                        Voting Period: {formatDateTime(getBlockTimestamp(proposal, proposal.startBlock))} - {formatDateTime(getBlockTimestamp(proposal, proposal.endBlock))}
                      </span>
                      {proposal.executionETA && (
                        <span className={styles.execution}>
                          Execution: {formatTimestamp(proposal.executionETA)}
                        </span>
                      )}
                    </div>
                  </div>
                );
                })}
                {isFetchingMoreProposals && (
                  <div className={styles.loadingMore}>
                    <div className={styles.loadingIndicator}>Loading more proposals...</div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>No active proposals</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 