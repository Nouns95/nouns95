import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './Studio.module.css';
import { ImageData } from '@/src/Apps/Nouns/domain/utils/image-data';
import { buildSVG } from '@/src/Apps/Nouns/domain/utils/svg-builder';
import { getTraitName } from '@/src/Apps/Nouns/domain/utils/trait-name-utils';
import { Icon } from '@/src/Shell/Shell';

// Get the official Nouns palette and sort into color groups
const usedColors = new Set<string>();
const NOUNS_PALETTE = [
  // Whites and Light Grays
  ...ImageData.palette
    .filter((color: string) => color !== '')
    .filter((color: string) => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      const avg = (r + g + b) / 3;
      return avg > 220 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20;
    })
    .map((color: string) => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    }),

  // Grays (including dark grays and blacks)
  ...ImageData.palette
    .filter((color: string) => color !== '' && !usedColors.has(color))
    .filter((color: string) => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      const avg = (r + g + b) / 3;
      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      return maxDiff < 30 && avg <= 220;
    })
    .map((color: string) => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    }),

  // Blues
  ...ImageData.palette
    .filter((color: string) => color !== '' && !usedColors.has(color))
    .filter((color: string) => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      return b > r && b > g && (b > 150 || (b > 80 && b > r * 1.2 && b > g * 1.2));
    })
    .map((color: string) => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    }),

  // Light Blues and Cyans
  ...ImageData.palette
    .filter((color: string) => color !== '' && !usedColors.has(color))
    .filter((color: string) => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      return b > 100 && g > 100 && g/b > 0.7 && g/b < 1.1 && r < g;
    })
    .map((color: string) => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    }),

  // Greens
  ...ImageData.palette
    .filter((color: string) => color !== '' && !usedColors.has(color))
    .filter((color: string) => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      return g > Math.max(r, b) && (g > 100 || (g > 60 && g > r * 1.2 && g > b * 1.2));
    })
    .map((color: string) => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    }),

  // Yellows and Light Greens
  ...ImageData.palette
    .filter((color: string) => color !== '' && !usedColors.has(color))
    .filter((color: string) => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      return r > 150 && g > 150 && b < Math.min(r, g) * 0.9 && Math.abs(r - g) < 40;
    })
    .map((color: string) => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    }),

  // Reds and Pinks
  ...ImageData.palette
    .filter((color: string) => color !== '' && !usedColors.has(color))
    .filter((color: string) => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      return r > Math.max(g, b) && (r > 150 || (r > 100 && r > g * 1.4 && r > b * 1.4));
    })
    .map((color: string) => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    }),

  // Purples
  ...ImageData.palette
    .filter((color: string) => color !== '' && !usedColors.has(color))
    .filter((color: string) => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      return r > g && b > g && Math.abs(r - b) < 50 && (r > 80 || b > 80);
    })
    .map((color: string) => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    }),

  // Oranges and Browns
  ...ImageData.palette
    .filter((color: string) => color !== '' && !usedColors.has(color))
    .filter((color: string) => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      return r > g && g > b && (
        (r > 150 && g > 80) || 
        (r > 100 && g > 50 && b < 50) ||
        (r > g * 1.2 && g > b * 1.2)
      );
    })
    .map((color: string) => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    }),

  // Add any remaining colors at the end
  ...ImageData.palette
    .filter((color: string) => color !== '' && !usedColors.has(color))
    .map((color: string) => `#${color.toUpperCase()}`)
];

// Update tool definitions to include icon paths
const TOOLS = [
  { id: 'pencil', name: 'Pencil Tool', icon: 'studio-pencil' },
  { id: 'eraser', name: 'Eraser Tool', icon: 'studio-eraser' },
  { id: 'fill', name: 'Fill Tool', icon: 'studio-bucket' },
  { id: 'eyedropper', name: 'Color Picker', icon: 'studio-eyedropper' },
  { id: 'undo', name: 'Undo', icon: 'studio-undo' },
  { id: 'redo', name: 'Redo', icon: 'studio-redo' }
] as const;

// Update layer definitions to include icon paths
const LAYERS = [
  { id: 'noggles', name: 'NOGGLES', icon: 'studio-noggles' },
  { id: 'head', name: 'HEAD', icon: 'studio-head' },
  { id: 'accessory', name: 'ACCESSORY', icon: 'studio-accessory' },
  { id: 'body', name: 'BODY', icon: 'studio-body' },
  { id: 'background', name: 'BACKGROUND', icon: 'studio-background' }
] as const;

// Type for trait categories
type ImageCategory = keyof typeof ImageData.images;
type TraitCategory = ImageCategory | 'bgcolors';
type LayerId = typeof LAYERS[number]['id'];

const TRAIT_CATEGORIES: Record<LayerId, TraitCategory> = {
  noggles: 'glasses',
  head: 'heads',
  accessory: 'accessories',
  body: 'bodies',
  background: 'bgcolors'
} as const;

// Use our local trait name formatter
const formatTraitName = (filename: string, category: LayerId) => {
  // Map noggles to glasses for trait name lookup
  const traitType = category === 'noggles' ? 'glasses' : category;
  return getTraitName(
    traitType as 'head' | 'accessory' | 'body' | 'background' | 'glasses',
    ImageData.images[TRAIT_CATEGORIES[category] as ImageCategory]
      .findIndex(trait => trait.filename === filename)
  );
};

// Use our local background name formatter
const getBackgroundName = (index: number) => {
  return getTraitName('background', index);
};

// Add export size options at the top level
const EXPORT_SIZES = [32, 64, 128, 256, 512, 1024];

// Core types
interface Layer {
  id: LayerId;
  name: string;
  canvas: HTMLCanvasElement | null;
  isVisible: boolean;
  zIndex: number;
  selectedTrait: string | null;
}

type ToolId = typeof TOOLS[number]['id'];

// Add these interfaces near the top with other interfaces
interface DrawAction {
  layerId: LayerId;
  tool: 'pencil' | 'eraser' | 'fill';
  imageData: ImageData;
}

interface HistoryState {
  past: DrawAction[];
  future: DrawAction[];
}

const Studio: React.FC = () => {
  // Constants
  const CANVAS_SIZE = 32;

  // Canvas refs
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const hoverCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  // Core state
  const [layers, setLayers] = useState<Record<LayerId, Layer>>(() => {
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
  });

  // Essential state
  const [activeLayerId, setActiveLayerId] = useState<LayerId>('noggles');
  const [selectedColor, setSelectedColor] = useState(NOUNS_PALETTE[0]);
  const [previousColor, setPreviousColor] = useState(NOUNS_PALETTE[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<ToolId>('pencil');
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [exportSize, setExportSize] = useState<number>(512);
  const [isInstructionsCollapsed, setIsInstructionsCollapsed] = useState(true);
  const [isMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });

  // Add new state for tool size
  const [toolSize, setToolSize] = useState(1);

  // Add history state
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    future: []
  });

  // Add useEffect for mobile detection
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
      if (tool === 'pencil' || tool === 'eraser') {
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
  }, [hoverPos, toolSize, tool]);

  // Drawing tools implementation
  const tools = {
    pencil: {
      draw: (canvas: HTMLCanvasElement, x: number, y: number, color: string) => {
      const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = color;
        const offset = Math.floor(toolSize / 2);
        for (let i = 0; i < toolSize; i++) {
          for (let j = 0; j < toolSize; j++) {
            const drawX = x - offset + i;
            const drawY = y - offset + j;
            if (drawX >= 0 && drawX < CANVAS_SIZE && drawY >= 0 && drawY < CANVAS_SIZE) {
              ctx.fillRect(drawX, drawY, 1, 1);
            }
          }
        }
      }
    },
    eraser: {
      draw: (canvas: HTMLCanvasElement, x: number, y: number) => {
        const ctx = canvas.getContext('2d');
    if (!ctx) return;
        const offset = Math.floor(toolSize / 2);
        for (let i = 0; i < toolSize; i++) {
          for (let j = 0; j < toolSize; j++) {
            const drawX = x - offset + i;
            const drawY = y - offset + j;
            if (drawX >= 0 && drawX < CANVAS_SIZE && drawY >= 0 && drawY < CANVAS_SIZE) {
              ctx.clearRect(drawX, drawY, 1, 1);
            }
          }
        }
      }
    },
    fill: {
      draw: (canvas: HTMLCanvasElement, x: number, y: number, color: string) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const targetColor = getPixelColor(x, y, canvas);
        
        const stack = [{x, y}];
        const checked = new Set<string>();
        
        while (stack.length > 0) {
          const pos = stack.pop()!;
          const key = `${pos.x},${pos.y}`;
          
          if (checked.has(key)) continue;
          if (pos.x < 0 || pos.x >= CANVAS_SIZE || pos.y < 0 || pos.y >= CANVAS_SIZE) continue;
          
          const currentColor = getPixelColor(pos.x, pos.y, canvas);
          if (currentColor !== targetColor) continue;
          
          checked.add(key);
          ctx.fillStyle = color;
          ctx.fillRect(pos.x, pos.y, 1, 1);
          
          stack.push({x: pos.x + 1, y: pos.y});
          stack.push({x: pos.x - 1, y: pos.y});
          stack.push({x: pos.x, y: pos.y + 1});
          stack.push({x: pos.x, y: pos.y - 1});
        }
      }
    },
    eyedropper: {
      draw: (canvas: HTMLCanvasElement, x: number, y: number) => {
        const color = getPixelColor(x, y, canvas);
        if (color && NOUNS_PALETTE.includes(color.toUpperCase())) {
          setSelectedColor(color.toUpperCase());
          setTool('pencil');
        }
      }
    }
  } as const;

  // Initialize the drawing canvas
  useEffect(() => {
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;

    drawingCanvas.width = CANVAS_SIZE;
    drawingCanvas.height = CANVAS_SIZE;
  }, []);

  // Initialize layer canvases
  useEffect(() => {
    // Create canvases for each layer
    LAYERS.forEach(({ id }) => {
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
      
      // Initialize with transparent background
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      }
      
      setLayers(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          canvas: canvas
        }
      }));
    });
  }, []); // Only run once on mount

  // Sync layer canvases with visible canvases
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

  // Add helper function to save canvas state before drawing
  const saveToHistory = useCallback((layerId: LayerId, tool: 'pencil' | 'eraser' | 'fill') => {
    const layer = layers[layerId];
    if (!layer?.canvas) return;
    
    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return;

    // Get the PREVIOUS state of the canvas before any new operation
    const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Add to history, keeping only last 10 actions
    setHistory(prev => ({
      past: [...prev.past, { layerId, tool, imageData }].slice(-10),
      future: [] // Clear future when new action is added
    }));
  }, [layers]);

  // Add undo function
  const handleUndo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;

      const newPast = [...prev.past];
      const action = newPast.pop()!;
      
      // Save current state to future before undoing
      const layer = layers[action.layerId];
      if (!layer?.canvas) return prev;
      
      const ctx = layer.canvas.getContext('2d');
      if (!ctx) return prev;

      const currentState = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      
      // Apply the previous state
      ctx.putImageData(action.imageData, 0, 0);

      // Update visible canvas
      const visibleCanvas = canvasRefs.current[action.layerId];
      if (visibleCanvas) {
        const visibleCtx = visibleCanvas.getContext('2d');
        if (visibleCtx) {
          visibleCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
          visibleCtx.drawImage(layer.canvas, 0, 0);
        }
      }

      return {
        past: newPast,
        future: [...prev.future, { ...action, imageData: currentState }]
      };
    });
  }, [layers]);

  // Add redo function
  const handleRedo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;

      const newFuture = [...prev.future];
      const action = newFuture.pop()!;
      
      // Save current state to past before redoing
      const layer = layers[action.layerId];
      if (!layer?.canvas) return prev;
      
      const ctx = layer.canvas.getContext('2d');
      if (!ctx) return prev;

      const currentState = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      
      // Apply the future state
      ctx.putImageData(action.imageData, 0, 0);

      // Update visible canvas
      const visibleCanvas = canvasRefs.current[action.layerId];
      if (visibleCanvas) {
        const visibleCtx = visibleCanvas.getContext('2d');
        if (visibleCtx) {
          visibleCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
          visibleCtx.drawImage(layer.canvas, 0, 0);
        }
      }

      return {
        past: [...prev.past, { ...action, imageData: currentState }],
        future: newFuture
      };
    });
  }, [layers]);

  // Modify handleDrawOperation to save history BEFORE the operation
  const handleDrawOperation = useCallback((
    layerId: LayerId, 
    operation: (canvas: HTMLCanvasElement) => void,
    shouldSaveHistory: boolean = true
  ) => {
    const layer = layers[layerId];
    if (!layer?.canvas) return;

    // First save the current state if needed
    if (shouldSaveHistory && (tool === 'pencil' || tool === 'eraser' || tool === 'fill')) {
      saveToHistory(layerId, tool);
    }

    // Then perform the operation
    operation(layer.canvas);

    // Finally update the visible canvas
    const visibleCanvas = canvasRefs.current[layerId];
    if (visibleCanvas) {
      const ctx = visibleCanvas.getContext('2d');
      if (ctx) {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.drawImage(layer.canvas, 0, 0);
      }
    }
  }, [layers, tool, saveToHistory]);

  // Mouse event handlers
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate the scaling factor
    const scale = CANVAS_SIZE / rect.width;
    
    // Calculate pixel position and clamp to canvas bounds
    const x = Math.min(Math.max(Math.floor((e.clientX - rect.left) * scale), 0), CANVAS_SIZE - 1);
    const y = Math.min(Math.max(Math.floor((e.clientY - rect.top) * scale), 0), CANVAS_SIZE - 1);
    
    return { x, y };
  };

  // Modify handleMouseDown to save history before starting to draw
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMobile) return; // Disable drawing on mobile
    const activeCanvas = layers[activeLayerId]?.canvas;
    if (!activeCanvas) return;

    const { x, y } = getCanvasCoordinates(e);

    if (tool === 'fill') {
      // Save state BEFORE the fill operation
      saveToHistory(activeLayerId, tool);
      handleDrawOperation(activeLayerId, (canvas) => {
        tools.fill.draw(canvas, x, y, selectedColor);
      }, false); // Don't save history in handleDrawOperation since we already did
    } else if (tool === 'eyedropper') {
      handleDrawOperation(activeLayerId, (canvas) => {
        tools.eyedropper.draw(canvas, x, y);
      }, false); // Don't save history for eyedropper
    } else if (tool === 'pencil' || tool === 'eraser') {
      setIsDrawing(true);
      // Save the state BEFORE starting to draw
      saveToHistory(activeLayerId, tool);
      handleDrawOperation(activeLayerId, (canvas) => {
        tools[tool].draw(canvas, x, y, selectedColor);
      }, false); // Don't save history in handleDrawOperation since we already did
    }
  };

  // Modify handleMouseMove to not save history during continuous drawing
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e);
    setHoverPos({ x, y });

    if (!isDrawing || tool === 'fill' || tool === 'eyedropper') return;

    const activeCanvas = layers[activeLayerId]?.canvas;
    if (!activeCanvas) return;

    if (tool === 'pencil' || tool === 'eraser') {
      handleDrawOperation(activeLayerId, (canvas) => {
        tools[tool].draw(canvas, x, y, selectedColor);
      }, false); // Don't save history during continuous drawing
    }
  };

  // Modify handleMouseUp to not save history since we save at the start
  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
    setHoverPos(null);
  };

  // Layer visibility toggle
  const toggleLayerVisibility = useCallback((layerId: LayerId, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent layer selection when toggling visibility
    setLayers(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        isVisible: !prev[layerId].isVisible
      }
    }));
  }, []);

  // Layer selection handler
  const handleLayerSelect = useCallback((layerId: LayerId) => {
    setActiveLayerId(layerId);
  }, []);

  // Trait selection handler
  const handleTraitSelect = useCallback(async (layerId: LayerId, traitId: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation(); // Prevent layer selection when selecting trait
    const layer = layers[layerId];
    if (!layer?.canvas) return;

    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return;

    // Clear the current layer
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (!traitId) {
      // Just clear the layer and update state
      setLayers(prev => ({
        ...prev,
        [layerId]: {
          ...prev[layerId],
          selectedTrait: null
        }
      }));
        return;
    }

    if (layerId === 'background') {
      // For background, fill with color from bgcolors
      ctx.fillStyle = `#${traitId}`;
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      
      // Update layer state
      setLayers(prev => ({
        ...prev,
        [layerId]: {
          ...prev[layerId],
          selectedTrait: traitId
        }
      }));
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
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = `data:image/svg+xml;base64,${btoa(svgString)}`;
      });

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Update layer state
      setLayers(prev => ({
        ...prev,
        [layerId]: {
          ...prev[layerId],
          selectedTrait: traitId
        }
      }));
    } catch (error) {
      console.error('Error applying trait:', error);
    }
  }, [layers]);

  // Export functionality
  const exportAsPNG = () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

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
          0, 0, exportSize, exportSize
        );
      });

    // Create download link
    const link = document.createElement('a');
    link.download = 'noun.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  // Update UI Event Handler
  const handleToolClick = (toolId: ToolId) => {
    if (toolId === 'undo') {
      handleUndo();
      return;
    }
    if (toolId === 'redo') {
      handleRedo();
      return;
    }
    setTool(toolId);
  };

  // Update the button disabled states
  const isUndoDisabled = history.past.length === 0;
  const isRedoDisabled = history.future.length === 0;

  // Helper function to get pixel color
  const getPixelColor = (x: number, y: number, canvas: HTMLCanvasElement): string | null => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imageData = ctx.getImageData(x, y, 1, 1);
    const data = imageData.data;
    
    if (data[3] === 0) return null; // Transparent pixel
    return `#${data[0].toString(16).padStart(2, '0')}${data[1].toString(16).padStart(2, '0')}${data[2].toString(16).padStart(2, '0')}`.toUpperCase();
  };

  // Add size selector component
  const renderSizeSelector = () => {
    if (tool !== 'pencil' && tool !== 'eraser') return null;

  return (
      <div className={styles.toolSizeSelector}>
        {[1, 2, 3, 4].map(size => (
          <button
            key={size}
            className={`${styles.sizeOption} ${size === toolSize ? styles.active : ''}`}
            onClick={() => setToolSize(size)}
            title={`${size}x${size} pixels`}
          >
            <div className={`${styles.sizePreview} ${styles[`size${size}`]}`} />
          </button>
        ))}
      </div>
    );
  };

  // Update color selection to track previous color
  const handleColorSelect = (color: string) => {
    setPreviousColor(selectedColor);
    setSelectedColor(color);
  };

  return (
    <div className={`${styles.studioPage} ${isMobile ? styles.mobile : ''}`}>
      <div className={styles.topRow}>
        <div className={styles.toolbox}>
          <div className={styles.toolGrid}>
            {TOOLS.map(toolItem => (
              <button 
                key={toolItem.id}
                className={`${styles.tool} ${toolItem.id === tool ? styles.active : ''}`}
                onClick={() => handleToolClick(toolItem.id)}
                title={toolItem.name}
                disabled={
                  (toolItem.id === 'undo' && isUndoDisabled) ||
                  (toolItem.id === 'redo' && isRedoDisabled)
                }
              >
                <div className={styles.toolIcon}>
                  <Icon appId={toolItem.icon} width={
                    toolItem.id === 'undo' || toolItem.id === 'redo' ? 16 : 24
                  } height={
                    toolItem.id === 'undo' || toolItem.id === 'redo' ? 16 : 24
                  } />
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
              onClick={() => handleColorSelect(previousColor)}
              title="Previous Color (click to swap)"
            />
          </div>
        </div>

        <div className={styles.canvasWrapper}>
          <div className={styles.canvasContent}>
            <canvas
              ref={gridCanvasRef}
              className={styles.gridCanvas}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
            />
            {Object.values(layers)
              .sort((a, b) => b.zIndex - a.zIndex)
              .map(layer => (
              <canvas
                key={layer.id}
                  ref={(el) => {
                    if (el) {
                      canvasRefs.current[layer.id] = el;
                    }
                  }}
                className={styles.layerCanvas}
                  style={{
                    visibility: layer.isVisible ? 'visible' : 'hidden',
                    zIndex: layer.zIndex
                  }}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
              />
            ))}
            <canvas
              ref={drawingCanvasRef}
              className={styles.drawingCanvas}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
            />
            <canvas
              ref={hoverCanvasRef}
              className={styles.hoverCanvas}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
            />
          </div>
        </div>

        <div className={styles.controlsPanel}>
          <div className={`${styles.instructionsPanel} ${isInstructionsCollapsed ? styles.collapsed : ''}`}>
            <div className={styles.instructionsTitle}>
              Instructions
              <button 
                className={styles.collapseButton}
                onClick={() => setIsInstructionsCollapsed(!isInstructionsCollapsed)}
                title={isInstructionsCollapsed ? "Expand" : "Collapse"}
              >
                {isInstructionsCollapsed ? "+" : "-"}
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
          
          <div className={styles.controlsBottom}>
            <div className={styles.exportPanel}>
              <div className={styles.exportTitle}>Export</div>
              <div className={styles.exportControls}>
                <select 
                  className={styles.sizeSelect}
                  value={exportSize}
                  onChange={(e) => setExportSize(Number(e.target.value))}
                >
                  {EXPORT_SIZES.map(size => (
                    <option key={size} value={size}>
                      {size}x{size}
                    </option>
                  ))}
                </select>
                <button 
                  className={styles.exportButton}
                  onClick={exportAsPNG}
                >
                  <span className={styles.toolIcon}>↓</span> Export PNG
                </button>
              </div>
            </div>

            <div className={styles.layersPanel}>
              <div className={styles.layersTitle}>Layers</div>
              {LAYERS.map((layer) => (
                <div 
                  key={layer.id}
                  className={`${styles.layer} ${activeLayerId === layer.id ? styles.active : ''}`}
                  onClick={() => handleLayerSelect(layer.id)}
                >
                  <div className={styles.layerPreview}>
                    <Icon 
                      appId={layer.icon}
                      width={24}
                      height={24}
                      className={styles.layerIcon}
                    />
                  </div>
                  <span className={styles.layerName}>{layer.name}</span>
                  <div className={styles.layerControls}>
                    <button
                      className={styles.layerControl}
                      onClick={(e) => toggleLayerVisibility(layer.id, e)}
                    >
                      {layers[layer.id]?.isVisible ? 
                        <span className={styles.toolIcon} data-visible="true"></span> : 
                        <span className={styles.toolIcon} data-visible="false"></span>
                      }
                    </button>
                    <select 
                      className={styles.traitSelect}
                        value={layers[layer.id]?.selectedTrait || ''}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleTraitSelect(layer.id, e.target.value, e)}
                      >
                        <option value="">{layer.name}</option>
                      {layer.id === 'background' ? (
                        ImageData.bgcolors.map((color, index) => (
                            <option key={color} value={color}>
                            {getBackgroundName(index)}
                          </option>
                        ))
                      ) : (
                          ImageData.images[TRAIT_CATEGORIES[layer.id] as ImageCategory]
                            .sort((a, b) => formatTraitName(a.filename, layer.id)
                              .localeCompare(formatTraitName(b.filename, layer.id)))
                            .map(trait => (
                              <option key={trait.filename} value={trait.filename}>
                                {formatTraitName(trait.filename, layer.id)}
                            </option>
                          ))
                      )}
                    </select>
                      <button 
                        className={styles.layerControl}
                        onClick={(e) => e.stopPropagation()}
                      >⋮</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.colorPalette}>
        {NOUNS_PALETTE.map((color) => (
          <button
            key={color}
            className={`${styles.colorSwatch} ${color === selectedColor ? styles.active : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorSelect(color)}
            title={color}
          />
        ))}
      </div>
    </div>
  );
};

export default Studio; 