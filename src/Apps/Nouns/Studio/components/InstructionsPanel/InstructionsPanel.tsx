/**
 * Studio Instructions Panel Component
 * Help and instructions for using the studio
 */

import React from 'react';
import { Icon } from '@/src/Shell/Shell';
import { TOOLS } from '../../utils/tools';
import styles from './InstructionsPanel.module.css';

interface InstructionsPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const InstructionsPanel: React.FC<InstructionsPanelProps> = ({
  isCollapsed,
  onToggleCollapse
}) => {
  return (
    <div className={`${styles.instructionsPanel} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.instructionsTitle}>
        Instructions
        <button 
          className={styles.collapseButton}
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? "+" : "-"}
        </button>
      </div>
      <div className={styles.instructionsList}>
        <ul>
          <li><span className={styles.toolIcon}>↑</span> Click a layer to select it - your edits will appear on the selected layer</li>
          <li><span className={styles.toolIcon}>□</span> Select traits from the dropdowns or draw your own</li>
          {TOOLS.slice(0, 4).map(tool => (
            <li key={tool.id}>
              <span className={styles.toolIcon}>
                <Icon appId={tool.icon} width={16} height={16} />
              </span>
              Use {tool.name.toLowerCase()} {tool.id === 'pencil' ? 'to draw pixel by pixel' :
                tool.id === 'fill' ? 'to fill areas' :
                tool.id === 'eraser' ? 'to remove pixels' :
                'to select colors from the canvas'}
            </li>
          ))}
          <li><span className={styles.toolIcon}>◉</span> Toggle layers on/off - only visible layers will be exported</li>
        </ul>
      </div>
    </div>
  );
};
