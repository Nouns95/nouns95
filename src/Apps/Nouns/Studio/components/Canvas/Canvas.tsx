/**
 * Studio Canvas Component
 * Main drawing area with grid and hover effects
 */

import React, { useRef, useEffect } from 'react';
import { CANVAS_SIZE } from '../../utils/tools';
import { LayerId } from '../../utils/layers';
import styles from './Canvas.module.css';

interface Layer {
  canvas: HTMLCanvasElement | null;
  isVisible: boolean;
  zIndex: number;
}

interface CanvasProps {
  layers: Record<LayerId, Layer>;
  hoverPos: { x: number; y: number } | null;
  toolSize: number;
  selectedTool: string;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  isMobile?: boolean;
}

export const Canvas: React.FC<CanvasProps> = ({
  layers,
  hoverPos,
  toolSize,
  selectedTool,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  isMobile = false
}) => {
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const hoverCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  // Initialize grid and handle hover highlight
  useEffect(() => {
    const gridCanvas = gridCanvasRef.current;
    const hoverCanvas = hoverCanvasRef.current;
    if (!gridCanvas || !hoverCanvas) return;

    const gridCtx = gridCanvas.getContext('2d');
    const hoverCtx = hoverCanvas.getContext('2d');
    if (!gridCtx || !hoverCtx) return;

    // Set canvas sizes
    gridCanvas.width = CANVAS_SIZE;
    gridCanvas.height = CANVAS_SIZE;
    hoverCanvas.width = CANVAS_SIZE;
    hoverCanvas.height = CANVAS_SIZE;

    // Enable crisp pixel rendering
    gridCtx.imageSmoothingEnabled = false;
    hoverCtx.imageSmoothingEnabled = false;

    // Draw grid background
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    // Draw checkerboard pattern
    for (let x = 0; x < CANVAS_SIZE; x++) {
      for (let y = 0; y < CANVAS_SIZE; y++) {
        gridCtx.fillStyle = (x + y) % 2 === 0 ? '#e0e0e0' : '#d0d0d0';
        gridCtx.fillRect(x, y, 1, 1);
      }
    }

    // Draw grid lines
    gridCtx.strokeStyle = '#ccc';
    gridCtx.lineWidth = 0.05;
    for (let i = 0; i <= CANVAS_SIZE; i++) {
      gridCtx.beginPath();
      gridCtx.moveTo(i, 0);
      gridCtx.lineTo(i, CANVAS_SIZE);
      gridCtx.stroke();

      gridCtx.beginPath();
      gridCtx.moveTo(0, i);
      gridCtx.lineTo(CANVAS_SIZE, i);
      gridCtx.stroke();
    }

    // Draw hover highlight
    if (hoverPos) {
      hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
      if (selectedTool === 'pencil' || selectedTool === 'eraser') {
        hoverCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        const offset = Math.floor(toolSize / 2);
        for (let i = 0; i < toolSize; i++) {
          for (let j = 0; j < toolSize; j++) {
            const x = hoverPos.x - offset + i;
            const y = hoverPos.y - offset + j;
            if (x >= 0 && x < CANVAS_SIZE && y >= 0 && y < CANVAS_SIZE) {
              hoverCtx.fillRect(x, y, 1, 1);
            }
          }
        }
      } else {
        // Single pixel highlight for other tools
        hoverCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        hoverCtx.fillRect(hoverPos.x, hoverPos.y, 1, 1);
      }
    } else {
      hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
    }
  }, [hoverPos, toolSize, selectedTool]);

  // Update visible canvases from layer canvases
  useEffect(() => {
    Object.entries(layers).forEach(([id, layer]) => {
      if (layer.canvas) {
        const visibleCanvas = canvasRefs.current[id];
        if (visibleCanvas) {
          const ctx = visibleCanvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            ctx.drawImage(layer.canvas, 0, 0);
          }
        }
      }
    });
  }, [layers]);


  return (
    <div className={styles.canvasWrapper}>
      <div className={styles.canvasContent}>
        <canvas
          ref={gridCanvasRef}
          className={styles.gridCanvas}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
        />
        {Object.entries(layers)
          .filter(([, layer]) => layer.isVisible)
          .map(([id, layer]) => (
          <canvas
            key={id}
              ref={(el) => {
                if (el) {
                  canvasRefs.current[id] = el;
                }
              }}
            className={styles.layerCanvas}
              style={{
                visibility: layer.isVisible ? 'visible' : 'hidden',
                zIndex: layer.zIndex
              }}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              onMouseDown={isMobile ? undefined : onMouseDown}
              onMouseMove={isMobile ? undefined : onMouseMove}
              onMouseUp={isMobile ? undefined : onMouseUp}
              onMouseLeave={isMobile ? undefined : onMouseLeave}
          />
        ))}
        <canvas
          ref={hoverCanvasRef}
          className={styles.hoverCanvas}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
        />
      </div>
    </div>
  );
};
