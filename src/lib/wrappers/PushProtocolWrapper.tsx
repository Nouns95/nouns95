'use client';

import React from 'react';
import { PushProtocolProvider } from '../../context/PushProtocolContext';

export function PushProtocolWrapper({ children }: { children: React.ReactNode }) {
  return <PushProtocolProvider>{children}</PushProtocolProvider>;
} 