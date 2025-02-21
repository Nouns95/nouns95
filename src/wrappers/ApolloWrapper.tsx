'use client';

import { ApolloClient, InMemoryCache, ApolloProvider, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://api.thegraph.com/subgraphs/name/nounsdao/nouns-subgraph'
});

const wsLink = typeof window !== 'undefined'
  ? new GraphQLWsLink(createClient({
      url: process.env.NEXT_PUBLIC_WS_URL || 'wss://api.thegraph.com/subgraphs/name/nounsdao/nouns-subgraph',
      connectionParams: {
        // Add any necessary authentication here
      },
      retryAttempts: 3,
      shouldRetry: (errOrCloseEvent: unknown) => {
        if (typeof errOrCloseEvent === 'object' && errOrCloseEvent && 'code' in errOrCloseEvent) {
          return (errOrCloseEvent as { code: number }).code !== 3000;
        }
        return true;
      },
    }))
  : null;

const splitLink = typeof window !== 'undefined' && wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      httpLink
    )
  : httpLink;

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
} 