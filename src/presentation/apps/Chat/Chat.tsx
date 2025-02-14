import { useState, useMemo } from 'react';
import { PushProtocolWrapper } from '../../../wrappers/PushProtocolWrapper';
import { ChatProvider, useChatContext } from './context/ChatContext';
import { LoadingScreen } from './components/LoadingScreen';
import { ChatsTab } from './components/ChatsTab';
import { NotificationsTab } from './components/NotificationsTab';
import { ChatService } from './services/chatService';
import { NotificationService } from './services/notificationService';
import { useChat } from './hooks/feature/useChat';
import { useNotifications } from './hooks/feature/useNotifications';
import styles from './Chat.module.css';

type TabType = 'Direct Messages' | 'Group Chats' | 'Video Calls' | 'Audio Spaces' | 'Channels' | 'Notifications';

// Error screen component
const ErrorScreen = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className={styles['error-screen']}>
    <div className={styles['error-box']}>
      <div className={styles['error-title']}>Error</div>
      <div className={styles['error-message']}>{message}</div>
      <button 
        className={styles['error-button']}
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  </div>
);

// Chat content component
const ChatContent = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Direct Messages');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const { 
    pushUser,
    stream,
    isInitializing, 
    isInitialized, 
    isStreamConnecting, 
    isStreamConnected, 
    error,
    progressHook,
    reset
  } = useChatContext();

  // Initialize services
  const services = useMemo(() => {
    if (!pushUser) return null;
    const chatService = new ChatService(pushUser);
    const notificationService = new NotificationService(pushUser);
    return {
      chatService,
      notificationService
    };
  }, [pushUser]);

  // Initialize hooks with services
  const chatState = useChat(
    services?.chatService || null,
    stream,
    isStreamConnected
  );

  const notificationState = useNotifications(
    services?.notificationService || null,
    stream,
    isStreamConnected
  );

  // Handle loading and error states
  if (isInitializing || isStreamConnecting) {
    return (
      <LoadingScreen 
        isInitializing={isInitializing}
        isStreamConnecting={isStreamConnecting}
        onProgress={progressHook}
      />
    );
  }

  if (error) {
    return <ErrorScreen message={error.message} onRetry={reset} />;
  }

  if (!isInitialized || !isStreamConnected || !services) {
    return <LoadingScreen onProgress={progressHook} />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Direct Messages':
        return (
          <ChatsTab 
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            chatState={chatState}
            notificationState={notificationState}
          />
        );
      case 'Group Chats':
        return <div>Group Chats Content</div>;
      case 'Video Calls':
        return <div>Video Calls Content</div>;
      case 'Audio Spaces':
        return <div>Audio Spaces Content</div>;
      case 'Channels':
        return <div>Channels Content</div>;
      case 'Notifications':
        return (
          <NotificationsTab 
            notificationState={notificationState}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles['chat-tabs']}>
      <div className={styles['chat-tab-buttons']}>
        {(['Direct Messages', 'Group Chats', 'Video Calls', 'Audio Spaces', 'Channels', 'Notifications'] as TabType[]).map((tab) => (
          <button
            key={tab}
            className={`${styles['chat-tab-button']} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className={styles['chat-tab-panel']}>
        <div className={styles['chat-tab-content']}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

// Main Chat component wrapper
const Chat: React.FC = () => {
  return (
    <PushProtocolWrapper>
      <ChatProvider>
        <div className={styles['chat-window']}>
          <ChatContent />
        </div>
      </ChatProvider>
    </PushProtocolWrapper>
  );
};

export default Chat;
