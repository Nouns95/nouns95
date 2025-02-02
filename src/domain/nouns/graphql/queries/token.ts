import { gql } from '@apollo/client';
import type { 
  NounQueryResponse, 
  NounQueryVariables,
  DelegateQueryResponse,
  DelegateQueryVariables,
  TransferEventsQueryResponse,
  DelegationEventsQueryResponse,
} from '../../types/graphql';

export const NOUN_HOLDER_QUERY = gql`
  query NounHolder($id: ID!) {
    noun(id: $id) {
      id
      seed {
        background
        body
        accessory
        head
        glasses
      }
      owner {
        id
      }
      votes(orderBy: blockNumber, orderDirection: desc) {
        id
        support
        votes
        voter {
          id
        }
        blockNumber
      }
    }
  }
`;

export type NounHolderQuery = {
  data: NounQueryResponse;
  variables: NounQueryVariables;
};

export const TOKEN_TRANSFERS_QUERY = gql`
  query NounTransfers($nounId: String, $first: Int = 100) {
    transfers(
      where: { noun: $nounId }
      orderBy: blockNumber
      orderDirection: desc
      first: $first
    ) {
      id
      noun {
        id
        seed {
          background
          body
          accessory
          head
          glasses
        }
      }
      previousHolder {
        id
      }
      newHolder {
        id
      }
      blockNumber
      blockTimestamp
    }
  }
`;

export type NounTransfersQuery = {
  data: TransferEventsQueryResponse;
  variables: {
    nounId?: string;
    first?: number;
  };
};

export const DELEGATIONS_QUERY = gql`
  query DelegateInfo($id: ID!) {
    delegate(id: $id) {
      id
      delegatedVotesRaw
      delegatedVotes
      tokenHoldersRepresentedAmount
      tokenHoldersRepresented(first: 100, orderBy: tokenBalance, orderDirection: desc) {
        id
        tokenBalance
      }
      nounsRepresented(first: 100, orderBy: id, orderDirection: asc) {
        id
        seed {
          background
          body
          accessory
          head
          glasses
        }
        owner {
          id
        }
      }
      votes(first: 100, orderBy: blockNumber, orderDirection: desc) {
        id
        proposal {
          id
          title
        }
        support
        votes
        blockNumber
      }
      proposals(first: 100, orderBy: createdBlock, orderDirection: desc) {
        id
        title
        status
        createdBlock
        startBlock
        endBlock
      }
    }
  }
`;

export type DelegateInfoQuery = {
  data: DelegateQueryResponse;
  variables: DelegateQueryVariables;
};

export const DELEGATION_EVENTS_QUERY = gql`
  query DelegationEvents($nounId: String, $first: Int = 100) {
    delegations(
      where: { noun: $nounId }
      orderBy: blockNumber
      orderDirection: desc
      first: $first
    ) {
      id
      noun {
        id
        seed {
          background
          body
          accessory
          head
          glasses
        }
      }
      delegator {
        id
      }
      previousDelegate {
        id
        delegatedVotes
      }
      newDelegate {
        id
        delegatedVotes
      }
      blockNumber
      blockTimestamp
    }
  }
`;

export type DelegationEventsQuery = {
  data: DelegationEventsQueryResponse;
  variables: {
    nounId?: string;
    first?: number;
  };
}; 