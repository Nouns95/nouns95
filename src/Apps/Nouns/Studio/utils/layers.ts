/**
 * Studio Layers Utilities
 * Layer configuration and trait management
 */

import { ImageData } from '@/src/Apps/Nouns/domain/utils/image-data';
import { buildSVG } from '@/src/Apps/Nouns/domain/utils/svg-builder';
import { getTraitName } from '@/src/Apps/Nouns/domain/utils/trait-name-utils';
import { CANVAS_SIZE } from './tools';

// Layer definitions with icons
export const LAYERS = [
  { id: 'noggles', name: 'NOGGLES', icon: 'studio-noggles' },
  { id: 'head', name: 'HEAD', icon: 'studio-head' },
  { id: 'accessory', name: 'ACCESSORY', icon: 'studio-accessory' },
  { id: 'body', name: 'BODY', icon: 'studio-body' },
  { id: 'background', name: 'BACKGROUND', icon: 'studio-background' }
] as const;

export type LayerId = typeof LAYERS[number]['id'];

// Type for trait categories
type ImageCategory = keyof typeof ImageData.images;
type TraitCategory = ImageCategory | 'bgcolors';

export const TRAIT_CATEGORIES: Record<LayerId, TraitCategory> = {
  noggles: 'glasses',
  head: 'heads',
  accessory: 'accessories',
  body: 'bodies',
  background: 'bgcolors'
} as const;

export interface Layer {
  id: LayerId;
  name: string;
  canvas: HTMLCanvasElement | null;
  isVisible: boolean;
  zIndex: number;
  selectedTrait: string | null;
}

/**
 * Create initial layer state
 */
export const createInitialLayers = (): Record<LayerId, Layer> => {
  const initialLayers: Record<LayerId, Layer> = {
    noggles: {
      id: 'noggles',
      name: 'NOGGLES',
      canvas: null,
      isVisible: true,
      zIndex: 9,
      selectedTrait: null
    },
    head: {
      id: 'head',
      name: 'HEAD',
      canvas: null,
      isVisible: true,
      zIndex: 8,
      selectedTrait: null
    },
    accessory: {
      id: 'accessory',
      name: 'ACCESSORY',
      canvas: null,
      isVisible: true,
      zIndex: 7,
      selectedTrait: null
    },
    body: {
      id: 'body',
      name: 'BODY',
      canvas: null,
      isVisible: true,
      zIndex: 6,
      selectedTrait: null
    },
    background: {
      id: 'background',
      name: 'BACKGROUND',
      canvas: null,
      isVisible: true,
      zIndex: 5,
      selectedTrait: null
    }
  };
  return initialLayers;
};

/**
 * Create a canvas for a layer
 */
export const createLayerCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  
  // Initialize with transparent background
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }
  
  return canvas;
};

/**
 * Format trait name for display
 */
export const formatTraitName = (filename: string, category: LayerId): string => {
  // Map noggles to glasses for trait name lookup
  const traitType = category === 'noggles' ? 'glasses' : category;
  return getTraitName(
    traitType as 'head' | 'accessory' | 'body' | 'background' | 'glasses',
    ImageData.images[TRAIT_CATEGORIES[category] as ImageCategory]
      ?.findIndex(trait => trait.filename === filename) ?? -1
  );
};

/**
 * Get background color name by index
 */
export const getBackgroundName = (index: number): string => {
  return getTraitName('background', index);
};

/**
 * Apply a trait to a layer canvas
 */
export const applyTraitToLayer = async (
  canvas: HTMLCanvasElement,
  layerId: LayerId,
  traitId: string
): Promise<void> => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear the current layer
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  if (!traitId) {
    // Just clear the layer
    return;
  }

  if (layerId === 'background') {
    // For background, fill with color from bgcolors
    ctx.fillStyle = `#${traitId}`;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    return;
  }

  // For other layers, draw the SVG trait
  const category = TRAIT_CATEGORIES[layerId];
  if (category === 'bgcolors') return;

  try {
    const trait = ImageData.images[category]?.find(t => t.filename === traitId);
    if (!trait) return;

    const svgString = buildSVG(
      [{ data: trait.data }],
      ImageData.palette,
      '' // No background color for individual traits
    );

    // Create an image from the SVG
    const img = document.createElement('img');
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = `data:image/svg+xml;base64,${btoa(svgString)}`;
    });

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  } catch (error) {
    console.error('Error applying trait:', error);
  }
};

/**
 * Get trait options for a layer
 */
export const getTraitOptions = (layerId: LayerId): Array<{ value: string; label: string }> => {
  if (layerId === 'background') {
    return ImageData.bgcolors.map((color, index) => ({
      value: color,
      label: getBackgroundName(index)
    }));
  }

  const category = TRAIT_CATEGORIES[layerId] as ImageCategory;
  return ImageData.images[category]
    ?.map(trait => ({
      value: trait.filename,
      label: formatTraitName(trait.filename, layerId)
    }))
    .sort((a, b) => a.label.localeCompare(b.label)) ?? [];
};
