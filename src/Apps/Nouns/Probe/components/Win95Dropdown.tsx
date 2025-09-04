'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ContextMenu } from '@/src/Shell/ContextMenu/ContextMenu';
import { MenuItem } from '@/src/Shell/ContextMenu/MenuItem';
import styles from './Win95Dropdown.module.css';

interface DropdownOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface DropdownGroup {
  label: string;
  options: DropdownOption[];
}

interface Win95DropdownProps {
  value: string | number | undefined;
  onChange: (value: string | number | undefined) => void;
  options?: DropdownOption[];
  groups?: DropdownGroup[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Win95Dropdown: React.FC<Win95DropdownProps> = ({
  value,
  onChange,
  options = [],
  groups = [],
  placeholder = '',
  disabled = false,
  className = '',
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get the display label for the current value
  const getDisplayLabel = () => {
    // Check in options first
    const option = options.find(opt => opt.value === value);
    if (option) return option.label;

    // Check in groups
    for (const group of groups) {
      const groupOption = group.options.find(opt => opt.value === value);
      if (groupOption) return groupOption.label;
    }

    return placeholder || 'Select...';
  };

  const handleButtonClick = () => {
    if (disabled) return;

    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        x: rect.left,
        y: rect.bottom + 2 // Small gap between button and dropdown
      });
    }
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Close dropdown when clicking outside or pressing escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const renderMenuItems = () => {
    const items: React.ReactNode[] = [];

    // Render standalone options
    if (options.length > 0) {
      options.forEach((option) => {
        items.push(
          <MenuItem
            key={option.value}
            label={option.label}
            disabled={option.disabled}
            onClick={() => handleOptionClick(option.value)}
          />
        );
      });
    }

    // Render grouped options
    if (groups.length > 0) {
      groups.forEach((group, groupIndex) => {
        // Add divider before groups (except first)
        if (groupIndex > 0 || options.length > 0) {
          items.push(<MenuItem key={`divider-${groupIndex}`} label="" divider />);
        }

        // Add group label (non-clickable)
        items.push(
          <div key={`group-${groupIndex}`} className={styles.groupLabel}>
            {group.label}
          </div>
        );

        // Add group options
        group.options.forEach((option) => {
          items.push(
            <MenuItem
              key={`${groupIndex}-${option.value}`}
              label={option.label}
              disabled={option.disabled}
              onClick={() => handleOptionClick(option.value)}
            />
          );
        });
      });
    }

    return items;
  };

  return (
    <>
      <button
        ref={buttonRef}
        className={`${styles.dropdownButton} ${disabled ? styles.disabled : ''} ${className}`}
        onClick={handleButtonClick}
        disabled={disabled}
        style={style}
        type="button"
      >
        <span className={styles.buttonText}>{getDisplayLabel()}</span>
        <span className={styles.arrow}>▼</span>
      </button>

      {isOpen && (
        <ContextMenu
          position={dropdownPosition}
          onClose={handleClose}
        >
          {renderMenuItems()}
        </ContextMenu>
      )}
    </>
  );
};
