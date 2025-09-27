import { gql } from '@apollo/client';

export const DELEGATES_QUERY = gql`
  query Delegates($first: Int!, $skip: Int!, $orderBy: Delegate_orderBy, $orderDirection: OrderDirection) {
    delegates(
      first: $first,
      skip: $skip,
      orderBy: $orderBy,
      orderDirection: $orderDirection,
      where: { 
        delegatedVotesRaw_gt: "0",
        id_not: "0xb1a32fc9f9d8b2cf86c068cae13108809547ef71"
      }
    ) {
      id
      delegatedVotesRaw
      delegatedVotes
      tokenHoldersRepresentedAmount
      tokenHoldersRepresented(first: 100, where: { tokenBalance_gt: "0" }) {
        id
        tokenBalance
        tokenBalanceRaw
      }
      nounsRepresented(first: 10) {
        id
        owner {
          id
        }
      }
      votes(first: 5, orderBy: blockNumber, orderDirection: desc) {
        id
        support
        supportDetailed
        votes
        reason
        blockTimestamp
        proposal {
          id
          title
        }
      }
      proposals(first: 3, orderBy: createdTimestamp, orderDirection: desc) {
        id
        title
        status
        createdTimestamp
      }
    }
  }
`;

export const DELEGATE_DETAIL_QUERY = gql`
  query DelegateDetail($id: ID!) {
    delegate(id: $id) {
      id
      delegatedVotesRaw
      delegatedVotes
      tokenHoldersRepresentedAmount
      tokenHoldersRepresented(first: 100, orderBy: tokenBalance, orderDirection: desc, where: { tokenBalance_gt: "0" }) {
        id
        tokenBalance
        tokenBalanceRaw
      }
      nounsRepresented(first: 100, orderBy: id, orderDirection: desc) {
        id
        owner {
          id
        }
        seed {
          background
          body
          accessory
          head
          glasses
        }
      }
      votes(first: 1000, orderBy: blockNumber, orderDirection: desc) {
        id
        support
        supportDetailed
        votes
        votesRaw
        reason
        blockNumber
        blockTimestamp
        transactionHash
        proposal {
          id
          title
          status
        }
        nouns {
          id
        }
      }
      proposals(first: 20, orderBy: createdTimestamp, orderDirection: desc) {
        id
        title
        description
        status
        createdTimestamp
        startBlock
        endBlock
        forVotes
        againstVotes
        abstainVotes
        quorumVotes
      }
    }
  }
`;

export const RECENT_DELEGATE_ACTIVITY_QUERY = gql`
  query RecentDelegateActivity($first: Int!, $skip: Int!) {
    votes(
      first: $first,
      skip: $skip,
      orderBy: blockNumber,
      orderDirection: desc,
      where: { 
        votes_gt: "0",
        voter_not: "0xb1a32fc9f9d8b2cf86c068cae13108809547ef71"
      }
    ) {
      id
      voter {
        id
        delegatedVotes
      }
      support
      supportDetailed
      votes
      votesRaw
      reason
      blockTimestamp
      proposal {
        id
        title
      }
      nouns {
        id
      }
    }
  }
`;

// Type definitions
export interface Delegate {
  id: string;
  delegatedVotesRaw: string;
  delegatedVotes: string;
  tokenHoldersRepresentedAmount: number;
  tokenHoldersRepresented: Array<{
    id: string;
    tokenBalance?: string;
    tokenBalanceRaw?: string;
  }>;
  nounsRepresented: Array<{
    id: string;
    owner: {
      id: string;
    };
    seed?: {
      background: number;
      body: number;
      accessory: number;
      head: number;
      glasses: number;
    };
  }>;
  votes: Array<{
    id: string;
    support: boolean;
    supportDetailed: number;
    votes: string;
    votesRaw?: string;
    reason: string | null;
    blockNumber?: string;
    blockTimestamp: string;
    transactionHash?: string;
    proposal: {
      id: string;
      title: string;
      status?: string;
    };
    nouns?: Array<{
      id: string;
    }>;
  }>;
  proposals: Array<{
    id: string;
    title: string;
    description?: string;
    status: string;
    createdTimestamp: string;
    startBlock?: string;
    endBlock?: string;
    forVotes?: string;
    againstVotes?: string;
    abstainVotes?: string;
    quorumVotes?: string;
  }>;
}

export interface DelegateActivity {
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
  blockTimestamp: string;
  proposal: {
    id: string;
    title: string;
  };
  nouns: Array<{
    id: string;
  }>;
}

export enum Delegate_orderBy {
  id = 'id',
  delegatedVotes = 'delegatedVotes',
  delegatedVotesRaw = 'delegatedVotesRaw',
  tokenHoldersRepresentedAmount = 'tokenHoldersRepresentedAmount'
}

export enum OrderDirection {
  asc = 'asc',
  desc = 'desc'
}
