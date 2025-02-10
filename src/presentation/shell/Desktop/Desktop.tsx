"use client";

import React from 'react';
import { DesktopGrid } from '@/src/presentation/shell/Desktop';
import { WindowManager } from '@/src/presentation/shell/Window';
import styles from './Desktop.module.css';

const Desktop: React.FC = () => {
  return (
    <div className={styles.desktop}>
      <DesktopGrid />
      <WindowManager />
    </div>
  );
};

export default Desktop;
