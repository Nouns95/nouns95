/**
 * Canvas Management Hook
 * Handles drawing operations, history, and canvas interactions
 */

import { useState, useCallback } from 'react';
import { 
  ToolId, 
  CANVAS_SIZE, 
  drawPencil, 
  drawEraser, 
  drawFill, 
  pickColor, 
  getCanvasCoordinates 
} from '../utils/tools';
import { LayerId } from '../utils/layers';

interface DrawAction {
  layerId: LayerId;
  tool: 'pencil' | 'eraser' | 'fill';
  imageData: ImageData;
}

interface HistoryState {
  past: DrawAction[];
  future: DrawAction[];
}

export interface UseCanvasReturn {
  tool: ToolId;
  setTool: (tool: ToolId) => void;
  toolSize: number;
  setToolSize: (size: number) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  previousColor: string;
  isDrawing: boolean;
  hoverPos: { x: number; y: number } | null;
  history: HistoryState;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>, activeLayerId: LayerId, drawOperation: (layerId: LayerId, operation: (canvas: HTMLCanvasElement) => void) => void, validColors: string[]) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>, activeLayerId: LayerId, drawOperation: (layerId: LayerId, operation: (canvas: HTMLCanvasElement) => void) => void) => void;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;
  handleUndo: (layers: Record<LayerId, { canvas: HTMLCanvasElement | null }>, drawOperation: (layerId: LayerId, operation: (canvas: HTMLCanvasElement) => void) => void) => void;
  handleRedo: (layers: Record<LayerId, { canvas: HTMLCanvasElement | null }>, drawOperation: (layerId: LayerId, operation: (canvas: HTMLCanvasElement) => void) => void) => void;
  swapColors: () => void;
}

export const useCanvas = (initialColor: string): UseCanvasReturn => {
  const [tool, setTool] = useState<ToolId>('pencil');
  const [toolSize, setToolSize] = useState(1);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [previousColor, setPreviousColor] = useState(initialColor);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    future: []
  });

  // Remove unused ref - layers are passed as parameters now

  /**
   * Save canvas state to history before drawing
   */
  const saveToHistory = useCallback((layerId: LayerId, tool: 'pencil' | 'eraser' | 'fill', canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    setHistory(prev => ({
      past: [...prev.past, { layerId, tool, imageData }].slice(-10),
      future: []
    }));
  }, []);

  /**
   * Handle mouse down events
   */
  const handleMouseDown = useCallback((
    e: React.MouseEvent<HTMLCanvasElement>,
    activeLayerId: LayerId,
    drawOperation: (layerId: LayerId, operation: (canvas: HTMLCanvasElement) => void) => void,
    validColors: string[]
  ) => {
    const { x, y } = getCanvasCoordinates(e);
 
    if (tool === 'fill') {
      drawOperation(activeLayerId, (canvas) => {
        saveToHistory(activeLayerId, tool, canvas);
        drawFill(canvas, x, y, selectedColor);
      });
    } else if (tool === 'eyedropper') {
      drawOperation(activeLayerId, (canvas) => {
        const pickedColor = pickColor(canvas, x, y, validColors);
        if (pickedColor) {
          setPreviousColor(selectedColor);
          setSelectedColor(pickedColor);
          setTool('pencil');
        }
      });
    } else if (tool === 'pencil' || tool === 'eraser') {
      setIsDrawing(true);
      drawOperation(activeLayerId, (canvas) => {
        saveToHistory(activeLayerId, tool, canvas);
        if (tool === 'pencil') {
          drawPencil(canvas, x, y, selectedColor, toolSize);
        } else {
          drawEraser(canvas, x, y, toolSize);
        }
      });
    }
  }, [tool, selectedColor, toolSize, saveToHistory]);

  /**
   * Handle mouse move events
   */
  const handleMouseMove = useCallback((
    e: React.MouseEvent<HTMLCanvasElement>,
    activeLayerId: LayerId,
    drawOperation: (layerId: LayerId, operation: (canvas: HTMLCanvasElement) => void) => void
  ) => {
    const { x, y } = getCanvasCoordinates(e);
    setHoverPos({ x, y });

    if (!isDrawing || tool === 'fill' || tool === 'eyedropper') return;

    if (tool === 'pencil') {
      drawOperation(activeLayerId, (canvas) => {
        drawPencil(canvas, x, y, selectedColor, toolSize);
      });
    } else if (tool === 'eraser') {
      drawOperation(activeLayerId, (canvas) => {
        drawEraser(canvas, x, y, toolSize);
      });
    }
  }, [isDrawing, tool, selectedColor, toolSize]);

  /**
   * Handle mouse up events
   */
  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  /**
   * Handle mouse leave events
   */
  const handleMouseLeave = useCallback(() => {
    setIsDrawing(false);
    setHoverPos(null);
  }, []);

  /**
   * Handle undo operation
   */
  const handleUndo = useCallback((
    layers: Record<LayerId, { canvas: HTMLCanvasElement | null }>,
    drawOperation: (layerId: LayerId, operation: (canvas: HTMLCanvasElement) => void) => void
  ) => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;

      const newPast = [...prev.past];
      const action = newPast.pop()!;
      
      const layer = layers[action.layerId];
      if (!layer?.canvas) return prev;
      
      const ctx = layer.canvas.getContext('2d');
      if (!ctx) return prev;

      const currentState = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      
      // Apply the previous state and trigger visual update
      drawOperation(action.layerId, (canvas) => {
        const canvasCtx = canvas.getContext('2d');
        if (canvasCtx) {
          canvasCtx.putImageData(action.imageData, 0, 0);
        }
      });

      return {
        past: newPast,
        future: [...prev.future, { ...action, imageData: currentState }]
      };
    });
  }, []);

  /**
   * Handle redo operation
   */
  const handleRedo = useCallback((
    layers: Record<LayerId, { canvas: HTMLCanvasElement | null }>,
    drawOperation: (layerId: LayerId, operation: (canvas: HTMLCanvasElement) => void) => void
  ) => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;

      const newFuture = [...prev.future];
      const action = newFuture.pop()!;
      
      const layer = layers[action.layerId];
      if (!layer?.canvas) return prev;
      
      const ctx = layer.canvas.getContext('2d');
      if (!ctx) return prev;

      const currentState = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      
      // Apply the future state and trigger visual update
      drawOperation(action.layerId, (canvas) => {
        const canvasCtx = canvas.getContext('2d');
        if (canvasCtx) {
          canvasCtx.putImageData(action.imageData, 0, 0);
        }
      });

      return {
        past: [...prev.past, { ...action, imageData: currentState }],
        future: newFuture
      };
    });
  }, []);

  /**
   * Swap current and previous colors
   */
  const swapColors = useCallback(() => {
    const temp = selectedColor;
    setSelectedColor(previousColor);
    setPreviousColor(temp);
  }, [selectedColor, previousColor]);

  /**
   * Update selected color and track previous
   */
  const updateSelectedColor = useCallback((color: string) => {
    setPreviousColor(selectedColor);
    setSelectedColor(color);
  }, [selectedColor]);

  return {
    tool,
    setTool,
    toolSize,
    setToolSize,
    selectedColor,
    setSelectedColor: updateSelectedColor,
    previousColor,
    isDrawing,
    hoverPos,
    history,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleUndo,
    handleRedo,
    swapColors
  };
};
