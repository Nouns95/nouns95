import { NextRequest, NextResponse } from 'next/server';
import { getNounById } from '@/lib/services/nounsService';
import { fetchNounDetailFromGraphQL } from '@/lib/services/graphqlService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/nouns/[id] - Get detailed noun data
 * 
 * Query params:
 * - fallback: 'true' | 'false' (default: 'true') - use GraphQL if no cached data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const useFallback = searchParams.get('fallback') !== 'false';
    const resolvedParams = await params;
    const nounId = parseInt(resolvedParams.id);

    if (isNaN(nounId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid noun ID' },
        { status: 400 }
      );
    }

    console.log(`📡 Getting noun detail for ID: ${nounId}`);

    try {
      // Try cache first
      const cachedNoun = await getNounById(nounId);
      
      if (cachedNoun) {
        const duration = Date.now() - startTime;
        
        return NextResponse.json({
          success: true,
          data: {
            noun: {
              id: cachedNoun.id.toString(),
              seed: {
                background: cachedNoun.background.toString(),
                body: cachedNoun.body.toString(),
                accessory: cachedNoun.accessory.toString(),
                head: cachedNoun.head.toString(),
                glasses: cachedNoun.glasses.toString(),
              },
              owner: {
                id: cachedNoun.owner_address
              },
              ens_name: cachedNoun.ens_name,
              svg_data: cachedNoun.svg_data,
              votes: [] // TODO: Add votes from cache
            }
          },
          meta: {
            source: 'cache',
            duration
          }
        });
      }

      // Fallback to GraphQL if not in cache
      if (useFallback) {
        console.log(`📡 Noun ${nounId} not in cache, falling back to GraphQL...`);
        
        const graphqlNoun = await fetchNounDetailFromGraphQL(resolvedParams.id);
        
        if (!graphqlNoun) {
          return NextResponse.json(
            { success: false, error: 'Noun not found' },
            { status: 404 }
          );
        }

        const duration = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          data: {
            noun: {
              id: graphqlNoun.id,
              seed: graphqlNoun.seed,
              owner: graphqlNoun.owner,
              votes: graphqlNoun.votes || []
            }
          },
          meta: {
            source: 'graphql',
            duration
          }
        });
      }

      // Not found and no fallback
      return NextResponse.json(
        { success: false, error: 'Noun not found' },
        { status: 404 }
      );

    } catch (cacheError) {
      console.error('Cache error for noun detail:', cacheError);
      
      if (!useFallback) {
        throw cacheError;
      }

      // GraphQL fallback
      console.log(`📡 Cache failed for noun ${nounId}, using GraphQL...`);
      const graphqlNoun = await fetchNounDetailFromGraphQL(resolvedParams.id);
      
      if (!graphqlNoun) {
        return NextResponse.json(
          { success: false, error: 'Noun not found' },
          { status: 404 }
        );
      }

      const duration = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        data: {
          noun: {
            id: graphqlNoun.id,
            seed: graphqlNoun.seed,
            owner: graphqlNoun.owner,
            votes: graphqlNoun.votes || []
          }
        },
        meta: {
          source: 'graphql_fallback',
          duration
        }
      });
    }

  } catch (error) {
    console.error('API Error:', error);
    const duration = Date.now() - startTime;
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        meta: { duration }
      },
      { status: 500 }
    );
  }
}
