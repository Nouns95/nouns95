import React, { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import styles from './ProposalsList.module.css';
import { AddressAvatar } from '../Common/AddressAvatar';
import { MarkdownReason } from './MarkdownReason';
import { providers } from 'ethers';

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

const PROPOSALS_TO_SHOW = 10;
const VOTES_TO_SHOW = 15;

const RECENT_VOTES_QUERY = gql`
  query RecentVotes($first: Int!) {
    votes(
      first: $first,
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

export function ProposalsList({ onProposalClick }: ProposalsListProps) {
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Update the effect to use the new provider
  useEffect(() => {
    const fetchCurrentBlock = async () => {
      try {
        const provider = getProvider();
        const block = await provider.getBlockNumber();
        setCurrentBlock(block);
      } catch (error) {
        console.warn('Error fetching current block:', error);
        // Don't update currentBlock if there's an error
        // The existing value will be used
      }
    };

    fetchCurrentBlock();
    const interval = setInterval(fetchCurrentBlock, 30000);

    return () => clearInterval(interval);
  }, []);

  const { loading: proposalsLoading, error: proposalsError, data: proposalsData } = useQuery(ACTIVE_PROPOSALS_QUERY, {
    variables: {
      first: PROPOSALS_TO_SHOW,
      skip: 0
    },
    pollInterval: 30000,
  });

  const { loading: votesLoading, error: votesError, data: votesData } = useQuery(RECENT_VOTES_QUERY, {
    variables: { first: 1000 }
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

  const votes = votesData?.votes || [];

  const recentProposals = filteredProposals?.slice(0, PROPOSALS_TO_SHOW) || [];

  return (
    <div className={styles.container}>
      <div className={styles.column}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recent Voter Feedback</h3>
          <div className={styles.feedbackList}>
            {votesLoading ? (
              Array(5).fill(0).map((_, i) => (
                <React.Fragment key={`loading-vote-${i}`}>
                  {renderLoadingVote()}
                </React.Fragment>
              ))
            ) : votes.length ? (
              votes.slice(0, VOTES_TO_SHOW).map((vote: Vote) => (
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
              ))
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
          <div className={styles.proposalsList}>
            {proposalsLoading ? (
              Array(3).fill(0).map((_, i) => (
                <React.Fragment key={`loading-proposal-${i}`}>
                  {renderLoadingProposal()}
                </React.Fragment>
              ))
            ) : recentProposals?.length ? (
              recentProposals.map((proposal: Proposal) => {
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
                      <span className={`${styles.status} ${styles[realStatus.toLowerCase()]}`}>
                        {realStatus}
                      </span>
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
              })
            ) : (
              <div className={styles.emptyState}>No active proposals</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 