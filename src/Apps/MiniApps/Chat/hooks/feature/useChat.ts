import { useCallback, useEffect, useState } from 'react';
import { CONSTANTS, GroupEventType } from '@pushprotocol/restapi';
import type { 
  Message,
  MessageEvent,
  GroupMemberEventBase,
  NotificationEvent,
  GroupEventBase,
  SpaceMemberEventBase,
  VideoEventType
} from '@pushprotocol/restapi';
import { ChatService } from '../../services/chatService';
import { StreamService } from '../../services/streamService';
import { PushMessage } from '../../services/chatService';

// Chat event type refinements
interface ChatMessageEvent {
  type: 'Text' | 'Image' | 'File';
  content: string;
}

interface ChatEventData {
  chatId: string;
  event: 'chat.message';
  from: string;
  message: ChatMessageEvent;
  meta: {
    group: boolean;
  };
  origin: 'other' | 'self';
  reference: string;
  timestamp: string;
  to: string[];
}

// Update type guard to match actual event structure
function isChatEventData(data: unknown): data is ChatEventData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const event = data as Record<string, unknown>;
  
  // Check required fields and their types
  const hasRequiredFields = 
    'event' in event && event.event === 'chat.message' &&
    'from' in event && typeof event.from === 'string' &&
    'to' in event && Array.isArray(event.to) &&
    'message' in event && typeof event.message === 'object' &&
    'timestamp' in event && typeof event.timestamp === 'string' &&
    'chatId' in event && typeof event.chatId === 'string' &&
    'reference' in event && typeof event.reference === 'string';

  if (!hasRequiredFields) {
    console.warn('Event missing required fields:', event);
    return false;
  }

  // Validate message object
  const msg = event.message as Record<string, unknown>;
  const hasValidMessage = 
    'type' in msg && typeof msg.type === 'string' &&
    'content' in msg && typeof msg.content === 'string';

  if (!hasValidMessage) {
    console.warn('Invalid message structure:', msg);
    return false;
  }

  return true;
}

// Regular state interface
interface ChatState {
  messages: PushMessage[];
  isLoading: boolean;
  chats: PushMessage[];
  chatListLoading: boolean;
  chatHistoryLoading: boolean;
  chatListError: Error | null;
  chatHistoryError: Error | null;
}

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  chats: [],
  chatListLoading: false,
  chatHistoryLoading: false,
  chatListError: null,
  chatHistoryError: null
};

// Real-time state interface
interface ChatRealTimeState {
  onlineUsers: {
    [address: string]: {
      isOnline: boolean;
      lastSeen: Date | null;
      unreadCount: number;
    };
  };
  readReceipts: {
    [messageId: string]: {
      readBy: string[];
      timestamp: Date;
    };
  };
  unreadCount: number;
}

export const useChat = (
  chatService: ChatService | null,
  stream: StreamService | null,
  isStreamConnected: boolean
) => {
  // Regular chat state
  const [state, setState] = useState<ChatState>(initialState);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  // Real-time state
  const [realTimeState, setRealTimeState] = useState<ChatRealTimeState>({
    onlineUsers: {},
    readReceipts: {},
    unreadCount: 0
  });

  //---------------------------------------------------
  // CHAT HISTORY
  //---------------------------------------------------

  /**
   * Get conversation hash (IPFS CID) for a chat
   */
  const getConversationHash = useCallback(async (
    target: string
  ): Promise<{ threadHash: string; intent: boolean }> => {
    try {
      if (!chatService) {
        return { threadHash: '', intent: false };
      }
      // Get the latest message to get the thread hash
      const history = await chatService.getHistory(target, { limit: 1 });
      if (!history?.success || !history?.data || history.data.length === 0) {
        return {
          threadHash: '',
          intent: false
        };
      }

      return { 
        threadHash: history.data[0].link || '', 
        intent: false
      };
    } catch (error) {
      console.error('Failed to get conversation hash:', error);
      return {
        threadHash: '',
        intent: false
      };
    }
  }, [chatService]);

  /**
   * Mark messages from a specific chat as read
   */
  const markChatAsRead = useCallback(() => {
    setRealTimeState(prev => {
      // Get the current chat's DID
      const chatDID = selectedChat?.replace('eip155:', '');
      if (!chatDID) return prev;

      // Reset unread count for this chat
      return {
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - (prev.onlineUsers[chatDID]?.unreadCount || 0)),
        onlineUsers: {
          ...prev.onlineUsers,
          [chatDID]: {
            ...prev.onlineUsers[chatDID],
            unreadCount: 0
          }
        }
      };
    });
  }, [selectedChat]);

  /**
   * Load chat history with a user
   */
  const loadChatHistory = useCallback(async (
    target: string,
    options?: {
      reference?: string | null;
      limit?: number;
    }
  ) => {
    // Store the selected chat and mark as read
    setSelectedChat(target);
    markChatAsRead();
    
    // Check if we have a valid chat service and stream connection
    if (!chatService) {
      console.error('Chat service not initialized');
      setState(prev => ({
        ...prev,
        chatHistoryError: new Error('Chat service not initialized'),
        chatHistoryLoading: false
      }));
      return;
    }

    if (!isStreamConnected) {
      console.error('Stream not connected');
      setState(prev => ({
        ...prev,
        chatHistoryError: new Error('Stream not connected'),
        chatHistoryLoading: false
      }));
      return;
    }

    setState(prev => ({ ...prev, chatHistoryLoading: true, chatHistoryError: null }));

    try {
      // Get chat info first to ensure the chat exists
      const chatInfo = await chatService.getChatInfo(target);
// Debug comment removed
      if (!chatInfo.success || !chatInfo.data) {
        throw new Error('Failed to get chat info');
      }

      // Use the recipient from chat info if available, and strip eip155: prefix
      const targetAddress = (chatInfo.data.recipient || target).replace('eip155:', '');
      // Comment removed

      // Get conversation hash first
      await getConversationHash(targetAddress);
      // Comment removed

      // Get chat history
      const result = await chatService.getHistory(targetAddress, {
        ...options,
        limit: options?.limit || 30
      });
      // Comment removed
      
      if (!result.success) {
        throw result.error || new Error('Failed to load chat history');
      }

      // Convert messages to PushMessage format
      const messages = result.data?.map(msg => ({
        link: msg.link || null,
        toDID: msg.toDID || '',
        encType: msg.encType || 'PlainText',
        fromDID: msg.fromDID || '',
        sigType: msg.sigType || '',
        toCAIP10: msg.toCAIP10 || '',
        signature: msg.signature || '',
        timestamp: typeof msg.timestamp === 'number' ? msg.timestamp : Date.now(),
        fromCAIP10: msg.fromCAIP10 || '',
        messageType: msg.messageType || 'Text',
        messageContent: msg.messageContent || '',
        encryptedSecret: msg.encryptedSecret || ''
      } as PushMessage)) || [];

      setState(prev => {
        // Update messages state
        return {
        ...prev,
          messages,
          chatHistoryLoading: false
        };
      });
    } catch (error) {
      console.error('Error loading chat history:', error);
      setState(prev => ({
        ...prev,
        chatHistoryError: error instanceof Error ? error : new Error('Failed to load chat history'),
        chatHistoryLoading: false
      }));
    }
  }, [chatService, isStreamConnected, getConversationHash, markChatAsRead]);

  /**
   * Load all chats
   */
  const loadChats = useCallback(async () => {
    if (!chatService) {
      setState(prev => ({
        ...prev,
        chatListError: new Error('Chat service not initialized'),
        chatListLoading: false
      }));
      return;
    }

    setState(prev => ({ ...prev, chatListLoading: true, chatListError: null }));

    try {
      // Comment removed
      const result = await chatService.checkChatExists('');
      // Comment removed

      if (!result?.success) {
        throw result?.error || new Error('Failed to load chats');
      }

      // Convert raw messages to PushMessage format and filter out invalid chats
      const chats = result.data
        ?.filter(chat => {
          // Filter out chats with null did or invalid message structure
          const isValid = chat && 
            typeof chat.did === 'string' && 
            chat.did.length > 0 &&
            chat.msg && 
            typeof chat.msg === 'object';
          
          if (!isValid) {
            console.warn('Filtered out invalid chat:', chat);
          }
          return isValid;
        })
        .map(chat => {
// Debug comment removed
          // Extract message fields from the nested msg object
          const msg = chat.msg || {};
          const timestamp = msg.timestamp || Date.now();
          
          const pushMessage = {
            link: msg.link || null,
            toDID: msg.toDID || '',
            encType: msg.encType || 'PlainText',
            fromDID: chat.did, // Use chat.did as fromDID for consistency
            sigType: msg.sigType || '',
            toCAIP10: msg.toCAIP10 || '',
            signature: msg.signature || '',
            timestamp: typeof timestamp === 'number' ? timestamp : Date.now(),
            fromCAIP10: msg.fromCAIP10 || chat.did, // Use chat.did as fallback
            messageType: msg.messageType || 'Text',
            messageContent: msg.messageContent || '',
            encryptedSecret: msg.encryptedSecret || '',
            profilePicture: chat.profilePicture || null,
            name: chat.name || null
          } as PushMessage;

          // Initialize online status for this chat
          const chatDID = chat.did.replace('eip155:', '');
          setRealTimeState(prev => ({
            ...prev,
            onlineUsers: {
              ...prev.onlineUsers,
              [chatDID]: {
                isOnline: true, // Assume online initially
                lastSeen: new Date(),
                unreadCount: prev.onlineUsers[chatDID]?.unreadCount || 0
              }
            }
          }));

          // Comment removed
          return pushMessage;
        }) || [];

      // Comment removed

      setState(prev => ({
        ...prev,
        chats,
        chatListLoading: false
      }));
    } catch (error) {
      console.error('Error loading chats:', error);
      setState(prev => ({
        ...prev,
        chatListError: error instanceof Error ? error : new Error('Failed to load chats'),
        chatListLoading: false
      }));
    }
  }, [chatService]);

  //---------------------------------------------------
  // MESSAGE OPERATIONS
  //---------------------------------------------------

  /**
   * Send a message
   */
  const sendMessage = useCallback(async (
    recipient: string,
    message: Message
  ) => {
    if (!chatService) {
      setState(prev => ({
        ...prev,
        chatHistoryError: new Error('Chat service not initialized'),
        isLoading: false
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await chatService.sendMessage(recipient, message);
      if (!result?.success || !result?.data) {
        throw result?.error || new Error('Failed to send message');
      }

      // Decrypt the message before adding to state
      const decryptResult = await chatService.decryptMessages([result.data]);
      if (!decryptResult?.success || !decryptResult?.data) {
        throw decryptResult?.error || new Error('Failed to decrypt message');
      }

      // Use the decrypted message
      const decryptedMessage = decryptResult.data[0];
      
      // Convert decrypted message to PushMessage format
      const newMessage: PushMessage = {
        link: decryptedMessage.link || null,
        toDID: decryptedMessage.toDID || '',
        encType: decryptedMessage.encType || 'PlainText',
        fromDID: decryptedMessage.fromDID || '',
        sigType: decryptedMessage.sigType || '',
        toCAIP10: decryptedMessage.toCAIP10 || '',
        signature: decryptedMessage.signature || '',
        timestamp: decryptedMessage.timestamp || Date.now(),
        fromCAIP10: decryptedMessage.fromCAIP10 || '',
        messageType: decryptedMessage.messageType || 'Text',
        messageContent: decryptedMessage.messageContent || '',
        encryptedSecret: decryptedMessage.encryptedSecret || ''
      };

      // Add message to messages state
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage],
        isLoading: false
      }));

      // Check if this is a new chat
      const recipientDID = recipient.replace('eip155:', '');
      setState(prev => {
        // Check if chat already exists
        const existingChatIndex = prev.chats.findIndex(chat => {
          const chatDID = chat.fromDID.replace('eip155:', '');
          return chatDID === recipientDID;
        });

        // If chat exists, update the last message
        if (existingChatIndex >= 0) {
          const updatedChats = [...prev.chats];
          updatedChats[existingChatIndex] = {
            ...updatedChats[existingChatIndex],
          messageContent: newMessage.messageContent,
            timestamp: newMessage.timestamp
          };
          
          // Move updated chat to top
          updatedChats.unshift(...updatedChats.splice(existingChatIndex, 1));
          
          return {
            ...prev,
            chats: updatedChats
          };
        }

        // If new chat, add to top of the list
        const newChatEntry = {
          ...newMessage,
          profilePicture: null, // Will be updated when user info is fetched
          name: recipientDID // Use address as name initially
        };

        return {
          ...prev,
          chats: [newChatEntry, ...prev.chats]
        };
      });

      // Scroll to bottom after sending
      setTimeout(() => {
        const scrollContainer = document.querySelector('.win95-scrollable-content');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }, 100);
    } catch (error) {
      setState(prev => ({
        ...prev,
        chatHistoryError: error instanceof Error ? error : new Error('Failed to send message'),
        isLoading: false
      }));
    }
  }, [chatService]);

  //---------------------------------------------------
  // STREAM EVENT HANDLERS
  //---------------------------------------------------

  /**
   * Process a decrypted message and update state
   */
  const handleDecryptedMessage = useCallback(async (message: PushMessage) => {
    // Strip eip155: prefix for comparison
    const messageFrom = message.fromDID.replace('eip155:', '');
    const messageTo = message.toDID.replace('eip155:', '');
    const currentChat = selectedChat?.replace('eip155:', '');

    // Check if message belongs to current chat
    const isRelevantMessage = currentChat && (
      messageFrom === currentChat ||
      messageTo === currentChat
    );

// Debug comment removed
    // Only add message to state if it's from someone else
    // This prevents duplicate messages when we send them
    if (isRelevantMessage && !chatService) {
      console.warn('Chat service not initialized');
      return;
    }

    if (isRelevantMessage) {
      const userInfo = await chatService?.getUserInfo();
      const isFromUs = userInfo?.success && userInfo.data?.did === messageFrom;

      // Only add message to state if it's not from us
      if (!isFromUs) {
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, message]
        }));

        // Scroll to bottom after adding new message
        setTimeout(() => {
          const scrollContainer = document.querySelector('.win95-scrollable-content');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            // Comment removed
          }
        }, 100);
      }
    }
  }, [selectedChat, chatService]);

  /**
   * Handle new message from stream
   */
  const handleNewMessage = useCallback(async (data: unknown) => {
    if (!chatService || !isChatEventData(data)) {
      // Comment removed
      return;
    }

    try {
      // Check if message is from us before processing
      const userAccount = await chatService.getUserInfo();
// Debug comment removed
      const isFromUs = userAccount?.success && data.from === userAccount.data?.did;

// Debug comment removed
      // Skip processing if message is from us since we already added it in sendMessage
      if (isFromUs) {
        // Comment removed
        return;
      }

      // For real-time messages, we don't need to decrypt them as they come unencrypted
      // We just need to format them correctly
      const message: PushMessage = {
        link: data.reference || null,
        toDID: data.to[0] || '',
        encType: 'PlainText', // Real-time messages are not encrypted
        fromDID: data.from || '',
        sigType: 'pgp',
        toCAIP10: data.to[0] || '',
        signature: '',
        timestamp: parseInt(data.timestamp),
        fromCAIP10: data.from || '',
        messageType: data.message.type || 'Text',
        messageContent: data.message.content || '',
        encryptedSecret: ''
      };

      // Process the message directly since it's already decrypted
      handleDecryptedMessage(message);

      // Get the DIDs without eip155: prefix for comparison
      const messageFromDID = data.from.replace('eip155:', '');
      const currentSelectedChat = selectedChat?.replace('eip155:', '');
      
// Debug comment removed
      // Always increment unread count if the message is not from the currently selected chat
      if (messageFromDID !== currentSelectedChat) {
        setRealTimeState(prev => {
          // Initialize the user's state if it doesn't exist
          const currentUserState = prev.onlineUsers[messageFromDID] || {
            isOnline: true,
            lastSeen: new Date(),
            unreadCount: 0
          };
          
          const newState = {
            ...prev,
            unreadCount: prev.unreadCount + 1,
            onlineUsers: {
              ...prev.onlineUsers,
              [messageFromDID]: {
                ...currentUserState,
                isOnline: true,
                lastSeen: new Date(),
                unreadCount: (currentUserState.unreadCount || 0) + 1
              }
            }
          };
          
// Comment removed          
          return newState;
        });
      }

      // Update chat list while preserving order and selection
      setState(prev => {
        // Find existing chat
        const existingChatIndex = prev.chats.findIndex(chat => {
          const chatDID = chat.fromDID.replace('eip155:', '');
          const fromDID = data.from.replace('eip155:', '');
          return chatDID === fromDID;
        });

        // Get current unread count for this chat from realTimeState
        // Get current unread count

// Debug comment removed
        // Create new chat entry
        const newChatEntry = {
          ...message,
          profilePicture: existingChatIndex >= 0 ? prev.chats[existingChatIndex].profilePicture : null,
          name: existingChatIndex >= 0 ? prev.chats[existingChatIndex].name : null
        };

        // If chat exists, update it in place
        if (existingChatIndex >= 0) {
          const updatedChats = [...prev.chats];
          updatedChats[existingChatIndex] = newChatEntry;
          
          // Move updated chat to top
          updatedChats.unshift(...updatedChats.splice(existingChatIndex, 1));
          
// Comment removed          
          return {
        ...prev,
            chats: updatedChats
          };
        }

        // If new chat, add to top
// Debug comment removed
        return {
          ...prev,
          chats: [newChatEntry, ...prev.chats]
        };
      });
    } catch (error) {
      console.error('❌ Error processing chat message:', error);
    }
  }, [chatService, handleDecryptedMessage, selectedChat]);

  /**
   * Handle presence update from stream
   */
  const handlePresence = useCallback((data: unknown) => {
    if (
      !data ||
      typeof data !== 'object' ||
      !('event' in data) ||
      !('from' in data) ||
      !('timestamp' in data)
    ) {
      return;
    }

    const presenceData = data as GroupMemberEventBase;
    if (presenceData.event !== GroupEventType.JoinGroup && presenceData.event !== GroupEventType.LeaveGroup) {
      return;
    }

    const isOnline = presenceData.event === GroupEventType.JoinGroup;
    const fromDID = presenceData.from.replace('eip155:', '');
    
    setRealTimeState(prev => ({
      ...prev,
      onlineUsers: {
        ...prev.onlineUsers,
        [fromDID]: {
          isOnline,
          lastSeen: isOnline ? new Date() : new Date(presenceData.timestamp),
          unreadCount: prev.onlineUsers[fromDID]?.unreadCount || 0
        }
      }
    }));

    // If a user comes online, update their status in the chat list
    if (isOnline) {
      setState(prev => {
        const updatedChats = prev.chats.map(chat => {
          if (chat.fromDID.replace('eip155:', '') === fromDID) {
            return { ...chat };
          }
          return chat;
        });
        return { ...prev, chats: updatedChats };
      });
    }
  }, []);

  /**
   * Handle read receipt from stream
   */
  const handleReadReceipt = useCallback((data: unknown) => {
    if (
      !data ||
      typeof data !== 'object' ||
      !('message' in data) ||
      !('reference' in data) ||
      !('from' in data) ||
      !('timestamp' in data)
    ) {
      return;
    }

    const receiptData = data as MessageEvent;
    if (receiptData.message?.type !== 'read' || !receiptData.reference) {
      return;
    }
    
    setRealTimeState(prev => ({
      ...prev,
      readReceipts: {
        ...prev.readReceipts,
        [receiptData.reference]: {
          readBy: [...(prev.readReceipts[receiptData.reference]?.readBy || []), receiptData.from],
          timestamp: new Date(receiptData.timestamp)
        }
      }
    }));
  }, []);

  // Set up stream event listeners when connected
  useEffect(() => {
    if (!stream || !isStreamConnected) return;

    // Subscribe to chat events with type assertions for the handlers
    stream.on(CONSTANTS.STREAM.CHAT, handleNewMessage as (data: MessageEvent | NotificationEvent | GroupEventBase | SpaceMemberEventBase | VideoEventType) => void);
    stream.on(CONSTANTS.STREAM.CHAT_OPS, handlePresence as (data: MessageEvent | NotificationEvent | GroupEventBase | SpaceMemberEventBase | VideoEventType) => void);
    stream.on(CONSTANTS.STREAM.CHAT_OPS, handleReadReceipt as (data: MessageEvent | NotificationEvent | GroupEventBase | SpaceMemberEventBase | VideoEventType) => void);

    // Debug log for stream connection
    // Comment removed

    // Cleanup listeners on unmount or disconnect
    return () => {
      stream.off(CONSTANTS.STREAM.CHAT, handleNewMessage as (data: MessageEvent | NotificationEvent | GroupEventBase | SpaceMemberEventBase | VideoEventType) => void);
      stream.off(CONSTANTS.STREAM.CHAT_OPS, handlePresence as (data: MessageEvent | NotificationEvent | GroupEventBase | SpaceMemberEventBase | VideoEventType) => void);
      stream.off(CONSTANTS.STREAM.CHAT_OPS, handleReadReceipt as (data: MessageEvent | NotificationEvent | GroupEventBase | SpaceMemberEventBase | VideoEventType) => void);
      // Comment removed
    };
  }, [stream, isStreamConnected, handleNewMessage, handlePresence, handleReadReceipt]);

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  return {
    // Regular state
    messages: state.messages,
    chats: state.chats,
    isLoading: state.chatHistoryLoading,
    error: state.chatHistoryError,
    chatListLoading: state.chatListLoading,
    chatListError: state.chatListError,
    selectedChat,

    // Real-time state
    onlineUsers: realTimeState.onlineUsers,
    readReceipts: realTimeState.readReceipts,
    unreadCount: realTimeState.unreadCount,

    // Chat actions
    loadChatHistory,
    loadChats,
    sendMessage,
    markChatAsRead,

    // Real-time actions
    markAsRead: () => setRealTimeState(prev => ({ ...prev, unreadCount: 0 })),

    // New actions
    getConversationHash
  };
}
