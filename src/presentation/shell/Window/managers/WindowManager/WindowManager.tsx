"use client";

import React, { useEffect } from 'react';
import { WindowService } from '@/src/domain/shell/window/services/WindowService';
import { Window as WindowType, MiniAppWindow } from '@/src/domain/shell/window/models/Window';
import { Window, MiniApp } from '@/src/presentation/shell/Window';
import { useWindowStore, WindowStoreState } from '@/src/domain/shell/window/stores/WindowStore';
import { getAppConfig } from '@/src/domain/shell/window/config/AppConfig';
import styles from './WindowManager.module.css';

const mapWindowToState = (window: WindowType | MiniAppWindow): WindowStoreState => {
  const appConfig = getAppConfig(window.applicationId);
  const baseState = {
    id: window.id,
    title: window.title,
    applicationId: window.applicationId,
    position: window.position,
    size: window.size,
    isMinimized: window.isMinimized,
    isMaximized: window.isMaximized,
    isFocused: window.isFocused,
    canResize: appConfig.behavior.canResize,
    zIndex: window.zIndex,
    processId: window.processId,
    icon: window.icon || appConfig.metadata?.icon,
    metadata: {
      ...appConfig.metadata,
      ...window.metadata
    }
  };

  if ('miniAppId' in window) {
    return {
      ...baseState,
      type: 'miniapp' as const,
      miniAppId: window.miniAppId,
      isPinned: window.isPinned
    };
  }

  return {
    ...baseState,
    type: 'window' as const
  };
};

export default function WindowManager() {
  const { windows, setWindows } = useWindowStore();
  const windowService = WindowService.getInstance();

  const handleDesktopClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      windowService.clearFocus();
    }
  };

  useEffect(() => {
    const handleStateChange = ({ state }: { state: { windows: Record<string, WindowType>; miniApps: Record<string, MiniAppWindow> } }) => {
      const allWindows = [
        ...Object.values(state.windows),
        ...Object.values(state.miniApps)
      ].map(mapWindowToState);
      setWindows(allWindows);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        windowService.switchFocus();
      }
    };

    windowService.on('windowStateChanged', handleStateChange);
    document.addEventListener('keydown', handleKeyDown);

    const initialWindows = [
      ...windowService.getAllWindows(),
      ...windowService.getAllMiniApps()
    ].map(mapWindowToState);
    setWindows(initialWindows);

    return () => {
      windowService.off('windowStateChanged', handleStateChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [windowService, setWindows]);

  const renderAppContent = (window: WindowStoreState) => {
    const appConfig = getAppConfig(window.applicationId);
    const AppComponent = appConfig.component;
    return <AppComponent />;
  };

  return (
    <div className={styles.container} onMouseDown={handleDesktopClick}>
      {windows.map((window) => (
        window.type === 'miniapp' ? (
          <MiniApp
            key={window.id}
            id={window.id}
            title={window.title}
            window={window}
          >
            {renderAppContent(window)}
          </MiniApp>
        ) : (
          <Window
            key={window.id}
            id={window.id}
            title={window.title}
            window={window}
          >
            {renderAppContent(window)}
          </Window>
        )
      ))}
    </div>
  );
}
