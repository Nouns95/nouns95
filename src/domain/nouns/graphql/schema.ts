import { gql } from '@apollo/client';

export const typeDefs = gql`
  type Query {
    # We'll add Nouns specific queries here
    _version: String
  }

  type Mutation {
    # We'll add Nouns specific mutations here
    _placeholder: String
  }
`;

// Example of a query definition
export const VERSION_QUERY = gql`
  query GetVersion {
    _version
  }
`; 