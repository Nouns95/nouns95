/**
 * Studio Export Panel Component
 * Export controls and size selection
 */

import React from 'react';
import { EXPORT_SIZES } from '../../utils/export';
import { Win95Dropdown } from '../Win95Dropdown';
import styles from './ExportPanel.module.css';

interface ExportPanelProps {
  exportSize: number;
  onExportSizeChange: (size: number) => void;
  onExport: () => void;
  hasArtwork: boolean;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  exportSize,
  onExportSizeChange,
  onExport,
  hasArtwork
}) => {
  return (
    <div className={styles.exportPanel}>
      <div className={styles.exportTitle}>Export</div>
      <div className={styles.exportControls}>
        <Win95Dropdown
          className={styles.sizeSelect}
          value={exportSize}
          onChange={(value) => onExportSizeChange(Number(value))}
          placeholder="Select size..."
          options={EXPORT_SIZES.map(size => ({
            value: size,
            label: `${size}x${size}`
          }))}
        />
        <button 
          className={styles.exportButton}
          onClick={onExport}
          disabled={!hasArtwork}
          title={hasArtwork ? "Export as PNG" : "No artwork to export"}
        >
          <span className={styles.toolIcon}>↓</span> Export PNG
        </button>
      </div>
    </div>
  );
};
