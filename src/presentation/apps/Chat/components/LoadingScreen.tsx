import React, { useState, useEffect } from 'react';
import type { ProgressHookType } from '@pushprotocol/restapi';
import styles from '../Chat.module.css';

interface LoadingScreenProps {
  isInitializing?: boolean;
  isStreamConnecting?: boolean;
  onProgress?: (callback: (progress: ProgressHookType) => void) => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  isInitializing,
  isStreamConnecting,
  onProgress 
}) => {
  const [progress, setProgress] = useState<ProgressHookType | null>(null);

  useEffect(() => {
    if (onProgress) {
      onProgress(setProgress);
    }
  }, [onProgress]);

  const getMessage = () => {
    if (isInitializing) {
      return 'Connecting to Push Protocol.\n\nPlease sign in your connected wallet to log in.';
    }
    if (isStreamConnecting) {
      return 'Establishing connection...';
    }
    return 'Waiting for connection...';
  };

  return (
    <div className={styles['loading-screen']}>
      <div className={styles['loading-box']}>
        <div className={styles['loading-title']}>
          {progress?.progressTitle || 'Initializing...'}
        </div>
        <div className={styles['loading-message']}>
          {(progress?.progressInfo || getMessage()).split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </div>
        <div className={styles['loading-progress']}>
          <div className={styles['progress-bar']} />
          <div className={styles['progress-steps']}>
            {progress?.progressId && (
              <div className={`${styles['progress-step']} ${styles[progress.level.toLowerCase()]}`}>
                {progress.progressId}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 