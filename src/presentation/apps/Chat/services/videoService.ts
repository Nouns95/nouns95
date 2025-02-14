import { PushAPI } from '@pushprotocol/restapi';
import type { VideoNotificationRules } from '@pushprotocol/restapi/src/lib/types';
import { VideoV2 } from '@pushprotocol/restapi/src/lib/video/VideoV2';

//---------------------------------------------------
// VIDEO SERVICE
//---------------------------------------------------

/**
 * Service responsible for managing video call functionality
 */
export class VideoService {
  private readonly video: VideoV2;

  constructor(
    private readonly pushUser: PushAPI
  ) {
    this.video = pushUser.video as unknown as VideoV2;
  }

  //---------------------------------------------------
  // VIDEO CALL MANAGEMENT
  //---------------------------------------------------

  /**
   * Request a video call with recipients
   */
  public async requestCall(
    recipients: string[],
    options: {
      rules: VideoNotificationRules;
    }
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.video.request(recipients, options);
      return { success: true };
    } catch (error) {
      console.error('Failed to request video call:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to request video call')
      };
    }
  }

  /**
   * Approve a video call
   */
  public async approveCall(address?: string): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.video.approve(address);
      return { success: true };
    } catch (error) {
      console.error('Failed to approve video call:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to approve video call')
      };
    }
  }

  /**
   * Deny a video call
   */
  public async denyCall(address?: string): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.video.deny(address);
      return { success: true };
    } catch (error) {
      console.error('Failed to deny video call:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to deny video call')
      };
    }
  }

  /**
   * Disconnect from video call
   */
  public async disconnect(): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.video.disconnect();
      return { success: true };
    } catch (error) {
      console.error('Failed to disconnect from video call:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to disconnect from video call')
      };
    }
  }

  //---------------------------------------------------
  // MEDIA CONFIGURATION
  //---------------------------------------------------

  /**
   * Configure video call settings
   */
  public configureCall(config: {
    video?: boolean;
    audio?: boolean;
  }): { success: boolean; error?: Error } {
    try {
      this.video.config(config);
      return { success: true };
    } catch (error) {
      console.error('Failed to configure video call:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to configure video call')
      };
    }
  }
}
