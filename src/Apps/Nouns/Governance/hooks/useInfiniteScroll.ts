import { useState, useEffect, useCallback, RefObject } from 'react';

interface InfiniteScrollOptions {
  threshold?: number;
  hasMore: boolean;
  loading: boolean;
}

interface InfiniteScrollReturn {
  isFetchingMore: boolean;
  loadMore: () => void;
}

export function useInfiniteScroll(
  containerRef: RefObject<HTMLElement | null>,
  onLoadMore: () => void,
  options: InfiniteScrollOptions
): InfiniteScrollReturn {
  const { threshold = 100, hasMore, loading } = options;
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && !isFetchingMore) {
      setIsFetchingMore(true);
      onLoadMore();
    }
  }, [loading, hasMore, isFetchingMore, onLoadMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;
      
      if (isNearBottom && !loading && hasMore && !isFetchingMore) {
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, threshold, loading, hasMore, isFetchingMore, loadMore]);

  // Reset fetching state when loading completes
  useEffect(() => {
    if (!loading) {
      setIsFetchingMore(false);
    }
  }, [loading]);

  return {
    isFetchingMore,
    loadMore
  };
}