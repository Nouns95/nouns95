import { query, transaction } from '../database';

export interface NounData {
  id: number;
  background: number;
  body: number;
  accessory: number;
  head: number;
  glasses: number;
  owner_address: string;
  delegate_address?: string | null;
  delegate_votes?: string | null;
  ens_name?: string | null;
  cached_image?: string | null; // Add cached image to main interface
  created_at?: string;
  updated_at?: string;
}

export interface NounWithImage extends NounData {
  svg_data?: string;
}

export interface SyncResult {
  processed: number;
  errors: string[];
  lastId?: number;
}

export interface TraitFilters {
  background?: number;
  body?: number;
  accessory?: number;
  head?: number;
  glasses?: number;
}

/**
 * Get all nouns with optional filtering and pagination
 */
export async function getAllNouns(options: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  search?: string;
  traitFilters?: TraitFilters;
} = {}): Promise<NounData[]> {
  const {
    limit = 50,
    offset = 0,
    orderBy = 'id',
    orderDirection = 'desc',
    search,
    traitFilters
  } = options;

  // Validate orderBy to prevent SQL injection
  const validOrderFields = ['id', 'background', 'body', 'accessory', 'head', 'glasses', 'owner_address', 'delegate_address', 'created_at'];
  const safeOrderBy = validOrderFields.includes(orderBy) ? orderBy : 'id';
  const safeDirection = orderDirection === 'asc' ? 'ASC' : 'DESC';

  const whereConditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Add search filter if provided
  if (search && search.trim()) {
    whereConditions.push(`(
      n.id::text ILIKE $${paramIndex} OR 
      n.owner_address ILIKE $${paramIndex + 1} OR
      e.ens_name ILIKE $${paramIndex + 2}
    )`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    paramIndex += 3;
  }

  // Add trait filters if provided
  if (traitFilters && Object.keys(traitFilters).length > 0) {
    Object.entries(traitFilters).forEach(([trait, value]) => {
      if (value !== undefined && value !== null) {
        whereConditions.push(`n.${trait} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      n.id,
      n.background,
      n.body,
      n.accessory,
      n.head,
      n.glasses,
      n.owner_address,
      n.delegate_address,
      n.delegate_votes,
      e.ens_name,
      i.svg_data as cached_image,
      n.created_at,
      n.updated_at
    FROM nouns n
    LEFT JOIN ens_cache e ON n.owner_address = e.address 
      AND e.expires_at > NOW() 
      AND e.is_valid = true
    LEFT JOIN noun_images i ON n.id = i.noun_id
    ${whereClause}
    ORDER BY n.${safeOrderBy} ${safeDirection}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit, offset);

  const result = await query(sql, params);
  return result?.rows || [];
}

/**
 * Get total count of nouns with optional filtering
 */
export async function getTotalNounsCount(options: {
  search?: string;
  traitFilters?: TraitFilters;
} = {}): Promise<number> {
  const { search, traitFilters } = options;

  const whereConditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Add search filter if provided
  if (search && search.trim()) {
    whereConditions.push(`(
      n.id::text ILIKE $${paramIndex} OR 
      n.owner_address ILIKE $${paramIndex + 1} OR
      e.ens_name ILIKE $${paramIndex + 2}
    )`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    paramIndex += 3;
  }

  // Add trait filters if provided
  if (traitFilters && Object.keys(traitFilters).length > 0) {
    Object.entries(traitFilters).forEach(([trait, value]) => {
      if (value !== undefined && value !== null) {
        whereConditions.push(`n.${trait} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const sql = `
    SELECT COUNT(*) as count
    FROM nouns n
    LEFT JOIN ens_cache e ON n.owner_address = e.address 
      AND e.expires_at > NOW() 
      AND e.is_valid = true
    ${whereClause}
  `;

  const result = await query(sql, params);
  if (!result || result.rows.length === 0) {
    return 0;
  }
  return parseInt((result.rows[0] as { count: string }).count);
}

/**
 * Get a single noun by ID with all related data
 */
export async function getNounById(id: number): Promise<NounWithImage | null> {
  const sql = `
    SELECT 
      n.id,
      n.background,
      n.body,
      n.accessory,
      n.head,
      n.glasses,
      n.owner_address,
      n.delegate_address,
      n.delegate_votes,
      e.ens_name,
      ni.svg_data,
      n.created_at,
      n.updated_at
    FROM nouns n
    LEFT JOIN ens_cache e ON n.owner_address = e.address 
      AND e.expires_at > NOW() 
      AND e.is_valid = true
    LEFT JOIN noun_images ni ON n.id = ni.noun_id
    WHERE n.id = $1
  `;

  const result = await query(sql, [id]);
  return result && result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Insert or update a noun
 */
export async function upsertNoun(nounData: Omit<NounData, 'created_at' | 'updated_at'>): Promise<void> {
  const sql = `
    INSERT INTO nouns (id, background, body, accessory, head, glasses, owner_address, delegate_address, delegate_votes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (id) DO UPDATE SET
      background = EXCLUDED.background,
      body = EXCLUDED.body,
      accessory = EXCLUDED.accessory,
      head = EXCLUDED.head,
      glasses = EXCLUDED.glasses,
      owner_address = EXCLUDED.owner_address,
      delegate_address = EXCLUDED.delegate_address,
      delegate_votes = EXCLUDED.delegate_votes,
      updated_at = NOW()
  `;

  await query(sql, [
    nounData.id,
    nounData.background,
    nounData.body,
    nounData.accessory,
    nounData.head,
    nounData.glasses,
    nounData.owner_address,
    nounData.delegate_address || null,
    nounData.delegate_votes || null
  ]);
}

/**
 * Batch insert/update nouns for better performance during sync
 */
export async function batchUpsertNouns(nouns: Omit<NounData, 'created_at' | 'updated_at'>[]): Promise<SyncResult> {
  if (nouns.length === 0) {
    return { processed: 0, errors: [] };
  }

  const errors: string[] = [];
  let processed = 0;

  try {
    await transaction(async (client) => {
      for (const noun of nouns) {
        try {
          await client.query(`
            INSERT INTO nouns (id, background, body, accessory, head, glasses, owner_address)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
              background = EXCLUDED.background,
              body = EXCLUDED.body,
              accessory = EXCLUDED.accessory,
              head = EXCLUDED.head,
              glasses = EXCLUDED.glasses,
              owner_address = EXCLUDED.owner_address,
      delegate_address = EXCLUDED.delegate_address,
      delegate_votes = EXCLUDED.delegate_votes,
              updated_at = NOW()
          `, [
            noun.id,
            noun.background,
            noun.body,
            noun.accessory,
            noun.head,
            noun.glasses,
            noun.owner_address,
            noun.delegate_address || null,
            noun.delegate_votes || null
          ]);
          processed++;
        } catch (error) {
          errors.push(`Failed to upsert noun ${noun.id}: ${error}`);
        }
      }
    });
  } catch (error) {
    errors.push(`Transaction failed: ${error}`);
  }

  return {
    processed,
    errors,
    lastId: nouns.length > 0 ? Math.max(...nouns.map(n => n.id)) : undefined
  };
}

/**
 * Get the highest noun ID in the database
 */
export async function getLastNounId(): Promise<number> {
  const result = await query('SELECT COALESCE(MAX(id), 0) as max_id FROM nouns');
  if (!result || result.rows.length === 0) {
    return 0;
  }
  return parseInt((result.rows[0] as { max_id: string }).max_id);
}

/**
 * Get total count of nouns
 */
export async function getNounCount(): Promise<number> {
  const result = await query('SELECT COUNT(*) as count FROM nouns');
  if (!result || result.rows.length === 0) {
    return 0;
  }
  return parseInt((result.rows[0] as { count: string }).count);
}

/**
 * Optimized function to get nouns with count in a single query
 * Reduces database connections from 3 to 1 per API request
 */
export async function getAllNounsWithCount(options: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  search?: string;
  traitFilters?: TraitFilters;
} = {}): Promise<{ nouns: NounData[], totalCount: number }> {
  const {
    limit = 50,
    offset = 0,
    orderBy = 'id',
    orderDirection = 'desc',
    search,
    traitFilters
  } = options;

  // Validate orderBy to prevent SQL injection
  const validOrderFields = ['id', 'background', 'body', 'accessory', 'head', 'glasses', 'owner_address', 'delegate_address', 'created_at'];
  const safeOrderBy = validOrderFields.includes(orderBy) ? orderBy : 'id';
  const safeDirection = orderDirection === 'asc' ? 'ASC' : 'DESC';

  const whereConditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Add search filter if provided
  if (search && search.trim()) {
    whereConditions.push(`(
      n.id::text ILIKE $${paramIndex} OR 
      n.owner_address ILIKE $${paramIndex + 1} OR
      e.ens_name ILIKE $${paramIndex + 2}
    )`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    paramIndex += 3;
  }

  // Add trait filters if provided
  if (traitFilters && Object.keys(traitFilters).length > 0) {
    Object.entries(traitFilters).forEach(([trait, value]) => {
      if (value !== undefined && value !== null) {
        whereConditions.push(`n.${trait} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Combined query that gets both data and count
  const sql = `
    WITH noun_data AS (
      SELECT 
        n.id,
        n.background,
        n.body,
        n.accessory,
        n.head,
        n.glasses,
        n.owner_address,
        n.delegate_address,
        n.delegate_votes,
        e.ens_name,
        i.svg_data as cached_image,
        n.created_at,
        n.updated_at
      FROM nouns n
      LEFT JOIN ens_cache e ON n.owner_address = e.address 
        AND e.expires_at > NOW() 
        AND e.is_valid = true
      LEFT JOIN noun_images i ON n.id = i.noun_id
      ${whereClause}
      ORDER BY n.${safeOrderBy} ${safeDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    ),
    total_count AS (
      SELECT COUNT(*) as count
      FROM nouns n
      LEFT JOIN ens_cache e ON n.owner_address = e.address 
        AND e.expires_at > NOW() 
        AND e.is_valid = true
      ${whereClause}
    )
    SELECT 
      noun_data.*,
      total_count.count as total_count
    FROM noun_data, total_count;
  `;

  params.push(limit, offset);

  const result = await query(sql, params);
  
  if (!result) {
    return { nouns: [], totalCount: 0 };
  }
  
  // Extract data and count
  const nouns = result.rows.map(row => {
    const typedRow = row as {
      id: number; background: number; body: number; accessory: number; head: number; glasses: number;
      owner_address: string; delegate_address: string | null; delegate_votes: string | null; ens_name: string | null; cached_image: string | null;
      created_at: string; updated_at: string; total_count: string;
    };
    return {
      id: typedRow.id,
      background: typedRow.background,
      body: typedRow.body,
      accessory: typedRow.accessory,
      head: typedRow.head,
      glasses: typedRow.glasses,
      owner_address: typedRow.owner_address,
      delegate_address: typedRow.delegate_address,
      delegate_votes: typedRow.delegate_votes,
      ens_name: typedRow.ens_name,
      cached_image: typedRow.cached_image,
      created_at: typedRow.created_at,
      updated_at: typedRow.updated_at
    };
  });
  
  const totalCount = result.rows.length > 0 ? parseInt((result.rows[0] as { total_count: string }).total_count) : 0;
  
  return { nouns, totalCount };
}

/**
 * Get trait distribution for analytics
 */
export async function getTraitCounts(): Promise<{ trait_type: string; trait_value: number; count: number }[]> {
  const result = await query('SELECT * FROM trait_counts ORDER BY trait_type, trait_value');
  return result?.rows || [];
}
