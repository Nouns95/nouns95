"use client";

import React from 'react';
import { StartMenu, TaskbarButtons, TaskbarIcons, Clock } from '@/src/Shell/Taskbar';
import styles from './Taskbar.module.css';

const Taskbar: React.FC = () => {
  return (
    <div className={styles.taskbar}>
      <div className={styles.left}>
        <StartMenu />
        <TaskbarButtons />
      </div>
      <div className={styles.right}>
        <div className={styles.systemTray}>
          <TaskbarIcons />
          <Clock />
        </div>
      </div>
    </div>
  );
};

export default Taskbar;
