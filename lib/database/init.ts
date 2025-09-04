import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../database';

/**
 * Initialize the database schema
 * This should be run once during deployment or manually
 */
export async function initializeDatabase() {
  try {
    console.log('🗄️ Initializing Neon database schema...');
    
    // Read the schema file
    const schemaPath = join(process.cwd(), 'lib', 'database', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Execute the schema
    await query(schema);
    
    console.log('✅ Database schema initialized successfully');
    
    // Check if we have any data
    const nounsCount = await query('SELECT COUNT(*) FROM nouns');
    if (!nounsCount || nounsCount.rows.length === 0) {
      throw new Error('Failed to query nouns count');
    }
    const count = (nounsCount.rows[0] as { count: string }).count;
    console.log(`📊 Current Nouns in database: ${count}`);
    
    return { success: true, nounsCount: parseInt(count) };
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

/**
 * Check database health and connection
 */
export async function checkDatabaseHealth() {
  try {
    // Test basic connection
    await query('SELECT NOW()');
    
    // Check table existence
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('nouns', 'noun_images', 'ens_cache', 'noun_votes', 'sync_log')
    `);
    
    if (!tables || tables.rows.length === 0) {
      throw new Error('Failed to query tables');
    }
    const tableNames = tables.rows.map(row => (row as { table_name: string }).table_name);
    
    // Get data counts
    const nounsCount = await query('SELECT COUNT(*) FROM nouns');
    const imagesCount = await query('SELECT COUNT(*) FROM noun_images');
    const ensCount = await query('SELECT COUNT(*) FROM ens_cache WHERE expires_at > NOW()');
    
    if (!nounsCount || !imagesCount || !ensCount || 
        nounsCount.rows.length === 0 || imagesCount.rows.length === 0 || ensCount.rows.length === 0) {
      throw new Error('Failed to query table counts');
    }
    
    return {
      healthy: true,
      tables: tableNames,
      counts: {
        nouns: parseInt((nounsCount.rows[0] as { count: string }).count),
        images: parseInt((imagesCount.rows[0] as { count: string }).count),
        ens: parseInt((ensCount.rows[0] as { count: string }).count)
      }
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
