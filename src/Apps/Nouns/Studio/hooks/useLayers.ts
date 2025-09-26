/**
 * Layer Management Hook
 * Manages layer state, visibility, and trait selection
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  Layer, 
  LayerId, 
  createInitialLayers, 
  createLayerCanvas, 
  applyTraitToLayer, 
  LAYERS 
} from '../utils/layers';

export interface UseLayersReturn {
  layers: Record<LayerId, Layer>;
  activeLayerId: LayerId;
  setActiveLayerId: (layerId: LayerId) => void;
  toggleLayerVisibility: (layerId: LayerId) => void;
  selectTrait: (layerId: LayerId, traitId: string) => Promise<void>;
  updateVisibleCanvas: (layerId: LayerId, visibleCanvas: HTMLCanvasElement) => void;
  handleDrawOperation: (layerId: LayerId, operation: (canvas: HTMLCanvasElement) => void) => void;
}

export const useLayers = (): UseLayersReturn => {
  const [layers, setLayers] = useState<Record<LayerId, Layer>>(createInitialLayers);
  const [activeLayerId, setActiveLayerId] = useState<LayerId>('noggles');

  // Initialize layer canvases
  useEffect(() => {
    setLayers(prev => {
      const updated = { ...prev };
      LAYERS.forEach(({ id }) => {
        if (!updated[id].canvas) {
          updated[id] = {
            ...updated[id],
            canvas: createLayerCanvas()
          };
        }
      });
      return updated;
    });
  }, []);

  /**
   * Toggle layer visibility
   */
  const toggleLayerVisibility = useCallback((layerId: LayerId) => {
    setLayers(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        isVisible: !prev[layerId].isVisible
      }
    }));
  }, []);

  /**
   * Select a trait for a layer
   */
  const selectTrait = useCallback(async (layerId: LayerId, traitId: string) => {
    const layer = layers[layerId];
    if (!layer?.canvas) return;

    try {
      await applyTraitToLayer(layer.canvas, layerId, traitId);
      
      setLayers(prev => ({
        ...prev,
        [layerId]: {
          ...prev[layerId],
          selectedTrait: traitId || null
        }
      }));
    } catch (error) {
      console.error('Error selecting trait:', error);
    }
  }, [layers]);

  /**
   * Update a visible canvas from layer canvas
   */
  const updateVisibleCanvas = useCallback((layerId: LayerId, visibleCanvas: HTMLCanvasElement) => {
    const layer = layers[layerId];
    if (!layer?.canvas) return;

    const ctx = visibleCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height);
    ctx.drawImage(layer.canvas, 0, 0);
  }, [layers]);

  /**
   * Handle draw operations on layer canvas and trigger updates
   */
  const handleDrawOperation = useCallback((layerId: LayerId, operation: (canvas: HTMLCanvasElement) => void) => {
    const layer = layers[layerId];
    if (!layer?.canvas) return;

    // Perform the operation on the layer canvas
    operation(layer.canvas);

    // Force a state update to trigger re-render and canvas sync
    setLayers(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId]
      }
    }));
  }, [layers]);

  return {
    layers,
    activeLayerId,
    setActiveLayerId,
    toggleLayerVisibility,
    selectTrait,
    updateVisibleCanvas,
    handleDrawOperation
  };
};
