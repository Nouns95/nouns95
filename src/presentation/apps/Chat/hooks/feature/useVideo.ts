import { useCallback, useEffect, useState } from 'react';
import { CONSTANTS } from '@pushprotocol/restapi';
import type { VideoNotificationRules } from '@pushprotocol/restapi';
import { VideoService } from '../../services/videoService';
import { StreamService } from '../../services/streamService';

// Regular state interface
interface VideoState {
  activeCall: {
    participants: string[];
    startTime: Date | null;
    duration: number;
  } | null;
  pendingCalls: {
    [callId: string]: {
      from: string;
      rules: VideoNotificationRules;
      timestamp: Date;
    };
  };
  isLoading: boolean;
  error: Error | null;
}

// Real-time state interface
interface VideoRealTimeState {
  callStatus: {
    isActive: boolean;
    participants: {
      [address: string]: {
        isConnected: boolean;
        hasVideo: boolean;
        hasAudio: boolean;
        isScreenSharing: boolean;
        connectionQuality: number;
        lastUpdated: Date;
      };
    };
  };
  mediaStreams: {
    [address: string]: {
      videoEnabled: boolean;
      audioEnabled: boolean;
      screenShare: boolean | null;
      quality: number;
      lastUpdated: Date;
    };
  };
}

// Event type refinements
interface BaseVideoEvent {
  event: string;
  timestamp: number;
}

interface CallRequestEvent extends BaseVideoEvent {
  callId: string;
  from: string;
  rules: VideoNotificationRules;
}

interface CallStatusEvent extends BaseVideoEvent {
  isActive: boolean;
  participants: {
    [address: string]: {
      isConnected: boolean;
      hasVideo: boolean;
      hasAudio: boolean;
      isScreenSharing: boolean;
      connectionQuality: number;
    };
  };
}

interface MediaUpdateEvent extends BaseVideoEvent {
  address: string;
  video: boolean;
  audio: boolean;
  screenShare: boolean | null;
  quality: number;
}

interface ParticipantUpdateEvent extends BaseVideoEvent {
  address: string;
  isConnected: boolean;
  connectionQuality: number;
}

// Type guards
function isCallRequestEvent(data: unknown): data is CallRequestEvent {
  return (
    typeof data === 'object' &&
    data !== null &&
    'callId' in data &&
    'from' in data &&
    'rules' in data
  );
}

function isCallStatusEvent(data: unknown): data is CallStatusEvent {
  return (
    typeof data === 'object' &&
    data !== null &&
    'isActive' in data &&
    'participants' in data
  );
}

function isMediaUpdateEvent(data: unknown): data is MediaUpdateEvent {
  return (
    typeof data === 'object' &&
    data !== null &&
    'address' in data &&
    'video' in data &&
    'audio' in data &&
    'quality' in data
  );
}

function isParticipantUpdateEvent(data: unknown): data is ParticipantUpdateEvent {
  return (
    typeof data === 'object' &&
    data !== null &&
    'address' in data &&
    'isConnected' in data &&
    'connectionQuality' in data
  );
}

export function useVideo(
  videoService: VideoService,
  stream: StreamService | null,
  isStreamConnected: boolean
) {
  // Regular video state
  const [state, setState] = useState<VideoState>({
    activeCall: null,
    pendingCalls: {},
    isLoading: false,
    error: null
  });

  // Real-time state
  const [realTimeState, setRealTimeState] = useState<VideoRealTimeState>({
    callStatus: {
      isActive: false,
      participants: {}
    },
    mediaStreams: {}
  });

  //---------------------------------------------------
  // CALL MANAGEMENT
  //---------------------------------------------------

  /**
   * Request a video call
   */
  const requestCall = useCallback(async (
    recipients: string[],
    options: {
      rules: VideoNotificationRules;
    }
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await videoService.requestCall(recipients, options);
      if (!result.success) {
        throw result.error || new Error('Failed to request call');
      }

      // Update state with new call request
      setState(prev => ({
        ...prev,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to request call'),
        isLoading: false
      }));
    }
  }, [videoService]);

  /**
   * Accept an incoming call
   */
  const acceptCall = useCallback(async (address?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await videoService.approveCall(address);
      if (!result.success) {
        throw result.error || new Error('Failed to accept call');
      }

      // Update call status
      setRealTimeState(prev => ({
        ...prev,
        callStatus: {
          ...prev.callStatus,
          isActive: true,
          participants: {
            ...prev.callStatus.participants,
            [address || '']: {
              isConnected: true,
              hasVideo: false,
              hasAudio: false,
              isScreenSharing: false,
              connectionQuality: 100,
              lastUpdated: new Date()
            }
          }
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to accept call'),
        isLoading: false
      }));
    }
  }, [videoService]);

  /**
   * Reject an incoming call
   */
  const rejectCall = useCallback(async (address?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await videoService.denyCall(address);
      if (!result.success) {
        throw result.error || new Error('Failed to reject call');
      }

      // Remove from pending calls if exists
      if (address) {
        setState(prev => ({
          ...prev,
          pendingCalls: Object.fromEntries(
            Object.entries(prev.pendingCalls).filter(([key]) => key !== address)
          ),
          isLoading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to reject call'),
        isLoading: false
      }));
    }
  }, [videoService]);

  /**
   * End current call
   */
  const endCall = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await videoService.disconnect();
      if (!result.success) {
        throw result.error || new Error('Failed to end call');
      }

      // Reset call state
      setState(prev => ({
        ...prev,
        activeCall: null,
        isLoading: false
      }));

      setRealTimeState(prev => ({
        ...prev,
        callStatus: {
          isActive: false,
          participants: {}
        },
        mediaStreams: {}
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to end call'),
        isLoading: false
      }));
    }
  }, [videoService]);

  //---------------------------------------------------
  // MEDIA CONFIGURATION
  //---------------------------------------------------

  /**
   * Configure media settings
   */
  const configureMedia = useCallback((config: {
    video?: boolean;
    audio?: boolean;
  }) => {
    const result = videoService.configureCall(config);
    if (!result.success) {
      setState(prev => ({
        ...prev,
        error: result.error || new Error('Failed to configure media')
      }));
      return;
    }

    // Update local media stream state
    setRealTimeState(prev => ({
      ...prev,
      mediaStreams: {
        ...prev.mediaStreams,
        local: {
          ...prev.mediaStreams.local,
          videoEnabled: config.video ?? prev.mediaStreams.local?.videoEnabled ?? false,
          audioEnabled: config.audio ?? prev.mediaStreams.local?.audioEnabled ?? false,
          screenShare: prev.mediaStreams.local?.screenShare ?? null,
          quality: prev.mediaStreams.local?.quality ?? 100,
          lastUpdated: new Date()
        }
      }
    }));
  }, [videoService]);

  //---------------------------------------------------
  // STREAM EVENT HANDLERS
  //---------------------------------------------------

  /**
   * Handle call request from stream
   */
  const handleCallRequest = useCallback((data: unknown) => {
    if (!isCallRequestEvent(data)) return;
    const { callId, from, rules, timestamp } = data;
    
    setState(prev => ({
      ...prev,
      pendingCalls: {
        ...prev.pendingCalls,
        [callId]: {
          from,
          rules,
          timestamp: new Date(timestamp)
        }
      }
    }));
  }, []);

  /**
   * Handle call status update from stream
   */
  const handleCallStatus = useCallback((data: unknown) => {
    if (!isCallStatusEvent(data)) return;
    const { isActive, participants } = data;
    
    setRealTimeState(prev => ({
      ...prev,
      callStatus: {
        isActive,
        participants: Object.entries(participants).reduce((acc, [address, info]) => ({
          ...acc,
          [address]: {
            ...info,
            lastUpdated: new Date()
          }
        }), {})
      }
    }));
  }, []);

  /**
   * Handle media update from stream
   */
  const handleMediaUpdate = useCallback((data: unknown) => {
    if (!isMediaUpdateEvent(data)) return;
    const { address, video, audio, screenShare, quality } = data;
    
    setRealTimeState(prev => ({
      ...prev,
      mediaStreams: {
        ...prev.mediaStreams,
        [address]: {
          videoEnabled: video,
          audioEnabled: audio,
          screenShare,
          quality,
          lastUpdated: new Date()
        }
      }
    }));
  }, []);

  /**
   * Handle participant update from stream
   */
  const handleParticipantUpdate = useCallback((data: unknown) => {
    if (!isParticipantUpdateEvent(data)) return;
    const { address, isConnected, connectionQuality } = data;
    
    setRealTimeState(prev => ({
      ...prev,
      callStatus: {
        ...prev.callStatus,
        participants: {
          ...prev.callStatus.participants,
          [address]: {
            ...prev.callStatus.participants[address],
            isConnected,
            connectionQuality,
            lastUpdated: new Date()
          }
        }
      }
    }));
  }, []);

  // Set up stream event listeners when connected
  useEffect(() => {
    if (!stream || !isStreamConnected) return;

    // Subscribe to video events
    stream.on(CONSTANTS.STREAM.VIDEO, handleCallRequest);
    stream.on(CONSTANTS.STREAM.VIDEO, handleCallStatus);
    stream.on(CONSTANTS.STREAM.VIDEO, handleMediaUpdate);
    stream.on(CONSTANTS.STREAM.VIDEO, handleParticipantUpdate);

    // Cleanup listeners on unmount or disconnect
    return () => {
      stream.off(CONSTANTS.STREAM.VIDEO, handleCallRequest);
      stream.off(CONSTANTS.STREAM.VIDEO, handleCallStatus);
      stream.off(CONSTANTS.STREAM.VIDEO, handleMediaUpdate);
      stream.off(CONSTANTS.STREAM.VIDEO, handleParticipantUpdate);
    };
  }, [stream, isStreamConnected, handleCallRequest, handleCallStatus, handleMediaUpdate, handleParticipantUpdate]);

  return {
    // Regular state
    activeCall: state.activeCall,
    pendingCalls: state.pendingCalls,
    isLoading: state.isLoading,
    error: state.error,

    // Real-time state
    callStatus: realTimeState.callStatus,
    mediaStreams: realTimeState.mediaStreams,

    // Call actions
    requestCall,
    acceptCall,
    rejectCall,
    endCall,

    // Media actions
    configureMedia,

    // Real-time actions
    clearPendingCall: (callId: string) => setState(prev => ({
      ...prev,
      pendingCalls: Object.fromEntries(
        Object.entries(prev.pendingCalls).filter(([key]) => key !== callId)
      )
    }))
  };
}
