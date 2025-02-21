"use client";

import React from 'react';
import { Desktop } from '@/src/Shell/Desktop';
import { Taskbar } from '@/src/Shell/Taskbar';
import styles from './Shell.module.css';

const Shell: React.FC = () => {
  return (
    <div className={styles.shell}>
      <Desktop />
      <Taskbar />
    </div>
  );
};

export default Shell;