import { useEffect, useState, useCallback } from 'react';
import type { ProgressHookType } from '@pushprotocol/restapi';
import { usePushProtocol } from '../../../../../lib/wrappers/PushProtocolContext';
import { StreamService } from '../../services/streamService';

interface InitializationState {
  isInitializing: boolean;
  isInitialized: boolean;
  isStreamConnecting: boolean;
  isStreamConnected: boolean;
  error: Error | null;
}

export function useInitialization(progressHook?: (progress: ProgressHookType) => void) {
  const { user, isInitializing: isUserInitializing, error: userError, initializeUser } = usePushProtocol();
  const [state, setState] = useState<InitializationState>({
    isInitializing: false,
    isInitialized: false,
    isStreamConnecting: false,
    isStreamConnected: false,
    error: null
  });

  // Services
  const [streamService, setStreamService] = useState<StreamService | null>(null);

  // Progress reporting helper
  const reportProgress = useCallback((progressId: string, title: string, info: string, level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' = 'INFO') => {
    progressHook?.({
      progressId,
      progressTitle: title,
      progressInfo: info,
      level
    });
  }, [progressHook]);

  // Initialize stream function
  const initializeStream = useCallback(async () => {
    if (!user || state.isStreamConnecting || state.isStreamConnected) {
      console.log('Stream initialization skipped:', {
        hasUser: !!user,
        isConnecting: state.isStreamConnecting,
        isConnected: state.isStreamConnected,
        state
      });
      return;
    }

    console.log('Starting stream initialization...');
    setState(prev => ({ ...prev, isStreamConnecting: true, error: null }));
    reportProgress('stream-init', 'Stream Initialization', 'Starting stream service setup...');

    try {
      // Create and initialize stream service
      console.log('Creating stream service...');
      reportProgress('stream-create', 'Stream Service', 'Creating stream service instance...');
      const stream = new StreamService(user);
      
      // Initialize and connect stream
      console.log('Initializing stream...');
      reportProgress('stream-setup', 'Stream Setup', 'Initializing stream connection...');
      const initResult = await stream.initStream();
      if (!initResult.success) {
        console.error('Stream initialization failed:', initResult.error);
        throw initResult.error;
      }

      console.log('Connecting stream...');
      reportProgress('stream-connect', 'Stream Connection', 'Establishing connection...');
      const connectResult = await stream.connect();
      if (!connectResult.success) {
        console.error('Stream connection failed:', connectResult.error);
        throw connectResult.error;
      }

      console.log('Stream connected successfully');
      reportProgress('stream-ready', 'Stream Ready', 'Connection established successfully');
      setStreamService(stream);
      setState(prev => ({
        ...prev,
        isStreamConnecting: false,
        isStreamConnected: true,
        isInitialized: true
      }));
    } catch (error) {
      console.error('Stream initialization error:', error);
      reportProgress('stream-error', 'Stream Error', error instanceof Error ? error.message : 'Failed to initialize stream');
      setState(prev => ({
        ...prev,
        isStreamConnecting: false,
        error: error instanceof Error ? error : new Error('Failed to initialize stream')
      }));
    }
  }, [user, state, reportProgress]);

  // Initialize when user becomes available
  useEffect(() => {
    if (user && !state.isInitialized && !state.isStreamConnected && !state.isStreamConnecting) {
      reportProgress('init-start', 'Initialization', 'Starting Push Protocol initialization...');
      initializeStream();
    }
  }, [user, state.isInitialized, state.isStreamConnected, state.isStreamConnecting, initializeStream, reportProgress]);

  // Debug logging
  useEffect(() => {
    console.log('State Update:', {
      hasUser: !!user,
      isUserInitializing,
      userError,
      userAddress: user?.account,
      state,
      isFullyInitialized: !!user && state.isInitialized && state.isStreamConnected
    });
  }, [user, isUserInitializing, userError, state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamService) {
        console.log('Cleaning up stream service...');
        reportProgress('cleanup', 'Cleanup', 'Cleaning up stream service...');
        streamService.reset().catch(console.error);
      }
    };
  }, [streamService, reportProgress]);

  const isFullyInitialized = !!user && state.isInitialized && state.isStreamConnected;

  const reset = useCallback(() => {
    setState({
      isInitializing: false,
      isInitialized: false,
      isStreamConnecting: false,
      isStreamConnected: false,
      error: null
    });
    if (streamService) {
      streamService.reset().catch(console.error);
      setStreamService(null);
    }
    // Trigger a new PushProtocol initialization
    initializeUser();
  }, [streamService, initializeUser]);

  return {
    isInitializing: isUserInitializing || state.isStreamConnecting,
    isInitialized: isFullyInitialized,
    isStreamConnecting: state.isStreamConnecting,
    isStreamConnected: state.isStreamConnected,
    error: userError ? new Error(userError) : state.error,
    pushUser: user,
    stream: streamService,
    reset
  };
}
