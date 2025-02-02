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
      }
    }
  }
`; 