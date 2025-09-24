import React, { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import styles from './ProposalDetails.module.css';
import { MarkdownReason } from '../components/MarkdownReason';
import { AddressAvatar } from '../../Common/AddressAvatar';
import { VoteHistory } from './VoteHistory';
import { VoteForm } from './VoteForm';
import { getContractName, decodeCalldata, formatTokenAmount } from '../../../../domain/constants/contracts';

const PROPOSAL_QUERY = gql`
  query ProposalDetails($id: String!) {
    proposal(id: $id) {
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
      startBlock
      endBlock
      executionETA
      totalSupply
      createdBlock
      createdTransactionHash
      canceledTransactionHash
      executedTransactionHash
      vetoedTransactionHash
      queuedTransactionHash
      targets
      values
      signatures
      calldatas
    }
  }
`;

const calculateVotePercentages = (forVotes: string, againstVotes: string, abstainVotes: string, quorumVotes: string) => {
  const forNum = parseInt(forVotes);
  const againstNum = parseInt(againstVotes);
  const abstainNum = parseInt(abstainVotes);
  const quorumNum = parseInt(quorumVotes);
  const totalVotes = forNum + againstNum + abstainNum;
  
  if (totalVotes === 0) return { for: 0, against: 0, abstain: 0 };
  
  // If we haven't met quorum, scale all bars relative to quorum
  if (totalVotes < quorumNum) {
    return {
      for: (forNum / quorumNum) * 75, // Scale to 75% max width when below quorum
      against: (againstNum / quorumNum) * 75,
      abstain: (abstainNum / quorumNum) * 75
    };
  }
  
  // If we've met quorum, show proportions of total votes
  return {
    for: (forNum / totalVotes) * 100,
    against: (againstNum / totalVotes) * 100,
    abstain: (abstainNum / totalVotes) * 100
  };
};

const calculateQuorumPosition = (forVotes: string, againstVotes: string, abstainVotes: string, quorumVotes: string) => {
  const forNum = parseInt(forVotes);
  const againstNum = parseInt(againstVotes);
  const abstainNum = parseInt(abstainVotes);
  const quorumNum = parseInt(quorumVotes);
  const totalVotes = forNum + againstNum + abstainNum;

  // If no votes, position at 75% of the bar
  if (totalVotes === 0) return 75;

  // If votes exceed quorum, position the line proportionally
  if (totalVotes >= quorumNum) {
    // Calculate what percentage of the total votes the quorum represents
    const quorumPercent = (quorumNum / totalVotes) * 100;
    // Position the line at that percentage point
    return Math.min(Math.max(quorumPercent, 30), 75);
  }

  // If votes are less than quorum, fix at 75%
  return 75;
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

interface DecodedCall {
  loading: boolean;
  error?: string;
  value?: string;
}

interface ProposalDetailsProps {
  id: string;
  onBackToList: () => void;
  onEditProposal?: (proposalId: string) => void;
}

export default function ProposalDetails({ id, onBackToList, onEditProposal }: ProposalDetailsProps) {
  const { address } = useAccount();
  const [ensNames, setEnsNames] = useState<Record<string, string>>({});
  const [decodedCalls, setDecodedCalls] = useState<Record<string, DecodedCall>>({});
  const { data, loading, error } = useQuery(PROPOSAL_QUERY, {
    variables: { id },
    pollInterval: 30000,
  });

  useEffect(() => {
    const resolveEnsNames = async () => {
      if (!data?.proposal?.targets) return;

      const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const unresolvedTargets = data.proposal.targets.filter((target: string) => {
        const contractName = getContractName(target);
        return contractName === target; // Only resolve if it's not a known contract
      });

      const resolvedNames: Record<string, string> = {};
      await Promise.all(
        unresolvedTargets.map(async (target: string) => {
          try {
            const name = await provider.lookupAddress(target);
            if (name) {
              resolvedNames[target.toLowerCase()] = name;
            }
          } catch (error) {
            console.warn('Error resolving ENS name:', error);
          }
        })
      );

      setEnsNames(resolvedNames);
    };

    resolveEnsNames();
  }, [data?.proposal?.targets]);

  useEffect(() => {
    const decodeFunctionCalls = async () => {
      if (!data?.proposal?.signatures || !data?.proposal?.calldatas) return;

      // Initialize loading states
      const initialLoadingState: Record<string, DecodedCall> = {};
      data.proposal.signatures.forEach((_: string, index: number) => {
        initialLoadingState[`${index}`] = { loading: true };
      });
      setDecodedCalls(initialLoadingState);

      try {
        // Create a single provider instance
        const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);

        // Decode all calls in parallel
        const decodedResults = await Promise.all(
          data.proposal.signatures.map(async (signature: string, index: number) => {
            try {
              const target = data.proposal.targets[index];
              const contractName = getContractName(target);
              const decodedCall = await decodeCalldata(
                signature, 
                data.proposal.calldatas[index], 
                contractName,
                provider
              );
              return { index, result: { loading: false, value: decodedCall } };
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Failed to decode';
              return { index, result: { loading: false, error: errorMessage } };
            }
          })
        );

        // Update all results at once
        const newDecodedCalls = decodedResults.reduce((acc: Record<string, DecodedCall>, { index, result }) => {
          acc[`${index}`] = result;
          return acc;
        }, {});

        setDecodedCalls(newDecodedCalls);
      } catch (err) {
        console.error('Error decoding function calls:', err);
        // Set error state for all calls
        const errorState = data.proposal.signatures.reduce((acc: Record<string, DecodedCall>, _: string, index: number) => {
          acc[`${index}`] = { loading: false, error: 'Failed to decode calls' };
          return acc;
        }, {});
        setDecodedCalls(errorState);
      }
    };

    decodeFunctionCalls();
  }, [data?.proposal?.signatures, data?.proposal?.calldatas, data?.proposal?.targets]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error || !data?.proposal) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error ? 'Error loading proposal' : 'Proposal not found'}
        </div>
      </div>
    );
  }

  const { proposal } = data;

  const canEdit = () => {
    if (!address || !onEditProposal) return false;
    
    // Only proposer can edit
    if (proposal.proposer.id.toLowerCase() !== address.toLowerCase()) return false;
    
    // Can only edit proposals that are still active (voting not ended)
    return proposal.status === 'ACTIVE' || proposal.status === 'PENDING';
  };

  const getTargetDisplay = (target: string) => {
    const contractName = getContractName(target);
    if (contractName !== target) {
      return contractName; // It's a known Nouns contract
    }
    
    const ensName = ensNames[target.toLowerCase()];
    if (ensName) {
      return ensName; // It has an ENS name
    }
    
    return `${target.slice(0, 6)}...${target.slice(-4)}`; // Fallback to shortened address
  };

  return (
    <div className={styles.container}>
      <div className={styles.proposalDetails}>
        <div className={styles.headerActions}>
          <button className={styles.backButton} onClick={onBackToList}>
            ← Back to Proposals
          </button>
          {canEdit() && (
            <button 
              className={styles.editButton} 
              onClick={() => onEditProposal!(id)}
            >
              ✏️ Edit Proposal
            </button>
          )}
        </div>
        <div className={styles.proposalContent}>
          <div className={styles.mainContent}>
            <div className={styles.header}>
              <h2 className={styles.proposalTitle}>
                Proposal #{proposal.id}: {proposal.title}
              </h2>
              <div className={styles.proposerInfo}>
                <div className={styles.proposerLeft}>
                  <span>Proposed by </span>
                  <AddressAvatar address={proposal.proposer.id} size={16} />
                </div>
                <div className={styles.proposerRight}>
                  <span>Created: </span>
                  <a 
                    href={`https://etherscan.io/tx/${proposal.createdTransactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.transactionLink}
                    title={proposal.createdTransactionHash}
                  >
                    {new Date(parseInt(proposal.createdTimestamp) * 1000).toLocaleString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </a>
                </div>
              </div>
              <div className={styles.transactionHistory}>
                <h3 className={styles.sectionTitle}>Transaction Details</h3>
                <div className={styles.transactionContent}>
                  {proposal.queuedTransactionHash && (
                    <div className={styles.transactionItem}>
                      <span className={styles.transactionLabel}>Queued: </span>
                      <a 
                        href={`https://etherscan.io/tx/${proposal.queuedTransactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.transactionLink}
                      >
                        {proposal.queuedTransactionHash.slice(0, 6)}...{proposal.queuedTransactionHash.slice(-4)}
                      </a>
                    </div>
                  )}
                  {proposal.executedTransactionHash && (
                    <div className={styles.transactionItem}>
                      <span className={styles.transactionLabel}>Executed: </span>
                      <a 
                        href={`https://etherscan.io/tx/${proposal.executedTransactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.transactionLink}
                      >
                        {proposal.executedTransactionHash.slice(0, 6)}...{proposal.executedTransactionHash.slice(-4)}
                      </a>
                    </div>
                  )}
                  {proposal.canceledTransactionHash && (
                    <div className={styles.transactionItem}>
                      <span className={styles.transactionLabel}>Canceled: </span>
                      <a 
                        href={`https://etherscan.io/tx/${proposal.canceledTransactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.transactionLink}
                      >
                        {proposal.canceledTransactionHash.slice(0, 6)}...{proposal.canceledTransactionHash.slice(-4)}
                      </a>
                    </div>
                  )}
                  {proposal.vetoedTransactionHash && (
                    <div className={styles.transactionItem}>
                      <span className={styles.transactionLabel}>Vetoed: </span>
                      <a 
                        href={`https://etherscan.io/tx/${proposal.vetoedTransactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.transactionLink}
                      >
                        {proposal.vetoedTransactionHash.slice(0, 6)}...{proposal.vetoedTransactionHash.slice(-4)}
                      </a>
                    </div>
                  )}

                  <div className={styles.technicalDetails}>
                    <div className={styles.transactionItem}>
                      <span className={styles.transactionLabel}>Targets:</span>
                      <div className={styles.transactionValue}>
                        {proposal.targets.map((target: string, index: number) => {
                          const displayName = getTargetDisplay(target);
                          return (
                            <div key={index} className={styles.multiValueItem}>
                              <span className={styles.multiValueIndex}>#{index + 1}</span>
                              <a
                                href={`https://etherscan.io/address/${target}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.transactionLink}
                                title={target}
                              >
                                {displayName}
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className={styles.transactionItem}>
                      <span className={styles.transactionLabel}>Values:</span>
                      <div className={styles.transactionValue}>
                        {proposal.values.map((value: string, index: number) => (
                          <div key={index} className={styles.multiValueItem}>
                            <span className={styles.multiValueIndex}>#{index + 1}</span>
                            {formatTokenAmount(BigInt(value), 18, 'ETH')}
                          </div>
                        ))}
                      </div>
                    </div>

                    {proposal.signatures.some((sig: string) => sig) && (
                      <div className={styles.transactionItem}>
                        <span className={styles.transactionLabel}>Signatures:</span>
                        <div className={styles.transactionValue}>
                          {proposal.signatures.map((signature: string, index: number) => (
                            <div key={index} className={styles.multiValueItem}>
                              <span className={styles.multiValueIndex}>#{index + 1}</span>
                              {signature || 'No signature (fallback function)'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {proposal.signatures.some((sig: string) => sig) || proposal.calldatas.some((data: string) => data !== '0x') ? (
                      <div className={styles.transactionItem}>
                        <span className={styles.transactionLabel}>Function Calls:</span>
                        <div className={styles.transactionValue}>
                          {proposal.signatures.map((signature: string, index: number) => {
                            // Only show if there's a signature or meaningful calldata
                            if (signature || proposal.calldatas[index] !== '0x') {
                              const decodedCall = decodedCalls[index];
                              return (
                                <div key={index} className={styles.multiValueItem}>
                                  <span className={styles.multiValueIndex}>#{index + 1}</span>
                                  {decodedCall?.loading ? (
                                    <span className={styles.loading}>Decoding...</span>
                                  ) : decodedCall?.error ? (
                                    <span className={styles.error}>{decodedCall.error}</span>
                                  ) : (
                                    decodedCall?.value || 'Unknown function call'
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.description}>
              <MarkdownReason content={proposal.description} />
            </div>
          </div>

          <div className={styles.sideContent}>
            <VoteForm 
              proposalId={proposal.id} 
              startBlock={proposal.startBlock}
              endBlock={proposal.endBlock}
            />

            <div className={styles.quorumProgress}>
              <h3 className={styles.sectionTitle}>Quorum Progress</h3>
              <div className={styles.votingProgress}>
                <div 
                  className={styles.quorumMarker} 
                  style={{ 
                    left: `${calculateQuorumPosition(
                      proposal.forVotes,
                      proposal.againstVotes,
                      proposal.abstainVotes,
                      proposal.quorumVotes
                    )}%` 
                  }}
                >
                  {formatVoteCount(proposal.quorumVotes)}
                </div>
                <div className={styles.progressBar}>
                  {(() => {
                    const percentages = calculateVotePercentages(
                      proposal.forVotes,
                      proposal.againstVotes,
                      proposal.abstainVotes,
                      proposal.quorumVotes
                    );
                    
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
            </div>

            <VoteHistory proposalId={proposal.id} />
          </div>
        </div>
      </div>
    </div>
  );
}