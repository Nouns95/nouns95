'use client';

import { useState, useEffect } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, split, HttpLink, NormalizedCacheObject } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// Create client outside component to prevent recreation
let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

const getClient = () => {
  if (!apolloClient) {
    const httpLink = new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://api.thegraph.com/subgraphs/name/nounsdao/nouns-subgraph'
    });

    const wsLink = new GraphQLWsLink(createClient({
      url: process.env.NEXT_PUBLIC_WS_URL || 'wss://api.thegraph.com/subgraphs/name/nounsdao/nouns-subgraph',
      connectionParams: {
        origin: typeof window !== 'undefined' ? window.location.origin : undefined
      },
      retryAttempts: 3,
      shouldRetry: (errOrCloseEvent: unknown) => {
        if (typeof errOrCloseEvent === 'object' && errOrCloseEvent && 'code' in errOrCloseEvent) {
          return (errOrCloseEvent as { code: number }).code !== 3000;
        }
        return true;
      },
    }));

    const splitLink = split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      httpLink
    );

    apolloClient = new ApolloClient({
      link: splitLink,
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'cache-and-network',
        },
      },
    });
  }
  
  return apolloClient;
};

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<ApolloClient<NormalizedCacheObject> | null>(null);

  useEffect(() => {
    setClient(getClient());
  }, []);

  if (!client) {
    return null;
  }

  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
} 