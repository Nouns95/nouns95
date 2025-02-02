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
    nouns(where: { id_ends_with: "0" }) {
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