import { NextRequest, NextResponse } from 'next/server';
import { getAllNounsWithCount, TraitFilters } from '@/lib/services/nounsService';
import { fetchNounsFromGraphQL, convertGraphQLNoun } from '@/lib/services/graphqlService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/nouns - Fast cached endpoint for Probe component
 * 
 * Query params:
 * - limit: number (default: 1000, max: 2000)
 * - offset: number (default: 0)
 * - orderBy: string (default: 'id')
 * - orderDirection: 'asc' | 'desc' (default: 'desc')
 * - search: string (optional)
 * - traitFilters: JSON string with trait filters (optional)
 * - fallback: 'true' | 'false' (default: 'false') - use GraphQL if no cached data
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    
          const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 2000);
    const offset = parseInt(searchParams.get('offset') || '0');
    const orderBy = searchParams.get('orderBy') || 'id';
    const orderDirection = (searchParams.get('orderDirection') || 'desc') as 'asc' | 'desc';
    const search = searchParams.get('search') || undefined;
    const useFallback = searchParams.get('fallback') === 'true';
    
    // Parse trait filters from JSON string
    let traitFilters: TraitFilters | undefined;
    const traitFiltersParam = searchParams.get('traitFilters');
    if (traitFiltersParam) {
      try {
        traitFilters = JSON.parse(traitFiltersParam);
      } catch (e) {
        console.error('Invalid traitFilters JSON:', e);
        traitFilters = undefined;
      }
    }

    console.log(`📡 API request: limit=${limit}, offset=${offset}, orderBy=${orderBy}, direction=${orderDirection}, search=${search}, traitFilters=${JSON.stringify(traitFilters)}`);

    try {
      // Optimized: Get data and count in single DB call
      const { nouns: cachedNouns, totalCount } = await getAllNounsWithCount({
        limit,
        offset,
        orderBy,
        orderDirection,
        search,
        traitFilters
      });

      // If we have cached data, return it
      if (cachedNouns.length > 0 || !useFallback) {
        const duration = Date.now() - startTime;

        // Convert cached format to GraphQL format for frontend compatibility
        // Images and ENS data are now included in the main query
        const formattedNouns = cachedNouns.map((noun) => {
          return {
            id: noun.id.toString(),
            seed: {
              background: noun.background.toString(),
              body: noun.body.toString(),
              accessory: noun.accessory.toString(),
              head: noun.head.toString(),
              glasses: noun.glasses.toString(),
            },
            owner: {
              id: noun.owner_address
            },
            __ensName: noun.ens_name, // Include cached ENS data
            __cachedImage: noun.cached_image || null // Include cached SVG data from JOIN
          };
        });

        return NextResponse.json({
          success: true,
          data: formattedNouns,
          meta: {
            count: formattedNouns.length,
            total: totalCount,
            limit,
            offset,
            orderBy,
            orderDirection,
            search,
            source: 'cache',
            duration
          }
        });
      }

      // Fallback to GraphQL if no cached data and fallback is enabled
      if (useFallback) {
        console.log('📡 No cached data, falling back to GraphQL...');
        
        const graphqlNouns = await fetchNounsFromGraphQL(offset, limit);
        const convertedNouns = graphqlNouns.map(convertGraphQLNoun);
        
        const duration = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          data: convertedNouns.map(noun => ({
            id: noun.id.toString(),
            seed: {
              background: noun.background.toString(),
              body: noun.body.toString(),
              accessory: noun.accessory.toString(),
              head: noun.head.toString(),
              glasses: noun.glasses.toString(),
            },
            owner: {
              id: noun.owner_address
            }
            // Note: ENS data not available in GraphQL conversion
          })),
          meta: {
            count: convertedNouns.length,
            total: null, // Can't get total from GraphQL easily
            limit,
            offset,
            orderBy,
            orderDirection,
            search,
            source: 'graphql',
            duration
          }
        });
      }

      // No data and no fallback
      const duration = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          count: 0,
          total: 0,
          limit,
          offset,
          orderBy,
          orderDirection,
          search,
          source: 'cache',
          duration
        }
      });

    } catch (cacheError) {
      console.error('Cache error:', cacheError);
      
      if (!useFallback) {
        throw cacheError;
      }

      // Try GraphQL fallback
      console.log('📡 Cache failed, falling back to GraphQL...');
      const graphqlNouns = await fetchNounsFromGraphQL(offset, limit);
      const convertedNouns = graphqlNouns.map(convertGraphQLNoun);
      
      const duration = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        data: convertedNouns.map(noun => ({
          id: noun.id.toString(),
          seed: {
            background: noun.background.toString(),
            body: noun.body.toString(),
            accessory: noun.accessory.toString(),
            head: noun.head.toString(),
            glasses: noun.glasses.toString(),
          },
          owner: {
            id: noun.owner_address
          }
        })),
        meta: {
          count: convertedNouns.length,
          total: null,
          limit,
          offset,
          orderBy,
          orderDirection,
          search,
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
        meta: {
          duration
        }
      },
      { status: 500 }
    );
  }
}
