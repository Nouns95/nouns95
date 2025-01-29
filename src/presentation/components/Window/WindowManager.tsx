"use client";

import React, { useEffect, useState } from 'react';
import { WindowService } from '@/src/domain/window/services/WindowService';
import { FocusManager } from '@/src/domain/window/services/FocusManager';
import { Window as WindowType } from '@/src/domain/window/models/Window';
import Window from './Window';
import WalletApp from '@/src/presentation/apps/Wallet/WalletApp';
import FileExplorer from '@/src/presentation/apps/FileExplorer/FileExplorer';
import styles from './Window.module.css';

const WindowManager: React.FC = () => {
  const [windows, setWindows] = useState<WindowType[]>([]);
  const windowService = WindowService.getInstance();
  const focusManager = FocusManager.getInstance();

  useEffect(() => {
    const handleStateChange = ({ state }: { state: { windows: { [id: string]: WindowType } } }) => {
      setWindows(Object.values(state.windows));
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
    setWindows(windowService.getAllWindows());

    return () => {
      windowService.off('windowStateChanged', handleStateChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [windowService, focusManager]);

  const renderWindowContent = (window: WindowType) => {
    switch (window.applicationId) {
      case 'wallet':
        return <WalletApp />;
      case 'documents':
        return <FileExplorer />;
      default:
        return <div>Unknown application: {window.applicationId}</div>;
    }
  };

  return (
    <div className={styles.manager}>
      {windows.map((window) => (
        <Window key={window.id} window={window}>
          {renderWindowContent(window)}
        </Window>
      ))}
    </div>
  );
};

export default WindowManager;
