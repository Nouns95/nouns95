import { useCallback, useEffect, useState } from 'react';
import { CONSTANTS } from '@pushprotocol/restapi';
import { SpaceService } from '../../services/spaceService';
import { StreamService } from '../../services/streamService';
import type { 
  SpaceDTO,
  SpaceInfoDTO,
  SpaceIFeeds,
  GroupMembersInfo,
  GroupAccess,
  Rules
} from '@pushprotocol/restapi';

// Regular state interface
interface SpaceState {
  spaces: SpaceIFeeds[];
  currentSpace: SpaceDTO | SpaceInfoDTO | null;
  members: GroupMembersInfo | null;
  spaceAccess: GroupAccess | null;
  isLoading: boolean;
  error: Error | null;
}

// Real-time state interface
interface SpaceRealTimeState {
  spaceStatus: {
    [spaceId: string]: {
      isLive: boolean;
      startedAt: Date | null;
      endedAt: Date | null;
    };
  };
  memberPresence: {
    [address: string]: {
      isOnline: boolean;
      lastSeen: Date | null;
      role: 'speaker' | 'listener' | 'admin';
      isMuted: boolean;
    };
  };
  raisedHands: {
    [address: string]: {
      timestamp: Date;
      status: 'pending' | 'accepted' | 'rejected';
    };
  };
  audioStreams: {
    [address: string]: {
      isActive: boolean;
      quality: number;
      lastUpdated: Date;
    };
  };
}

// Event type refinements
interface BaseSpaceEvent {
  spaceId: string;
  timestamp: number;
}

interface SpaceStatusEvent extends BaseSpaceEvent {
  type: 'status';
  isLive: boolean;
  startedAt?: number;
  endedAt?: number;
}

interface SpaceMemberEvent extends BaseSpaceEvent {
  type: 'member';
  address: string;
  role: 'speaker' | 'listener' | 'admin';
  isMuted: boolean;
}

interface SpaceHandRaiseEvent extends BaseSpaceEvent {
  type: 'hand_raise';
  address: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface SpaceAudioEvent extends BaseSpaceEvent {
  type: 'audio';
  address: string;
  isActive: boolean;
  quality: number;
}

type SpaceEventData = SpaceStatusEvent | SpaceMemberEvent | SpaceHandRaiseEvent | SpaceAudioEvent;

// Type guards
function isSpaceEvent(data: unknown): data is SpaceEventData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    'spaceId' in data &&
    'timestamp' in data
  );
}

function isSpaceStatusEvent(data: SpaceEventData): data is SpaceStatusEvent {
  return data.type === 'status';
}

function isSpaceMemberEvent(data: SpaceEventData): data is SpaceMemberEvent {
  return data.type === 'member';
}

function isSpaceHandRaiseEvent(data: SpaceEventData): data is SpaceHandRaiseEvent {
  return data.type === 'hand_raise';
}

function isSpaceAudioEvent(data: SpaceEventData): data is SpaceAudioEvent {
  return data.type === 'audio';
}

interface AudioConfig {
  audio?: boolean;
}

export function useSpace(
  spaceService: SpaceService,
  stream: StreamService | null,
  isStreamConnected: boolean
) {
  // Regular space state
  const [state, setState] = useState<SpaceState>({
    spaces: [],
    currentSpace: null,
    members: null,
    spaceAccess: null,
    isLoading: false,
    error: null
  });

  // Real-time state
  const [realTimeState, setRealTimeState] = useState<SpaceRealTimeState>({
    spaceStatus: {},
    memberPresence: {},
    raisedHands: {},
    audioStreams: {}
  });

  //---------------------------------------------------
  // SPACE LISTING & DISCOVERY
  //---------------------------------------------------

  /**
   * Get trending spaces
   */
  const getTrendingSpaces = useCallback(async (options?: {
    page?: number;
    limit?: number;
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await spaceService.getTrendingSpaces(options);
      if (!result.success) {
        throw result.error || new Error('Failed to get trending spaces');
      }

      setState(prev => ({
        ...prev,
        spaces: result.data || [],
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to get trending spaces'),
        isLoading: false
      }));
    }
  }, [spaceService]);

  //---------------------------------------------------
  // SPACE MANAGEMENT
  //---------------------------------------------------

  /**
   * Create a new space
   */
  const createSpace = useCallback(async (options: {
    spaceName: string;
    spaceDescription?: string;
    spaceImage?: string;
    listeners?: string[];
    speakers?: string[];
    isPublic?: boolean;
    scheduleAt?: Date;
    rules?: Rules;
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await spaceService.createSpace({
        spaceName: options.spaceName,
        spaceDescription: options.spaceDescription || '',
        spaceImage: options.spaceImage || null,
        listeners: options.listeners || [],
        speakers: options.speakers || [],
        isPublic: options.isPublic || false,
        scheduleAt: options.scheduleAt || new Date(),
        rules: options.rules
      });
      if (!result.success) {
        throw result.error || new Error('Failed to create space');
      }

      // Update spaces list with new space
      setState(prev => ({
        ...prev,
        currentSpace: result.data || null,
        isLoading: false
      }));

      // Load updated spaces list
      await getTrendingSpaces();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to create space'),
        isLoading: false
      }));
    }
  }, [spaceService, getTrendingSpaces]);

  /**
   * Load space information
   */
  const loadSpaceInfo = useCallback(async (spaceId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Load space info
      const spaceResult = await spaceService.getSpaceInfo(spaceId);
      if (!spaceResult.success) {
        throw spaceResult.error || new Error('Failed to load space info');
      }

      setState(prev => ({
        ...prev,
        currentSpace: spaceResult.data || null,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to load space info'),
        isLoading: false
      }));
    }
  }, [spaceService]);

  //---------------------------------------------------
  // SPACE PARTICIPATION
  //---------------------------------------------------

  /**
   * Join a space
   */
  const joinSpace = useCallback(async (spaceId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await spaceService.joinSpace(spaceId);
      if (!result.success) {
        throw result.error || new Error('Failed to join space');
      }

      // Reload space info to get updated member list
      await loadSpaceInfo(spaceId);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to join space'),
        isLoading: false
      }));
    }
  }, [spaceService, loadSpaceInfo]);

  /**
   * Leave a space
   */
  const leaveSpace = useCallback(async (spaceId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await spaceService.leaveSpace(spaceId);
      if (!result.success) {
        throw result.error || new Error('Failed to leave space');
      }

      // Clear current space if it's the one we left
      if (state.currentSpace?.spaceId === spaceId) {
        setState(prev => ({
          ...prev,
          currentSpace: null,
          members: null,
          spaceAccess: null,
          isLoading: false
        }));
      }

      // Reload spaces list
      await getTrendingSpaces();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to leave space'),
        isLoading: false
      }));
    }
  }, [spaceService, getTrendingSpaces, state.currentSpace?.spaceId]);

  //---------------------------------------------------
  // SPACE CONTROLS
  //---------------------------------------------------

  /**
   * Start a space
   */
  const startSpace = useCallback(async (spaceId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await spaceService.startSpace(spaceId);
      if (!result.success) {
        throw result.error || new Error('Failed to start space');
      }

      // Update space status
      setRealTimeState(prev => ({
        ...prev,
        spaceStatus: {
          ...prev.spaceStatus,
          [spaceId]: {
            isLive: true,
            startedAt: new Date(),
            endedAt: null
          }
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to start space'),
        isLoading: false
      }));
    }
  }, [spaceService]);

  /**
   * Stop a space
   */
  const stopSpace = useCallback(async (spaceId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await spaceService.stopSpace(spaceId);
      if (!result.success) {
        throw result.error || new Error('Failed to stop space');
      }

      // Update space status
      setRealTimeState(prev => ({
        ...prev,
        spaceStatus: {
          ...prev.spaceStatus,
          [spaceId]: {
            isLive: false,
            startedAt: prev.spaceStatus[spaceId]?.startedAt || null,
            endedAt: new Date()
          }
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to stop space'),
        isLoading: false
      }));
    }
  }, [spaceService]);

  //---------------------------------------------------
  // MEMBER MANAGEMENT
  //---------------------------------------------------

  /**
   * Request microphone access
   */
  const requestMicAccess = useCallback(async (spaceId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await spaceService.requestMicAccess(spaceId);
      if (!result.success) {
        throw result.error || new Error('Failed to request mic access');
      }

      // Update raised hands state
      setRealTimeState(prev => ({
        ...prev,
        raisedHands: {
          ...prev.raisedHands,
          [spaceId]: {
            timestamp: new Date(),
            status: 'pending'
          }
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to request mic access'),
        isLoading: false
      }));
    }
  }, [spaceService]);

  /**
   * Accept a microphone request
   */
  const acceptMicRequest = useCallback(async (
    spaceId: string,
    address: string,
    signal: RTCSessionDescriptionInit
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await spaceService.acceptMicRequest(spaceId, address, signal);
      if (!result.success) {
        throw result.error || new Error('Failed to accept mic request');
      }

      // Update raised hands and member presence state
      setRealTimeState(prev => ({
        ...prev,
        raisedHands: {
          ...prev.raisedHands,
          [address]: {
            ...prev.raisedHands[address],
            status: 'accepted'
          }
        },
        memberPresence: {
          ...prev.memberPresence,
          [address]: {
            ...prev.memberPresence[address],
            role: 'speaker',
            isMuted: false
          }
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to accept mic request'),
        isLoading: false
      }));
    }
  }, [spaceService]);

  //---------------------------------------------------
  // STREAM EVENT HANDLERS
  //---------------------------------------------------

  /**
   * Handle space status update from stream
   */
  const handleSpaceStatus = useCallback((data: unknown) => {
    if (!isSpaceEvent(data) || !isSpaceStatusEvent(data)) return;
    
    setRealTimeState(prev => ({
      ...prev,
      spaceStatus: {
        ...prev.spaceStatus,
        [data.spaceId]: {
          isLive: data.isLive,
          startedAt: data.startedAt ? new Date(data.startedAt) : null,
          endedAt: data.endedAt ? new Date(data.endedAt) : null
        }
      }
    }));
  }, []);

  /**
   * Handle member presence update from stream
   */
  const handleMemberPresence = useCallback((data: unknown) => {
    if (!isSpaceEvent(data) || !isSpaceMemberEvent(data)) return;
    
    setRealTimeState(prev => ({
      ...prev,
      memberPresence: {
        ...prev.memberPresence,
        [data.address]: {
          isOnline: true,
          lastSeen: new Date(),
          role: data.role,
          isMuted: data.isMuted
        }
      }
    }));
  }, []);

  /**
   * Handle raised hand update from stream
   */
  const handleRaisedHand = useCallback((data: unknown) => {
    if (!isSpaceEvent(data) || !isSpaceHandRaiseEvent(data)) return;
    
    setRealTimeState(prev => ({
      ...prev,
      raisedHands: {
        ...prev.raisedHands,
        [data.address]: {
          timestamp: new Date(),
          status: data.status
        }
      }
    }));
  }, []);

  /**
   * Handle audio stream update from stream
   */
  const handleAudioStream = useCallback((data: unknown) => {
    if (!isSpaceEvent(data) || !isSpaceAudioEvent(data)) return;
    
    setRealTimeState(prev => ({
      ...prev,
      audioStreams: {
        ...prev.audioStreams,
        [data.address]: {
          isActive: data.isActive,
          quality: data.quality,
          lastUpdated: new Date()
        }
      }
    }));
  }, []);

  // Set up stream event listeners when connected
  useEffect(() => {
    if (!stream || !isStreamConnected) return;

    const spaceHandler = (data: unknown) => {
      if (!isSpaceEvent(data)) return;
      
      switch (data.type) {
        case 'status':
          handleSpaceStatus(data);
          break;
        case 'member':
          handleMemberPresence(data);
          break;
        case 'hand_raise':
          handleRaisedHand(data);
          break;
        case 'audio':
          handleAudioStream(data);
          break;
      }
    };

    // Subscribe to space events
    stream.on(CONSTANTS.STREAM.SPACE, spaceHandler);
    stream.on(CONSTANTS.STREAM.SPACE_OPS, spaceHandler);

    return () => {
      stream.off(CONSTANTS.STREAM.SPACE, spaceHandler);
      stream.off(CONSTANTS.STREAM.SPACE_OPS, spaceHandler);
    };
  }, [stream, isStreamConnected, handleSpaceStatus, handleMemberPresence, handleRaisedHand, handleAudioStream]);

  // Load initial spaces
  useEffect(() => {
    getTrendingSpaces();
  }, [getTrendingSpaces]);

  const { spaces, currentSpace, members, spaceAccess } = state;
  const { spaceStatus, memberPresence, raisedHands, audioStreams } = realTimeState;
  const { isLoading, error } = state;

  return {
    spaces,
    currentSpace,
    members,
    spaceAccess,
    spaceStatus,
    memberPresence,
    raisedHands,
    audioStreams,
    isLoading,
    error,
    getTrendingSpaces,
    createSpace,
    joinSpace,
    leaveSpace,
    startSpace,
    stopSpace,
    requestMicAccess,
    acceptMicRequest,
    rejectMicRequest: (spaceId: string, address: string) => 
      spaceService.rejectMicRequest(spaceId, address),
    inviteToPromote: (spaceId: string, address: string) => 
      spaceService.inviteToPromote(spaceId, address),
    acceptPromotionInvite: (spaceId: string, signal: RTCSessionDescriptionInit) => 
      spaceService.acceptPromotionInvite(spaceId, signal),
    rejectPromotionInvite: (spaceId: string) => 
      spaceService.rejectPromotionInvite(spaceId),
    configureAudio: (spaceId: string, options: AudioConfig) => 
      spaceService.configureAudio(spaceId, options),
    addSpeakers: (spaceId: string, addresses: string[]) => spaceService.addSpeakers(spaceId, addresses),
    removeSpeakers: (spaceId: string, addresses: string[]) => spaceService.removeSpeakers(spaceId, addresses),
    addListeners: (spaceId: string, addresses: string[]) => spaceService.addListeners(spaceId, addresses),
    removeListeners: (spaceId: string, addresses: string[]) => spaceService.removeListeners(spaceId, addresses),
    clearRaisedHand: (address: string) => setRealTimeState(prev => ({
      ...prev,
      raisedHands: Object.fromEntries(
        Object.entries(prev.raisedHands).filter(([key]) => key !== address)
      )
    }))
  };
}
