'use client';

import PrivyProviderWrapper from './PrivyProviderWrapper';

export default function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProviderWrapper>
      {children}
    </PrivyProviderWrapper>
  );
} 