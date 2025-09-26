/**
 * Studio Tools Utilities
 * Drawing tool implementations and configurations
 */

export const CANVAS_SIZE = 32;

// Tool definitions with icons
export const TOOLS = [
  { id: 'pencil', name: 'Pencil Tool', icon: 'studio-pencil' },
  { id: 'eraser', name: 'Eraser Tool', icon: 'studio-eraser' },
  { id: 'fill', name: 'Fill Tool', icon: 'studio-bucket' },
  { id: 'eyedropper', name: 'Color Picker', icon: 'studio-eyedropper' },
  { id: 'undo', name: 'Undo', icon: 'studio-undo' },
  { id: 'redo', name: 'Redo', icon: 'studio-redo' }
] as const;

export type ToolId = typeof TOOLS[number]['id'];

/**
 * Get pixel color from canvas at specific coordinates
 */
export const getPixelColor = (x: number, y: number, canvas: HTMLCanvasElement): string | null => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imageData = ctx.getImageData(x, y, 1, 1);
  const data = imageData.data;
  
  if (data[3] === 0) return null; // Transparent pixel
  return `#${data[0].toString(16).padStart(2, '0')}${data[1].toString(16).padStart(2, '0')}${data[2].toString(16).padStart(2, '0')}`.toUpperCase();
};

/**
 * Pencil tool implementation
 */
export const drawPencil = (
  canvas: HTMLCanvasElement, 
  x: number, 
  y: number, 
  color: string, 
  size: number = 1
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.fillStyle = color;
  const offset = Math.floor(size / 2);
  
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const drawX = x - offset + i;
      const drawY = y - offset + j;
      if (drawX >= 0 && drawX < CANVAS_SIZE && drawY >= 0 && drawY < CANVAS_SIZE) {
        ctx.fillRect(drawX, drawY, 1, 1);
      }
    }
  }
};

/**
 * Eraser tool implementation
 */
export const drawEraser = (
  canvas: HTMLCanvasElement, 
  x: number, 
  y: number, 
  size: number = 1
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const offset = Math.floor(size / 2);
  
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const drawX = x - offset + i;
      const drawY = y - offset + j;
      if (drawX >= 0 && drawX < CANVAS_SIZE && drawY >= 0 && drawY < CANVAS_SIZE) {
        ctx.clearRect(drawX, drawY, 1, 1);
      }
    }
  }
};

/**
 * Fill tool implementation (flood fill algorithm)
 */
export const drawFill = (
  canvas: HTMLCanvasElement, 
  x: number, 
  y: number, 
  color: string
): void => {
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
};

/**
 * Eyedropper tool implementation
 */
export const pickColor = (
  canvas: HTMLCanvasElement, 
  x: number, 
  y: number,
  validColors: string[]
): string | null => {
  const color = getPixelColor(x, y, canvas);
  if (color && validColors.includes(color.toUpperCase())) {
    return color.toUpperCase();
  }
  return null;
};

/**
 * Tool implementations object
 */
export const toolImplementations = {
  pencil: drawPencil,
  eraser: drawEraser,
  fill: drawFill,
  eyedropper: pickColor
};

/**
 * Calculate canvas coordinates from mouse event
 */
export const getCanvasCoordinates = (
  e: React.MouseEvent<HTMLCanvasElement>
): { x: number; y: number } => {
  const canvas = e.currentTarget;
  const rect = canvas.getBoundingClientRect();
  
  // Ensure we use the same dimension for both axes to maintain square aspect ratio
  const size = Math.min(rect.width, rect.height);
  
  // Calculate offset to center the square within the rect
  const offsetX = (rect.width - size) / 2;
  const offsetY = (rect.height - size) / 2;
  
  // Calculate relative position (0-1) within the square area
  const relativeX = (e.clientX - rect.left - offsetX) / size;
  const relativeY = (e.clientY - rect.top - offsetY) / size;
  
  // Convert to canvas coordinates and clamp to canvas bounds
  const x = Math.min(Math.max(Math.floor(relativeX * CANVAS_SIZE), 0), CANVAS_SIZE - 1);
  const y = Math.min(Math.max(Math.floor(relativeY * CANVAS_SIZE), 0), CANVAS_SIZE - 1);
  
  return { x, y };
};
