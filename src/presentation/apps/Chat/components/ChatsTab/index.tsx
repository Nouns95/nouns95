import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useChat } from '../../hooks/feature/useChat';
import { useNotifications } from '../../hooks/feature/useNotifications';
import { useChatContext } from '../../context/ChatContext';
import type { PushMessage } from '../../services/chatService';
import styles from './ChatsTab.module.css';

interface ChatsTabProps {
  selectedChat: string | null;
  setSelectedChat: (chat: string | null) => void;
  chatState: ReturnType<typeof useChat>;
  notificationState: ReturnType<typeof useNotifications>;
}

export const ChatsTab: React.FC<ChatsTabProps> = ({ 
  selectedChat,
  setSelectedChat,
  chatState,
  notificationState
}) => {
  const { pushUser } = useChatContext();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chatListRef = useRef<HTMLDivElement>(null);

  const { 
    chats,
    messages,
    sendMessage,
    loadChatHistory,
    isLoading: chatHistoryLoading,
    error: chatHistoryError,
    chatListLoading,
    chatListError,
    onlineUsers
  } = chatState;

  const {
    isLoading: notifLoading,
    error: notifError,
    lastNotification
  } = notificationState;

  // Add effect to check if chat list is scrollable
  useEffect(() => {
    const chatListElement = chatListRef.current;
    
    const checkIfScrollable = () => {
      if (chatListElement) {
        const isScrollable = chatListElement.scrollHeight > chatListElement.clientHeight;
        if (isScrollable) {
          chatListElement.classList.add('scrollable');
        } else {
          chatListElement.classList.remove('scrollable');
        }
      }
    };

    // Check initially and whenever chats change
    checkIfScrollable();
    
    // Add resize observer to check when container size changes
    const resizeObserver = new ResizeObserver(checkIfScrollable);
    if (chatListElement) {
      resizeObserver.observe(chatListElement);
    }

    return () => {
      if (chatListElement) {
        resizeObserver.unobserve(chatListElement);
      }
      resizeObserver.disconnect();
    };
  }, [chats]);

  // Explicitly type messages array when sorting
  const sortedMessages = [...messages].sort((a: PushMessage, b: PushMessage) => a.timestamp - b.timestamp);

  // Show notification badge or alert for new notifications
  useEffect(() => {
    if (lastNotification) {
      // You could show a toast/alert here
      console.log('New notification:', lastNotification);
    }
  }, [lastNotification]);

  // Update message comparison logic
  const isOwnMessage = (msg: PushMessage): boolean => {
    if (!pushUser) return false;
    
    // Try different possible formats
    const userAddresses = [
      pushUser.account,
      pushUser.account.toLowerCase(),
      `eip155:${pushUser.account}`,
      `eip155:${pushUser.account.toLowerCase()}`
    ];
    
    return userAddresses.some(address => 
      msg.fromDID === address || 
      msg.fromCAIP10 === address
    );
  };

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current.parentElement;
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  // Scroll to bottom when messages load or new messages arrive
  useEffect(() => {
    if (!chatHistoryLoading && messages.length > 0) {
      scrollToBottom();
    }
  }, [chatHistoryLoading, messages, selectedChat]);

  return (
    <div className={styles.container}>
      {/* Chat list section */}
      <div className={styles.chatList}>
        <div className={styles.chatListHeader}>
          {/* Remove notification badge from header */}
        </div>
        <div className="win95-scrollable-container">
          <div className="win95-scrollable-content" ref={chatListRef}>
            {(chatListError || notifError) ? (
              <div className={styles.errorState}>
                <div className={styles.errorMessage}>
                  {chatListError?.message || notifError?.message}
                </div>
                <button 
                  className={styles.retryButton}
                  onClick={() => {
                    if (chatListError) loadChatHistory(selectedChat || '');
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (chatListLoading || notifLoading) ? (
              <div className={styles.loadingState}>
                {chatListLoading ? 'Loading chats...' : 'Loading notifications...'}
              </div>
            ) : (
              <>
                {chats
                  .filter(chat => (
                    (chat.messageType === 'Text' || chat.messageType === 'Image') &&
                    chat.fromDID !== null && 
                    typeof chat.fromDID === 'string' &&
                    chat.fromDID.length > 0
                  ))
                  .map((chat, index) => {
                    const isActive = selectedChat === chat.fromDID;
                    const chatDID = chat.fromDID.replace('eip155:', '');
                    // Check if this chat has unread messages by comparing with the unread state
                    const unreadCount = onlineUsers[chatDID]?.unreadCount || 0;
                    const hasUnread = !isActive && unreadCount > 0;
                    
                    console.log('🎯 Rendering chat item:', {
                      chatId: chat.fromDID,
                      isActive,
                      hasUnread,
                      unreadCount,
                      message: chat.messageContent
                    });
                    
                    return (
                      <div 
                        key={`${chat.fromDID || ''}-${chat.toCAIP10 || ''}-${index}`}
                        className={`${styles.chatItem} ${isActive ? styles.active : ''}`}
                        onClick={() => {
                          if (!isActive) {
                            setSelectedChat(chat.fromDID);
                            loadChatHistory(chat.fromDID);
                          }
                        }}
                      >
                        <div className={styles.chatAvatar}>
                          {chat.profilePicture ? (
                            <div className={styles.avatarImageWrapper}>
                              <Image 
                                src={chat.profilePicture} 
                                alt={chat.name || chat.fromDID}
                                className={styles.avatarImage}
                                width={40}
                                height={40}
                              />
                            </div>
                          ) : (
                            <div className={styles.defaultAvatar}>
                              {(chat.name || chat.fromDID).charAt(0).toUpperCase()}
                            </div>
                          )}
                          {/* Remove online indicator since it's not supported by Push Protocol */}
                        </div>
                        <div className={styles.chatInfo}>
                          <div className={styles.chatName}>{chat.name || chat.fromDID}</div>
                          <div className={styles.lastMessage}>
                            {chat.messageContent || 'No messages yet'}
                          </div>
                        </div>
                        {/* Show notification dot for unread messages */}
                        {hasUnread && (
                          <div className={styles.notificationDot} title={`${unreadCount} unread messages`} />
                        )}
                      </div>
                    );
                  })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Active chat section */}
      <div className={styles.chatView}>
        {selectedChat ? (
          <>
            <div className={styles.chatHeader}>
              <div className={styles.chatName}>
                {chats.find(c => c.fromDID === selectedChat)?.name || selectedChat}
              </div>
              {/* Remove online status since it's not supported */}
            </div>
            <div className={styles.messageContainer}>
              <div className="win95-scrollable-container">
                <div className="win95-scrollable-content">
                  {chatHistoryError ? (
                    <div className={styles.errorState}>
                      <div className={styles.errorMessage}>{chatHistoryError.message}</div>
                      <button 
                        className={styles.retryButton}
                        onClick={() => loadChatHistory(selectedChat)}
                      >
                        Retry
                      </button>
                    </div>
                  ) : chatHistoryLoading ? (
                    <div className={styles.loadingState}>Loading messages...</div>
                  ) : (
                    <div className={styles.messageList} ref={scrollContainerRef}>
                      {sortedMessages.map((msg, index) => (
                        <div 
                          key={`${msg.fromDID}-${msg.timestamp}-${index}`}
                          className={`${styles.message} ${isOwnMessage(msg) ? styles.sent : styles.received}`}
                        >
                          <div className={styles.messageContent}>
                            {msg.messageContent}
                          </div>
                          <div className={styles.messageTime}>
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.messageInput}>
              <input 
                type="text"
                placeholder={chatHistoryError ? "Error sending message" : chatHistoryLoading ? "Sending..." : "Type a message..."}
                disabled={chatHistoryLoading || !!chatHistoryError}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value && !chatHistoryLoading && !chatHistoryError) {
                    const messageContent = e.currentTarget.value.trim();
                    if (messageContent && !messageContent.includes('Send message API')) {
                      e.currentTarget.value = ''; // Clear input before sending to prevent double-send
                      sendMessage(selectedChat, {
                        type: 'Text',
                        content: messageContent
                      });
                    }
                  }
                }}
              />
              <button
                className={styles.sendButton}
                disabled={chatHistoryLoading || !!chatHistoryError}
                onClick={(e) => {
                  const input = e.currentTarget.parentElement?.querySelector('input');
                  if (input?.value) {
                    const messageContent = input.value.trim();
                    if (messageContent && !messageContent.includes('Send message API')) {
                      input.value = ''; // Clear input before sending to prevent double-send
                      sendMessage(selectedChat, {
                        type: 'Text',
                        content: messageContent
                      });
                    }
                  }
                }}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className={styles.noChatSelected}>
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}; 