import { NextRequest, NextResponse } from 'next/server';
import { fetchNounsFromGraphQL, convertGraphQLNoun } from '@/lib/services/graphqlService';
import { batchUpsertNouns, getNounCount } from '@/lib/services/nounsService';
import { getAddressesNeedingENS, resolveENSBatch, batchCacheENS } from '@/lib/services/ensService';
import { batchCacheNounImages } from '@/lib/services/imageService';

export const dynamic = 'force-dynamic';

/**
 * Full sync - loads all existing nouns from GraphQL
 * This should be run once during initial setup, then the cron jobs handle incremental updates
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Basic auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 Starting full sync of all nouns...');

    const results = {
      nounsProcessed: 0,
      ensProcessed: 0,
      imagesProcessed: 0,
      errors: [] as string[]
    };

    // Step 1: Sync all nouns
    console.log('📦 Fetching all nouns from GraphQL...');
    
    const BATCH_SIZE = 1000;
    let skip = 0;
    let hasMore = true;
    const allConvertedNouns: Array<{ id: number; background: number; body: number; accessory: number; head: number; glasses: number; owner_address: string; }> = []; // Collect all nouns for image caching
    
    while (hasMore) {
      try {
        const batch = await fetchNounsFromGraphQL(skip, BATCH_SIZE);
        
        if (batch.length === 0) {
          hasMore = false;
          break;
        }

        console.log(`📦 Processing batch: ${skip + 1} to ${skip + batch.length}`);
        
        const convertedNouns = batch.map(convertGraphQLNoun);
        allConvertedNouns.push(...convertedNouns); // Collect for image caching
        
        const upsertResult = await batchUpsertNouns(convertedNouns);
        
        results.nounsProcessed += upsertResult.processed;
        
        if (upsertResult.errors.length > 0) {
          results.errors.push(...upsertResult.errors);
        }

        if (batch.length < BATCH_SIZE) {
          hasMore = false;
        } else {
          skip += BATCH_SIZE;
        }

        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing batch starting at ${skip}:`, error);
        results.errors.push(`Batch ${skip}: ${error}`);
        hasMore = false;
      }
    }

    console.log(`✅ Nouns sync completed: ${results.nounsProcessed} nouns processed`);

    // Step 2: Cache images for recent nouns (to avoid overwhelming the system)
    console.log('🖼️ Starting image caching for recent nouns...');
    
    try {
      // Cache images for the most recent 100 nouns to avoid overwhelming the system
      const recentNouns = allConvertedNouns.slice(0, 100);
      
      if (recentNouns.length > 0) {
        console.log(`🖼️ Caching images for ${recentNouns.length} recent nouns...`);
        
        const imageResult = await batchCacheNounImages(recentNouns.map(noun => ({
          id: noun.id,
          seed: {
            background: noun.background,
            body: noun.body,
            accessory: noun.accessory,
            head: noun.head,
            glasses: noun.glasses
          }
        })));
        
        results.imagesProcessed = imageResult.processed;
        if (imageResult.errors.length > 0) {
          results.errors.push(...imageResult.errors);
        }
        
        console.log(`✅ Image caching completed: ${imageResult.processed} images processed`);
        console.log(`💡 Note: Additional images will be cached by the background cron job`);
      }
    } catch (imageError) {
      console.error('Image caching error during full sync:', imageError);
      results.errors.push(`Image caching: ${imageError}`);
    }

    // Step 3: Initial ENS resolution for recent nouns
    console.log('🔍 Starting initial ENS resolution...');
    
    try {
      const addressesToResolve = await getAddressesNeedingENS(200); // Process more in initial sync
      
      if (addressesToResolve.length > 0) {
        console.log(`🔍 Resolving ENS for ${addressesToResolve.length} addresses...`);
        
        const ensResults = await resolveENSBatch(addressesToResolve);
        await batchCacheENS(ensResults);
        
        results.ensProcessed = ensResults.length;
        console.log(`✅ ENS resolution completed: ${ensResults.length} addresses processed`);
      }
    } catch (ensError) {
      console.error('ENS resolution error during full sync:', ensError);
      results.errors.push(`ENS sync: ${ensError}`);
    }

    const duration = Date.now() - startTime;
    const finalCount = await getNounCount();

    console.log(`🎉 Full sync completed in ${duration}ms`);
    console.log(`📊 Database now contains ${finalCount} nouns`);

    return NextResponse.json({
      success: true,
      message: 'Full sync completed',
      data: {
        nounsProcessed: results.nounsProcessed,
        ensProcessed: results.ensProcessed,
        imagesProcessed: results.imagesProcessed,
        totalNounsInDb: finalCount,
        errors: results.errors,
        duration
      }
    });

  } catch (error) {
    console.error('❌ Full sync failed:', error);
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      meta: { duration }
    }, { status: 500 });
  }
}
