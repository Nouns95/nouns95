"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { WindowService } from '@/src/domain/window/services/WindowService';
import { ProcessManager } from '@/src/domain/window/services/ProcessManager';
import { getAppConfig, AppId } from '@/src/domain/window/config/AppConfig';
import Icon from '../shared/Icon';
import styles from './StartMenu.module.css';
import Image from 'next/image';

interface MenuItem {
  id: string;
  label: string;
  appId: AppId;
  isMiniApp?: boolean;
  onClick?: () => void;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'programs', label: 'Programs', appId: 'programs' },
  { id: 'fileexplorer', label: 'File Explorer', appId: 'fileexplorer' },
  { id: 'auction', label: 'Auction', appId: 'auction' },
  { id: 'wallet', label: 'Wallet', appId: 'wallet' },
  { id: 'settings', label: 'Settings', appId: 'settings' }
];

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

  const createWindow = (appId: AppId) => {
    const config = getAppConfig(appId);
    if (!config) return;

    // Create a unique process ID
    const process = processManager.createProcess({
      applicationId: appId,
      windowId: `${appId}-${Date.now()}`,
    });

    // Create window or miniapp based on type with default metadata
    const metadata = appId === 'wallet' ? { network: 'ethereum' } : undefined;
    const windowId = config.type === 'miniapp'
      ? windowService.createMiniApp(appId, process.id, metadata)
      : windowService.createWindow(appId, process.id, metadata);

    // Focus the newly created window
    windowService.focusWindow(windowId);
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
          e.stopPropagation();
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
          <div className={styles.verticalBar}>
            <span className={styles.nouns}>NOUNS</span>
            <span className={styles.number}>95</span>
          </div>
          <div className={styles.menuContent}>
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
        </div>
      )}
    </div>
  );
};

export default StartMenu;
