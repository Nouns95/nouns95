import { NextRequest, NextResponse } from 'next/server';
import { getNounsNeedingImages, batchCacheNounImages, getImageCacheStats } from '@/lib/services/imageService';

export const dynamic = 'force-dynamic';

/**
 * Cache ALL missing images in batches
 * This is for bulk operations when we want to populate the entire cache
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Basic auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🖼️ Starting bulk image caching for ALL nouns...');

    // Get current cache stats
    const statsBefore = await getImageCacheStats();
    console.log(`📊 Cache stats: ${statsBefore.cachedImages}/${statsBefore.totalNouns} images cached`);

    if (statsBefore.missingImages === 0) {
      console.log('✅ All images are already cached');
      
      return NextResponse.json({
        success: true,
        message: 'All images are already cached',
        meta: {
          ...statsBefore,
          duration: Date.now() - startTime
        }
      });
    }

    let totalProcessed = 0;
    const totalErrors: string[] = [];
    const BATCH_SIZE = 50; // Process 50 images at a time
    let hasMore = true;

    console.log(`🖼️ Processing ${statsBefore.missingImages} missing images in batches of ${BATCH_SIZE}...`);

    while (hasMore) {
      // Get next batch of nouns needing images
      const nounsNeedingImages = await getNounsNeedingImages(BATCH_SIZE);
      
      if (nounsNeedingImages.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`🖼️ Processing batch: ${nounsNeedingImages.length} images...`);

      // Cache the images
      const result = await batchCacheNounImages(nounsNeedingImages);
      
      totalProcessed += result.processed;
      totalErrors.push(...result.errors);

      console.log(`✅ Batch completed: ${result.processed} images cached, ${result.errors.length} errors`);

      // Check if we should continue
      if (nounsNeedingImages.length < BATCH_SIZE) {
        hasMore = false;
      }

      // Small delay between batches to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Get final stats
    const statsAfter = await getImageCacheStats();

    const duration = Date.now() - startTime;
    console.log(`🎉 Bulk image caching completed: ${totalProcessed} images processed in ${duration}ms`);

    if (totalErrors.length > 0) {
      console.error(`⚠️ Total errors: ${totalErrors.length}`);
      console.error('First 10 errors:', totalErrors.slice(0, 10));
    }

    return NextResponse.json({
      success: true,
      message: `Bulk cached ${totalProcessed} images`,
      meta: {
        processed: totalProcessed,
        errors: totalErrors.length,
        errorSample: totalErrors.slice(0, 10), // Include sample of errors
        statsBefore,
        statsAfter,
        duration
      }
    });

  } catch (error) {
    console.error('❌ Bulk image caching failed:', error);
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        duration
      }
    }, { status: 500 });
  }
}
