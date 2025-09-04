import { ImageData } from '../../domain/utils/image-data';
import { getTraitName, TraitType } from '../../domain/utils/trait-name-utils';

export interface TraitOption {
  value: number;
  label: string;
}

// Get all available options for each trait type
export function getTraitOptions(type: TraitType): TraitOption[] {
  if (type === 'background') {
    return ImageData.bgcolors.map((_, index) => ({
      value: index,
      label: getTraitName('background', index)
    })).sort((a, b) => a.label.localeCompare(b.label));
  }

  const collections = {
    body: ImageData.images.bodies,
    accessory: ImageData.images.accessories,
    head: ImageData.images.heads,
    glasses: ImageData.images.glasses
  };

  const collection = collections[type];
  if (!collection) return [];

  return collection.map((_, index) => ({
    value: index,
    label: getTraitName(type, index)
  })).sort((a, b) => a.label.localeCompare(b.label));
}

// Export all trait types (using domain TraitType)
export const TRAIT_TYPES: TraitType[] = ['background', 'body', 'accessory', 'head', 'glasses'];
export { type TraitType } from '../../domain/utils/trait-name-utils';

// Interface for trait filters
export interface TraitFilters {
  background?: number;
  body?: number;
  accessory?: number;
  head?: number;
  glasses?: number;
}
