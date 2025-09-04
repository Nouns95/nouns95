import { query, transaction } from '../database';

export interface ENSCacheEntry {
  address: string;
  ens_name: string | null;
  resolved_at: string;
  expires_at: string;
  is_valid: boolean;
}

/**
 * Get cached ENS name for an address
 */
export async function getCachedENS(address: string): Promise<string | null | undefined> {
  const sql = `
    SELECT ens_name, expires_at 
    FROM ens_cache 
    WHERE address = $1 AND expires_at > NOW() AND is_valid = true
  `;
  
  const result = await query(sql, [address.toLowerCase()]);
  
  if (!result || result.rows.length === 0) {
    return undefined; // Not cached
  }
  
  return (result.rows[0] as { ens_name: string | null }).ens_name; // null if no ENS name, string if has ENS
}

/**
 * Cache ENS resolution result
 */
export async function cacheENSResult(address: string, ensName: string | null): Promise<void> {
  const sql = `
    INSERT INTO ens_cache (address, ens_name, resolved_at, expires_at, is_valid)
    VALUES ($1, $2, NOW(), NOW() + INTERVAL '24 hours', true)
    ON CONFLICT (address) DO UPDATE SET
      ens_name = EXCLUDED.ens_name,
      resolved_at = EXCLUDED.resolved_at,
      expires_at = EXCLUDED.expires_at,
      is_valid = EXCLUDED.is_valid
  `;
  
  await query(sql, [address.toLowerCase(), ensName]);
}

/**
 * Batch cache ENS results for better performance
 */
export async function batchCacheENS(results: Array<{ address: string; ensName: string | null }>): Promise<void> {
  if (results.length === 0) return;

  await transaction(async (client) => {
    for (const { address, ensName } of results) {
      await client.query(`
        INSERT INTO ens_cache (address, ens_name, resolved_at, expires_at, is_valid)
        VALUES ($1, $2, NOW(), NOW() + INTERVAL '24 hours', true)
        ON CONFLICT (address) DO UPDATE SET
          ens_name = EXCLUDED.ens_name,
          resolved_at = EXCLUDED.resolved_at,
          expires_at = EXCLUDED.expires_at,
          is_valid = EXCLUDED.is_valid
      `, [address.toLowerCase(), ensName]);
    }
  });
}

/**
 * Get addresses that need ENS resolution
 */
export async function getAddressesNeedingENS(limit: number = 100): Promise<string[]> {
  const sql = `
    SELECT n.owner_address
    FROM nouns n
    LEFT JOIN ens_cache e ON n.owner_address = e.address
    WHERE e.address IS NULL OR e.expires_at <= NOW()
    GROUP BY n.owner_address
    ORDER BY MAX(n.id) DESC
    LIMIT $1
  `;
  
  const result = await query(sql, [limit]);
  if (!result) {
    return [];
  }
  return result.rows.map(row => (row as { owner_address: string }).owner_address);
}

/**
 * Resolve ENS names using ensdata.net API (same as current implementation)
 */
export async function resolveENSBatch(addresses: string[]): Promise<Array<{ address: string; ensName: string | null }>> {
  if (addresses.length === 0) return [];

  const BATCH_SIZE = 30; // Same as current implementation
  const results: Array<{ address: string; ensName: string | null }> = [];

  // Process in batches
  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    const batch = addresses.slice(i, i + BATCH_SIZE);
    
    try {
      // Make concurrent requests for this batch
      const batchPromises = batch.map(async (address) => {
        try {
          const response = await fetch(`https://ensdata.net/${address}`, {
            headers: { 'Accept': 'application/json' }
          });
          
          if (response.ok) {
            const data = await response.json();
            return { address, ensName: data.ens || null };
          } else {
            return { address, ensName: null };
          }
        } catch (error) {
          console.error(`ENS resolution failed for ${address}:`, error);
          return { address, ensName: null };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to be respectful to the API
      if (i + BATCH_SIZE < addresses.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error('Batch ENS resolution error:', error);
      // Add failed addresses as null results
      batch.forEach(address => {
        results.push({ address, ensName: null });
      });
    }
  }

  return results;
}

/**
 * Clean up expired ENS cache entries
 */
export async function cleanupExpiredENS(): Promise<number> {
  const result = await query('DELETE FROM ens_cache WHERE expires_at <= NOW()');
  return result?.rowCount || 0;
}

/**
 * Get ENS cache statistics
 */
export async function getENSCacheStats(): Promise<{
  total: number;
  valid: number;
  expired: number;
  withNames: number;
}> {
  const stats = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE expires_at > NOW() AND is_valid = true) as valid,
      COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired,
      COUNT(*) FILTER (WHERE ens_name IS NOT NULL AND expires_at > NOW() AND is_valid = true) as with_names
    FROM ens_cache
  `);

  if (!stats || stats.rows.length === 0) {
    throw new Error('Failed to query ENS cache stats');
  }
  
  const row = stats.rows[0] as { total: string; valid: string; expired: string; with_names: string };
  return {
    total: parseInt(row.total),
    valid: parseInt(row.valid),
    expired: parseInt(row.expired),
    withNames: parseInt(row.with_names)
  };
}
