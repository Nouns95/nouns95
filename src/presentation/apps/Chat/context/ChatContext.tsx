import React, { createContext, useContext, useState, useCallback } from 'react';
import type { PushAPI, ProgressHookType } from '@pushprotocol/restapi';
import { StreamService } from '../services/streamService';
import { useInitialization } from '../hooks/core/useInitialization';

interface ChatContextType {
  pushUser: PushAPI | null;
  stream: StreamService | null;
  isInitializing: boolean;
  isInitialized: boolean;
  isStreamConnecting: boolean;
  isStreamConnected: boolean;
  error: Error | null;
  progressHook?: (callback: (progress: ProgressHookType) => void) => void;
  reset: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [progressCallback, setProgressCallback] = useState<((progress: ProgressHookType) => void) | undefined>();

  const {
    pushUser,
    stream,
    isInitializing,
    isInitialized,
    isStreamConnecting,
    isStreamConnected,
    error,
    reset
  } = useInitialization(progressCallback);

  const setProgress = useCallback((callback: (progress: ProgressHookType) => void) => {
    setProgressCallback(() => callback);
  }, []);

  const value = {
    pushUser,
    stream,
    isInitializing,
    isInitialized,
    isStreamConnecting,
    isStreamConnected,
    error,
    progressHook: setProgress,
    reset
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
} 