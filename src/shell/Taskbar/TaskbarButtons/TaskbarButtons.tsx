"use client";

import React, { useEffect, useState } from 'react';
import { Window } from '@/src/shell/Window/domain/models/Window';
import { WindowService } from '@/src/shell/Window/domain/services/WindowService';
import { Icon } from '@/src/shell/Shell';
import styles from './TaskbarButtons.module.css';

const TaskbarButtons: React.FC = () => {
  const [windows, setWindows] = useState<Window[]>([]);
  const windowService = WindowService.getInstance();

  useEffect(() => {
    const handleWindowsChange = () => {
      const allWindows = windowService.getAllWindows();
      setWindows(allWindows);
    };

    handleWindowsChange();
    windowService.on('windowStateChanged', handleWindowsChange);
    
    return () => {
      windowService.off('windowStateChanged', handleWindowsChange);
    };
  }, [windowService]);

  const handleButtonClick = (windowId: string) => {
    const window = windowService.getWindow(windowId);
    if (!window) return;

    if (window.isMinimized) {
      windowService.restoreWindow(windowId);
      windowService.focusWindow(windowId);
    } else if (window.isFocused) {
      windowService.minimizeWindow(windowId);
    } else {
      windowService.focusWindow(windowId);
    }
  };

  return (
    <div className={styles.taskbarButtons}>
      {windows.map(window => (
        <button
          key={window.id}
          className={`${styles.taskbarButton} ${window.isFocused ? styles.focused : ''} ${window.isMinimized ? styles.minimized : ''}`}
          onClick={() => handleButtonClick(window.id)}
        >
          <Icon appId={window.applicationId} width={16} height={16} />
          <span>{window.title}</span>
        </button>
      ))}
    </div>
  );
};

export default TaskbarButtons; 
