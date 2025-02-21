"use client";

import React from 'react';
import { WindowManager } from '@/src/Shell/Window';
import { DesktopIcons } from './DesktopIcons';
import styles from './Desktop.module.css';

const Desktop: React.FC = () => {
  return (
    <div className={styles.desktop}>
      <div className={styles.desktopLayer}>
        <DesktopIcons />
      </div>
      <div className={styles.windowLayer}>
        <WindowManager />
      </div>
    </div>
  );
};

export default Desktop;
