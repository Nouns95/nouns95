import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Noun_orderBy, OrderDirection } from '../../domain/types/graphql';
import { fetchCachedNouns, convertCachedNounsToGraphQL } from '../services/cachedNounsService';
import { TraitFilters } from '../utils/trait-utils';

interface UseCachedNounsOptions {
  searchQuery?: string;
  orderBy?: Noun_orderBy;
  orderDirection?: OrderDirection;
  traitFilters?: TraitFilters;
  refreshKey?: number;
}

interface UseCachedNounsReturn {
  nouns: Array<{ id: string; seed: { background: string; body: string; accessory: string; head: string; glasses: string; }; owner: { id: string; }; }>; // Matches existing GraphQL format
  loading: boolean;
  error: string | null;
  loadingProgress: number;
  isLoadingComplete: boolean;
  totalCount: number;
  meta: {
    source: string;
    duration: number;
  } | null;
  loadMore: () => Promise<void>; // Keep for compatibility but not used
  hasMore: boolean; // Always false since we load everything
  loadingMore: boolean;
}

const INITIAL_LOAD_SIZE = 1000; // Load 1000 items initially  
const BATCH_SIZE = 1000; // Sustainable 1000-item batches
// const MAX_CONCURRENT_BATCHES = 1; // Sequential loading only - no parallel requests

export function useCachedNouns({
  searchQuery = '',
  orderBy = Noun_orderBy.id,
  orderDirection = OrderDirection.desc,
  traitFilters = {},
  refreshKey = 0
}: UseCachedNounsOptions = {}): UseCachedNounsReturn {
  const [nouns, setNouns] = useState<Array<{ id: string; seed: { background: string; body: string; accessory: string; head: string; glasses: string; }; owner: { id: string; }; }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [meta, setMeta] = useState<{ source: string; duration: number } | null>(null);
  
  const isMountedRef = useRef(true);
  const loadingRef = useRef(false); // Prevent concurrent loading
  
  // Create stable reference for traitFilters to prevent infinite loops  
  const stableTraitFilters = useMemo(() => {
    // Return a new object only if values actually changed
    return {
      background: traitFilters?.background,
      body: traitFilters?.body,
      accessory: traitFilters?.accessory,
      head: traitFilters?.head,
      glasses: traitFilters?.glasses
    };
  }, [
    traitFilters?.background,
    traitFilters?.body, 
    traitFilters?.accessory,
    traitFilters?.head,
    traitFilters?.glasses
  ]);



  // Load all data in fast batches - no scroll required
  const fetchAllData = useCallback(async () => {
    // Prevent concurrent loading operations
    if (loadingRef.current) {
      // Loading already in progress, skip
      return;
    }
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Start fast batch loading
      
      // First, get the initial batch to know total count
      const initialResult = await fetchCachedNouns({
        limit: INITIAL_LOAD_SIZE,
        offset: 0,
        orderBy,
        orderDirection,
        search: searchQuery,
        traitFilters: stableTraitFilters,
        fallback: true
      });

      if (!isMountedRef.current) return;

      const totalCount = initialResult.meta.total || 0;
      // Total nouns to load

      // Show initial batch immediately
      const initialNouns = convertCachedNounsToGraphQL(initialResult.data);
      // Initial load complete
      setNouns(initialNouns);
      setTotalCount(totalCount);
      setLoadingProgress(initialResult.data.length);
      setMeta({
        source: initialResult.meta.source,
        duration: initialResult.meta.duration
      });

      // If we have all data already, we're done
      if (initialResult.data.length >= totalCount) {
        setIsLoadingComplete(true);
        setLoading(false);
        return;
      }

      // Continue loading remaining data in parallel batches
      setLoadingMore(true);
      const remainingCount = totalCount - initialResult.data.length;
      const numberOfBatches = Math.ceil(remainingCount / BATCH_SIZE);
      
      // Load remaining nouns in batches

      // Load remaining batches sequentially (no parallel requests)
      // let totalLoadedCount = INITIAL_LOAD_SIZE;
      const seenIds = new Set(initialNouns.map(noun => noun.id));
      let allLoadedNouns = [...initialNouns];
      
      // Sequential loading with 1000-item batches
      for (let batchIndex = 0; batchIndex < numberOfBatches && batchIndex < 4; batchIndex++) {
        if (!isMountedRef.current) break;
        
        const offset = INITIAL_LOAD_SIZE + (batchIndex * BATCH_SIZE);
        
        try {
          // Load batch
          
          const batchResult = await fetchCachedNouns({
            limit: BATCH_SIZE,
            offset,
            orderBy,
            orderDirection,
            search: searchQuery,
            traitFilters: stableTraitFilters,
            fallback: true
          });
          
          if (!isMountedRef.current) break;
          
          if (batchResult.data.length > 0) {
            const batchNouns = convertCachedNounsToGraphQL(batchResult.data);
            const uniqueNouns = batchNouns.filter(noun => !seenIds.has(noun.id));
            
            if (uniqueNouns.length > 0) {
              uniqueNouns.forEach(noun => seenIds.add(noun.id));
              allLoadedNouns = [...allLoadedNouns, ...uniqueNouns];
              
              // Single state update per batch
              setNouns([...allLoadedNouns]);
              setLoadingProgress(allLoadedNouns.length);
              
              // Batch loaded successfully
            }
          } else {
            // Batch returned no data, stop
            break;
          }
          
          // Delay between batches to respect database connections
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (batchError) {
          console.error(`❌ Error loading batch ${batchIndex + 1}:`, batchError);
          break;
        }
      }


      setIsLoadingComplete(true);
      // All nouns loaded successfully

    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error('❌ Error in batch loading:', err);
      setError(err instanceof Error ? err.message : 'Failed to load nouns');
      setIsLoadingComplete(true);
    } finally {
      loadingRef.current = false; // Reset loading flag
      if (isMountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [orderBy, orderDirection, searchQuery, stableTraitFilters]);

  // Dummy loadMore function for compatibility (not used)
  const loadMore = useCallback(async (): Promise<void> => {
    // Not used - we load everything upfront
  }, []);

  // Reset and load all data when dependencies change
  useEffect(() => {
    // Prevent multiple simultaneous effect runs
    if (loadingRef.current) {
      // Effect skipped - loading in progress
      return;
    }
    
    // Dependencies changed, reset and load
    
    // Reset state immediately
    setNouns([]);
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setIsLoadingComplete(false);
    setLoadingProgress(0);
    setTotalCount(0);
    setMeta(null);
    
    // Start loading data
    fetchAllData();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, orderBy, orderDirection, stableTraitFilters, refreshKey]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      loadingRef.current = false; // Reset loading flag on unmount
    };
  }, []);

  return {
    nouns,
    loading,
    error,
    loadingProgress,
    isLoadingComplete,
    totalCount,
    meta,
    loadMore,
    hasMore: false, // Always false since we load everything
    loadingMore
  };
}