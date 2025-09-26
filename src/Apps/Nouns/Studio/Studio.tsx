/**
 * Studio - Windows 95 Microsoft Paint for Nouns DAO
 * Restructured for better maintainability and component separation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Toolbar,
  Canvas,
  LayersPanel,
  ExportPanel,
  ColorPalette,
  InstructionsPanel
} from './components';
import { useLayers, useCanvas } from './hooks';
import { getNounsPalette, exportAsPNG, hasArtwork, ToolId } from './utils';
import type { LayerId } from './utils';
import styles from './Studio.module.css';

const Studio: React.FC = () => {
  // Initialize state
  const palette = getNounsPalette();
  const [exportSize, setExportSize] = useState<number>(32);
  const [isInstructionsCollapsed, setIsInstructionsCollapsed] = useState(true);
  const [isMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });

  // Custom hooks for core functionality
  const {
    layers,
    activeLayerId,
    setActiveLayerId,
    toggleLayerVisibility,
    selectTrait,
    handleDrawOperation
  } = useLayers();

  const {
    tool,
    setTool,
    toolSize,
    setToolSize,
    selectedColor,
    setSelectedColor,
    previousColor,
    hoverPos,
    history,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleUndo,
    handleRedo,
    swapColors
  } = useCanvas(palette[0]);

  // Handle mobile detection
  useEffect(() => {
    const checkIfMobile = () => {
      if (typeof window === 'undefined') return;
      const isMobileView = window.innerWidth <= 768;
      if (isMobileView) {
        setIsInstructionsCollapsed(true);
      }
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Tool selection handler
  const handleToolSelect = useCallback((toolId: ToolId) => {
    if (toolId === 'undo') {
      handleUndo(layers, handleDrawOperation);
      return;
    }
    if (toolId === 'redo') {
      handleRedo(layers, handleDrawOperation);
      return;
    }
    setTool(toolId);
  }, [handleUndo, handleRedo, layers, handleDrawOperation, setTool]);

  // Layer visibility toggle handler
  const handleLayerVisibilityToggle = useCallback((layerId: LayerId, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLayerVisibility(layerId);
  }, [toggleLayerVisibility]);

  // Trait selection handler
  const handleTraitSelection = useCallback(async (layerId: LayerId, traitId: string) => {
    await selectTrait(layerId, traitId);
  }, [selectTrait]);

  // Canvas interaction handlers
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMobile) return;
    
    handleMouseDown(e, activeLayerId, handleDrawOperation, palette);
  }, [isMobile, activeLayerId, handleMouseDown, handleDrawOperation, palette]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    handleMouseMove(e, activeLayerId, handleDrawOperation);
  }, [activeLayerId, handleMouseMove, handleDrawOperation]);

  // Export functionality
  const handleExport = useCallback(() => {
    exportAsPNG(layers, exportSize);
  }, [layers, exportSize]);

  // Check if there's artwork to export
  const hasArtworkToExport = hasArtwork(layers);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.topRow}>
          <Toolbar
            selectedTool={tool}
            onToolSelect={handleToolSelect}
            toolSize={toolSize}
            onToolSizeChange={setToolSize}
            canUndo={history.past.length > 0}
            canRedo={history.future.length > 0}
            selectedColor={selectedColor}
            previousColor={previousColor}
            onColorSwap={swapColors}
          />

          <Canvas
            layers={layers}
            hoverPos={hoverPos}
            toolSize={toolSize}
            selectedTool={tool}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            isMobile={isMobile}
          />

          <div className={styles.controlsPanel}>
            <InstructionsPanel
              isCollapsed={isInstructionsCollapsed}
              onToggleCollapse={() => setIsInstructionsCollapsed(!isInstructionsCollapsed)}
            />
            
            <div className={styles.controlsBottom}>
              <ExportPanel
                exportSize={exportSize}
                onExportSizeChange={setExportSize}
                onExport={handleExport}
                hasArtwork={hasArtworkToExport}
              />

              <LayersPanel
                layers={layers}
                activeLayerId={activeLayerId}
                onLayerSelect={setActiveLayerId}
                onToggleVisibility={handleLayerVisibilityToggle}
                onTraitSelect={handleTraitSelection}
              />
            </div>
          </div>
        </div>

        <ColorPalette
          colors={palette}
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
        />
      </div>
    </div>
  );
};

export default Studio;
