"use client";

import React, { useEffect } from 'react';
import { WindowService } from '@/src/domain/window/services/WindowService';
import { ProcessManager } from '@/src/domain/window/services/ProcessManager';
import { getAppConfig } from '@/src/domain/window/config/AppConfig';
import { useWindowStore } from '@/src/domain/window/stores/WindowStore';
import Icon from '../shared/Icon';
import styles from './TaskbarIcons.module.css';
import { NounImage } from '../../apps/Nouns/AuctionNounImage';

const TaskbarIcons: React.FC = () => {
  const { windows } = useWindowStore();
  const windowService = WindowService.getInstance();
  const processManager = ProcessManager.getInstance();
  const walletConfig = getAppConfig('wallet');
  const auctionConfig = getAppConfig('nounsauction');

  useEffect(() => {
    // Subscribe to window state changes
    const handleWindowClose = ({ windowId }: { windowId: string }) => {
      const closedWindow = windows.find(w => w.id === windowId);
      if (closedWindow && 'miniAppId' in closedWindow) {
        if (closedWindow.miniAppId === 'wallet') {
          windowService.closeMiniApp('wallet');
          processManager.terminateProcess(closedWindow.processId);
        } else if (closedWindow.miniAppId === 'nounsauction') {
          windowService.closeMiniApp('nounsauction');
          processManager.terminateProcess(closedWindow.processId);
        }
      }
    };

    windowService.on('windowClosed', handleWindowClose);
    return () => {
      windowService.off('windowClosed', handleWindowClose);
    };
  }, [windows, processManager, windowService]);

  const toggleApp = (appId: string) => {
    const app = windows.find(window => 
      'miniAppId' in window && window.miniAppId === appId
    );

    if (app) {
      if (!app.isFocused) {
        // If not focused, focus it and ensure it's visible
        windowService.focusWindow(app.id);
        if (app.isMinimized) {
          windowService.restoreWindow(app.id);
        }
      } else {
        // If already focused, minimize it
        windowService.minimizeWindow(app.id);
      }
    } else {
      // Create new instance if none exists
      const process = processManager.createProcess({
        applicationId: appId,
        windowId: `${appId}-${Date.now()}`,
      });

      // Create miniapp with default metadata
      const windowId = windowService.createMiniApp(appId, process.id);
      windowService.focusWindow(windowId);
    }
  };

  return (
    <div className={styles.taskbarIcons}>
      <button
        className={styles.iconButton}
        onClick={() => toggleApp('nounsauction')}
        title={auctionConfig.title}
      >
        <div className={styles.icon}>
          <NounImage width={16} height={16} />
        </div>
      </button>

      <button
        className={styles.iconButton}
        onClick={() => toggleApp('wallet')}
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