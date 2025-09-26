/**
 * Studio Color Palette Component
 * Displays and manages color selection
 */

import React from 'react';
import styles from './ColorPalette.module.css';

interface ColorPaletteProps {
  colors: string[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  colors,
  selectedColor,
  onColorSelect
}) => {
  return (
    <div className={styles.colorPalette}>
      {colors.map((color) => (
        <button
          key={color}
          className={`${styles.colorSwatch} ${color === selectedColor ? styles.active : ''}`}
          style={{ backgroundColor: color }}
          onClick={() => onColorSelect(color)}
          title={color}
        />
      ))}
    </div>
  );
};
