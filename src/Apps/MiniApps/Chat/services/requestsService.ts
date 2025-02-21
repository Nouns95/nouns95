import { PushAPI } from '@pushprotocol/restapi';
import { ChatListType, SpaceListType } from '@pushprotocol/restapi/src/lib/pushapi/pushAPITypes';
import type { IFeeds } from '@pushprotocol/restapi';

//---------------------------------------------------
// REQUESTS SERVICE
//---------------------------------------------------

/**
 * Service responsible for managing chat, group, and space requests
 */
export class RequestsService {
  constructor(
    private readonly pushUser: PushAPI
  ) {}

  //---------------------------------------------------
  // CHAT REQUEST LISTING
  //---------------------------------------------------

  /**
   * Get list of chat requests
   */
  public async getChatRequests(options?: {
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data?: IFeeds[]; error?: Error }> {
    try {
      const requests = await this.pushUser.chat.list(ChatListType.REQUESTS, options);
      return { success: true, data: requests };
    } catch (error) {
      console.error('Failed to get chat requests:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get chat requests')
      };
    }
  }

  //---------------------------------------------------
  // SPACE REQUEST LISTING
  //---------------------------------------------------

  /**
   * Get list of space requests
   */
  public async getSpaceRequests(options?: {
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data?: IFeeds[]; error?: Error }> {
    try {
      const requests = await this.pushUser.space.list(SpaceListType.REQUESTS, options);
      return { success: true, data: requests };
    } catch (error) {
      console.error('Failed to get space requests:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get space requests')
      };
    }
  }

  //---------------------------------------------------
  // CHAT REQUEST ACTIONS
  //---------------------------------------------------

  /**
   * Accept a chat request
   */
  public async acceptChat(target: string): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.pushUser.chat.accept(target);
      return { success: true };
    } catch (error) {
      console.error('Failed to accept chat request:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to accept chat request')
      };
    }
  }

  /**
   * Reject a chat request
   */
  public async rejectChat(target: string): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.pushUser.chat.reject(target);
      return { success: true };
    } catch (error) {
      console.error('Failed to reject chat request:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to reject chat request')
      };
    }
  }

  /**
   * Accept a chat request and refresh the chat list
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
        error: error instanceof Error ? error : new Error('Failed to refresh after accepting chat')
      };
    }
  }

  //---------------------------------------------------
  // GROUP REQUEST ACTIONS
  //---------------------------------------------------

  /**
   * Accept a group request
   */
  public async acceptGroup(target: string): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.pushUser.chat.group.join(target);
      return { success: true };
    } catch (error) {
      console.error('Failed to accept group request:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to accept group request')
      };
    }
  }

  /**
   * Reject a group request
   */
  public async rejectGroup(target: string): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.pushUser.chat.group.reject(target);
      return { success: true };
    } catch (error) {
      console.error('Failed to reject group request:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to reject group request')
      };
    }
  }

  //---------------------------------------------------
  // SPACE REQUEST ACTIONS
  //---------------------------------------------------

  /**
   * Accept a space request
   */
  public async acceptSpace(target: string): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.pushUser.space.accept(target);
      return { success: true };
    } catch (error) {
      console.error('Failed to accept space request:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to accept space request')
      };
    }
  }

  /**
   * Reject a space request
   */
  public async rejectSpace(target: string): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.pushUser.space.reject(target);
      return { success: true };
    } catch (error) {
      console.error('Failed to reject space request:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to reject space request')
      };
    }
  }

  //---------------------------------------------------
  // REQUEST BLOCKING
  //---------------------------------------------------

  /**
   * Block users from sending requests
   */
  public async block(users: string[]): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.pushUser.chat.block(users);
      return { success: true };
    } catch (error) {
      console.error('Failed to block users:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to block users')
      };
    }
  }

  /**
   * Unblock users to allow requests
   */
  public async unblock(users: string[]): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.pushUser.chat.unblock(users);
      return { success: true };
    } catch (error) {
      console.error('Failed to unblock users:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to unblock users')
      };
    }
  }
}
