import { NextRequest, NextResponse } from 'next/server';
import { getNounsNeedingImages, batchCacheNounImages, getImageCacheStats } from '@/lib/services/imageService';
import { query } from '@/lib/database';

export const dynamic = 'force-dynamic';

/**
 * Vercel Cron Job: Cache missing noun images
 * Runs every 30 minutes to cache any missing images
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('🖼️ Starting image caching job...');

    // Log sync start
    const syncId = await logSyncStart('images');

    // Get current cache stats
    const statsBefore = await getImageCacheStats();
    console.log(`📊 Cache stats: ${statsBefore.cachedImages}/${statsBefore.totalNouns} images cached`);

    if (statsBefore.missingImages === 0) {
      console.log('✅ No images need caching');
      await logSyncComplete(syncId, 0, true);
      
      return NextResponse.json({
        success: true,
        message: 'No images need caching',
        meta: {
          ...statsBefore,
          duration: Date.now() - startTime
        }
      });
    }

    // Get nouns that need image caching (process in smaller batches for cron)
    const nounsNeedingImages = await getNounsNeedingImages(100); // Smaller batch for cron job
    console.log(`🖼️ Found ${nounsNeedingImages.length} nouns needing image caching`);

    if (nounsNeedingImages.length === 0) {
      console.log('✅ No nouns need image caching');
      await logSyncComplete(syncId, 0, true);
      
      return NextResponse.json({
        success: true,
        message: 'No nouns need image caching',
        meta: {
          ...statsBefore,
          duration: Date.now() - startTime
        }
      });
    }

    // Cache the images
    const result = await batchCacheNounImages(nounsNeedingImages);
    console.log(`🖼️ Cached ${result.processed} images`);

    // Get updated stats
    const statsAfter = await getImageCacheStats();

    // Log completion
    await logSyncComplete(syncId, result.processed, result.errors.length === 0);

    const duration = Date.now() - startTime;
    console.log(`✅ Image caching completed: ${result.processed} images processed in ${duration}ms`);

    if (result.errors.length > 0) {
      console.error('⚠️ Image caching errors:', result.errors.slice(0, 5)); // Log first 5 errors
    }

    return NextResponse.json({
      success: true,
      message: `Cached ${result.processed} images`,
      meta: {
        processed: result.processed,
        errors: result.errors.length,
        statsBefore,
        statsAfter,
        duration
      }
    });

  } catch (error) {
    console.error('❌ Image caching job failed:', error);
    
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

/**
 * Manual trigger for image caching (for testing)
 */
export async function POST(request: NextRequest) {
  return GET(request);
}

// Helper functions for sync logging
async function logSyncStart(syncType: string): Promise<number> {
  const result = await query(
    'INSERT INTO sync_log (sync_type, sync_started_at) VALUES ($1, NOW()) RETURNING id',
    [syncType]
  );
  if (!result || result.rows.length === 0) {
    throw new Error('Failed to create sync log entry');
  }
  return (result.rows[0] as { id: number }).id;
}

async function logSyncComplete(syncId: number, processed: number, success: boolean, errorMessage?: string): Promise<void> {
  await query(
    `UPDATE sync_log 
     SET sync_completed_at = NOW(), 
         total_processed = $2, 
         success = $3, 
         error_message = $4 
     WHERE id = $1`,
    [syncId, processed, success, errorMessage || null]
  );
}
