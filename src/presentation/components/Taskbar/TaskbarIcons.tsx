"use client";

import React, { useEffect } from 'react';
import { WindowService } from '@/src/domain/window/services/WindowService';
import { ProcessManager } from '@/src/domain/window/services/ProcessManager';
import { getAppConfig } from '@/src/domain/window/config/AppConfig';
import { useWindowStore } from '@/src/domain/window/stores/WindowStore';
import Icon from '../shared/Icon';
import styles from './TaskbarIcons.module.css';

const TaskbarIcons: React.FC = () => {
  const { windows } = useWindowStore();
  const windowService = WindowService.getInstance();
  const processManager = ProcessManager.getInstance();
  const walletConfig = getAppConfig('wallet');

  useEffect(() => {
    // Subscribe to window state changes
    const handleWindowClose = ({ windowId }: { windowId: string }) => {
      const closedWindow = windows.find(w => w.id === windowId);
      if (closedWindow && 'miniAppId' in closedWindow && closedWindow.miniAppId === 'wallet') {
        windowService.closeMiniApp('wallet');
        processManager.terminateProcess(closedWindow.processId);
      }
    };

    windowService.on('windowClosed', handleWindowClose);
    return () => {
      windowService.off('windowClosed', handleWindowClose);
    };
  }, [windows, processManager, windowService]);

  const toggleWallet = () => {
    // Check if wallet miniapp is already open
    const walletApp = windows.find(window => 
      'miniAppId' in window && window.miniAppId === 'wallet'
    );

    if (walletApp) {
      if (!walletApp.isFocused) {
        // If not focused, focus it and ensure it's visible
        windowService.focusWindow(walletApp.id);
        if (walletApp.isMinimized) {
          windowService.restoreWindow(walletApp.id);
        }
      } else {
        // If already focused, minimize it
        windowService.minimizeWindow(walletApp.id);
      }
    } else {
      // Create new wallet instance if none exists
      const process = processManager.createProcess({
        applicationId: 'wallet',
        windowId: `wallet-${Date.now()}`,
      });

      // Create miniapp with default metadata
      const windowId = windowService.createMiniApp('wallet', process.id, { network: 'ethereum' });
      windowService.focusWindow(windowId);
    }
  };

  return (
    <div className={styles.taskbarIcons}>
      <button
        className={styles.iconButton}
        onClick={toggleWallet}
        title={walletConfig.title}
      >
        <Icon 
          appId="wallet"
          width={16}
          height={16}
          className={styles.icon}
        />
      </button>
    </div>
  );
};

export default TaskbarIcons; 