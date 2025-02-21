import React, { useState } from 'react';
import { Menu, MenuAction } from './Menu';
import styles from './MenuBar.module.css';

export interface MenuBarItem {
  id: string;
  label: string;
  items: MenuAction[];
}

interface MenuBarProps {
  items: MenuBarItem[];
}

interface MenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  items: MenuAction[];
}

export function MenuBar({ items }: MenuBarProps) {
  const [menu, setMenu] = useState<MenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    items: []
  });

  const handleMenuClick = (menuItem: MenuBarItem, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    
    setMenu({
      isOpen: true,
      position: { x: rect.left, y: rect.bottom },
      items: menuItem.items
    });
  };

  return (
    <>
      <div className={styles.menuBar}>
        {items.map(item => (
          <div
            key={item.id}
            className={styles.menuItem}
            onClick={(e) => handleMenuClick(item, e)}
          >
            {item.label}
          </div>
        ))}
      </div>
      <Menu
        isOpen={menu.isOpen}
        position={menu.position}
        items={menu.items}
        onClose={() => setMenu(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
} 