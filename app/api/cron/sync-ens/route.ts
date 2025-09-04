import { NextRequest, NextResponse } from 'next/server';
import { getAddressesNeedingENS, resolveENSBatch, batchCacheENS, cleanupExpiredENS } from '@/lib/services/ensService';
import { query } from '@/lib/database';

export const dynamic = 'force-dynamic';

/**
 * Vercel Cron Job: Sync ENS names for addresses
 * Runs less frequently (every hour) since ENS changes are rare
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('🔄 Starting ENS sync job...');

    // Log sync start
    const syncId = await logSyncStart('ens');

    // Clean up expired entries first
    const cleanedUp = await cleanupExpiredENS();
    console.log(`🧹 Cleaned up ${cleanedUp} expired ENS entries`);

    // Get addresses that need ENS resolution (prioritize recent/active addresses)
    const addressesToResolve = await getAddressesNeedingENS(100); // Limit to 100 per run
    console.log(`📋 Found ${addressesToResolve.length} addresses needing ENS resolution`);

    if (addressesToResolve.length === 0) {
      console.log('✅ No addresses need ENS resolution');
      await logSyncComplete(syncId, 0, true);
      
      return NextResponse.json({
        success: true,
        message: 'No addresses need ENS resolution',
        meta: {
          cleanedUp,
          duration: Date.now() - startTime
        }
      });
    }

    // Resolve ENS names in batches
    const ensResults = await resolveENSBatch(addressesToResolve);
    console.log(`🔍 Resolved ENS for ${ensResults.length} addresses`);

    // Cache the results
    await batchCacheENS(ensResults);

    // Count successful resolutions (addresses that have ENS names)
    const successfulResolutions = ensResults.filter(r => r.ensName !== null).length;
    
    // Log completion
    await logSyncComplete(syncId, ensResults.length, true);

    const duration = Date.now() - startTime;
    console.log(`✅ ENS sync completed: ${ensResults.length} addresses processed, ${successfulResolutions} with ENS names, in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: `ENS sync completed`,
      meta: {
        addressesProcessed: ensResults.length,
        ensNamesFound: successfulResolutions,
        cleanedUp,
        duration
      }
    });

  } catch (error) {
    console.error('❌ ENS sync job failed:', error);
    
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
 * Manual trigger for ENS sync (for testing)
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
