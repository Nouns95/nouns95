import { gql } from '@apollo/client';
import type { 
  ProposalCandidateQueryResponse,
  ProposalCandidatesQueryResponse,
  ProposalCandidateQueryVariables,
  ProposalCandidatesQueryVariables,
  CandidateFeedbacksQueryResponse,
} from '../../types/graphql';

export const PROPOSAL_CANDIDATES_QUERY = gql`
  query ProposalCandidates($first: Int = 100, $skip: Int = 0) {
    proposalCandidates(
      first: $first
      skip: $skip
      orderBy: createdTimestamp
      orderDirection: desc
    ) {
      id
      proposer
      slug
      createdTransactionHash
      createdTimestamp
      createdBlock
      lastUpdatedTimestamp
      lastUpdatedBlock
      canceled
      canceledTimestamp
      canceledBlock
      canceledTransactionHash
      number
      latestVersion {
        id
        createdTimestamp
        createdBlock
        content
        title
        description
        targets
        values
        signatures
        calldatas
      }
    }
  }
`;

export const PROPOSAL_CANDIDATE_QUERY = gql`
  query ProposalCandidate($id: ID!) {
    proposalCandidate(id: $id) {
      id
      proposer
      slug
      createdTransactionHash
      createdTimestamp
      createdBlock
      lastUpdatedTimestamp
      lastUpdatedBlock
      canceled
      canceledTimestamp
      canceledBlock
      canceledTransactionHash
      number
      latestVersion {
        id
        createdTimestamp
        createdBlock
        content
        title
        description
        targets
        values
        signatures
        calldatas
      }
      versions(orderBy: createdTimestamp, orderDirection: desc) {
        id
        createdTimestamp
        createdBlock
        content
        title
        description
        targets
        values
        signatures
        calldatas
      }
    }
  }
`;

export const CANDIDATE_FEEDBACK_QUERY = gql`
  query CandidateFeedback($candidateId: String!, $first: Int = 100) {
    candidateFeedbacks(
      where: { candidate: $candidateId }
      first: $first
      orderBy: createdTimestamp
      orderDirection: desc
    ) {
      id
      createdTimestamp
      createdBlock
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

export type ProposalCandidatesQuery = {
  data: ProposalCandidatesQueryResponse;
  variables: ProposalCandidatesQueryVariables;
};

export type ProposalCandidateQuery = {
  data: ProposalCandidateQueryResponse;
  variables: ProposalCandidateQueryVariables;
};

export type CandidateFeedbackQuery = {
  data: CandidateFeedbacksQueryResponse;
  variables: {
    candidateId: string;
    first?: number;
  };
}; 