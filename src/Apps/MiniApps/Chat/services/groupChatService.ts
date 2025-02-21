import { PushAPI } from '@pushprotocol/restapi';
import { ChatListType, ParticipantStatus } from '@pushprotocol/restapi/src/lib/pushapi/pushAPITypes';
import { getGroupMembersPublicKeys } from '@pushprotocol/restapi/src/lib/chat';
import type { 
  IFeeds,
  GroupDTO,
  GroupInfoDTO,
  GroupAccess,
  IMessageIPFS,
  ChatStatus,
  ChatMemberProfile,
  GroupParticipantCounts,
  Rules,
  MessageWithCID,
  Message,
  UserV2,
  GroupMembersInfo
} from '@pushprotocol/restapi/src/lib/types';
import { isErrorWithResponse, isErrorWithResponseV2, ValidationError } from '@pushprotocol/restapi/src/lib/errors/validationError';
import { HttpStatus } from '@pushprotocol/restapi/src/lib/errors/httpStatus';

//---------------------------------------------------
// GROUP CHAT SERVICE
//---------------------------------------------------

/**
 * Service responsible for managing group chat functionality
 */
export class GroupChatService {
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
  // GROUP CREATION
  //---------------------------------------------------

  /**
   * Create a new group
   */
  public async createGroup(
    name: string,
    options?: {
      description?: string;
      image?: string;
      members?: string[];
      admins?: string[];
      private?: boolean;
    }
  ): Promise<{ success: boolean; data?: GroupInfoDTO | GroupDTO; error?: Error }> {
    try {
      const group = await this.pushUser.chat.group.create(name, options);
      return { success: true, data: group };
    } catch (error) {
      console.error('Failed to create group:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to create group')
      };
    }
  }

  //---------------------------------------------------
  // GROUP INFORMATION
  //---------------------------------------------------

  /**
   * Get group information by chat id
   */
  public async getGroup(chatId: string): Promise<{ success: boolean; data?: GroupInfoDTO | GroupDTO; error?: Error }> {
    try {
      const group = await this.pushUser.chat.group.info(chatId);
      return { success: true, data: group };
    } catch (error) {
      console.error('Failed to get group:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get group')
      };
    }
  }

  /**
   * Get group by name
   */
  public async getGroupByName(groupName: string): Promise<{ success: boolean; data?: GroupInfoDTO | GroupDTO; error?: Error }> {
    try {
      const group = await this.pushUser.chat.group.info(groupName);
      return { success: true, data: group };
    } catch (error) {
      console.error('Failed to get group by name:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get group by name')
      };
    }
  }

  //---------------------------------------------------
  // GROUP UPDATES
  //---------------------------------------------------

  /**
   * Update group information
   */
  public async updateGroup(
    chatId: string,
    options: {
      description?: string;
      image?: string;
      name?: string;
    }
  ): Promise<{ success: boolean; data?: GroupInfoDTO | GroupDTO; error?: Error }> {
    try {
      const updated = await this.pushUser.chat.group.update(chatId, options);
      return { success: true, data: updated };
    } catch (error) {
      console.error('Failed to update group:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to update group')
      };
    }
  }

  //---------------------------------------------------
  // MEMBER MANAGEMENT
  //---------------------------------------------------

  /**
   * Add members to group
   */
  public async addMembers(chatId: string, members: string[]): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.pushUser.chat.group.add(chatId, { role: 'MEMBER', accounts: members });
      return { success: true };
    } catch (error) {
      console.error('Failed to add members:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to add members')
      };
    }
  }

  /**
   * Remove members from group
   */
  public async removeMembers(chatId: string, members: string[]): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.pushUser.chat.group.remove(chatId, { accounts: members });
      return { success: true };
    } catch (error) {
      console.error('Failed to remove members:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to remove members')
      };
    }
  }

  /**
   * Add admins to group
   */
  public async addAdmins(chatId: string, admins: string[]): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.pushUser.chat.group.add(chatId, { role: 'ADMIN', accounts: admins });
      return { success: true };
    } catch (error) {
      console.error('Failed to add admins:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to add admins')
      };
    }
  }

  /**
   * Remove admins from group
   */
  public async removeAdmins(chatId: string, admins: string[]): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.pushUser.chat.group.remove(chatId, { accounts: admins });
      return { success: true };
    } catch (error) {
      console.error('Failed to remove admins:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to remove admins')
      };
    }
  }

  //---------------------------------------------------
  // GROUP ACCESS & ROLES
  //---------------------------------------------------

  /**
   * Get group access control
   */
  public async getAccess(chatId: string): Promise<{ success: boolean; data?: GroupAccess; error?: Error }> {
    try {
      const access = await this.pushUser.chat.group.permissions(chatId);
      return { success: true, data: access };
    } catch (error) {
      console.error('Failed to get group access:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get group access')
      };
    }
  }

  /**
   * Modify member role
   */
  public async modifyMemberRole(
    chatId: string, 
    member: string, 
    role: 'ADMIN' | 'MEMBER'
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.pushUser.chat.group.modify(chatId, {
        role,
        accounts: [member]
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to modify member role:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to modify member role')
      };
    }
  }

  //---------------------------------------------------
  // GROUP MESSAGES
  //---------------------------------------------------

  /**
   * Send a message to the group
   */
  public async sendMessage(
    chatId: string,
    message: Message
  ): Promise<{ success: boolean; data?: MessageWithCID; error?: Error }> {
    try {
      const sent = await this.pushUser.chat.send(chatId, message);
      return { success: true, data: sent };
    } catch (error) {
      console.error('Failed to send message:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to send message')
      };
    }
  }

  /**
   * Get group message history
   */
  public async getMessageHistory(
    chatId: string,
    options?: {
      limit?: number;
      threadhash?: string;
    }
  ): Promise<{ success: boolean; data?: IMessageIPFS[]; error?: Error }> {
    try {
      const messages = await this.pushUser.chat.history(chatId, options);
      return { success: true, data: messages };
    } catch (error) {
      console.error('Failed to get message history:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get message history')
      };
    }
  }

  /**
   * Get latest message in group
   */
  public async getLatestMessage(chatId: string): Promise<{ success: boolean; data?: IMessageIPFS; error?: Error }> {
    try {
      const message = await this.pushUser.chat.latest(chatId);
      return { success: true, data: message as IMessageIPFS };
    } catch (error) {
      console.error('Failed to get latest message:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get latest message')
      };
    }
  }

  //---------------------------------------------------
  // GROUP SEARCH & LISTING
  //---------------------------------------------------

  /**
   * List all groups
   */
  public async listGroups(options?: {
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data?: IFeeds[]; error?: Error }> {
    try {
      const groups = await this.pushUser.chat.list(ChatListType.CHATS, {
        page: options?.page,
        limit: options?.limit
      });
      return { success: true, data: groups };
    } catch (error) {
      console.error('Failed to list groups:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to list groups')
      };
    }
  }

  /**
   * List groups by search term
   * Note: Currently using list method as search is not directly supported
   */
  public async searchGroups(
    searchTerm: string,
    options?: {
      pageNumber?: number;
      pageSize?: number;
    }
  ): Promise<{ success: boolean; data?: IFeeds[]; error?: Error }> {
    try {
      const allGroups = await this.pushUser.chat.list(ChatListType.CHATS, {
        page: options?.pageNumber,
        limit: options?.pageSize
      });
      
      // Client-side filtering since the API doesn't support search directly
      const searchTermLower = searchTerm.toLowerCase();
      const filteredGroups = allGroups.filter(group => {
        const content = group.msg?.messageContent || '';
        return content.toLowerCase().includes(searchTermLower);
      });
      
      return { success: true, data: filteredGroups };
    } catch (error) {
      console.error('Failed to search groups:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to search groups')
      };
    }
  }

  //---------------------------------------------------
  // MEMBER INFORMATION
  //---------------------------------------------------

  /**
   * Get group members with pagination and filters
   */
  public async getMembers(
    chatId: string,
    options?: {
      page?: number;
      limit?: number;
      pending?: boolean;
      role?: string;
    }
  ): Promise<{ success: boolean; data?: GroupMembersInfo; error?: Error }> {
    try {
      const response = await this.pushUser.chat.group.participants.list(chatId, options);
      return { 
        success: true, 
        data: {
          totalMembersCount: response.members.length,
          members: response.members
        }
      };
    } catch (error) {
      console.error('Failed to get members:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get members')
      };
    }
  }

  /**
   * Helper method to format user info
   */
  private formatUserInfo(userInfo: {
    did: string;
    wallets: string;
    profile?: {
      name?: string | null;
      desc?: string | null;
      picture?: string | null;
      profileVerificationProof?: string | null;
      blockedUsersList?: string[] | null;
    };
    msgSent?: number;
    maxMsgPersisted?: number;
    encryptedPrivateKey?: string | null;
    publicKey?: string | null;
    verificationProof?: string | null;
    origin?: string | null;
  }): UserV2 {
    return {
      did: userInfo.did,
      wallets: userInfo.wallets,
      profile: {
        name: userInfo.profile?.name || null,
        desc: userInfo.profile?.desc || null,
        picture: userInfo.profile?.picture || null,
        profileVerificationProof: userInfo.profile?.profileVerificationProof || null,
        blockedUsersList: userInfo.profile?.blockedUsersList || null
      },
      msgSent: userInfo.msgSent || 0,
      maxMsgPersisted: userInfo.maxMsgPersisted || 0,
      encryptedPrivateKey: userInfo.encryptedPrivateKey || null,
      publicKey: userInfo.publicKey || null,
      verificationProof: userInfo.verificationProof || null,
      origin: userInfo.origin || null
    };
  }

  /**
   * Get member profile
   */
  public async getMemberProfile(
    chatId: string,
    address: string
  ): Promise<{ success: boolean; data?: ChatMemberProfile; error?: Error }> {
    try {
      const members = await this.pushUser.chat.group.participants.list(chatId);
      const member = members.members.find(m => m.address.toLowerCase() === address.toLowerCase());
      
      if (!member) {
        throw new Error('Member not found');
      }

      return { 
        success: true, 
        data: {
          address: member.address,
          intent: member.intent,
          role: member.role,
          userInfo: this.formatUserInfo(member.userInfo)
        }
      };
    } catch (error) {
      console.error('Failed to get member profile:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get member profile')
      };
    }
  }

  /**
   * Get member count
   */
  public async getMemberCount(chatId: string): Promise<{ success: boolean; data?: GroupParticipantCounts; error?: Error }> {
    try {
      const count = await this.pushUser.chat.group.participants.count(chatId);
      return { success: true, data: count };
    } catch (error) {
      console.error('Failed to get member count:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get member count')
      };
    }
  }

  /**
   * Get member status
   */
  public async getMemberStatus(
    chatId: string,
    account: string
  ): Promise<{ success: boolean; data?: ParticipantStatus; error?: Error }> {
    try {
      const status = await this.pushUser.chat.group.participants.status(chatId, { overrideAccount: account });
      return { success: true, data: status };
    } catch (error) {
      console.error('Failed to get member status:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get member status')
      };
    }
  }

  //---------------------------------------------------
  // GROUP CONFIGURATION
  //---------------------------------------------------

  /**
   * Get public keys of all group members
   */
  public async getMembersPublicKeys(
    chatId: string
  ): Promise<{ 
    success: boolean; 
    data?: Array<{ did: string; publicKey: string }>; 
    error?: Error 
  }> {
    try {
      const response = await getGroupMembersPublicKeys({
        chatId,
        env: this.pushUser.env
      });
      return { success: true, data: response.members };
    } catch (error) {
      console.error('Failed to get member public keys:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get member public keys')
      };
    }
  }

  /**
   * Get detailed chat info including encryption status and visibility
   */
  public async getChatInfo(chatId: string): Promise<{ 
    success: boolean; 
    data?: { 
      meta: {
        group: boolean;
        encrypted: boolean;
        visibility: boolean;
        groupInfo: {
          public: boolean;
        };
      };
      list: string;
      participants: string[];
      chatId: string;
      recipient: string;
    }; 
    error?: Error 
  }> {
    try {
      const info = await this.pushUser.chat.info(chatId);
      return { success: true, data: info };
    } catch (error) {
      console.error('Failed to get chat info:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get chat info')
      };
    }
  }

  /**
   * Update group configuration
   */
  public async updateConfig(
    chatId: string,
    config: {
      meta?: string;
      scheduleAt?: Date;
      scheduleEnd?: Date;
      status?: ChatStatus;
    }
  ): Promise<{ success: boolean; data?: GroupDTO | GroupInfoDTO; error?: Error }> {
    try {
      const updated = await this.pushUser.chat.group.update(chatId, {
        ...config,
        meta: config.meta || undefined
      });
      return { success: true, data: updated };
    } catch (error) {
      console.error('Failed to update group config:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to update group config')
      };
    }
  }

  /**
   * Update group profile
   */
  public async updateProfile(
    chatId: string,
    profile: {
      name?: string;
      description?: string;
      image?: string;
      rules?: Rules;
    }
  ): Promise<{ success: boolean; data?: GroupDTO | GroupInfoDTO; error?: Error }> {
    try {
      const updated = await this.pushUser.chat.group.update(chatId, profile);
      return { success: true, data: updated };
    } catch (error) {
      console.error('Failed to update group profile:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to update group profile')
      };
    }
  }

  //---------------------------------------------------
  // GROUP CONVERSATION
  //---------------------------------------------------

  /**
   * Get group conversation hash
   */
  public async getConversationHash(chatId: string): Promise<{ success: boolean; data?: string; error?: Error }> {
    try {
      const history = await this.pushUser.chat.history(chatId, { limit: 1 });
      const hash = history[0]?.threadhash || '';
      return { success: true, data: hash };
    } catch (error) {
      console.error('Failed to get conversation hash:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get conversation hash')
      };
    }
  }
} 