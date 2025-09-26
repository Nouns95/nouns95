/**
 * Studio Layers Panel Component
 * Layer management and trait selection
 */

import React from 'react';
import { Icon } from '@/src/Shell/Shell';
import { LayerId, LAYERS, getTraitOptions } from '../../utils/layers';
import { Win95Dropdown } from '../Win95Dropdown';
import styles from './LayersPanel.module.css';

interface Layer {
  isVisible: boolean;
  selectedTrait: string | null;
}

interface LayersPanelProps {
  layers: Record<LayerId, Layer>;
  activeLayerId: LayerId;
  onLayerSelect: (layerId: LayerId) => void;
  onToggleVisibility: (layerId: LayerId, e: React.MouseEvent) => void;
  onTraitSelect: (layerId: LayerId, traitId: string) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onLayerSelect,
  onToggleVisibility,
  onTraitSelect
}) => {
  return (
    <div className={styles.layersPanel}>
      <div className={styles.layersTitle}>Layers</div>
      <div className={styles.layersContent}>
        {LAYERS.map((layer) => {
          const traitOptions = getTraitOptions(layer.id);
          
          return (
            <div 
              key={layer.id}
              className={`${styles.layer} ${activeLayerId === layer.id ? styles.active : ''}`}
              onClick={() => onLayerSelect(layer.id)}
            >
              <div className={styles.layerPreview}>
                <Icon 
                  appId={layer.icon}
                  width={24}
                  height={24}
                  className={styles.layerIcon}
                />
              </div>
              <div className={styles.layerControls}>
                <button
                  className={styles.layerControl}
                  onClick={(e) => onToggleVisibility(layer.id, e)}
                  title={layers[layer.id]?.isVisible ? "Hide layer" : "Show layer"}
                >
                  {layers[layer.id]?.isVisible ? 
                    <span className={styles.toolIcon} data-visible="true">👁</span> : 
                    <span className={styles.toolIcon} data-visible="false">🚫</span>
                  }
                </button>
                   <Win95Dropdown
                     className={styles.traitSelect}
                     value={layers[layer.id]?.selectedTrait || ''}
                     onChange={(value) => onTraitSelect(layer.id, value as string)}
                     placeholder={layer.name}
                     layerId={layer.id}
                     showTraitPreviews={true}
                     options={[
                       { value: '', label: layer.name },
                       ...traitOptions
                     ]}
                   />
                <button 
                  className={styles.layerControl}
                  onClick={(e) => e.stopPropagation()}
                  title="More options"
                >
                  ⋮
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
