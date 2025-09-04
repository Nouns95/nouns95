import { NextRequest, NextResponse } from 'next/server';
import { getNounsNeedingImages, batchCacheNounImages, getImageCacheStats } from '@/lib/services/imageService';

export const dynamic = 'force-dynamic';

/**
 * Manual image caching for testing
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Basic auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🖼️ Starting manual image caching...');

    // Get current cache stats
    const statsBefore = await getImageCacheStats();
    console.log(`📊 Cache stats: ${statsBefore.cachedImages}/${statsBefore.totalNouns} images cached`);

    if (statsBefore.missingImages === 0) {
      console.log('✅ No images need caching');
      
      return NextResponse.json({
        success: true,
        message: 'No images need caching',
        meta: {
          ...statsBefore,
          duration: Date.now() - startTime
        }
      });
    }

    // Get nouns that need image caching (smaller batch for testing)
    const nounsNeedingImages = await getNounsNeedingImages(10); // Just 10 for testing
    console.log(`🖼️ Found ${nounsNeedingImages.length} nouns needing image caching`);

    if (nounsNeedingImages.length === 0) {
      console.log('✅ No nouns need image caching');
      
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

    const duration = Date.now() - startTime;
    console.log(`✅ Image caching completed: ${result.processed} images processed in ${duration}ms`);

    if (result.errors.length > 0) {
      console.error('⚠️ Image caching errors:', result.errors);
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
    console.error('❌ Image caching failed:', error);
    
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
