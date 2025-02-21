'use client';

import React from 'react';
import styles from './ContextMenu.module.css';

export interface MenuItemProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  divider?: boolean;
  children?: React.ReactNode;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  label,
  onClick,
  disabled = false,
  divider = false,
  children
}) => {
  if (divider) {
    return <div className={styles.divider} />;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`${styles.menuItem} ${disabled ? styles.disabled : ''}`}
      onClick={handleClick}
      role="menuitem"
      tabIndex={0}
    >
      <span className={styles.label}>{label}</span>
      {children && (
        <span className={styles.arrow}>▶</span>
      )}
      {children && (
        <div className={styles.submenu}>
          {children}
        </div>
      )}
    </div>
  );
};
