"use client";

import React, { useState } from 'react';
import { WindowService } from '@/src/domain/window/services/WindowService';
import { ProcessManager } from '@/src/domain/window/services/ProcessManager';
import Icon from '../shared/Icon';
import { getAppIcon } from '@/src/config/icons';
import styles from './StartMenu.module.css';

interface MenuItem {
  id: string;
  label: string;
  appId: string;
  onClick?: () => void;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'programs', label: 'Programs', appId: 'programs' },
  { id: 'documents', label: 'Documents', appId: 'documents' },
  { id: 'settings', label: 'Settings', appId: 'settings' },
  { id: 'wallet', label: 'Wallet', appId: 'wallet' }
];

interface WindowConfig {
  title: string;
  size: { width: number; height: number };
}

const WINDOW_CONFIGS: { [key: string]: WindowConfig } = {
  wallet: {
    title: 'Wallet',
    size: { width: 800, height: 600 }
  },
  documents: {
    title: 'Documents',
    size: { width: 600, height: 400 }
  }
};

const StartMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const windowService = WindowService.getInstance();
  const processManager = ProcessManager.getInstance();

  const createWindow = (appId: string) => {
    const config = WINDOW_CONFIGS[appId];
    if (!config) return;

    // Create a unique window ID
    const windowId = `window-${Date.now()}`;
    
    // Create the process with the window ID
    const process = processManager.createProcess({
      applicationId: appId,
      windowId: windowId,
    });

    const appIcon = getAppIcon(appId);

    // Create the window with the process ID
    windowService.createWindow({
      title: config.title,
      applicationId: appId,
      processId: process.id,
      icon: appIcon.small,
      size: config.size,
    });

    setIsOpen(false);
  };

  const handleMenuItemClick = (item: MenuItem) => {
    createWindow(item.appId);
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.button}
        onClick={() => setIsOpen(!isOpen)}
      >
        <img src="/icons/start-20.png" alt="Start" className={styles.startIcon} />
        <span>Start</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
          {MENU_ITEMS.map((item) => (
            <div
              key={item.id}
              className={styles.menuItem}
              onClick={() => handleMenuItemClick(item)}
            >
              <Icon appId={item.appId} size="large" className={styles.menuItemIcon} />
              <span>{item.label}</span>
            </div>
          ))}
          <div className={styles.divider} />
          <div className={styles.menuItem}>
            <Icon appId="shutdown" size="large" className={styles.menuItemIcon} />
            <span>Shut Down...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartMenu;
