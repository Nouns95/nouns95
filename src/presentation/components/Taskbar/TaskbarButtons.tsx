"use client";

import React, { useEffect, useState } from 'react';
import { WindowService } from '@/src/domain/window/services/WindowService';
import { Window } from '@/src/domain/window/models/Window';
import Icon from '../shared/Icon';
import styles from './TaskbarButtons.module.css';

const TaskbarButtons: React.FC = () => {
  const [windows, setWindows] = useState<Window[]>([]);
  const windowService = WindowService.getInstance();

  useEffect(() => {
    const handleWindowsChange = ({ state }: { state: { windows: { [id: string]: Window } } }) => {
      setWindows(Object.values(state.windows));
    };

    // Initial windows
    setWindows(windowService.getAllWindows());

    // Subscribe to window changes
    windowService.on('windowStateChanged', handleWindowsChange);

    return () => {
      windowService.off('windowStateChanged', handleWindowsChange);
    };
  }, []);

  const handleButtonClick = (windowId: string) => {
    const window = windowService.getWindow(windowId);
    if (window) {
      if (window.isMinimized) {
        windowService.restoreWindow(windowId);
      } else if (window.isFocused) {
        windowService.minimizeWindow(windowId);
      } else {
        windowService.focusWindow(windowId);
      }
    }
  };

  return (
    <div className={styles.container}>
      {windows.map((window) => (
        <button
          key={window.id}
          className={`${styles.button} ${window.isFocused ? styles.active : ''}`}
          onClick={() => handleButtonClick(window.id)}
        >
          <span className={styles.icon}>
            <Icon appId={window.applicationId} size="small" />
          </span>
          <span className={styles.title}>{window.title}</span>
        </button>
      ))}
    </div>
  );
};

export default TaskbarButtons; 
