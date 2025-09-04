import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, checkDatabaseHealth } from '@/lib/database/init';

export const dynamic = 'force-dynamic';

/**
 * Initialize database schema and perform initial data sync
 * This should be called once after setting up the Neon database
 */
export async function POST(request: NextRequest) {
  try {
    // Basic auth check (you might want to improve this)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 Initializing database...');
    
    const result = await initializeDatabase();
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      data: result
    });

  } catch (error) {
    console.error('Database initialization failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Check database health
 */
export async function GET() {
  try {
    const health = await checkDatabaseHealth();
    
    return NextResponse.json({
      success: true,
      data: health
    });

  } catch (error) {
    console.error('Database health check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
