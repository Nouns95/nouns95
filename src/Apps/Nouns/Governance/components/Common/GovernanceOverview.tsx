import { useQuery } from '@apollo/client';
import { GOVERNANCE_OVERVIEW_QUERY, ACTIVE_PROPOSALS_QUERY } from '../../../domain/graphql/queries/governance';
import type { GovernanceOverviewData } from '../../../domain/graphql/queries/governance';
import styles from './GovernanceOverview.module.css';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface ProposalData {
  proposals: Array<{
    id: string;
    proposalThreshold: string;
    quorumVotes: string;
    minQuorumVotesBPS: string;
    maxQuorumVotesBPS: string;
    totalSupply: string;
    adjustedTotalSupply: string;
    status: string;
    forVotes: string;
    againstVotes: string;
    abstainVotes: string;
    startBlock: string;
    endBlock: string;
    createdBlock: string;
    createdTimestamp: string;
    executionETA: string;
    title: string;
    description: string;
  }>;
}

// Helper function to determine if a proposal is truly active
const isProposalActive = (proposal: ProposalData['proposals'][0], currentBlock: number) => {
  if (proposal.status !== 'ACTIVE') return false;

  // If we're past the end block
  if (currentBlock > parseInt(proposal.endBlock)) {
    const forVotes = parseInt(proposal.forVotes);
    const againstVotes = parseInt(proposal.againstVotes);
    const quorumVotes = parseInt(proposal.quorumVotes);

    // Check defeat conditions:
    // 1. Didn't reach quorum
    // 2. More against votes than for votes
    if (forVotes < quorumVotes || againstVotes >= forVotes) {
      return false;
    }
  }

  return true;
};

export function GovernanceOverview() {
  const [currentBlock, setCurrentBlock] = useState<number>(0);

  // Add effect to fetch current block
  useEffect(() => {
    const fetchCurrentBlock = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const block = await provider.getBlockNumber();
        setCurrentBlock(block);
      } catch (error) {
        console.error('Error fetching current block:', error);
      }
    };

    fetchCurrentBlock();
    const interval = setInterval(fetchCurrentBlock, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const { data: govData, loading: govLoading, error: govError } = useQuery<GovernanceOverviewData>(
    GOVERNANCE_OVERVIEW_QUERY,
    {
      pollInterval: 30000,
      fetchPolicy: 'cache-and-network'
    }
  );

  const { data: proposalData, loading: proposalLoading } = useQuery<ProposalData>(
    ACTIVE_PROPOSALS_QUERY,
    {
      pollInterval: 30000,
      fetchPolicy: 'cache-and-network'
    }
  );

  const loading = govLoading || proposalLoading;
  const error = govError;
  const governance = govData?.governance;
  const quorumParams = govData?.dynamicQuorumParams;
  const latestProposal = proposalData?.proposals?.[0];

  // Calculate truly active proposals
  const activeProposals = proposalData?.proposals?.filter(
    proposal => isProposalActive(proposal, currentBlock)
  ).length || 0;

  const calculateVotesFromBPS = (bps: number, supply: string) => {
    const supplyNum = Number(supply);
    return Math.floor((supplyNum * bps) / 10000);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Governance Overview</h2>
        <div className={`${styles.content} ${styles.loading}`}>
          Loading...
        </div>
      </div>
    );
  }

  if (error || !governance) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Governance Overview</h2>
        <div className={styles.error}>
          Failed to load governance data
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Governance Overview</h2>
      <div className={styles.parameters}>
        <div className={styles.section}>
          <div className={styles.parameter}>
            <span className={styles.label}>Total Proposals</span>
            <span className={styles.value}>{governance.proposals}</span>
          </div>
          <div className={styles.parameter}>
            <span className={styles.label}>Active</span>
            <span className={styles.value}>{activeProposals}</span>
          </div>
          {latestProposal && (
            <div className={styles.parameter}>
              <span className={styles.label}>Current Threshold</span>
              <span className={styles.value}>3</span>
            </div>
          )}
        </div>

        {quorumParams && latestProposal && (
          <div className={styles.section}>
            <div className={styles.parameter}>
              <span className={styles.label}>Min Quorum</span>
              <span className={styles.value}>
                {calculateVotesFromBPS(quorumParams.minQuorumVotesBPS, latestProposal.adjustedTotalSupply)}
              </span>
            </div>
            <div className={styles.parameter}>
              <span className={styles.label}>Max Quorum</span>
              <span className={styles.value}>
                {calculateVotesFromBPS(quorumParams.maxQuorumVotesBPS, latestProposal.adjustedTotalSupply)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 