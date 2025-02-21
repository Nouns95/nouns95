"use client";

import React from 'react';
import { Desktop } from '@/src/shell/Desktop';
import { Taskbar } from '@/src/shell/Taskbar';
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