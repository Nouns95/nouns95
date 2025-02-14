import { PushAPI, CONSTANTS } from '@pushprotocol/restapi';
import type { STREAM } from '@pushprotocol/restapi';
import type { 
  PushStreamInitializeProps,
  NotificationEvent,
  MessageEvent,
  GroupEventBase,
  SpaceMemberEventBase,
  VideoEventType
} from '@pushprotocol/restapi/src/lib/pushstream/pushStreamTypes';
import { isErrorWithResponse, isErrorWithResponseV2, ValidationError } from '@pushprotocol/restapi/src/lib/errors/validationError';
import { HttpStatus } from '@pushprotocol/restapi/src/lib/errors/httpStatus';

//---------------------------------------------------
// STREAM SERVICE
//---------------------------------------------------

/**
 * Service responsible for managing Push Protocol stream operations
 */
export class StreamService {
  private stream: Awaited<ReturnType<PushAPI['initStream']>> | null = null;

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
  // STREAM INITIALIZATION
  //---------------------------------------------------

  /**
   * Initialize stream with required features
   */
  public async initStream(
    options?: Partial<PushStreamInitializeProps>
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      // Initialize stream with all required features
      this.stream = await this.pushUser.initStream([
        CONSTANTS.STREAM.CHAT,
        CONSTANTS.STREAM.CHAT_OPS,
        CONSTANTS.STREAM.SPACE,
        CONSTANTS.STREAM.SPACE_OPS,
        CONSTANTS.STREAM.VIDEO,
        CONSTANTS.STREAM.NOTIF,
        CONSTANTS.STREAM.CONNECT,
        CONSTANTS.STREAM.DISCONNECT
      ], {
        filter: {
          chats: options?.filter?.chats || [],
          spaces: options?.filter?.spaces || [],
          video: options?.filter?.video || []
        },
        connection: {
          retries: options?.connection?.retries || 3,
          auto: options?.connection?.auto ?? true
        },
        raw: options?.raw
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to initialize stream:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to initialize stream')
      };
    }
  }

  //---------------------------------------------------
  // STREAM MANAGEMENT
  //---------------------------------------------------

  /**
   * Connect to stream
   */
  public async connect(): Promise<{ success: boolean; error?: Error }> {
    try {
      if (!this.stream) {
        throw new Error('Stream not initialized');
      }

      await this.stream.connect();
      return { success: true };
    } catch (error) {
      console.error('Failed to connect stream:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to connect stream')
      };
    }
  }

  /**
   * Disconnect from stream
   */
  public async disconnect(): Promise<{ success: boolean; error?: Error }> {
    try {
      if (!this.stream) {
        throw new Error('Stream not initialized');
      }

      await this.stream.disconnect();
      return { success: true };
    } catch (error) {
      console.error('Failed to disconnect stream:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to disconnect stream')
      };
    }
  }

  /**
   * Check if stream is connected
   */
  public isConnected(): boolean {
    return this.stream?.connected() || false;
  }

  //---------------------------------------------------
  // EVENT HANDLING
  //---------------------------------------------------

  /**
   * Add event listener with proper typing
   */
  public on(
    event: STREAM,
    listener: (data: NotificationEvent | MessageEvent | GroupEventBase | SpaceMemberEventBase | VideoEventType) => void
  ): void {
    this.stream?.on(event, listener);
  }

  /**
   * Remove event listener
   */
  public off(
    event: STREAM,
    listener: (data: NotificationEvent | MessageEvent | GroupEventBase | SpaceMemberEventBase | VideoEventType) => void
  ): void {
    this.stream?.off(event, listener);
  }

  //---------------------------------------------------
  // CLEANUP
  //---------------------------------------------------

  /**
   * Reset stream service state
   */
  public async reset(): Promise<void> {
    if (this.stream) {
      await this.disconnect();
      this.stream = null;
    }
  }
}
