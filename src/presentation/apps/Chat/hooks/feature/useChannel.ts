import { useCallback, useEffect, useState } from 'react';
import { CONSTANTS } from '@pushprotocol/restapi';
import type { 
  CreateChannelOptions,
  ChannelListOptions,
  ChannelSearchOptions,
  ChannelInfoOptions,
  UserSetting,
  IFeeds
} from '@pushprotocol/restapi';
import { ChannelService } from '../../services/channelService';
import { StreamService } from '../../services/streamService';

// Event type refinements
interface BaseStreamEvent {
  event: string;
  origin: string;
  timestamp: number;
  from: string;
}

interface ChannelUpdateEvent extends BaseStreamEvent {
  channelAddress: string;
  update: Partial<IFeeds>;
}

interface SubscriptionUpdateEvent extends BaseStreamEvent {
  channelAddress: string;
  settings: UserSetting[];
  action?: string;
}

interface VerificationUpdateEvent extends BaseStreamEvent {
  channelAddress: string;
  isVerified: boolean;
}

interface DelegateUpdateEvent extends BaseStreamEvent {
  address: string;
  action: string;
}

// Regular state interface
interface ChannelState {
  channels: IFeeds[];
  subscribers: string[];
  delegates: string[];
  tags: string[];
  notifications: IFeeds[];
  isLoading: boolean;
  error: Error | null;
}

// Real-time state interface
interface ChannelRealTimeState {
  subscriptionStatus: {
    [channelAddress: string]: {
      isSubscribed: boolean;
      lastUpdate: Date;
      settings: UserSetting[];
    };
  };
  subscriberCount: {
    [channelAddress: string]: {
      count: number;
      lastUpdate: Date;
    };
  };
  verificationStatus: {
    [channelAddress: string]: {
      isVerified: boolean;
      timestamp: Date;
    };
  };
  delegateActivity: {
    [address: string]: {
      lastAction: string;
      timestamp: Date;
    };
  };
}

export function useChannel(
  channelService: ChannelService,
  stream: StreamService | null,
  isStreamConnected: boolean
) {
  // Regular channel state
  const [state, setState] = useState<ChannelState>({
    channels: [],
    subscribers: [],
    delegates: [],
    tags: [],
    notifications: [],
    isLoading: false,
    error: null
  });

  // Real-time state
  const [realTimeState, setRealTimeState] = useState<ChannelRealTimeState>({
    subscriptionStatus: {},
    subscriberCount: {},
    verificationStatus: {},
    delegateActivity: {}
  });

  //---------------------------------------------------
  // CHANNEL MANAGEMENT
  //---------------------------------------------------

  /**
   * Load channels list
   */
  const loadChannels = useCallback(async (options?: ChannelListOptions) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await channelService.listChannels(options);
      if (!result.success) throw result.error;
      setState(prev => ({
        ...prev,
        channels: result.data || [],
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to load channels:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to load channels'),
        isLoading: false
      }));
    }
  }, [channelService]);

  // Create channel
  const createChannel = useCallback(async (options: CreateChannelOptions) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await channelService.createChannel(options);
      if (!result.success) throw result.error;
      await loadChannels();
    } catch (error) {
      console.error('Failed to create channel:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to create channel'),
        isLoading: false
      }));
    }
  }, [channelService, loadChannels]);

  //---------------------------------------------------
  // SUBSCRIBER MANAGEMENT
  //---------------------------------------------------

  /**
   * Load channel subscribers
   */
  const loadSubscribers = useCallback(async (options?: ChannelInfoOptions) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await channelService.getSubscribers(options);
      if (!result.success) {
        throw result.error || new Error('Failed to load subscribers');
      }

      setState(prev => ({
        ...prev,
        subscribers: result.data || [],
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to load subscribers'),
        isLoading: false
      }));
    }
  }, [channelService]);

  //---------------------------------------------------
  // TAG MANAGEMENT
  //---------------------------------------------------

  /**
   * Search channels by tag
   */
  const searchByTags = useCallback(async (query: string, options?: ChannelSearchOptions) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await channelService.searchChannels(query, options);
      if (!result.success) {
        throw result.error || new Error('Failed to search channels');
      }

      setState(prev => ({
        ...prev,
        channels: result.data || [],
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to search channels'),
        isLoading: false
      }));
    }
  }, [channelService]);

  //---------------------------------------------------
  // VERIFICATION MANAGEMENT
  //---------------------------------------------------

  /**
   * Verify a channel
   */
  const verifyChannel = useCallback(async (channelAddress: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await channelService.verifyChannel(channelAddress);
      if (!result.success) {
        throw result.error || new Error('Failed to verify channel');
      }

      // Update verification status
      setRealTimeState(prev => ({
        ...prev,
        verificationStatus: {
          ...prev.verificationStatus,
          [channelAddress]: {
            isVerified: true,
            timestamp: new Date()
          }
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to verify channel'),
        isLoading: false
      }));
    }
  }, [channelService]);

  //---------------------------------------------------
  // STREAM EVENT HANDLERS
  //---------------------------------------------------

  /**
   * Handle channel update from stream
   */
  const handleChannelUpdate = useCallback((data: unknown) => {
    if (!isChannelUpdateEvent(data)) return;
    const { channelAddress, update } = data;
    
    setState(prev => ({
      ...prev,
      channels: prev.channels.map(channel => 
        channel.did === channelAddress
          ? { ...channel, ...update }
          : channel
      )
    }));
  }, []);

  /**
   * Handle subscription update from stream
   */
  const handleSubscriptionUpdate = useCallback((data: unknown) => {
    if (!isSubscriptionUpdateEvent(data)) return;
    const { channelAddress, settings, action } = data;
    
    setRealTimeState(prev => ({
      ...prev,
      subscriptionStatus: {
        ...prev.subscriptionStatus,
        [channelAddress]: {
          isSubscribed: action === 'SUBSCRIBE',
          lastUpdate: new Date(),
          settings
        }
      }
    }));

    // Reload subscribers list
    if (channelAddress) {
      loadSubscribers({ channel: channelAddress }).catch(console.error);
    }
  }, [loadSubscribers]);

  /**
   * Handle verification update from stream
   */
  const handleVerificationUpdate = useCallback((data: unknown) => {
    if (!isVerificationUpdateEvent(data)) return;
    const { channelAddress, isVerified } = data;
    
    setRealTimeState(prev => ({
      ...prev,
      verificationStatus: {
        ...prev.verificationStatus,
        [channelAddress]: {
          isVerified,
          timestamp: new Date()
        }
      }
    }));
  }, []);

  /**
   * Handle delegate update from stream
   */
  const handleDelegateUpdate = useCallback((data: unknown) => {
    if (!isDelegateUpdateEvent(data)) return;
    const { address, action } = data;
    
    setRealTimeState(prev => ({
      ...prev,
      delegateActivity: {
        ...prev.delegateActivity,
        [address]: {
          lastAction: action,
          timestamp: new Date()
        }
      }
    }));
  }, []);

  // Set up stream event listeners when connected
  useEffect(() => {
    if (!stream || !isStreamConnected) return;

    // Subscribe to channel events
    stream.on(CONSTANTS.STREAM.NOTIF, handleChannelUpdate);
    stream.on(CONSTANTS.STREAM.NOTIF, handleSubscriptionUpdate);
    stream.on(CONSTANTS.STREAM.NOTIF, handleVerificationUpdate);
    stream.on(CONSTANTS.STREAM.NOTIF, handleDelegateUpdate);

    // Cleanup listeners on unmount or disconnect
    return () => {
      stream.off(CONSTANTS.STREAM.NOTIF, handleChannelUpdate);
      stream.off(CONSTANTS.STREAM.NOTIF, handleSubscriptionUpdate);
      stream.off(CONSTANTS.STREAM.NOTIF, handleVerificationUpdate);
      stream.off(CONSTANTS.STREAM.NOTIF, handleDelegateUpdate);
    };
  }, [stream, isStreamConnected, handleChannelUpdate, handleSubscriptionUpdate, handleVerificationUpdate, handleDelegateUpdate]);

  // Load channels on mount
  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  // Type guards
  function isChannelUpdateEvent(data: unknown): data is ChannelUpdateEvent {
    return typeof data === 'object' && data !== null && 'channelAddress' in data && 'update' in data;
  }

  function isSubscriptionUpdateEvent(data: unknown): data is SubscriptionUpdateEvent {
    return typeof data === 'object' && data !== null && 'channelAddress' in data && 'settings' in data;
  }

  function isVerificationUpdateEvent(data: unknown): data is VerificationUpdateEvent {
    return typeof data === 'object' && data !== null && 'channelAddress' in data && 'isVerified' in data;
  }

  function isDelegateUpdateEvent(data: unknown): data is DelegateUpdateEvent {
    return typeof data === 'object' && data !== null && 'address' in data && 'action' in data;
  }

  return {
    // Regular state
    channels: state.channels,
    subscribers: state.subscribers,
    delegates: state.delegates,
    tags: state.tags,
    notifications: state.notifications,
    isLoading: state.isLoading,
    error: state.error,

    // Real-time state
    subscriptionStatus: realTimeState.subscriptionStatus,
    subscriberCount: realTimeState.subscriberCount,
    verificationStatus: realTimeState.verificationStatus,
    delegateActivity: realTimeState.delegateActivity,

    // Channel actions
    createChannel,
    loadChannels,
    searchByTags,
    loadSubscribers,
    verifyChannel,

    // Real-time actions
    clearDelegateActivity: (address: string) => setRealTimeState(prev => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [address]: removed, ...remainingActivity } = prev.delegateActivity;
      return {
        ...prev,
        delegateActivity: remainingActivity
      };
    })
  };
}

