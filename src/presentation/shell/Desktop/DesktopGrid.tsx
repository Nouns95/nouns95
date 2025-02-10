"use client";

import React from 'react';
import styles from './DesktopGrid.module.css';

const DesktopGrid: React.FC = () => {
  return (
    <nav className={styles.grid} role="navigation" aria-label="Desktop icons">
      {/* Icons will be dynamically added here when we implement the window system and apps */}
    </nav>
  );
};

export default DesktopGrid;
