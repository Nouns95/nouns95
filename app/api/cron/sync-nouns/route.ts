import { NextRequest, NextResponse } from 'next/server';
import { getLastNounId, batchUpsertNouns } from '@/lib/services/nounsService';
import { fetchNewNounsFromGraphQL, convertGraphQLNoun, getLatestNounIdFromGraphQL } from '@/lib/services/graphqlService';
import { query } from '@/lib/database';

export const dynamic = 'force-dynamic';

/**
 * Vercel Cron Job: Sync new nouns every 5 minutes
 * This endpoint should be called by Vercel Cron
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('🔄 Starting noun sync job...');

    // Log sync start
    const syncId = await logSyncStart('nouns');

    // Get the last noun ID we have in the database
    const lastCachedId = await getLastNounId();
    console.log(`📊 Last cached noun ID: ${lastCachedId}`);

    // Get the latest noun ID from GraphQL
    const latestGraphQLId = await getLatestNounIdFromGraphQL();
    console.log(`📊 Latest GraphQL noun ID: ${latestGraphQLId}`);

    if (latestGraphQLId <= lastCachedId) {
      console.log('✅ No new nouns to sync');
      await logSyncComplete(syncId, 0, true);
      
      return NextResponse.json({
        success: true,
        message: 'No new nouns to sync',
        meta: {
          lastCachedId,
          latestGraphQLId,
          duration: Date.now() - startTime
        }
      });
    }

    // Fetch new nouns from GraphQL
    const newGraphQLNouns = await fetchNewNounsFromGraphQL(lastCachedId);
    console.log(`📦 Fetched ${newGraphQLNouns.length} new nouns from GraphQL`);

    if (newGraphQLNouns.length === 0) {
      console.log('✅ No new nouns found');
      await logSyncComplete(syncId, 0, true);
      
      return NextResponse.json({
        success: true,
        message: 'No new nouns found',
        meta: {
          lastCachedId,
          latestGraphQLId,
          duration: Date.now() - startTime
        }
      });
    }

    // Convert and batch insert
    const convertedNouns = newGraphQLNouns.map(convertGraphQLNoun);
    const upsertResult = await batchUpsertNouns(convertedNouns);

    // Log completion
    await logSyncComplete(syncId, upsertResult.processed, upsertResult.errors.length === 0);

    const duration = Date.now() - startTime;
    console.log(`✅ Sync completed: ${upsertResult.processed} nouns processed in ${duration}ms`);

    if (upsertResult.errors.length > 0) {
      console.error('⚠️ Sync errors:', upsertResult.errors);
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${upsertResult.processed} new nouns`,
      meta: {
        processed: upsertResult.processed,
        errors: upsertResult.errors.length,
        lastCachedId,
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
