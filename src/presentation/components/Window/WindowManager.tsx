"use client";

import React, { useEffect } from 'react';
import { WindowService } from '@/src/domain/window/services/WindowService';
import { FocusManager } from '@/src/domain/window/services/FocusManager';
import { Window as WindowType } from '@/src/domain/window/models/Window';
import Window from './Window';
import WalletApp from '@/src/presentation/apps/Wallet/WalletApp';
import type { WalletType } from '@/src/presentation/apps/Wallet/WalletApp';
import FileExplorer from '@/src/presentation/apps/FileExplorer/FileExplorer';
import styles from './Window.module.css';
import { useWindowStore } from '../../../data/stores/WindowStore';

interface WindowMetadata {
  network?: WalletType;
  path?: string;
}

interface WindowState {
  id: string;
  title: string;
  appId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  canResize: boolean;
  zIndex: number;
  metadata?: WindowMetadata;
}

const mapWindowToState = (window: WindowType): WindowState => ({
  id: window.id,
  title: window.title,
  appId: window.applicationId,
  position: window.position,
  size: window.size,
  isMinimized: window.isMinimized,
  isMaximized: window.isMaximized,
  isFocused: window.isFocused,
  canResize: window.canResize,
  zIndex: window.zIndex,
  metadata: window.metadata
});

export default function WindowManager() {
  const { windows, setWindows } = useWindowStore();
  const windowService = WindowService.getInstance();
  const focusManager = FocusManager.getInstance();

  useEffect(() => {
    const handleStateChange = ({ state }: { state: { windows: { [id: string]: WindowType } } }) => {
      setWindows(Object.values(state.windows).map(mapWindowToState));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        focusManager.switchFocus();
      }
    };

    // Subscribe to window state changes
    windowService.on('windowStateChanged', handleStateChange);
    document.addEventListener('keydown', handleKeyDown);

    // Initial windows state
    setWindows(windowService.getAllWindows().map(mapWindowToState));

    return () => {
      windowService.off('windowStateChanged', handleStateChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [windowService, focusManager, setWindows]);

  const renderAppContent = (window: WindowState) => {
    switch (window.appId) {
      case 'wallet':
        return <WalletApp network={window.metadata?.network || 'ethereum'} />;
      case 'fileexplorer':
      case 'documents':
        return <FileExplorer />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.manager}>
      {windows.map((window) => (
        <Window
          key={window.id}
          id={window.id}
          title={window.title}
          defaultWidth={window.size.width}
          defaultHeight={window.size.height}
          minWidth={400}
          minHeight={300}
          window={window}
        >
          {renderAppContent(window)}
        </Window>
      ))}
    </div>
  );
}
