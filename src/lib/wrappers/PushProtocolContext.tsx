'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useWalletClient } from 'wagmi';
import { useAppKitAccount } from '@reown/appkit/react';
import { PushAPI, CONSTANTS } from '@pushprotocol/restapi';

interface PushAPIInitializeProps {
  env?: typeof CONSTANTS.ENV.STAGING | typeof CONSTANTS.ENV.PROD;
  progressHook?: (progress: { progressId: string; progressTitle: string; progressInfo: string }) => void;
  account?: string;
  version?: string;
  versionMeta?: {
    NFTPGP_V1?: {
      password: string;
    };
  };
  autoUpgrade?: boolean;
  origin?: string;
}

interface PushProtocolContextType {
  user: PushAPI | null;
  isInitializing: boolean;
  error: string | null;
  initializeUser: () => Promise<void>;
}

const PushProtocolContext = createContext<PushProtocolContextType | undefined>(undefined);

// Helper function to determine the environment
const getPushEnvironment = () => {
  const env = process.env.NEXT_PUBLIC_PUSH_ENV || 'prod';
  return env.toLowerCase() === 'staging' ? CONSTANTS.ENV.STAGING : CONSTANTS.ENV.PROD;
};

export const PushProtocolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PushAPI | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();
  const { address } = useAppKitAccount();
  const [hasAttemptedInit, setHasAttemptedInit] = useState(false);
  const initializationInProgress = useRef(false);

  const initializeUser = useCallback(async () => {
    if (isInitializing || user || initializationInProgress.current) return;
    
    try {
      initializationInProgress.current = true;
      setIsInitializing(true);
      setError(null);
      
      if (!address || !walletClient) return;

      const pushEnv = getPushEnvironment();

      let userInstance: PushAPI | null = null;
      try {
        const initOptions: PushAPIInitializeProps = {
          env: pushEnv,
          account: address,
          autoUpgrade: false,
          progressHook: () => void 0
        };

        userInstance = await PushAPI.initialize(walletClient, initOptions);

        if (!userInstance) {
          throw new Error('Failed to login. Please try again.');
        }

        if (userInstance.errors?.length > 0) {
          const errorObj = userInstance.errors[0];
          throw new Error(typeof errorObj === 'string' ? errorObj : errorObj.message);
        }

        setUser(userInstance);
        setHasAttemptedInit(true);
      } catch (initError) {
        const errorMessage = initError instanceof Error ? initError.message : 'Unknown error';
        if (errorMessage.toLowerCase().includes('error decrypting pgp private key')) {
          throw new Error('Failed to login. Please try again.');
        }
        throw initError;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to login. Please try again.';
      setError(errorMessage);
      setUser(null);
      setHasAttemptedInit(true);
    } finally {
      setIsInitializing(false);
      initializationInProgress.current = false;
    }
  }, [address, walletClient, isInitializing, user]);

  useEffect(() => {
    // Only attempt initialization if we haven't tried before and there's no error
    if (address && walletClient && !hasAttemptedInit && !user && !initializationInProgress.current && !error) {
      initializeUser();
    } else if (!walletClient || !address) {
      // Clean up when wallet disconnects
      setUser(null);
      setError(null);
      setHasAttemptedInit(false);
      initializationInProgress.current = false;
    }
  }, [address, walletClient, hasAttemptedInit, user, initializeUser, error]);

  const value = {
    user,
    isInitializing,
    error,
    initializeUser,
  };

  return (
    <PushProtocolContext.Provider value={value}>
      {children}
    </PushProtocolContext.Provider>
  );
};

export const usePushProtocol = () => {
  const context = useContext(PushProtocolContext);
  if (context === undefined) {
    throw new Error('usePushProtocol must be used within a PushProtocolProvider');
  }
  return context;
}; 