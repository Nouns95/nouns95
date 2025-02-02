import { gql } from '@apollo/client';
import type { ProposalsQueryResponse } from '../../types/graphql';

export const ACTIVE_PROPOSALS_QUERY = gql`
  query ActiveProposals {
    proposals(
      where: { status_in: ["ACTIVE", "PENDING"] }
      orderBy: createdBlock
      orderDirection: desc
    ) {
      id
      proposer {
        id
        delegatedVotes
        tokenHoldersRepresentedAmount
      }
      signers {
        id
        delegatedVotes
      }
      targets
      values
      signatures
      calldatas
      createdTimestamp
      createdBlock
      lastUpdatedTimestamp
      lastUpdatedBlock
      createdTransactionHash
      lastUpdatedTransactionHash
      startBlock
      endBlock
      proposalThreshold
      quorumVotes
      forVotes
      againstVotes
      abstainVotes
      title
      description
      status
      executionETA
      totalSupply
      adjustedTotalSupply
      minQuorumVotesBPS
      maxQuorumVotesBPS
      quorumCoefficient
      objectionPeriodEndBlock
      updatePeriodEndBlock
      onTimelockV1
      voteSnapshotBlock
      clientId
      votes(orderBy: blockNumber, orderDirection: desc) {
        id
        support
        votes
        voter {
          id
        }
        blockNumber
      }
      feedbackPosts(orderBy: createdTimestamp, orderDirection: desc) {
        id
        supportType
        createdTimestamp
      }
    }
  }
`;

export type ActiveProposalsQuery = {
  data: ProposalsQueryResponse;
};

export const PROPOSAL_HISTORY_QUERY = gql`
  query ProposalHistory($first: Int = 10, $skip: Int = 0) {
    proposals(
      first: $first
      skip: $skip
      orderBy: createdBlock
      orderDirection: desc
      where: { status_in: ["EXECUTED", "DEFEATED", "VETOED", "QUEUED", "CANCELLED"] }
    ) {
      id
      proposer {
        id
        delegatedVotes
      }
      createdTimestamp
      createdBlock
      startBlock
      endBlock
      title
      description
      status
      forVotes
      againstVotes
      abstainVotes
      quorumVotes
      executionETA
      totalSupply
      minQuorumVotesBPS
      maxQuorumVotesBPS
      clientId
      votes(orderBy: votes, orderDirection: desc, first: 10) {
        id
        support
        votes
        voter {
          id
        }
      }
    }
  }
`;

export type ProposalHistoryQuery = {
  data: ProposalsQueryResponse;
  variables: {
    first?: number;
    skip?: number;
  };
};

export const PROPOSAL_VOTES_QUERY = gql`
  query ProposalVotes($proposalId: String!) {
    votes(
      where: { proposal: $proposalId }
      orderBy: blockNumber
      orderDirection: desc
    ) {
      id
      voter {
        id
        delegatedVotes
      }
      support
      votes
      blockNumber
    }
  }
`;

export type ProposalVotesQuery = {
  data: {
    votes: Array<{
      id: string;
      voter: {
        id: string;
        delegatedVotes: string;
      };
      support: boolean;
      votes: string;
      blockNumber: string;
    }>;
  };
  variables: {
    proposalId: string;
  };
}; 