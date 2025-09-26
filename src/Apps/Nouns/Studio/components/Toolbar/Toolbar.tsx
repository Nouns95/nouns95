/**
 * Studio Toolbar Component
 * Tool selection and configuration
 */

import React from 'react';
import { Icon } from '@/src/Shell/Shell';
import { TOOLS, ToolId } from '../../utils/tools';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  selectedTool: ToolId;
  onToolSelect: (tool: ToolId) => void;
  toolSize: number;
  onToolSizeChange: (size: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedColor: string;
  previousColor: string;
  onColorSwap: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onToolSelect,
  toolSize,
  onToolSizeChange,
  canUndo,
  canRedo,
  selectedColor,
  previousColor,
  onColorSwap
}) => {
  const renderSizeSelector = () => {
    if (selectedTool !== 'pencil' && selectedTool !== 'eraser') return null;

    return (
      <div className={styles.toolSizeSelector}>
        {[1, 2, 3, 4].map(size => (
          <button
            key={size}
            className={`${styles.sizeOption} ${size === toolSize ? styles.active : ''}`}
            onClick={() => onToolSizeChange(size)}
            title={`${size}x${size} pixels`}
          >
            <div className={`${styles.sizePreview} ${styles[`size${size}`]}`} />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.toolbox}>
      <div className={styles.toolGrid}>
        {TOOLS.map(tool => (
          <button 
            key={tool.id}
            className={`${styles.tool} ${tool.id === selectedTool ? styles.active : ''}`}
            onClick={() => onToolSelect(tool.id)}
            title={tool.name}
            disabled={
              (tool.id === 'undo' && !canUndo) ||
              (tool.id === 'redo' && !canRedo)
            }
          >
            <div className={styles.toolIcon}>
              <Icon 
                appId={tool.icon} 
                width={tool.id === 'undo' || tool.id === 'redo' ? 16 : 24} 
                height={tool.id === 'undo' || tool.id === 'redo' ? 16 : 24} 
              />
            </div>
          </button>
        ))}
      </div>
      {renderSizeSelector()}
      <div className={styles.colorHistory}>
        <button
          className={styles.colorHistoryButton}
          style={{ backgroundColor: selectedColor }}
          title="Current Color"
        />
        <button
          className={styles.colorHistoryButton}
          style={{ backgroundColor: previousColor }}
          onClick={onColorSwap}
          title="Previous Color (click to swap)"
        />
      </div>
    </div>
  );
};
