import React from 'react';
import Image from 'next/image';
import styles from './Menu.module.css';

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  action?: () => void;
  disabled?: boolean;
}

export interface MenuSeparator {
  id: string;
  separator: true;
}

export type MenuAction = MenuItem | MenuSeparator;

interface MenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  items: MenuAction[];
  onClose: () => void;
}

export function Menu({ isOpen, position, items, onClose }: MenuProps) {
  if (!isOpen) return null;

  const handleItemClick = (item: MenuItem) => {
    if (!item.disabled && item.action) {
      item.action();
      onClose();
    }
  };

  const renderMenuItem = (item: MenuAction) => {
    if ('separator' in item && item.separator) {
      return <div key={item.id} className={styles.separator} />;
    }

    const menuItem = item as MenuItem;
    return (
      <div
        key={menuItem.id}
        className={`${styles.menuItem} ${menuItem.disabled ? styles.disabled : ''}`}
        onClick={() => handleItemClick(menuItem)}
      >
        {menuItem.icon && (
          <div className={styles.icon}>
            <Image
              src={menuItem.icon}
              alt=""
              width={16}
              height={16}
              style={{ objectFit: 'contain' }}
            />
          </div>
        )}
        <span className={styles.label}>{menuItem.label}</span>
      </div>
    );
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div
        className={styles.menu}
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {items.map((item) => renderMenuItem(item))}
      </div>
    </>
  );
} 
