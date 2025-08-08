import { gql } from '@apollo/client';
import type { ProposalsQueryResponse } from '../../types/graphql';

export const GOVERNANCE_OVERVIEW_QUERY = gql`
  query GovernanceOverview {
    governance(id: "GOVERNANCE") {
      id
      proposals
      proposalsQueued
      voteSnapshotBlockSwitchProposalId
      candidates
    }
    dynamicQuorumParams(id: "LATEST") {
      id
      minQuorumVotesBPS
      maxQuorumVotesBPS
      quorumCoefficient
      dynamicQuorumStartBlock
    }
  }
`;

export interface GovernanceOverviewData {
  governance: {
    id: string;
    proposals: string;
    proposalsQueued: string;
    voteSnapshotBlockSwitchProposalId: string;
    candidates: string;
  };
  dynamicQuorumParams: {
    id: string;
    minQuorumVotesBPS: number;
    maxQuorumVotesBPS: number;
    quorumCoefficient: string;
    dynamicQuorumStartBlock: string;
  };
}

export const ACTIVE_PROPOSALS_QUERY = gql`
  query ActiveProposals {
    proposals(
      first: 1000,
      orderBy: createdBlock,
      orderDirection: desc,
      where: { status: "ACTIVE" }
    ) {
      id
      proposalThreshold
      quorumVotes
      minQuorumVotesBPS
      maxQuorumVotesBPS
      totalSupply
      adjustedTotalSupply
      status
      forVotes
      againstVotes
      abstainVotes
      startBlock
      endBlock
      createdBlock
      createdTimestamp
      executionETA
      title
      description
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

export const PROPOSAL_DETAIL_QUERY = gql`
  query ProposalDetail($proposalId: String!) {
    proposal(id: $proposalId) {
      id
      title
      description
      status
      proposer {
        id
      }
      targets
      values
      signatures
      calldatas
      createdTimestamp
      startBlock
      endBlock
      executionETA
      quorumVotes
      forVotes
      againstVotes
      abstainVotes
      totalSupply
      createdBlock
      updatePeriodEndBlock
    }
  }
`;

export type ProposalDetailQuery = {
  data: {
    proposal: {
      id: string;
      title: string;
      description: string;
      status: string;
      proposer: {
        id: string;
      };
      targets: string[];
      values: string[];
      signatures: string[];
      calldatas: string[];
      createdTimestamp: string;
      startBlock: string;
      endBlock: string;
      executionETA: string | null;
      quorumVotes: string;
      forVotes: string;
      againstVotes: string;
      abstainVotes: string;
      totalSupply: string;
      createdBlock: string;
      updatePeriodEndBlock?: string;
    };
  };
  variables: {
    proposalId: string;
  };
}; 