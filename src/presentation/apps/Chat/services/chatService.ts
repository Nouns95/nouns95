import { PushAPI } from '@pushprotocol/restapi';
import type { 
  Message,
  MessageWithCID,
  IMessageIPFS,
  IFeeds,
  IUser
} from '@pushprotocol/restapi/src/lib/types';
import type { ChatInfoResponse } from '@pushprotocol/restapi/src/lib/chat/getChatInfo';
import { ChatListType } from '@pushprotocol/restapi/src/lib/pushapi/pushAPITypes';
import { isErrorWithResponse, isErrorWithResponseV2, ValidationError } from '@pushprotocol/restapi/src/lib/errors/validationError';
import { HttpStatus } from '@pushprotocol/restapi/src/lib/errors/httpStatus';

//---------------------------------------------------
// CHAT SERVICE
//---------------------------------------------------

/**
 * Service responsible for handling direct messaging functionality
 */
export class ChatService {
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

  /**
   * Helper function to validate IFeeds object
   */
  private isValidIFeeds(obj: unknown): obj is IFeeds {
    if (!obj || typeof obj !== 'object') {
      return false;
    }
    
    const feed = obj as Record<string, unknown>;
    
    // Only validate essential fields for a message
    const hasRequiredFields = 
      'msg' in feed && typeof feed.msg === 'object' &&
      'did' in feed && typeof feed.did === 'string';

    if (!hasRequiredFields) {
      console.warn('Feed missing required fields:', feed);
      return false;
    }

    // Validate message object has minimum required fields
    const msg = feed.msg as Record<string, unknown>;
    const hasRequiredMessageFields =
      'messageContent' in msg &&
      'fromCAIP10' in msg &&
      'toCAIP10' in msg;

    if (!hasRequiredMessageFields) {
      console.warn('Message missing required fields:', msg);
      return false;
    }

    return true;
  }

  /**
   * Helper to convert IMessageIPFS to PushMessage format
   */
  private convertToPushMessage(message: IMessageIPFS | MessageWithCID): PushMessage {
    return {
      link: message.link || null,
      toDID: message.toDID || '',
      encType: message.encType || 'PlainText',
      fromDID: message.fromDID || '',
      sigType: message.sigType || '',
      toCAIP10: message.toCAIP10 || '',
      signature: message.signature || '',
      timestamp: message.timestamp || Date.now(),
      fromCAIP10: message.fromCAIP10 || '',
      messageType: message.messageType || 'Text',
      messageContent: message.messageContent || '',
      encryptedSecret: message.encryptedSecret || ''
    };
  }

  //---------------------------------------------------
  // CHAT HISTORY
  //---------------------------------------------------

  /**
   * Get chat history with a user
   * @param target Target DID (For Group Chats target is chatId, for 1-to-1 chat target is Push DID)
   * @param options Optional configuration for fetching chat history
   * @param options.reference Message reference hash from where previous messages are fetched. If null, messages are fetched from latest
   * @param options.limit Number of messages to be loaded (default: 10)
   * @returns Array of messages in Push Protocol format
   */
  public async getHistory(
    target: string,
    options?: {
      reference?: string | null;
      limit?: number;
    }
  ): Promise<{ 
    success: boolean; 
    data?: PushMessage[];
    error?: Error;
  }> {
    try {
      // Direct call to Push Protocol's chat history with documented options
      const messages = await this.pushUser.chat.history(target, {
        reference: options?.reference,
        limit: options?.limit || 10
      });

      // Convert messages to PushMessage format
      const convertedMessages = messages.map(msg => this.convertToPushMessage(msg));

      return { success: true, data: convertedMessages };
    } catch (error) {
      console.error('Failed to get chat history:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get chat history')
      };
    }
  }

  /**
   * Get latest message with a user
   */
  public async getLatest(target: string): Promise<{ success: boolean; data?: IFeeds; error?: Error }> {
    try {
      const latest = await this.pushUser.chat.latest(target);
      if (!this.isValidIFeeds(latest)) {
        throw new Error('Invalid message format received');
      }
      return { success: true, data: latest };
    } catch (error) {
      console.error('Failed to get latest message:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get latest message')
      };
    }
  }

  //---------------------------------------------------
  // MESSAGE OPERATIONS
  //---------------------------------------------------

  /**
   * Send a message to a user
   */
  public async sendMessage(recipient: string, message: Message): Promise<{ success: boolean; data?: PushMessage; error?: Error }> {
    try {
      const sent = await this.pushUser.chat.send(recipient, message);
      return { success: true, data: this.convertToPushMessage(sent) };
    } catch (error) {
      console.error('Failed to send message:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to send message')
      };
    }
  }

  /**
   * Decrypt messages
   */
  public async decryptMessages(messages: IMessageIPFS[]): Promise<{ success: boolean; data?: IMessageIPFS[]; error?: Error }> {
    try {
      const decrypted = await this.pushUser.chat.decrypt(messages);
      return { success: true, data: decrypted };
    } catch (error) {
      console.error('Failed to decrypt messages:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to decrypt messages')
      };
    }
  }

  //---------------------------------------------------
  // CHAT INFORMATION
  //---------------------------------------------------

  /**
   * Get chat information
   */
  public async getChatInfo(
    recipient: string,
    options?: {
      overrideAccount?: string;
    }
  ): Promise<{ success: boolean; data?: ChatInfoResponse; error?: Error }> {
    try {
      const info = await this.pushUser.chat.info(recipient, options);
      return { success: true, data: info };
    } catch (error) {
      console.error('Failed to get chat info:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get chat info')
      };
    }
  }

  //---------------------------------------------------
  // MESSAGE REFERENCES
  //---------------------------------------------------

  /**
   * Get message by reference
   */
  public async getMessageByReference(
    target: string,
    options?: {
      reference?: string | null;
    }
  ): Promise<{ success: boolean; data?: IFeeds; error?: Error }> {
    try {
      const message = await this.pushUser.chat.message(target, options);
      return { success: true, data: message as IFeeds };
    } catch (error) {
      console.error('Failed to get message by reference:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get message by reference')
      };
    }
  }

  //---------------------------------------------------
  // USER INFORMATION
  //---------------------------------------------------

  /**
   * Get user information
   */
  public async getUserInfo(address?: string): Promise<{ success: boolean; data?: IUser; error?: Error }> {
    try {
      const info = await this.pushUser.info(address ? { overrideAccount: address } : undefined);
      return { success: true, data: info };
    } catch (error) {
      console.error('Failed to get user info:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get user info')
      };
    }
  }

  //---------------------------------------------------
  // CHAT STATUS
  //---------------------------------------------------

  /**
   * Check if a chat exists between two users
   */
  public async checkChatExists(
    target: string
  ): Promise<{ success: boolean; data?: IFeeds[]; error?: Error }> {
    try {
      const chats = await this.pushUser.chat.list(ChatListType.CHATS, {
        overrideAccount: target
      });
      return { success: true, data: chats };
    } catch (error) {
      console.error('Failed to check chat:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to check chat')
      };
    }
  }

  /**
   * Get the conversation hash (IPFS CID) for a chat
   */
  public async getConversationHash(
    target: string
  ): Promise<{ success: boolean; data?: { threadHash: string; intent: boolean }; error?: Error }> {
    try {
      // Get the latest message to get the thread hash
      const history = await this.pushUser.chat.history(target, { limit: 1 });
      if (!Array.isArray(history) || history.length === 0) {
        return {
          success: true,
          data: {
            threadHash: '',
            intent: false
          }
        };
      }

      return { 
        success: true, 
        data: { 
          threadHash: history[0].threadhash || '', 
          intent: Boolean(history[0].intent)
        } 
      };
    } catch (error) {
      console.error('Failed to get conversation hash:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get conversation hash')
      };
    }
  }

  //---------------------------------------------------
  // CHAT BLOCKING
  //---------------------------------------------------

  /**
   * Block users from sending messages
   */
  public async blockUsers(users: string[]): Promise<{ success: boolean; data?: IUser; error?: Error }> {
    try {
      const result = await this.pushUser.chat.block(users);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to block users:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to block users')
      };
    }
  }

  /**
   * Unblock previously blocked users
   */
  public async unblockUsers(users: string[]): Promise<{ success: boolean; data?: IUser; error?: Error }> {
    try {
      const result = await this.pushUser.chat.unblock(users);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to unblock users:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to unblock users')
      };
    }
  }

  /**
   * Get list of chats
   */
  public async getChats(options?: {
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data?: IFeeds[]; error?: Error }> {
    try {
      const chats = await this.pushUser.chat.list(ChatListType.CHATS, options);
      return { success: true, data: chats };
    } catch (error) {
      console.error('Failed to get chats:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get chats')
      };
    }
  }

  /**
   * Refresh chat list after accepting a request
   */
  public async refreshAfterAccept(target: string): Promise<{ success: boolean; error?: Error }> {
    try {
      // First accept the chat request
      await this.pushUser.chat.accept(target);
      
      // Then do a fresh fetch of the chat list
      await this.pushUser.chat.list(ChatListType.CHATS);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to refresh after accepting chat:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to refresh after accepting chat')
      };
    }
  }
}

export interface PushMessage {
  link: string | null;
  toDID: string;
  encType: string;
  fromDID: string;
  sigType: string;
  toCAIP10: string;
  signature: string;
  timestamp: number;
  fromCAIP10: string;
  messageType: string;
  messageContent: string;
  encryptedSecret: string;
  profilePicture?: string | null;
  name?: string | null;
}

export interface ChatHistoryMessage {
  link: string | null;
  toDID: string;
  encType: string;
  fromDID: string;
  sigType: string;
  toCAIP10: string;
  signature: string;
  timestamp: number;
  fromCAIP10: string;
  messageType: string;
  messageContent: string;
  encryptedSecret: string;
}
