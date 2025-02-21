'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './ContextMenu.module.css';

interface Position {
  x: number;
  y: number;
}

interface ContextMenuProps {
  children: React.ReactNode;
  position: Position;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ children, position, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<Position>(position);

  useEffect(() => {
    // Adjust menu position if it would render outside viewport
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      // Adjust horizontal position if needed
      if (position.x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width;
      }

      // Adjust vertical position if needed
      if (position.y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height;
      }

      setMenuPosition({ x: adjustedX, y: adjustedY });
    }
  }, [position]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div 
      ref={menuRef}
      className={styles.contextMenu}
      style={{
        left: menuPosition.x,
        top: menuPosition.y,
      }}
    >
      {children}
    </div>
  );
};
