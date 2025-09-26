/**
 * Studio Export Utilities
 * Functions for exporting artwork as PNG files
 */

import { CANVAS_SIZE } from './tools';

export const EXPORT_SIZES = [32, 64, 128, 256, 512, 1024];

export interface Layer {
  canvas: HTMLCanvasElement | null;
  isVisible: boolean;
  zIndex: number;
}

/**
 * Export visible layers as PNG
 */
export const exportAsPNG = (
  layers: Record<string, Layer>, 
  size: number = 512, 
  filename: string = 'noun.png'
): void => {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = size;
  exportCanvas.height = size;
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) return;

  // Enable pixel art rendering
  ctx.imageSmoothingEnabled = false;

  // Draw visible layers in order (lowest zIndex first)
  Object.values(layers)
    .sort((a, b) => a.zIndex - b.zIndex)
    .forEach(layer => {
      if (!layer.isVisible || !layer.canvas) return;
      ctx.drawImage(
        layer.canvas,
        0, 0, CANVAS_SIZE, CANVAS_SIZE,
        0, 0, size, size
      );
    });

  // Create download link
  const link = document.createElement('a');
  link.download = filename;
  link.href = exportCanvas.toDataURL('image/png');
  link.click();
};

/**
 * Export as data URL for preview purposes
 */
export const exportAsDataURL = (
  layers: Record<string, Layer>, 
  size: number = 256
): string => {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = size;
  exportCanvas.height = size;
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) return '';

  // Enable pixel art rendering
  ctx.imageSmoothingEnabled = false;

  // Draw visible layers in order
  Object.values(layers)
    .sort((a, b) => a.zIndex - b.zIndex)
    .forEach(layer => {
      if (!layer.isVisible || !layer.canvas) return;
      ctx.drawImage(
        layer.canvas,
        0, 0, CANVAS_SIZE, CANVAS_SIZE,
        0, 0, size, size
      );
    });

  return exportCanvas.toDataURL('image/png');
};

/**
 * Check if there's any artwork to export
 */
export const hasArtwork = (layers: Record<string, Layer>): boolean => {
  return Object.values(layers).some(layer => {
    if (!layer.isVisible || !layer.canvas) return false;
    
    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return false;
    
    // Check if canvas has any non-transparent pixels
    const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const data = imageData.data;
    
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) return true; // Found a non-transparent pixel
    }
    
    return false;
  });
};
