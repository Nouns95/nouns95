/**
 * Cached Nouns Service
 * Provides fast cached data with GraphQL fallback
 */

import { Noun_orderBy, OrderDirection } from '../../domain/types/graphql';
import { TraitFilters } from '../utils/trait-utils';

export interface CachedNounData {
  id: string;
  seed: {
    background: string;
    body: string;
    accessory: string;
    head: string;
    glasses: string;
  };
  owner: {
    id: string;
  };
  __ensName?: string | null; // Updated to match API response
  __cachedImage?: string | null; // Cached SVG image data
  created_at?: string;
  updated_at?: string;
}

export interface CachedApiResponse {
  success: boolean;
  data: CachedNounData[];
  meta: {
    count: number;
    total: number | null;
    limit: number;
    offset: number;
    orderBy: string;
    orderDirection: string;
    search?: string;
    source: 'cache' | 'graphql' | 'graphql_fallback';
    duration: number;
  };
  error?: string;
}

export interface CachedNounDetailResponse {
  success: boolean;
  data?: {
    noun: CachedNounData & {
      votes?: Array<{
        id: string;
        support: boolean;
        votes: string;
        blockNumber: string;
        voter: { id: string };
        proposal: {
          id: string;
          title: string;
          status: string;
        };
      }>;
    };
  };
  meta: {
    source: 'cache' | 'graphql' | 'graphql_fallback';
    duration: number;
  };
  error?: string;
}

/**
 * Fetch nouns from cached API with GraphQL fallback
 */
export async function fetchCachedNouns(options: {
  limit?: number;
  offset?: number;
  orderBy?: Noun_orderBy;
  orderDirection?: OrderDirection;
  search?: string;
  traitFilters?: TraitFilters;
  fallback?: boolean;
} = {}): Promise<CachedApiResponse> {
  const {
    limit = 1000,
    offset = 0,
    orderBy = Noun_orderBy.id,
    orderDirection = OrderDirection.desc,
    search = '',
    traitFilters,
    fallback = true
  } = options;

  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      orderBy: orderBy.toString(),
      orderDirection: orderDirection.toString(),
      fallback: fallback.toString(),
      ...(search && { search }),
      ...(traitFilters && Object.keys(traitFilters).length > 0 && { 
        traitFilters: JSON.stringify(traitFilters) 
      })
    });

    const response = await fetch(`/api/nouns?${params}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result: CachedApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'API request failed');
    }

    return result;
  } catch (error) {
    console.error('Error fetching cached nouns:', error);
    throw error;
  }
}

/**
 * Fetch a single noun with details from cached API
 */
export async function fetchCachedNounDetail(id: string, fallback: boolean = true): Promise<CachedNounDetailResponse> {
  try {
    const params = new URLSearchParams({
      fallback: fallback.toString()
    });

    const response = await fetch(`/api/nouns/${id}?${params}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result: CachedNounDetailResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Noun detail request failed');
    }

    return result;
  } catch (error) {
    console.error('Error fetching cached noun detail:', error);
    throw error;
  }
}

/**
 * Convert cached noun data to match existing GraphQL format
 */
export function convertCachedNounToGraphQL(cachedNoun: CachedNounData) {
  return {
    id: cachedNoun.id,
    seed: {
      background: cachedNoun.seed.background,
      body: cachedNoun.seed.body,
      accessory: cachedNoun.seed.accessory,
      head: cachedNoun.seed.head,
      glasses: cachedNoun.seed.glasses,
    },
    owner: {
      id: cachedNoun.owner.id
    },
    // Include ENS name in a custom field for easy access
    __ensName: cachedNoun.__ensName
  };
}

/**
 * Batch convert cached nouns to GraphQL format
 */
export function convertCachedNounsToGraphQL(cachedNouns: CachedNounData[]) {
  return cachedNouns.map(convertCachedNounToGraphQL);
}
