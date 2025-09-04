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
    // Adjust menu position if it would render outside the window boundaries
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      
      // Find the window content container that this dropdown should be constrained to
      const windowContent = menu.closest('[class*="content"]') || 
                           menu.closest('[class*="window"]') ||
                           document.body;
      
      const containerRect = windowContent.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      let adjustedX = position.x;
      let adjustedY = position.y;

      // Convert viewport coordinates to container-relative coordinates
      const relativeX = position.x - containerRect.left;
      const relativeY = position.y - containerRect.top;

      // Adjust horizontal position if needed
      if (relativeX + rect.width > containerWidth) {
        adjustedX = Math.max(containerRect.left + 8, position.x - rect.width);
      }

      // Adjust vertical position if needed - prioritize showing above if not enough space below
      const spaceBelow = containerHeight - relativeY;
      const spaceAbove = relativeY;
      const menuHeight = Math.min(rect.height, 200); // Max height constraint

      if (spaceBelow < menuHeight && spaceAbove > spaceBelow && spaceAbove > menuHeight) {
        // Show above the trigger if there's more space above
        adjustedY = Math.max(containerRect.top + 8, position.y - menuHeight);
      } else if (relativeY + menuHeight > containerHeight) {
        // Adjust to fit within container
        adjustedY = Math.max(containerRect.top + 8, containerRect.bottom - menuHeight - 8);
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
