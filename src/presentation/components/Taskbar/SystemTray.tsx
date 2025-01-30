"use client";

import React, { useState, useEffect } from 'react';
import styles from './Taskbar.module.css';

const SystemTray: React.FC = () => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true 
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.systemTray}>
      {time}
    </div>
  );
};

export default SystemTray;
