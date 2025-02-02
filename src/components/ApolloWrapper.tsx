'use client';

import { ApolloProvider } from '@apollo/client';
import { getClient } from '../lib/apollo-client';

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={getClient()}>
      {children}
    </ApolloProvider>
  );
} 