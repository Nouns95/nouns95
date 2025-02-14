import React, { useState } from 'react';
import Image from 'next/image';
import { useNotifications } from '../../hooks/feature/useNotifications';
import styles from './NotificationsTab.module.css';

interface NotificationsTabProps {
  notificationState: ReturnType<typeof useNotifications>;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ 
  notificationState
}) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'spam'>('inbox');

  const {
    inboxFeeds,
    spamFeeds,
    isLoading: notifLoading,
    error: notifError,
    unreadCount: notifUnreadCount,
    markAsRead
  } = notificationState;

  return (
    <div className={styles.container}>
      <div className={styles.tabButtons}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'inbox' ? styles.active : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          Inbox {notifUnreadCount > 0 && <span className={styles.badge}>{notifUnreadCount}</span>}
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'spam' ? styles.active : ''}`}
          onClick={() => setActiveTab('spam')}
        >
          Spam
        </button>
      </div>

      <div className={styles.notificationList}>
        {notifError ? (
          <div className={styles.errorState}>
            <div className={styles.errorMessage}>{notifError.message}</div>
            <button className={styles.retryButton} onClick={markAsRead}>
              Retry
            </button>
          </div>
        ) : notifLoading ? (
          <div className={styles.loadingState}>Loading notifications...</div>
        ) : (
          (activeTab === 'inbox' ? inboxFeeds : spamFeeds).map((notification, index) => (
            <div key={`${notification.did}-${notification.msg.timestamp}-${index}`} className={styles.notification}>
              <div className={styles.notificationHeader}>
                <div className={styles.channelInfo}>
                  {notification.profilePicture && (
                    <div className={styles.channelIconWrapper}>
                      <Image 
                        src={notification.profilePicture} 
                        alt={notification.name || 'channel'} 
                        className={styles.channelIcon}
                        width={32}
                        height={32}
                      />
                    </div>
                  )}
                  <span className={styles.channelName}>{notification.name || notification.did}</span>
                </div>
                <span className={styles.timestamp}>
                  {notification.msg.timestamp ? new Date(notification.msg.timestamp).toLocaleTimeString() : ''}
                </span>
              </div>
              <div className={styles.notificationContent}>
                <div className={styles.notificationTitle}>{notification.about}</div>
                <div className={styles.notificationBody}>{notification.msg.messageContent}</div>
              </div>
              {notification.msg.link && (
                <a 
                  href={notification.msg.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.notificationLink}
                >
                  View Details
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 