"use client";

import React from 'react';
import Image from 'next/image';
import { getAppIcon } from '@/src/config/icons';
import styles from './TitleBar.module.css';

interface TitleBarProps {
  title: string;
  applicationId: string;
  isMaximized: boolean;
  isFocused: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onRestore?: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({
  title,
  applicationId,
  isMaximized,
  isFocused,
  onMouseDown,
  onClose,
  onMinimize,
  onMaximize,
  onRestore
}) => {
  const appIcon = getAppIcon(applicationId);

  return (
    <div 
      className={`${styles.titleBar} ${isFocused ? styles.focused : ''}`}
      onMouseDown={onMouseDown}
    >
      <div className={styles.titleContent}>
        {appIcon && (
          <div className={styles.iconWrapper}>
            <Image 
              src={appIcon.icon} 
              alt={`${title} icon`}
              width={16}
              height={16}
              className={styles.icon}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        )}
        <span className={styles.title}>{title}</span>
      </div>
      <div className={styles.controls}>
        {onMinimize && (
          <button className={styles.control} onClick={onMinimize}>
            <span className={styles.minimizeIcon}>_</span>
          </button>
        )}
        {onMaximize && (
          <button className={styles.control} onClick={isMaximized ? onRestore : onMaximize}>
            <span className={isMaximized ? styles.restoreIcon : styles.maximizeIcon}>□</span>
          </button>
        )}
        <button className={`${styles.control} ${styles.close}`} onClick={onClose}>
          <span className={styles.closeIcon}>×</span>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
