"use client";

import React from 'react';
import DesktopGrid from './DesktopGrid';
import Taskbar from '../Taskbar/Taskbar';
import WindowManager from '../Window/WindowManager';
import styles from './Desktop.module.css';

const Desktop: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.area}>
        <DesktopGrid />
        <WindowManager />
      </div>
      <Taskbar />
    </div>
  );
};

export default Desktop;
