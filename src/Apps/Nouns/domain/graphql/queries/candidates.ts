import { gql } from '@apollo/client';

// Base Types
export interface ProposalCandidateVersion {
  id: string;
  createdTimestamp: string;
  createdBlock: string;
  content?: string | null;
}

export interface ProposalCandidateContent {
  id: string;
  proposer: string;
  targets: string[];
  values: string[];
  signatures: string[];
  calldatas: string[];
  description: string;
  proposalIdToUpdate: string;
  title: string;
  encodedProposalHash: string;
  matchingProposalIds: string[];
  contentSignatures: ProposalCandidateSignature[];
}

export interface ProposalCandidateSignature {
  id: string;
  signer: string;
  sig: string;
  expirationTimestamp: string;
  reason: string | null;
}

export interface CandidateFeedback {
  id: string;
  createdTimestamp: string;
  createdBlock: string;
  candidate: ProposalCandidate;
  voter: {
    id: string;
    delegatedVotes: string;
  };
  supportDetailed: number;
  votes: string;
  reason: string | null;
}

export interface ProposalCandidate {
  id: string;
  proposer: string;
  slug: string;
  createdTransactionHash: string;
  createdTimestamp: string;
  createdBlock: string;
  lastUpdatedTimestamp: string;
  lastUpdatedBlock: string;
  canceled: boolean;
  canceledTimestamp: string | null;
  canceledBlock: string | null;
  canceledTransactionHash: string | null;
  number: string;
  latestVersion: ProposalCandidateVersion;
  versions: ProposalCandidateVersion[];
}

// Query Variables Types
export interface ProposalCandidateQueryVariables {
  id: string;
}

export interface ProposalCandidatesQueryVariables {
  first?: number;
  skip?: number;
}

export interface ProposalCandidateContentQueryVariables {
  id: string;
}

export interface CandidateFeedbackQueryVariables {
  candidateId: string;
  first?: number;
}

// Query Response Types
export interface ProposalCandidateQueryResponse {
  proposalCandidate: ProposalCandidate;
}

export interface ProposalCandidatesQueryResponse {
  proposalCandidates: ProposalCandidate[];
}

export interface ProposalCandidateContentQueryResponse {
  proposalCandidateContent: ProposalCandidateContent;
}

export interface CandidateFeedbackQueryResponse {
  candidateFeedbacks: CandidateFeedback[];
}

// Main Queries
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
      }
      versions(orderBy: createdTimestamp, orderDirection: desc) {
        id
        createdTimestamp
        createdBlock
        content
      }
    }
  }
`;

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
      }
    }
  }
`;

export const PROPOSAL_CANDIDATE_CONTENT_QUERY = gql`
  query ProposalCandidateContent($id: ID!) {
    proposalCandidateContent(id: $id) {
      id
      proposer
      targets
      values
      signatures
      calldatas
      description
      proposalIdToUpdate
      title
      encodedProposalHash
      matchingProposalIds
      contentSignatures(orderBy: expirationTimestamp, orderDirection: desc) {
        id
        signer
        sig
        expirationTimestamp
        reason
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

// Query Types
export type ProposalCandidateQuery = {
  data: ProposalCandidateQueryResponse;
  variables: ProposalCandidateQueryVariables;
};

export type ProposalCandidatesQuery = {
  data: ProposalCandidatesQueryResponse;
  variables: ProposalCandidatesQueryVariables;
};

export type ProposalCandidateContentQuery = {
  data: ProposalCandidateContentQueryResponse;
  variables: ProposalCandidateContentQueryVariables;
};

export type CandidateFeedbackQuery = {
  data: CandidateFeedbackQueryResponse;
  variables: CandidateFeedbackQueryVariables;
};
