import { Pool } from 'pg';

// Use the pooled connection for better performance
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required');
}

// Create a connection pool with better resilience
export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 8, // Optimized for 1000-item batch loading strategy 
  min: 1, // Keep at least 1 connection alive
  idleTimeoutMillis: 20000, // Close idle clients after 20 seconds
  connectionTimeoutMillis: 10000, // 10 second connection timeout
  // acquireTimeoutMillis: 15000, // Property not available in this pg version
  allowExitOnIdle: false, // Don't exit on idle
  keepAlive: true, // Enable TCP keep-alive
  keepAliveInitialDelayMillis: 30000 // 30 second keep-alive delay
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to Neon database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function for queries with retry logic
export async function query(text: string, params?: unknown[], retries = 2) {
  const start = Date.now();
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount, attempt: attempt + 1 });
      return res;
    } catch (error: unknown) {
      const isLastAttempt = attempt === retries;
      const err = error as { code?: string; message?: string };
      const isRetryableError = 
        err.code === 'ENOTFOUND' || 
        err.code === 'ECONNRESET' ||
        err.code === 'ETIMEDOUT' ||
        err.message?.includes('timeout') ||
        err.message?.includes('Connection terminated');
      
      if (isLastAttempt || !isRetryableError) {
        console.error('Database query error:', { text, error, attempts: attempt + 1 });
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      console.warn(`Database query failed (attempt ${attempt + 1}), retrying in ${delay}ms...`, err.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Helper function for transactions
export async function transaction<T>(callback: (client: { query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number }> }) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
