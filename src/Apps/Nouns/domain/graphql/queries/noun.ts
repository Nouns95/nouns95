import { gql } from '@apollo/client';

export const NOUN_BY_ID_QUERY = gql`
  query NounById($id: String!) {
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
        delegate {
          id
          delegatedVotes
        }
      }
    }
  }
`;

export const NOUNDERS_NOUNS_QUERY = gql`
  query NoundersNouns {
    nouns(first: 1000, orderBy: id) {
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
        delegate {
          id
          delegatedVotes
        }
      }
    }
  }
`;

export const ALL_NOUNS_QUERY = gql`
  query AllNouns($first: Int = 1000, $skip: Int = 0) {
    nouns(first: $first, skip: $skip, orderBy: id, orderDirection: desc) {
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
        delegate {
          id
          delegatedVotes
        }
      }
    }
  }
`;

export const PROBE_NOUNS_QUERY = gql`
  query ProbeNouns($first: Int = 100, $skip: Int = 0, $orderBy: Noun_orderBy = id, $orderDirection: OrderDirection = asc) {
    nouns(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection) {
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
        delegate {
          id
          delegatedVotes
        }
      }
    }
  }
`;

export const PROBE_NOUNS_INITIAL_QUERY = gql`
  query ProbeNounsInitial($first: Int = 500) {
    nouns(first: $first, orderBy: id, orderDirection: desc) {
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
        delegate {
          id
          delegatedVotes
        }
      }
    }
  }
`;

export const NOUN_DETAIL_QUERY = gql`
  query NounDetail($id: String!) {
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
        delegate {
          id
          delegatedVotes
        }
      }
      votes(first: 100, orderBy: blockNumber, orderDirection: desc) {
        id
        support
        votes
        blockNumber
        voter {
          id
        }
        proposal {
          id
          title
          status
        }
      }
    }
  }
`; 