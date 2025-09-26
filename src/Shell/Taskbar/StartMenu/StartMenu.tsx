"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { WindowService } from '@/src/Shell/Window/domain/services/WindowService';
import { ProcessManager } from '@/src/Shell/Window/domain/services/ProcessManager';
import { getAppConfig, AppId } from '@/src/Apps/AppConfig';
import { Icon } from '@/src/Shell/Shell';
import styles from './StartMenu.module.css';
import Image from 'next/image';
import { getAppIcon } from '@/src/Shell/Desktop/icons';

interface MenuItem {
  id: string;
  label: string;
  appId?: AppId; // Optional for submenu organizers like "Utilities"
  isMiniApp?: boolean;
  onClick?: () => void;
  submenu?: MenuItem[];
}

const MENU_ITEMS: MenuItem[] = [
  { 
    id: 'programs', 
    label: 'Programs', 
    appId: 'programs',
    submenu: [
      { id: 'governance', label: 'Camp', appId: 'governance' },
      { id: 'probe', label: 'Probe', appId: 'probe' },
      { id: 'studio', label: 'Studio', appId: 'studio' },
      { id: 'chat', label: 'Chat', appId: 'chat' },
      { 
        id: 'utilities', 
        label: 'Utilities',
        submenu: [
          { id: 'tabs', label: 'Tabs', appId: 'tabs' }
        ]
      }
    ]
  },
  { id: 'fileexplorer', label: 'File Explorer', appId: 'fileexplorer' },
  { id: 'auction', label: 'Auction', appId: 'auction' },
  { id: 'wallet', label: 'Wallet', appId: 'wallet' },
  { id: 'settings', label: 'Settings', appId: 'settings' }
];

const StartMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [activeNestedSubmenu, setActiveNestedSubmenu] = useState<string | null>(null);
  const windowService = WindowService.getInstance();
  const processManager = ProcessManager.getInstance();

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
    setActiveSubmenu(null);
    setActiveNestedSubmenu(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        toggleMenu();
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setActiveSubmenu(null);
        setActiveNestedSubmenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Click outside to close
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.button}`) && !target.closest(`.${styles.submenu}`) && isOpen) {
        setIsOpen(false);
        setActiveSubmenu(null);
        setActiveNestedSubmenu(null);
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

    const process = processManager.createProcess({
      applicationId: appId,
      windowId: `${appId}-${Date.now()}`,
    });

    const metadata = appId === 'wallet' ? { network: 'ethereum' } : undefined;
    const windowId = config.type === 'miniapp'
      ? windowService.createMiniApp(appId, process.id, metadata)
      : windowService.createWindow(appId, process.id, metadata);

    windowService.focusWindow(windowId);
    setIsOpen(false);
    setActiveSubmenu(null);
    setActiveNestedSubmenu(null);
  };

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.submenu) {
      setActiveSubmenu(activeSubmenu === item.id ? null : item.id);
    } else {
      createWindow(item.appId);
    }
  };

  const renderMenuItem = (item: MenuItem) => (
    <div
      key={item.id}
      className={`${styles.menuItem} ${activeSubmenu === item.id ? styles.active : ''}`}
      onClick={() => !item.submenu && item.appId && handleMenuItemClick(item)}
      onMouseEnter={() => item.submenu && setActiveSubmenu(item.id)}
    >
      {item.appId && <Icon appId={item.appId} width={32} height={32} className={styles.menuItemIcon} />}
      <span>{item.label}</span>
      {item.submenu && <span className={styles.submenuArrow}>▶</span>}
      {item.submenu && activeSubmenu === item.id && (
        <div className={styles.submenu}>
          {item.submenu.map((subItem) => (
            <div
              key={subItem.id}
              className={`${styles.menuItem} ${!subItem.appId ? styles.textOnly : ''} ${activeNestedSubmenu === subItem.id ? styles.active : ''}`}
              data-app-id={subItem.appId}
              onClick={(e) => {
                e.stopPropagation();
                if (!subItem.submenu && subItem.appId) {
                  handleMenuItemClick(subItem);
                }
              }}
              onMouseEnter={() => {
                if (subItem.submenu) {
                  setActiveNestedSubmenu(subItem.id);
                } else {
                  setActiveNestedSubmenu(null);
                }
              }}
              onMouseLeave={() => {
                // Don't clear nested submenu immediately to allow navigation
              }}
            >
              {subItem.appId && (
                <Icon 
                  appId={subItem.appId} 
                  width={32} 
                  height={32} 
                  className={styles.menuItemIcon} 
                />
              )}
              <span>{subItem.label}</span>
              {subItem.submenu && <span className={styles.submenuArrow}>▶</span>}
              {subItem.submenu && activeNestedSubmenu === subItem.id && (
                <div className={styles.submenu}>
                  {subItem.submenu.map((nestedItem) => (
                    <div
                      key={nestedItem.id}
                      className={styles.menuItem}
                      data-app-id={nestedItem.appId}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (nestedItem.appId) {
                          handleMenuItemClick(nestedItem);
                        }
                      }}
                    >
                      {nestedItem.appId && (
                        <Icon 
                          appId={nestedItem.appId} 
                          width={32} 
                          height={32} 
                          className={styles.menuItemIcon} 
                        />
                      )}
                      <span>{nestedItem.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

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
          src={getAppIcon('startmenu').icon as string}
          alt={getAppIcon('startmenu').alt}
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
            {MENU_ITEMS.map(renderMenuItem)}
            <div className={styles.divider} />
            <div 
              className={styles.menuItem}
              onClick={() => window.close()}
            >
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
