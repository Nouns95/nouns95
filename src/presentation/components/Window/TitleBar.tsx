"use client";

import React from 'react';
import Icon from '../shared/Icon';
import styles from './TitleBar.module.css';

interface TitleBarProps {
  title: string;
  applicationId: string;
  isMaximized: boolean;
  isFocused: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize?: () => void;
  onRestore: () => void;
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
  return (
    <div className={`${styles.titleBar} ${isFocused ? styles.focused : ''}`} onMouseDown={onMouseDown}>
      <span className={styles.icon}>
        <Icon appId={applicationId} width={16} height={16} />
      </span>
      <div className={styles.title}>{title}</div>
      <div className={styles.controls}>
        <button
          className={styles.button}
          onClick={onMinimize}
          title="Minimize"
        >
          ─
        </button>
        {onMaximize && (
          <button
            className={styles.button}
            onClick={isMaximized ? onRestore : onMaximize}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? "❐" : "☐"}
          </button>
        )}
        <button
          className={styles.button}
          onClick={onClose}
          title="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
