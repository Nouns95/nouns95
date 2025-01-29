"use client";

import React from 'react';
import StartMenu from './StartMenu';
import TaskbarButtons from './TaskbarButtons';
import SystemTray from './SystemTray';
import styles from './Taskbar.module.css';

const Taskbar: React.FC = () => {
  return (
    <div className={styles.container}>
      <StartMenu />
      <TaskbarButtons />
      <SystemTray />
    </div>
  );
};

export default Taskbar;
