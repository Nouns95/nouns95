import { useCallback, useEffect, useState } from 'react';
import { CONSTANTS } from '@pushprotocol/restapi';
import type { 
  Message,
  MessageWithCID,
  IMessageIPFS,
  IFeeds,
  GroupDTO,
  GroupInfoDTO,
  GroupAccess,
  ChatMemberProfile,
  GroupParticipantCounts,
  ParticipantStatus
} from '@pushprotocol/restapi';
import { GroupChatService } from '../../services/groupChatService';
import { StreamService } from '../../services/streamService';

// Event type refinements
interface BaseGroupEvent {
  type: string;
  timestamp: number;
}

interface GroupMessageEvent extends BaseGroupEvent {
  type: 'message';
  toCAIP10: string;
  fromCAIP10: string;
  fromDID: string;
  toDID: string;
  messageType: string;
  messageContent: string;
  signature: string;
  sigType: string;
  link: string | null;
  encType: string;
  encryptedSecret: string | null;
}

interface GroupMemberEvent extends BaseGroupEvent {
  type: 'member';
  groupId: string;
  member: string;
  status: ParticipantStatus;
  timestamp: number;
}

interface GroupUpdateEvent extends BaseGroupEvent {
  type: 'group';
  groupId: string;
  update: {
    type: 'settings' | 'profile';
    data: unknown;
  };
}

// Type guards
function isGroupMessageEvent(data: unknown): data is GroupMessageEvent {
  if (!data || typeof data !== 'object') return false;
  const msg = data as Partial<GroupMessageEvent>;
  return msg.type === 'message' &&
    typeof msg.toCAIP10 === 'string' &&
    typeof msg.fromCAIP10 === 'string';
}

function isGroupMemberEvent(data: unknown): data is GroupMemberEvent {
  if (!data || typeof data !== 'object') return false;
  const evt = data as Partial<GroupMemberEvent>;
  return evt.type === 'member' &&
    typeof evt.groupId === 'string' &&
    typeof evt.member === 'string' &&
    typeof evt.status === 'object';
}

function isGroupUpdateEvent(data: unknown): data is GroupUpdateEvent {
  if (!data || typeof data !== 'object') return false;
  const evt = data as Partial<GroupUpdateEvent>;
  return evt.type === 'group' &&
    typeof evt.groupId === 'string' &&
    typeof evt.update === 'object' &&
    evt.update !== null;
}

// Regular state interface
interface GroupChatState {
  messages: IMessageIPFS[];
  groups: IFeeds[];
  currentGroup: (GroupInfoDTO | GroupDTO) | null;
  members: ChatMemberProfile[];
  memberCount: GroupParticipantCounts | null;
  groupAccess: GroupAccess | null;
  isLoading: boolean;
  error: Error | null;
}

// Real-time state interface
interface GroupMemberUpdate {
  lastUpdate: Date;
  type: 'member';
  data: {
    member: string;
    status: ParticipantStatus;
  };
}

interface GroupSettingsUpdate {
  lastUpdate: Date;
  type: 'settings';
  data: Record<string, unknown>;
}

interface GroupProfileUpdate {
  lastUpdate: Date;
  type: 'profile';
  data: Record<string, unknown>;
}

type GroupUpdate = GroupMemberUpdate | GroupSettingsUpdate | GroupProfileUpdate;

interface GroupChatRealTimeState {
  memberPresence: {
    [address: string]: {
      isOnline: boolean;
      lastSeen: Date | null;
      status: ParticipantStatus;
    };
  };
  groupUpdates: {
    [groupId: string]: GroupUpdate;
  };
  unreadCount: {
    [groupId: string]: number;
  };
}

export function useGroupChat(
  groupChatService: GroupChatService,
  stream: StreamService | null,
  isStreamConnected: boolean
) {
  // Regular group chat state
  const [state, setState] = useState<GroupChatState>({
    messages: [],
    groups: [],
    currentGroup: null,
    members: [],
    memberCount: null,
    groupAccess: null,
    isLoading: false,
    error: null
  });

  // Real-time state
  const [realTimeState, setRealTimeState] = useState<GroupChatRealTimeState>({
    memberPresence: {},
    groupUpdates: {},
    unreadCount: {}
  });

  //---------------------------------------------------
  // GROUP CHAT HISTORY
  //---------------------------------------------------

  /**
   * Load group chat history
   */
  const loadGroupHistory = useCallback(async (
    groupId: string,
    options?: {
      limit?: number;
      threadhash?: string;
    }
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await groupChatService.getMessageHistory(groupId, options);
      if (!result.success) {
        throw result.error || new Error('Failed to load group history');
      }

      setState(prev => ({
        ...prev,
        messages: result.data || [],
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to load group history'),
        isLoading: false
      }));
    }
  }, [groupChatService]);

  /**
   * Load all groups
   */
  const loadGroups = useCallback(async (options?: {
    page?: number;
    limit?: number;
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await groupChatService.listGroups(options);
      if (!result.success) {
        throw result.error || new Error('Failed to load groups');
      }

      setState(prev => ({
        ...prev,
        groups: result.data || [],
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to load groups'),
        isLoading: false
      }));
    }
  }, [groupChatService]);

  //---------------------------------------------------
  // GROUP INFORMATION
  //---------------------------------------------------

  /**
   * Load group information
   */
  const loadGroupInfo = useCallback(async (groupId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Load group info, members, and access in parallel
      const [groupResult, membersResult, accessResult, countResult] = await Promise.all([
        groupChatService.getGroup(groupId),
        groupChatService.getMembers(groupId),
        groupChatService.getAccess(groupId),
        groupChatService.getMemberCount(groupId)
      ]);

      if (!groupResult.success) {
        throw groupResult.error || new Error('Failed to load group info');
      }

      // Convert undefined to null for consistency
      const groupInfo = groupResult.data || null;
      const members = membersResult.success ? membersResult.data?.members || [] : [];
      const access = accessResult.success ? accessResult.data || null : null;
      const count = countResult.success ? countResult.data || null : null;

      setState(prev => ({
        ...prev,
        currentGroup: groupInfo,
        members,
        groupAccess: access,
        memberCount: count,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to load group info'),
        isLoading: false
      }));
    }
  }, [groupChatService]);

  //---------------------------------------------------
  // MESSAGE OPERATIONS
  //---------------------------------------------------

  /**
   * Send a message to the group
   */
  const sendMessage = useCallback(async (
    groupId: string,
    message: Message
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await groupChatService.sendMessage(groupId, message);
      if (!result.success) {
        throw result.error || new Error('Failed to send message');
      }

      // Convert MessageWithCID to IMessageIPFS format
      const newMessage: MessageWithCID | undefined = result.data;
      if (newMessage) {
        const messageIPFS: IMessageIPFS = {
          fromCAIP10: newMessage.fromCAIP10,
          toCAIP10: newMessage.toCAIP10,
          fromDID: newMessage.fromDID,
          toDID: newMessage.toDID,
          messageType: newMessage.messageType,
          messageContent: newMessage.messageContent,
          signature: newMessage.signature,
          sigType: newMessage.sigType,
          link: newMessage.link || null,
          timestamp: newMessage.timestamp,
          encType: newMessage.encType,
          encryptedSecret: newMessage.encryptedSecret
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, messageIPFS],
          isLoading: false
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to send message'),
        isLoading: false
      }));
    }
  }, [groupChatService]);

  //---------------------------------------------------
  // STREAM EVENT HANDLERS
  //---------------------------------------------------

  /**
   * Handle new group message from stream
   */
  const handleGroupMessage = useCallback(async (data: unknown) => {
    if (!isGroupMessageEvent(data)) return;

    try {
      // Update messages state
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, data]
      }));

      // Update unread count for the group
      const groupId = data.toCAIP10;
      setRealTimeState(prev => ({
        ...prev,
        unreadCount: {
          ...prev.unreadCount,
          [groupId]: (prev.unreadCount[groupId] || 0) + 1
        }
      }));
    } catch (error) {
      console.error('Failed to handle group message:', error);
    }
  }, []);

  /**
   * Handle member update from stream
   */
  const handleMemberUpdate = useCallback((data: unknown) => {
    if (!isGroupMemberEvent(data)) return;
    const { groupId, member, status, timestamp } = data;
    
    setRealTimeState(prev => {
      const shouldReloadMembers = status.participant !== prev.memberPresence[member]?.status.participant;
      
      const newState: GroupChatRealTimeState = {
        ...prev,
        memberPresence: {
          ...prev.memberPresence,
          [member]: {
            isOnline: status.participant && !status.pending,
            lastSeen: timestamp ? new Date(timestamp) : null,
            status
          }
        },
        groupUpdates: {
          ...prev.groupUpdates,
          [groupId]: {
            lastUpdate: new Date(),
            type: 'member',
            data: { member, status }
          }
        },
        unreadCount: prev.unreadCount
      };

      // Trigger member list reload if needed
      if (shouldReloadMembers) {
        loadGroupInfo(groupId);
      }

      return newState;
    });
  }, [loadGroupInfo]);

  /**
   * Handle group update from stream
   */
  const handleGroupUpdate = useCallback((data: unknown) => {
    if (!isGroupUpdateEvent(data)) return;
    const { groupId, update } = data;
    
    setRealTimeState(prev => ({
      ...prev,
      groupUpdates: {
        ...prev.groupUpdates,
        [groupId]: {
          lastUpdate: new Date(),
          type: update.type,
          data: update.data as Record<string, unknown>
        } as GroupUpdate
      }
    }));

    // Reload group info for significant updates
    if (['settings', 'profile'].includes(update.type)) {
      loadGroupInfo(groupId);
    }
  }, [loadGroupInfo]);

  // Set up stream event listeners when connected
  useEffect(() => {
    if (!stream || !isStreamConnected) return;

    const messageHandler = (data: unknown) => {
      if (isGroupMessageEvent(data)) handleGroupMessage(data);
    };
    const memberHandler = (data: unknown) => {
      if (isGroupMemberEvent(data)) handleMemberUpdate(data);
    };
    const groupHandler = (data: unknown) => {
      if (isGroupUpdateEvent(data)) handleGroupUpdate(data);
    };

    // Subscribe to group chat events
    stream.on(CONSTANTS.STREAM.CHAT, messageHandler);
    stream.on(CONSTANTS.STREAM.CHAT_OPS, memberHandler);
    stream.on(CONSTANTS.STREAM.CHAT_OPS, groupHandler);

    // Cleanup listeners on unmount or disconnect
    return () => {
      stream.off(CONSTANTS.STREAM.CHAT, messageHandler);
      stream.off(CONSTANTS.STREAM.CHAT_OPS, memberHandler);
      stream.off(CONSTANTS.STREAM.CHAT_OPS, groupHandler);
    };
  }, [stream, isStreamConnected, handleGroupMessage, handleMemberUpdate, handleGroupUpdate]);

  // Load groups on mount
  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  return {
    // Regular state
    messages: state.messages,
    groups: state.groups,
    currentGroup: state.currentGroup,
    members: state.members,
    memberCount: state.memberCount,
    groupAccess: state.groupAccess,
    isLoading: state.isLoading,
    error: state.error,

    // Real-time state
    memberPresence: realTimeState.memberPresence,
    groupUpdates: realTimeState.groupUpdates,
    unreadCount: realTimeState.unreadCount,

    // Group actions
    loadGroupHistory,
    loadGroups,
    loadGroupInfo,
    sendMessage,

    // Real-time actions
    markAsRead: (groupId: string) => setRealTimeState(prev => ({
      ...prev,
      unreadCount: {
        ...prev.unreadCount,
        [groupId]: 0
      }
    }))
  };
}
