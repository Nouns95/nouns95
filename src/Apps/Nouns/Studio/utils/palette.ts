import { ImageData } from '@/src/Apps/Nouns/domain/utils/image-data';

/**
 * Nouns Palette Utilities
 * Organized color palette from the official Nouns ImageData
 */

// Track used colors to avoid duplicates
const usedColors = new Set<string>();

/**
 * Filter colors by RGB criteria
 */
const filterColors = (
  palette: string[],
  predicate: (r: number, g: number, b: number) => boolean
): string[] => {
  return palette
    .filter((color: string) => color !== '' && !usedColors.has(color))
    .filter((color: string) => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      return predicate(r, g, b);
    })
    .map((color: string) => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    });
};

/**
 * Get organized Nouns color palette grouped by color families
 */
export const getNounsPalette = (): string[] => {
  // Reset used colors for each call
  usedColors.clear();

  const palette: string[] = [];

  // Whites and Light Grays
  palette.push(...filterColors(ImageData.palette, (r, g, b) => {
    const avg = (r + g + b) / 3;
    return avg > 220 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20;
  }));

  // Grays (including dark grays and blacks)
  palette.push(...filterColors(ImageData.palette, (r, g, b) => {
    const avg = (r + g + b) / 3;
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    return maxDiff < 30 && avg <= 220;
  }));

  // Blues
  palette.push(...filterColors(ImageData.palette, (r, g, b) => {
    return b > r && b > g && (b > 150 || (b > 80 && b > r * 1.2 && b > g * 1.2));
  }));

  // Light Blues and Cyans
  palette.push(...filterColors(ImageData.palette, (r, g, b) => {
    return b > 100 && g > 100 && g/b > 0.7 && g/b < 1.1 && r < g;
  }));

  // Greens
  palette.push(...filterColors(ImageData.palette, (r, g, b) => {
    return g > Math.max(r, b) && (g > 100 || (g > 60 && g > r * 1.2 && g > b * 1.2));
  }));

  // Yellows and Light Greens
  palette.push(...filterColors(ImageData.palette, (r, g, b) => {
    return r > 150 && g > 150 && b < Math.min(r, g) * 0.9 && Math.abs(r - g) < 40;
  }));

  // Reds and Pinks
  palette.push(...filterColors(ImageData.palette, (r, g, b) => {
    return r > Math.max(g, b) && (r > 150 || (r > 100 && r > g * 1.4 && r > b * 1.4));
  }));

  // Purples
  palette.push(...filterColors(ImageData.palette, (r, g, b) => {
    return r > g && b > g && Math.abs(r - b) < 50 && (r > 80 || b > 80);
  }));

  // Oranges and Browns
  palette.push(...filterColors(ImageData.palette, (r, g, b) => {
    return r > g && g > b && (
      (r > 150 && g > 80) || 
      (r > 100 && g > 50 && b < 50) ||
      (r > g * 1.2 && g > b * 1.2)
    );
  }));

  // Add any remaining colors at the end
  palette.push(...ImageData.palette
    .filter((color: string) => color !== '' && !usedColors.has(color))
    .map((color: string) => `#${color.toUpperCase()}`)
  );

  return palette;
};

/**
 * Check if a color is in the Nouns palette
 */
export const isNounsColor = (color: string): boolean => {
  const palette = getNounsPalette();
  return palette.includes(color.toUpperCase());
};

/**
 * Get the closest Nouns color to a given color
 */
export const getClosestNounsColor = (targetColor: string): string => {
  const palette = getNounsPalette();
  
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const target = hexToRgb(targetColor);
  if (!target) return palette[0];

  let closest = palette[0];
  let minDistance = Infinity;

  palette.forEach(color => {
    const rgb = hexToRgb(color);
    if (!rgb) return;

    // Calculate Euclidean distance in RGB space
    const distance = Math.sqrt(
      Math.pow(target.r - rgb.r, 2) +
      Math.pow(target.g - rgb.g, 2) +
      Math.pow(target.b - rgb.b, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closest = color;
    }
  });

  return closest;
};
