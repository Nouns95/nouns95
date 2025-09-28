import { useCallback, useEffect, useState } from 'react';
import { CONSTANTS } from '@pushprotocol/restapi';
import type { IFeeds } from '@pushprotocol/restapi';
import { RequestsService } from '../../services/requestsService';
import { StreamService } from '../../services/streamService';

// Regular state interface
interface RequestState {
  chatRequests: IFeeds[];
  spaceRequests: IFeeds[];
  isLoading: boolean;
  error: Error | null;
}

// Real-time state interface
interface RequestRealTimeState {
  pendingRequests: {
    [requestId: string]: {
      type: 'chat' | 'space' | 'group';
      status: 'pending' | 'accepted' | 'rejected';
      timestamp: Date;
      from: string;
    };
  };
  requestUpdates: {
    [requestId: string]: {
      previousStatus: string;
      newStatus: string;
      timestamp: Date;
    };
  };
}

// Event type refinements
interface RequestEventData {
  requestId: string;
  type: 'chat' | 'space' | 'group';
  from: string;
  timestamp: number;
}

interface RequestUpdateEventData {
  requestId: string;
  previousStatus: string;
  newStatus: string;
  timestamp: number;
}

// Type guards
function isRequestEventData(data: unknown): data is RequestEventData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'requestId' in data &&
    'type' in data &&
    'from' in data &&
    'timestamp' in data
  );
}

function isRequestUpdateEventData(data: unknown): data is RequestUpdateEventData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'requestId' in data &&
    'previousStatus' in data &&
    'newStatus' in data &&
    'timestamp' in data
  );
}

export function useRequests(
  requestsService: RequestsService | null,
  stream: StreamService | null,
  isStreamConnected: boolean
) {
  // Regular request state
  const [state, setState] = useState<RequestState>({
    chatRequests: [],
    spaceRequests: [],
    isLoading: false,
    error: null
  });

  // Real-time state
  const [realTimeState, setRealTimeState] = useState<RequestRealTimeState>({
    pendingRequests: {},
    requestUpdates: {}
  });

  //---------------------------------------------------
  // REQUEST LOADING
  //---------------------------------------------------

  /**
   * Load chat requests
   */
  const loadChatRequests = useCallback(async (options?: {
    page?: number;
    limit?: number;
  }) => {
    if (!requestsService) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await requestsService.getChatRequests(options);
      if (!result.success) {
        throw result.error || new Error('Failed to load chat requests');
      }

      setState(prev => ({
        ...prev,
        chatRequests: result.data || [],
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to load chat requests'),
        isLoading: false
      }));
    }
  }, [requestsService]);

  /**
   * Load space requests
   */
  const loadSpaceRequests = useCallback(async (options?: {
    page?: number;
    limit?: number;
  }) => {
    if (!requestsService) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await requestsService.getSpaceRequests(options);
      if (!result.success) {
        throw result.error || new Error('Failed to load space requests');
      }

      setState(prev => ({
        ...prev,
        spaceRequests: result.data || [],
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to load space requests'),
        isLoading: false
      }));
    }
  }, [requestsService]);

  /**
   * Load all requests
   */
  const loadAllRequests = useCallback(async (options?: {
    page?: number;
    limit?: number;
  }) => {
    if (!requestsService) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Load both request types in parallel
      const [chatResult, spaceResult] = await Promise.all([
        requestsService.getChatRequests(options),
        requestsService.getSpaceRequests(options)
      ]);

      if (!chatResult.success) {
        throw chatResult.error || new Error('Failed to load chat requests');
      }
      if (!spaceResult.success) {
        throw spaceResult.error || new Error('Failed to load space requests');
      }

      setState(prev => ({
        ...prev,
        chatRequests: chatResult.data || [],
        spaceRequests: spaceResult.data || [],
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to load requests'),
        isLoading: false
      }));
    }
  }, [requestsService]);

  //---------------------------------------------------
  // REQUEST ACTIONS
  //---------------------------------------------------

  /**
   * Accept a chat request
   */
  const acceptChat = useCallback(async (target: string) => {
    if (!requestsService) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await requestsService.refreshAfterAccept(target);
      if (!result.success) {
        throw result.error || new Error('Failed to accept chat request');
      }

      // Reload chat requests to get updated list
      await loadChatRequests();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to accept chat request'),
        isLoading: false
      }));
    }
  }, [requestsService, loadChatRequests]);

  /**
   * Reject a chat request
   */
  const rejectChat = useCallback(async (target: string) => {
    if (!requestsService) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await requestsService.rejectChat(target);
      if (!result.success) {
        throw result.error || new Error('Failed to reject chat request');
      }

      // Reload chat requests to get updated list
      await loadChatRequests();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to reject chat request'),
        isLoading: false
      }));
    }
  }, [requestsService, loadChatRequests]);

  /**
   * Accept a space request
   */
  const acceptSpace = useCallback(async (target: string) => {
    if (!requestsService) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await requestsService.acceptSpace(target);
      if (!result.success) {
        throw result.error || new Error('Failed to accept space request');
      }

      // Reload space requests to get updated list
      await loadSpaceRequests();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to accept space request'),
        isLoading: false
      }));
    }
  }, [requestsService, loadSpaceRequests]);

  /**
   * Reject a space request
   */
  const rejectSpace = useCallback(async (target: string) => {
    if (!requestsService) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await requestsService.rejectSpace(target);
      if (!result.success) {
        throw result.error || new Error('Failed to reject space request');
      }

      // Reload space requests to get updated list
      await loadSpaceRequests();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to reject space request'),
        isLoading: false
      }));
    }
  }, [requestsService, loadSpaceRequests]);

  //---------------------------------------------------
  // STREAM EVENT HANDLERS
  //---------------------------------------------------

  /**
   * Handle new request from stream
   */
  const handleNewRequest = useCallback((data: unknown) => {
    if (!isRequestEventData(data)) return;
    
    // Update pending requests
    setRealTimeState(prev => ({
      ...prev,
      pendingRequests: {
        ...prev.pendingRequests,
        [data.requestId]: {
          type: data.type,
          status: 'pending',
          timestamp: new Date(data.timestamp),
          from: data.from
        }
      }
    }));

    // Reload appropriate request list
    if (data.type === 'chat') {
      loadChatRequests();
    } else if (data.type === 'space') {
      loadSpaceRequests();
    }
  }, [loadChatRequests, loadSpaceRequests]);

  /**
   * Handle request update from stream
   */
  const handleRequestUpdate = useCallback((data: unknown) => {
    if (!isRequestUpdateEventData(data)) return;
    
    setRealTimeState(prev => ({
      ...prev,
      requestUpdates: {
        ...prev.requestUpdates,
        [data.requestId]: {
          previousStatus: data.previousStatus,
          newStatus: data.newStatus,
          timestamp: new Date(data.timestamp)
        }
      }
    }));

    // Reload all requests to get updated lists
    loadAllRequests();
  }, [loadAllRequests]);

  // Set up stream event listeners when connected
  useEffect(() => {
    if (!stream || !isStreamConnected) return;

    const requestHandler = (data: unknown) => {
      // Debug log removed
      
      if (data && typeof data === 'object') {
        // Check for new request events
        if ('type' in data && data.type === 'request') {
          handleNewRequest(data);
        }
        // Check for request update events
        else if ('type' in data && data.type === 'request_update') {
          handleRequestUpdate(data);
        }
        // Check for chat request events
        else if ('event' in data && (
          data.event === 'chat.request' || 
          data.event === 'CHAT_REQUEST' ||
          data.event === 'REQUEST.CHAT'
        )) {
          // Debug log removed
          handleNewRequest({
            type: 'chat',
            requestId: (data as { reference?: string }).reference || Date.now().toString(),
            from: (data as { from?: string }).from || '',
            timestamp: (data as { timestamp?: number }).timestamp || Date.now()
          });
          // Reload chat requests immediately
          loadChatRequests();
        }
        // Check for space request events
        else if ('event' in data && (
          data.event === 'space.request' ||
          data.event === 'SPACE_REQUEST' ||
          data.event === 'REQUEST.SPACE'
        )) {
          // Debug log removed
          handleNewRequest({
            type: 'space',
            requestId: (data as { reference?: string }).reference || Date.now().toString(),
            from: (data as { from?: string }).from || '',
            timestamp: (data as { timestamp?: number }).timestamp || Date.now()
          });
          // Reload space requests immediately
          loadSpaceRequests();
        }
      }
    };

    // Subscribe to all relevant request events
    stream.on(CONSTANTS.STREAM.CHAT, requestHandler);
    stream.on(CONSTANTS.STREAM.CHAT_OPS, requestHandler);
    stream.on(CONSTANTS.STREAM.SPACE, requestHandler);
    stream.on(CONSTANTS.STREAM.SPACE_OPS, requestHandler);

    // Debug logging
    // Request stream handlers registered

    // Load initial requests
    loadAllRequests();

    // Cleanup listeners on unmount or disconnect
    return () => {
      stream.off(CONSTANTS.STREAM.CHAT, requestHandler);
      stream.off(CONSTANTS.STREAM.CHAT_OPS, requestHandler);
      stream.off(CONSTANTS.STREAM.SPACE, requestHandler);
      stream.off(CONSTANTS.STREAM.SPACE_OPS, requestHandler);
      // Debug log removed
    };
  }, [stream, isStreamConnected, handleNewRequest, handleRequestUpdate, loadChatRequests, loadSpaceRequests, loadAllRequests]);

  // Load all requests on mount
  useEffect(() => {
    loadAllRequests();
  }, [loadAllRequests]);

  return {
    // Regular state
    chatRequests: state.chatRequests,
    spaceRequests: state.spaceRequests,
    isLoading: state.isLoading,
    error: state.error,

    // Real-time state
    pendingRequests: realTimeState.pendingRequests,
    requestUpdates: realTimeState.requestUpdates,

    // Request actions
    loadChatRequests,
    loadSpaceRequests,
    loadAllRequests,
    acceptChat,
    rejectChat,
    acceptSpace,
    rejectSpace,

    // Real-time actions
    clearRequestUpdate: (requestId: string) => setRealTimeState(prev => ({
      ...prev,
      requestUpdates: Object.fromEntries(
        Object.entries(prev.requestUpdates).filter(([key]) => key !== requestId)
      )
    }))
  };
}
