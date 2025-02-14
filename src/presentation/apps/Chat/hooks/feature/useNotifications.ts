import { useCallback, useEffect, useState } from 'react';
import { FeedType } from '@pushprotocol/restapi/src/lib/pushNotification/PushNotificationTypes';
import { CONSTANTS } from '@pushprotocol/restapi';
import { NotificationService } from '../../services/notificationService';
import { StreamService } from '../../services/streamService';
import type { 
  NotificationOptions,
  FeedsOptions,
  SubscribeUnsubscribeOptions,
  UserSetting,
  IFeeds
} from '@pushprotocol/restapi';

// Regular state interface
interface NotificationState {
  inboxFeeds: IFeeds[];
  spamFeeds: IFeeds[];
  subscriptions: IFeeds[];
  isLoading: boolean;
  error: Error | null;
}

// Real-time state interface
interface NotificationRealTimeState {
  unreadCount: number;
  lastNotification: {
    title: string;
    body: string;
  } | null;
  subscriptionUpdates: {
    [channelAddress: string]: {
      isSubscribed: boolean;
      lastUpdate: Date;
    }
  };
}

// Event type refinements
interface NotificationEventData {
  notifID: string;
  to: string[];
  from: string;
  timestamp: number;
  message: {
    notification: {
      title: string;
      body: string;
    };
    payload?: {
      cta?: string;
    };
  };
  channel: {
    name: string;
    icon: string;
    url: string;
  };
  event: 'INBOX' | 'SPAM';
  raw?: {
    verificationProof?: string;
  };
}

// Type guard for notification events
function isNotificationEventData(data: unknown): data is NotificationEventData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'notifID' in data &&
    'to' in data &&
    'from' in data &&
    'message' in data &&
    'channel' in data &&
    'event' in data
  );
}

export const useNotifications = (
  notificationService: NotificationService | null,
  stream: StreamService | null,
  isStreamConnected: boolean
) => {
  // Regular notification state
  const [state, setState] = useState<NotificationState>({
    inboxFeeds: [],
    spamFeeds: [],
    subscriptions: [],
    isLoading: false,
    error: null
  });

  // Real-time state
  const [realTimeState, setRealTimeState] = useState<NotificationRealTimeState>({
    unreadCount: 0,
    lastNotification: null,
    subscriptionUpdates: {}
  });

  //---------------------------------------------------
  // NOTIFICATION SUBSCRIPTIONS
  //---------------------------------------------------

  /**
   * Load subscriptions
   */
  const loadSubscriptions = useCallback(async (options?: { page?: number; limit?: number }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!notificationService) {
        throw new Error('Notification service not initialized');
      }

      const result = await notificationService.getSubscriptions(options);
      if (!result?.success) {
        throw result?.error || new Error('Failed to load subscriptions');
      }

      setState(prev => ({
        ...prev,
        subscriptions: result.data || [],
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to load subscriptions'),
        isLoading: false
      }));
    }
  }, [notificationService]);

  //---------------------------------------------------
  // STREAM EVENT HANDLERS
  //---------------------------------------------------

  /**
   * Handle new notification from stream
   */
  const handleNewNotification = useCallback(async (data: unknown) => {
    if (!isNotificationEventData(data)) return;

    try {
      const feed: IFeeds = {
        msg: {
          fromCAIP10: data.notifID,
          toCAIP10: data.to[0] || '',
          fromDID: data.from,
          toDID: data.to[0] || '',
          messageType: 'NOTIFICATION',
          messageContent: data.message.notification.body,
          signature: data.raw?.verificationProof || '',
          sigType: '',
          link: data.message.payload?.cta || null,
          timestamp: new Date(data.timestamp).getTime(),
          encType: '',
          encryptedSecret: null
        },
        did: data.from,
        wallets: data.to.join(','),
        profilePicture: data.channel.icon,
        name: data.channel.name,
        publicKey: null,
        about: data.message.notification.title,
        threadhash: null,
        intent: null,
        intentSentBy: null,
        intentTimestamp: new Date(data.timestamp),
        combinedDID: data.channel.url
      };

      if (data.event === 'INBOX') {
        setState(prev => ({
          ...prev,
          inboxFeeds: [feed, ...prev.inboxFeeds]
        }));
      } else if (data.event === 'SPAM') {
        setState(prev => ({
          ...prev,
          spamFeeds: [feed, ...prev.spamFeeds]
        }));
      }

      setRealTimeState(prev => ({
        ...prev,
        unreadCount: prev.unreadCount + 1,
        lastNotification: {
          title: data.message.notification.title,
          body: data.message.notification.body,
        }
      }));
    } catch (error) {
      console.error('Failed to handle new notification:', error);
    }
  }, []);

  /**
   * Handle subscription update from stream
   */
  const handleSubscriptionUpdate = useCallback(() => {
    // When connected, load the latest subscriptions
    loadSubscriptions();
  }, [loadSubscriptions]);

  // Set up stream event listeners when connected
  useEffect(() => {
    if (!stream || !isStreamConnected) return;

    stream.on(CONSTANTS.STREAM.NOTIF, handleNewNotification);
    stream.on(CONSTANTS.STREAM.CONNECT, handleSubscriptionUpdate);

    return () => {
      stream.off(CONSTANTS.STREAM.NOTIF, handleNewNotification);
      stream.off(CONSTANTS.STREAM.CONNECT, handleSubscriptionUpdate);
    };
  }, [stream, isStreamConnected, handleNewNotification, handleSubscriptionUpdate]);

  // Load subscriptions on mount
  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  //---------------------------------------------------
  // NOTIFICATION FEEDS
  //---------------------------------------------------

  /**
   * Load notification feeds
   */
  const loadFeeds = useCallback(async (feedType: FeedType = FeedType.INBOX, options?: Omit<FeedsOptions, 'raw'>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!notificationService) {
        throw new Error('Notification service not initialized');
      }

      const result = await notificationService.getFeeds({
        ...options,
        raw: false // We want parsed data in the hook
      });
      if (!result?.success) {
        throw result?.error || new Error('Failed to load feeds');
      }

      setState(prev => ({
        ...prev,
        [feedType === FeedType.INBOX ? 'inboxFeeds' : 'spamFeeds']: result.data || [],
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to load feeds'),
        isLoading: false
      }));
    }
  }, [notificationService]);

  /**
   * Load all feeds (both inbox and spam)
   */
  const loadAllFeeds = useCallback(async (options?: Omit<FeedsOptions, 'raw'>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!notificationService) {
        throw new Error('Notification service not initialized');
      }

      // Load both feed types in parallel
      const [inboxResult, spamResult] = await Promise.all([
        notificationService.getFeeds({
          ...options,
          raw: false
        }),
        notificationService.getFeeds({
          ...options,
          raw: false
        })
      ]);

      if (!inboxResult?.success) {
        throw inboxResult?.error || new Error('Failed to load inbox feeds');
      }
      if (!spamResult?.success) {
        throw spamResult?.error || new Error('Failed to load spam feeds');
      }

      setState(prev => ({
        ...prev,
        inboxFeeds: inboxResult.data || [],
        spamFeeds: spamResult.data || [],
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to load feeds'),
        isLoading: false
      }));
    }
  }, [notificationService]);

  // Load all feeds on mount
  useEffect(() => {
    loadAllFeeds();
  }, [loadAllFeeds]);

  //---------------------------------------------------
  // NOTIFICATION SENDING
  //---------------------------------------------------

  /**
   * Send a notification
   */
  const sendNotification = useCallback(async (options: NotificationOptions) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!notificationService) {
        throw new Error('Notification service not initialized');
      }

      const result = await notificationService.sendNotification(options);
      if (!result?.success) {
        throw result?.error || new Error('Failed to send notification');
      }

      // Reload all feeds to get latest
      await loadAllFeeds();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to send notification'),
        isLoading: false
      }));
    }
  }, [notificationService, loadAllFeeds]);

  //---------------------------------------------------
  // NOTIFICATION SETTINGS
  //---------------------------------------------------

  /**
   * Get notification settings for a channel
   */
  const getSettings = useCallback(async (channelAddress: string) => {
    try {
      if (!notificationService) {
        throw new Error('Notification service not initialized');
      }

      const result = await notificationService.getSettings(channelAddress);
      if (!result?.success || !result?.data) {
        throw result?.error || new Error('Failed to get settings');
      }
      return result.data;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to get settings');
    }
  }, [notificationService]);

  /**
   * Update notification settings for a channel
   */
  const updateSettings = useCallback(async (channelAddress: string, settings: UserSetting[]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!notificationService) {
        throw new Error('Notification service not initialized');
      }

      const result = await notificationService.updateSettings(channelAddress, settings);
      if (!result?.success) {
        throw result?.error || new Error('Failed to update settings');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to update settings'),
        isLoading: false
      }));
    }
  }, [notificationService]);

  //---------------------------------------------------
  // NOTIFICATION SUBSCRIPTIONS
  //---------------------------------------------------

  /**
   * Subscribe to notifications from a channel
   */
  const subscribe = useCallback(async (channelAddress: string, options?: SubscribeUnsubscribeOptions) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!notificationService) {
        throw new Error('Notification service not initialized');
      }

      const result = await notificationService.subscribe(channelAddress, options);
      if (!result?.success) {
        throw result?.error || new Error('Failed to subscribe');
      }

      // Reload subscriptions to get latest
      await loadSubscriptions();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to subscribe'),
        isLoading: false
      }));
    }
  }, [notificationService, loadSubscriptions]);

  /**
   * Unsubscribe from notifications from a channel
   */
  const unsubscribe = useCallback(async (channelAddress: string, options?: SubscribeUnsubscribeOptions) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!notificationService) {
        throw new Error('Notification service not initialized');
      }

      const result = await notificationService.unsubscribe(channelAddress, options);
      if (!result?.success) {
        throw result?.error || new Error('Failed to unsubscribe');
      }

      // Reload subscriptions to get latest
      await loadSubscriptions();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to unsubscribe'),
        isLoading: false
      }));
    }
  }, [notificationService, loadSubscriptions]);

  return {
    // Regular state
    inboxFeeds: state.inboxFeeds,
    spamFeeds: state.spamFeeds,
    subscriptions: state.subscriptions,
    isLoading: state.isLoading,
    error: state.error,
    
    // Real-time state
    unreadCount: realTimeState.unreadCount,
    lastNotification: realTimeState.lastNotification,
    subscriptionUpdates: realTimeState.subscriptionUpdates,
    
    // Actions
    loadFeeds,
    loadAllFeeds,
    sendNotification,
    getSettings,
    updateSettings,
    subscribe,
    unsubscribe,
    reloadSubscriptions: loadSubscriptions,
    
    // Real-time actions
    markAsRead: () => setRealTimeState(prev => ({ ...prev, unreadCount: 0 }))
  };
}
