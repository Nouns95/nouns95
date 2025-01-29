import React from 'react';
import styles from './Menu.module.css';

interface MenuItemBase {
  separator?: boolean;
}

interface MenuAction extends MenuItemBase {
  label: string;
  action?: () => void;
  shortcut?: string;
  disabled?: boolean;
  separator?: false;
  icon?: string;
}

interface MenuSeparator extends MenuItemBase {
  separator: true;
}

type MenuItem = MenuAction | MenuSeparator;

interface MenuProps {
  items: MenuItem[];
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

export function Menu({ items, isOpen, onClose, position }: MenuProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div 
        className={styles.menu}
        style={{ 
          left: position.x,
          top: position.y
        }}
      >
        {items.map((item, index) => (
          item.separator ? (
            <div key={index} className={styles.separator} />
          ) : (
            <div
              key={index}
              className={`${styles.menuItem} ${item.disabled ? styles.disabled : ''}`}
              onClick={() => {
                if (!item.disabled && item.action) {
                  item.action();
                  onClose();
                }
              }}
            >
              {item.icon && (
                <img src={item.icon} alt="" className={styles.menuIcon} />
              )}
              <span className={styles.label}>{item.label}</span>
              {item.shortcut && (
                <span className={styles.shortcut}>{item.shortcut}</span>
              )}
            </div>
          )
        ))}
      </div>
    </>
  );
}

export type { MenuItem, MenuAction, MenuSeparator }; 
