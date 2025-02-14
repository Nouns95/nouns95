import { PushAPI } from '@pushprotocol/restapi';
import type { 
  CreateChannelOptions,
  ChannelListOptions,
  ChannelSearchOptions,
  ChannelInfoOptions,
  ChannelOptions,
  IFeeds
} from '@pushprotocol/restapi';
import { isErrorWithResponse, isErrorWithResponseV2, ValidationError } from '@pushprotocol/restapi/src/lib/errors/validationError';
import { HttpStatus } from '@pushprotocol/restapi/src/lib/errors/httpStatus';

//---------------------------------------------------
// CHANNEL SERVICE
//---------------------------------------------------

/**
 * Service responsible for managing Push Protocol channels
 */
export class ChannelService {
  constructor(
    private readonly pushUser: PushAPI
  ) {}

  /**
   * Helper to handle Push Protocol specific errors
   */
  private handlePushError(error: unknown, context: string): Error {
    if (isErrorWithResponse(error)) {
      const status = error.response.status;
      const { message, errorCode, details } = error.response.data;
      return new ValidationError(
        status as HttpStatus,
        errorCode,
        `${context}: ${message}`,
        details
      );
    }
    if (isErrorWithResponseV2(error)) {
      const status = error.response.status;
      const { message, validation, error: errorCode } = error.response.data;
      return new ValidationError(
        status as HttpStatus,
        errorCode,
        `${context}: ${message}`,
        validation
      );
    }
    if (error instanceof Error) {
      return new ValidationError(
        HttpStatus.InternalError,
        'UNKNOWN_ERROR',
        error.message,
        error.stack || ''
      );
    }
    return new ValidationError(
      HttpStatus.InternalError,
      'UNKNOWN_ERROR',
      `${context}: Unknown error`,
      String(error)
    );
  }

  //---------------------------------------------------
  // CHANNEL CREATION & UPDATES
  //---------------------------------------------------

  /**
   * Create a new channel
   */
  public async createChannel(
    options: CreateChannelOptions
  ): Promise<{ success: boolean; data?: { transactionHash: string }; error?: Error }> {
    try {
      const result = await this.pushUser.channel.create(options);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to create channel:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to create channel')
      };
    }
  }

  /**
   * Update channel information
   */
  public async updateChannel(
    options: CreateChannelOptions
  ): Promise<{ success: boolean; data?: { transactionHash: string }; error?: Error }> {
    try {
      const result = await this.pushUser.channel.update(options);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to update channel:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to update channel')
      };
    }
  }

  //---------------------------------------------------
  // CHANNEL INFORMATION
  //---------------------------------------------------

  /**
   * Get channel information
   */
  public async getChannelInfo(
    channelAddress: string,
    options?: ChannelOptions
  ): Promise<{ success: boolean; data?: IFeeds; error?: Error }> {
    try {
      const info = await this.pushUser.channel.info(channelAddress, options);
      return { success: true, data: info };
    } catch (error) {
      console.error('Failed to get channel info:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get channel info')
      };
    }
  }

  /**
   * Get channel subscribers
   */
  public async getSubscribers(
    options?: ChannelInfoOptions
  ): Promise<{ success: boolean; data?: string[]; error?: Error }> {
    try {
      const subscribers = await this.pushUser.channel.subscribers(options);
      return { success: true, data: subscribers as string[] };
    } catch (error) {
      console.error('Failed to get subscribers:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get subscribers')
      };
    }
  }

  //---------------------------------------------------
  // CHANNEL SEARCH & LISTING
  //---------------------------------------------------

  /**
   * Search for channels
   */
  public async searchChannels(
    query: string,
    options?: ChannelSearchOptions
  ): Promise<{ success: boolean; data?: IFeeds[]; error?: Error }> {
    try {
      const results = await this.pushUser.channel.search(query, options);
      return { success: true, data: results };
    } catch (error) {
      console.error('Failed to search channels:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to search channels')
      };
    }
  }

  /**
   * List channels with filtering and sorting
   */
  public async listChannels(
    options?: ChannelListOptions
  ): Promise<{ success: boolean; data?: IFeeds[]; error?: Error }> {
    try {
      const channels = await this.pushUser.channel.list(options);
      return { success: true, data: channels };
    } catch (error) {
      console.error('Failed to list channels:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to list channels')
      };
    }
  }

  //---------------------------------------------------
  // CHANNEL VERIFICATION
  //---------------------------------------------------

  /**
   * Verify a channel
   */
  public async verifyChannel(
    channelAddress: string
  ): Promise<{ success: boolean; data?: { transactionHash: string }; error?: Error }> {
    try {
      const result = await this.pushUser.channel.verify(channelAddress);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to verify channel:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to verify channel')
      };
    }
  }
}
