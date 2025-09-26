/**
 * TraitPreview Component
 * Renders a miniature trait image for dropdown menu items
 */

import React, { useMemo } from 'react';
import { ImageData } from '@/src/Apps/Nouns/domain/utils/image-data';
import { buildSVG } from '@/src/Apps/Nouns/domain/utils/svg-builder';
import { LayerId, TRAIT_CATEGORIES } from '../../utils/layers';
import styles from './TraitPreview.module.css';

interface TraitPreviewProps {
  layerId: LayerId;
  traitId: string;
  size?: number;
}

export const TraitPreview: React.FC<TraitPreviewProps> = ({
  layerId,
  traitId,
  size = 16
}) => {
  const svgDataUrl = useMemo(() => {
    if (!traitId) return null;

    try {
      if (layerId === 'background') {
        // For background colors, create a simple colored rectangle
        const svgString = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
          <rect width="100%" height="100%" fill="#${traitId}" />
        </svg>`;
        return `data:image/svg+xml;base64,${btoa(svgString)}`;
      }

      // For other traits, use the SVG builder
      const category = TRAIT_CATEGORIES[layerId];
      if (category === 'bgcolors') return null;

      const trait = ImageData.images[category]?.find(t => t.filename === traitId);
      if (!trait) return null;

      const svgString = buildSVG(
        [{ data: trait.data }],
        ImageData.palette,
        '' // No background color for trait previews
      );

      // Scale down the SVG for preview
      const scaledSvg = svgString.replace(
        'width="320" height="320" viewBox="0 0 320 320"',
        `width="${size}" height="${size}" viewBox="0 0 320 320"`
      );

      return `data:image/svg+xml;base64,${btoa(scaledSvg)}`;
    } catch (error) {
      console.error('Error generating trait preview:', error);
      return null;
    }
  }, [layerId, traitId, size]);

  if (!svgDataUrl) {
    return <div className={styles.placeholder} style={{ width: size, height: size }} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={svgDataUrl}
      alt=""
      className={styles.traitPreview}
      style={{ width: size, height: size }}
    />
  );
};
