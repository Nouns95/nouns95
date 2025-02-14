import { PushAPI } from '@pushprotocol/restapi';
import { FeedType } from '@pushprotocol/restapi/src/lib/pushNotification/PushNotificationTypes';
import type { 
  NotificationOptions,
  FeedsOptions,
  SubscribeUnsubscribeOptions,
  UserSetting,
  IFeeds,
  SubscriptionOptions
} from '@pushprotocol/restapi';

//---------------------------------------------------
// NOTIFICATION SERVICE
//---------------------------------------------------

/**
 * Service responsible for managing notifications across all features
 */
export class NotificationService {
  constructor(
    private readonly pushUser: PushAPI
  ) {}

  //---------------------------------------------------
  // NOTIFICATION FEEDS
  //---------------------------------------------------

  /**
   * Get notification feed
   */
  public async getFeeds(options?: FeedsOptions): Promise<{ success: boolean; data?: IFeeds[]; error?: Error }> {
    try {
      const feeds = await this.pushUser.notification.list(FeedType.INBOX, options);
      return { success: true, data: feeds };
    } catch (error) {
      console.error('Failed to get notification feeds:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get notification feeds')
      };
    }
  }

  //---------------------------------------------------
  // NOTIFICATION SENDING
  //---------------------------------------------------

  /**
   * Send a notification
   */
  public async sendNotification(options: NotificationOptions): Promise<{ success: boolean; error?: Error }> {
    try {
      // Use the underlying notification API
      await this.pushUser.channel.send([options.channel || this.pushUser.account], {
        notification: options.notification,
        payload: options.payload,
        ...options.config,
        ...options.advanced
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to send notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to send notification')
      };
    }
  }

  //---------------------------------------------------
  // NOTIFICATION SETTINGS
  //---------------------------------------------------

  /**
   * Helper to create a notification setting
   */
  public createSetting(options: {
    enabled: boolean;
    value?: number | { lower: number; upper: number };
  }): UserSetting {
    return {
      enabled: options.enabled,
      value: options.value
    };
  }

  /**
   * Get notification settings for a channel
   */
  public async getSettings(channelAddress: string): Promise<{ success: boolean; data?: UserSetting[]; error?: Error }> {
    try {
      const subscriptions = await this.pushUser.notification.subscriptions({
        channel: channelAddress
      } as SubscriptionOptions);

      // Extract settings from the subscription
      const settings = subscriptions[0]?.settings || [];
      return { success: true, data: settings };
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get notification settings')
      };
    }
  }

  /**
   * Update notification settings for a channel
   */
  public async updateSettings(
    channelAddress: string,
    settings: UserSetting[]
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.subscribe(channelAddress, { settings });
      return { success: true };
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to update notification settings')
      };
    }
  }

  //---------------------------------------------------
  // NOTIFICATION SUBSCRIPTIONS
  //---------------------------------------------------

  /**
   * Subscribe to notifications from a channel with optional settings and callbacks
   */
  public async subscribe(
    channelAddress: string,
    options?: SubscribeUnsubscribeOptions
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.pushUser.notification.subscribe(channelAddress, {
        onSuccess: () => {
          console.log('Successfully subscribed to channel:', channelAddress);
          options?.onSuccess?.();
        },
        onError: (error: Error) => {
          console.error('Error subscribing to channel:', error);
          options?.onError?.(error);
        },
        settings: options?.settings
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to subscribe to notifications')
      };
    }
  }

  /**
   * Unsubscribe from notifications from a channel with optional callbacks
   */
  public async unsubscribe(
    channelAddress: string,
    options?: SubscribeUnsubscribeOptions
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.pushUser.notification.unsubscribe(channelAddress, {
        onSuccess: () => {
          console.log('Successfully unsubscribed from channel:', channelAddress);
          options?.onSuccess?.();
        },
        onError: (error: Error) => {
          console.error('Error unsubscribing from channel:', error);
          options?.onError?.(error);
        }
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to unsubscribe from notifications:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to unsubscribe from notifications')
      };
    }
  }

  /**
   * Get subscribed channels
   */
  public async getSubscriptions(options?: {
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data?: IFeeds[]; error?: Error }> {
    try {
      const subscriptions = await this.pushUser.notification.subscriptions(options);
      return { success: true, data: subscriptions };
    } catch (error) {
      console.error('Failed to get subscriptions:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get subscriptions')
      };
    }
  }
}