#!/usr/bin/env node

/**
 * Database initialization script
 * Run this locally to set up your Neon database schema
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function initDatabase() {
  console.log('🚀 Initializing Neon database...');
  
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL or POSTGRES_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Read and execute schema
    console.log('📋 Reading schema file...');
    const schemaPath = path.join(__dirname, '..', 'lib', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    console.log('🗄️ Creating database schema...');
    await pool.query(schema);
    console.log('✅ Database schema created successfully');

    // Check tables
    console.log('🔍 Checking created tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('nouns', 'noun_images', 'ens_cache', 'noun_votes', 'sync_log')
    `);
    
    console.log('📊 Created tables:', tables.rows.map(row => row.table_name));

    // Get current counts
    const nounsCount = await pool.query('SELECT COUNT(*) FROM nouns');
    const imagesCount = await pool.query('SELECT COUNT(*) FROM noun_images');
    const ensCount = await pool.query('SELECT COUNT(*) FROM ens_cache');

    console.log('\n📈 Database Status:');
    console.log(`   Nouns: ${nounsCount.rows[0].count}`);
    console.log(`   Images: ${imagesCount.rows[0].count}`);
    console.log(`   ENS Cache: ${ensCount.rows[0].count}`);
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Deploy your app to Vercel');
    console.log('   2. Set CRON_SECRET in Vercel environment variables');
    console.log('   3. Run initial data sync: npm run sync-all');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the initialization
initDatabase();
