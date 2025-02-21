"use client";

import React, { useState, useEffect } from 'react';
import { WindowService } from '@/src/Shell/Window/domain/services/WindowService';
import { getAppConfig, calculateWindowPosition } from '@/src/Apps/AppConfig';
import { MiniAppWindowState } from '@/src/Shell/Window/domain/stores/WindowStore';
import { Window } from '@/src/Shell/Window';
import styles from './MiniApp.module.css';

interface MiniAppProps {
  id: string;
  title: string;
  children: React.ReactNode;
  window: MiniAppWindowState;
}

const MiniApp: React.FC<MiniAppProps> = ({
  id,
  title,
  children,
  window: miniAppWindow
}) => {
  const windowService = WindowService.getInstance();
  const appConfig = getAppConfig(miniAppWindow.miniAppId);
  const [isDragged, setIsDragged] = useState(false);

  // Update position when window is resized
  useEffect(() => {
    const handleResize = () => {
      if (!isDragged && !miniAppWindow.isPinned) {
        const newPosition = calculateWindowPosition(miniAppWindow.miniAppId);
        windowService.moveWindow(id, newPosition);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [id, miniAppWindow.miniAppId, miniAppWindow.isPinned, windowService, isDragged]);

  return (
    <Window
      id={id}
      title={title}
      window={miniAppWindow}
      className={`${styles.miniApp} ${appConfig.type === 'miniapp' ? styles.miniAppWindow : ''}`}
      onDragStart={() => setIsDragged(true)}
      onDragEnd={() => setIsDragged(false)}
    >
      {children}
    </Window>
  );
};

export default MiniApp;