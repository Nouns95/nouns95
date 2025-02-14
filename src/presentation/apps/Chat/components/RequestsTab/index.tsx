import React, { useState } from 'react';
import Image from 'next/image';
import { useRequests } from '../../hooks/feature/useRequests';
import styles from './RequestsTab.module.css';

interface RequestsTabProps {
  requestState: ReturnType<typeof useRequests>;
  onRequestAccepted: () => Promise<void>;
}

export const RequestsTab: React.FC<RequestsTabProps> = ({ 
  requestState,
  onRequestAccepted
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'space'>('chat');

  const {
    chatRequests,
    spaceRequests,
    isLoading,
    error,
    acceptChat,
    rejectChat,
    acceptSpace,
    rejectSpace
  } = requestState;

  // Handler for accepting chat requests
  const handleAcceptChat = async (target: string) => {
    await acceptChat(target);
    // After accepting the chat request, refresh the chat list
    await onRequestAccepted();
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabButtons}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'chat' ? styles.active : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          Chat Requests
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'space' ? styles.active : ''}`}
          onClick={() => setActiveTab('space')}
        >
          Space Requests
        </button>
      </div>

      <div className={styles.requestList}>
        {error ? (
          <div className={styles.errorState}>
            <div className={styles.errorMessage}>{error.message}</div>
            <button 
              className={styles.retryButton}
              onClick={() => {
                if (activeTab === 'chat') {
                  requestState.loadChatRequests();
                } else {
                  requestState.loadSpaceRequests();
                }
              }}
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className={styles.loadingState}>Loading requests...</div>
        ) : (
          (activeTab === 'chat' ? chatRequests : spaceRequests).map((request, index) => (
            <div key={`${request.did}-${request.msg.timestamp}-${index}`} className={styles.request}>
              <div className={styles.requestHeader}>
                <div className={styles.userInfo}>
                  {request.profilePicture && (
                    <div className={styles.profileImageWrapper}>
                      <Image 
                        src={request.profilePicture} 
                        alt={request.name || 'user'} 
                        className={styles.profileImage}
                        width={32}
                        height={32}
                      />
                    </div>
                  )}
                  <span className={styles.userName}>{request.name || request.did}</span>
                </div>
                <span className={styles.timestamp}>
                  {request.msg.timestamp ? new Date(request.msg.timestamp).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: '2-digit'
                  }) + ' ' + new Date(request.msg.timestamp).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  }) : ''}
                </span>
              </div>
              <div className={styles.requestContent}>
                <div className={styles.requestMessage}>{request.msg.messageContent}</div>
                <div className={styles.requestActions}>
                  <button
                    className={`${styles.actionButton} ${styles.acceptButton}`}
                    onClick={() => {
                      if (activeTab === 'chat') {
                        handleAcceptChat(request.did);
                      } else {
                        acceptSpace(request.did);
                      }
                    }}
                  >
                    Accept
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.rejectButton}`}
                    onClick={() => {
                      if (activeTab === 'chat') {
                        rejectChat(request.did);
                      } else {
                        rejectSpace(request.did);
                      }
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        {!isLoading && !error && (activeTab === 'chat' ? chatRequests : spaceRequests).length === 0 && (
          <div className={styles.emptyState}>
            No {activeTab} requests
          </div>
        )}
      </div>
    </div>
  );
}; 