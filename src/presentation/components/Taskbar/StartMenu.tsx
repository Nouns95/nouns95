"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { WindowService } from '@/src/domain/window/services/WindowService';
import { ProcessManager } from '@/src/domain/window/services/ProcessManager';
import Icon from '../shared/Icon';
import { getAppIcon } from '@/src/config/icons';
import styles from './StartMenu.module.css';
import Image from 'next/image';

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
  { id: 'wallet', label: 'Wallet', appId: 'wallet' },
  { id: 'fileexplorer', label: 'File Explorer', appId: 'fileexplorer' }
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
  },
  fileexplorer: {
    title: 'File Explorer',
    size: { width: 800, height: 600 }
  }
};

const StartMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const windowService = WindowService.getInstance();
  const processManager = ProcessManager.getInstance();

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        toggleMenu();
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Click outside to close
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking the start button (it has its own handler)
      if (!target.closest(`.${styles.button}`) && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, toggleMenu]);

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
      icon: appIcon.icon,
      size: config.size,
      metadata: appId === 'wallet' ? { network: 'ethereum' } : undefined,
    });

    setIsOpen(false);
  };

  const handleMenuItemClick = (item: MenuItem) => {
    createWindow(item.appId);
  };

  return (
    <div className={styles.container}>
      <button
        className={`${styles.button} ${isOpen ? styles.active : ''}`}
        onClick={(e) => {
          e.stopPropagation(); // Prevent the click from being caught by the window click handler
          toggleMenu();
        }}
      >
        <Image
          src="/icons/start.png"
          alt="Start"
          width={20}
          height={20}
          className={styles.startIcon}
          style={{ objectFit: 'contain' }}
        />
        <span>Start</span>
      </button>

      {isOpen && (
        <div 
          className={styles.dropdown} 
          onClick={(e) => e.stopPropagation()}
        >
          {MENU_ITEMS.map((item) => (
            <div
              key={item.id}
              className={styles.menuItem}
              onClick={() => handleMenuItemClick(item)}
            >
              <Icon appId={item.appId} width={32} height={32} className={styles.menuItemIcon} />
              <span>{item.label}</span>
            </div>
          ))}
          <div className={styles.divider} />
          <div className={styles.menuItem}>
            <Icon appId="shutdown" width={32} height={32} className={styles.menuItemIcon} />
            <span>Shut Down...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartMenu;
