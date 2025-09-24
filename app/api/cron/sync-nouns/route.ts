import { NextRequest, NextResponse } from 'next/server';
import { getLastNounId, batchUpsertNouns } from '@/lib/services/nounsService';
import { fetchNounsFromGraphQL, convertGraphQLNoun, getLatestNounIdFromGraphQL } from '@/lib/services/graphqlService';
import { query } from '@/lib/database';

export const dynamic = 'force-dynamic';

/**
 * Vercel Cron Job: Sync ALL nouns every 5 minutes  
 * This ensures ownership changes are captured immediately
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('🔄 Starting full noun sync job...');

    // Log sync start
    const syncId = await logSyncStart('nouns');

    // Get the latest noun ID from GraphQL to know how many we need to fetch
    const latestGraphQLId = await getLatestNounIdFromGraphQL();
    console.log(`📊 Latest GraphQL noun ID: ${latestGraphQLId}`);

    // Fetch ALL nouns from GraphQL in batches
    console.log('📦 Fetching ALL nouns from GraphQL...');
    const BATCH_SIZE = 1000;
    const allGraphQLNouns = [];
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const batch = await fetchNounsFromGraphQL(skip, BATCH_SIZE);
      
      if (batch.length === 0) {
        hasMore = false;
        break;
      }

      allGraphQLNouns.push(...batch);
      
      // If we got fewer than BATCH_SIZE nouns, we've reached the end
      if (batch.length < BATCH_SIZE) {
        hasMore = false;
      } else {
        skip += BATCH_SIZE;
      }

      // Small delay to be respectful to the API
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`📦 Fetched ${allGraphQLNouns.length} total nouns from GraphQL`);

    if (allGraphQLNouns.length === 0) {
      console.log('⚠️ No nouns found in GraphQL');
      await logSyncComplete(syncId, 0, true);
      
      return NextResponse.json({
        success: true,
        message: 'No nouns found in GraphQL',
        meta: {
          latestGraphQLId,
          duration: Date.now() - startTime
        }
      });
    }

    // Convert and batch upsert ALL nouns
    const convertedNouns = allGraphQLNouns.map(convertGraphQLNoun);
    const upsertResult = await batchUpsertNouns(convertedNouns);

    // Log completion
    await logSyncComplete(syncId, upsertResult.processed, upsertResult.errors.length === 0);

    const duration = Date.now() - startTime;
    console.log(`✅ Full sync completed: ${upsertResult.processed} nouns processed in ${duration}ms`);

    if (upsertResult.errors.length > 0) {
      console.error('⚠️ Sync errors:', upsertResult.errors);
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${upsertResult.processed} total nouns`,
      meta: {
        processed: upsertResult.processed,
        errors: upsertResult.errors.length,
        totalNouns: allGraphQLNouns.length,
        latestGraphQLId: upsertResult.lastId || latestGraphQLId,
        duration
      }
    });

  } catch (error) {
    console.error('❌ Sync job failed:', error);
    
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
 * Manual trigger for sync (for testing)
 */
export async function POST(request: NextRequest) {
  // Add some basic auth or remove in production
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
