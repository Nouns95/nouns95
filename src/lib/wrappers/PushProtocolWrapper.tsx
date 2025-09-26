'use client';

import React from 'react';
import { PushProtocolProvider } from './PushProtocolContext';

export function PushProtocolWrapper({ children }: { children: React.ReactNode }) {
  return <PushProtocolProvider>{children}</PushProtocolProvider>;
} 