import { ImageData } from './image-data';

function getTraitName(type: 'background' | 'body' | 'accessory' | 'head' | 'glasses', value: number): string {
  if (type === 'background') {
    // Map background colors to their labels
    const bgLabels: Record<string, string> = {
      'e1d7d5': 'Warm',
      'd5d7e1': 'Cool'
    };
    const hexColor = ImageData.bgcolors[value];
    return bgLabels[hexColor] || `Color #${hexColor}`;
  }

  const collections = {
    body: ImageData.images.bodies,
    accessory: ImageData.images.accessories,
    head: ImageData.images.heads,
    glasses: ImageData.images.glasses
  };

  const collection = collections[type];
  if (!collection || value >= collection.length) {
    return `Unknown ${type} #${value}`;
  }

  // Extract name from filename by removing the prefix
  const filename = collection[value].filename;
  let name = filename.replace(`${type}-`, '');
  
  // For glasses, also remove 'square-'
  if (type === 'glasses') {
    name = name.replace('square-', '');
  }
  
  // Convert kebab case to title case
  return name.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export { getTraitName }; 