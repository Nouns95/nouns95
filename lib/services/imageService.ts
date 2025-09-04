import { query } from '../database';
import { buildSVG } from '@/src/Apps/Nouns/domain/utils/svg-builder';
import { ImageData } from '@/src/Apps/Nouns/domain/utils/image-data';

export interface NounImageData {
  noun_id: number;
  svg_data: string;
  width: number;
  height: number;
  created_at?: string;
}

/**
 * Generate SVG data for a noun given its seed
 */
export function generateNounSVG(seed: {
  background: number;
  body: number;
  accessory: number;
  head: number;
  glasses: number;
}): string {
  try {
    // Get the parts from ImageData
    const parts = [
      ImageData.images.bodies[seed.body],
      ImageData.images.accessories[seed.accessory],
      ImageData.images.heads[seed.head],
      ImageData.images.glasses[seed.glasses],
    ].filter(Boolean); // Filter out undefined parts

    const bgColor = ImageData.bgcolors[seed.background];
    
    // Use the SVG builder
    const svgString = buildSVG(parts, ImageData.palette, bgColor);

    // Convert to base64 data URL
    const base64SVG = `data:image/svg+xml;base64,${btoa(svgString)}`;

    return base64SVG;
  } catch (error) {
    console.error('Error generating SVG for noun:', error);
    throw new Error(`Failed to generate SVG: ${error}`);
  }
}

/**
 * Cache SVG data for a noun
 */
export async function cacheNounImage(nounId: number, seed: {
  background: number;
  body: number;
  accessory: number;
  head: number;
  glasses: number;
}, width: number = 160, height: number = 160): Promise<void> {
  try {
    const svgData = generateNounSVG(seed);
    
    await query(`
      INSERT INTO noun_images (noun_id, svg_data, width, height)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (noun_id) DO UPDATE SET
        svg_data = EXCLUDED.svg_data,
        width = EXCLUDED.width,
        height = EXCLUDED.height
    `, [nounId, svgData, width, height]);
    
    console.log(`✅ Cached image for Noun ${nounId}`);
  } catch (error) {
    console.error(`❌ Failed to cache image for Noun ${nounId}:`, error);
    throw error;
  }
}

/**
 * Batch cache images for multiple nouns
 */
export async function batchCacheNounImages(nouns: Array<{
  id: number;
  seed: {
    background: number;
    body: number;
    accessory: number;
    head: number;
    glasses: number;
  };
}>): Promise<{ processed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;

  console.log(`🖼️ Starting batch image caching for ${nouns.length} nouns...`);

  for (const noun of nouns) {
    try {
      await cacheNounImage(noun.id, noun.seed);
      processed++;
      
      // Log progress every 100 images
      if (processed % 100 === 0) {
        console.log(`🖼️ Cached ${processed}/${nouns.length} images...`);
      }
      
      // Small delay to prevent overwhelming the system
      if (processed % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      errors.push(`Noun ${noun.id}: ${error}`);
    }
  }

  console.log(`✅ Batch image caching completed: ${processed} processed, ${errors.length} errors`);
  return { processed, errors };
}

/**
 * Get cached image for a noun
 */
export async function getCachedNounImage(nounId: number): Promise<string | null> {
  try {
    const result = await query(
      'SELECT svg_data FROM noun_images WHERE noun_id = $1',
      [nounId]
    );
    
    return result && result.rows.length > 0 ? (result.rows[0] as { svg_data: string }).svg_data : null;
  } catch (error) {
    console.error(`Error getting cached image for Noun ${nounId}:`, error);
    return null;
  }
}

/**
 * Get cached images for multiple nouns in a single query
 */
export async function getBatchCachedImages(nounIds: number[]): Promise<Record<number, string>> {
  if (nounIds.length === 0) return {};
  
  try {
    const placeholders = nounIds.map((_, index) => `$${index + 1}`).join(',');
    const result = await query(
      `SELECT noun_id, svg_data FROM noun_images WHERE noun_id IN (${placeholders})`,
      nounIds
    );
    
    // Convert to a lookup object
    const imageMap: Record<number, string> = {};
    if (result) {
      result.rows.forEach(row => {
        const typedRow = row as { noun_id: number; svg_data: string };
        imageMap[typedRow.noun_id] = typedRow.svg_data;
      });
    }
    
    return imageMap;
  } catch (error) {
    console.error(`Error getting batch cached images for ${nounIds.length} nouns:`, error);
    return {};
  }
}

/**
 * Get nouns that need image caching
 */
export async function getNounsNeedingImages(limit: number = 100): Promise<Array<{
  id: number;
  seed: {
    background: number;
    body: number;
    accessory: number;
    head: number;
    glasses: number;
  };
}>> {
  try {
    const result = await query(`
      SELECT n.id, n.background, n.body, n.accessory, n.head, n.glasses
      FROM nouns n
      LEFT JOIN noun_images ni ON n.id = ni.noun_id
      WHERE ni.noun_id IS NULL
      ORDER BY n.id DESC
      LIMIT $1
    `, [limit]);

    if (!result) {
      return [];
    }
    
    return result.rows.map(row => {
      const typedRow = row as { id: number; background: number; body: number; accessory: number; head: number; glasses: number };
      return {
        id: typedRow.id,
        seed: {
          background: typedRow.background,
          body: typedRow.body,
          accessory: typedRow.accessory,
          head: typedRow.head,
          glasses: typedRow.glasses
        }
      };
    });
  } catch (error) {
    console.error('Error getting nouns needing images:', error);
    return [];
  }
}

/**
 * Get image cache statistics
 */
export async function getImageCacheStats(): Promise<{
  totalNouns: number;
  cachedImages: number;
  missingImages: number;
}> {
  try {
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM nouns) as total_nouns,
        (SELECT COUNT(*) FROM noun_images) as cached_images,
        (SELECT COUNT(*) FROM nouns n LEFT JOIN noun_images ni ON n.id = ni.noun_id WHERE ni.noun_id IS NULL) as missing_images
    `);

    if (!stats || stats.rows.length === 0) {
      throw new Error('Failed to query image cache stats');
    }
    
    const row = stats.rows[0] as { total_nouns: string; cached_images: string; missing_images: string };
    return {
      totalNouns: parseInt(row.total_nouns),
      cachedImages: parseInt(row.cached_images),
      missingImages: parseInt(row.missing_images)
    };
  } catch (error) {
    console.error('Error getting image cache stats:', error);
    return { totalNouns: 0, cachedImages: 0, missingImages: 0 };
  }
}
