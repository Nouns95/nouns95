import React, { useState, useRef, RefObject, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import styles from './VotersList.module.css';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { VoterCard } from './components/VoterCard';
import { VoterFilters } from './components/VoterFilters';
import { 
  DELEGATES_QUERY,
  type Delegate,
  Delegate_orderBy,
  OrderDirection
} from '@/src/Apps/Nouns/domain/graphql/queries/delegates';

interface VotersListProps {
  onVoterClick: (id: string) => void;
}

// Pagination constants
const INITIAL_DELEGATES_TO_SHOW = 30;
const LOAD_MORE_DELEGATES = 30;

// Treasury address to exclude
const NOUNS_TREASURY_ADDRESS = '0xb1a32fc9f9d8b2cf86c068cae13108809547ef71';

export function VotersList({ onVoterClick }: VotersListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState<Delegate_orderBy>(Delegate_orderBy.delegatedVotes);
  const [orderDirection, setOrderDirection] = useState<OrderDirection>(OrderDirection.desc);

  // Refs for infinite scroll containers
  const delegatesContainerRef = useRef<HTMLDivElement>(null);
  
  // Pagination state
  const [hasMoreDelegates, setHasMoreDelegates] = useState(true);
  const [isFetchingMoreDelegates, setIsFetchingMoreDelegates] = useState(false);

  // Query for delegates
  const { loading: delegatesLoading, error: delegatesError, data: delegatesData, fetchMore: fetchMoreDelegates, refetch } = useQuery(DELEGATES_QUERY, {
    variables: {
      first: INITIAL_DELEGATES_TO_SHOW,
      skip: 0,
      orderBy,
      orderDirection
    },
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-only',
    onCompleted: (data) => {
      if (data.delegates.length < INITIAL_DELEGATES_TO_SHOW) {
        setHasMoreDelegates(false);
      }
    },
    notifyOnNetworkStatusChange: false
  });

  // Fetch more function for infinite scroll
  const handleFetchMoreDelegates = async () => {
    if (isFetchingMoreDelegates) return;
    
    setIsFetchingMoreDelegates(true);
    try {
      await fetchMoreDelegates({
        variables: {
          first: LOAD_MORE_DELEGATES,
          skip: delegatesData?.delegates?.length || 0,
          orderBy,
          orderDirection
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult || !fetchMoreResult.delegates.length) {
            setHasMoreDelegates(false);
            return prev;
          }
          if (fetchMoreResult.delegates.length < LOAD_MORE_DELEGATES) {
            setHasMoreDelegates(false);
          }
          const existingDelegateIds = new Set(prev.delegates.map((delegate: Delegate) => delegate.id));
          const newDelegates = fetchMoreResult.delegates.filter((delegate: Delegate) => !existingDelegateIds.has(delegate.id));
          return {
            ...prev,
            delegates: [...prev.delegates, ...newDelegates]
          };
        }
      });
    } catch (error) {
      console.error('Error fetching more delegates:', error);
      setHasMoreDelegates(false);
    } finally {
      setIsFetchingMoreDelegates(false);
    }
  };

  // Infinite scroll hook
  useInfiniteScroll(
    delegatesContainerRef as RefObject<HTMLElement | null>,
    handleFetchMoreDelegates,
    {
      hasMore: hasMoreDelegates,
      loading: isFetchingMoreDelegates
    }
  );

  const handleRefresh = () => {
    refetch();
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    
    // If it's a valid address (starts with 0x), navigate to it
    if (query.trim() && query.startsWith('0x')) {
      onVoterClick(query.trim());
    }
  };

  // Filter delegates based on search query and exclude treasury
  const filteredDelegates = delegatesData?.delegates?.filter((delegate: Delegate) => {
    // Always exclude the treasury address
    if (delegate.id.toLowerCase() === NOUNS_TREASURY_ADDRESS.toLowerCase()) {
      return false;
    }
    
    // Apply search filter if query exists
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return delegate.id.toLowerCase().includes(query);
  });

  // Apply client-side sorting when needed (especially for tokenHoldersRepresentedAmount)
  const sortedDelegates = useMemo(() => {
    if (!filteredDelegates) return [];
    
    // If sorting by tokenHoldersRepresentedAmount, use actual filtered length instead
    if (orderBy === 'tokenHoldersRepresentedAmount') {
      return [...filteredDelegates].sort((a, b) => {
        const aCount = a.tokenHoldersRepresented.length;
        const bCount = b.tokenHoldersRepresented.length;
        
        if (orderDirection === 'desc') {
          return bCount - aCount;
        } else {
          return aCount - bCount;
        }
      });
    }
    
    // For other fields, rely on GraphQL sorting
    return filteredDelegates;
  }, [filteredDelegates, orderBy, orderDirection]);

  const renderLoadingDelegate = () => (
    <div className={styles.loadingItem}>
      <div className={styles.loadingText} />
      <div className={styles.loadingText} style={{ width: '70%' }} />
      <div className={styles.loadingText} style={{ width: '50%' }} />
    </div>
  );

  // Show loading state
  if (delegatesLoading) {
    return (
      <div className={styles.container}>
        <VoterFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          orderBy={orderBy}
          onOrderByChange={setOrderBy}
          orderDirection={orderDirection}
          onOrderDirectionChange={setOrderDirection}
          onRefresh={handleRefresh}
        />
        <div className={styles.gridWrapper}>
          <div className={styles.delegatesList}>
            {Array(8).fill(0).map((_, i) => (
              <React.Fragment key={`loading-delegate-${i}`}>
                {renderLoadingDelegate()}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (delegatesError) {
    return <div className={styles.errorState}>Error loading voters</div>;
  }

  const delegates = sortedDelegates || [];

  return (
    <div className={styles.container}>
      <VoterFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        orderBy={orderBy}
        onOrderByChange={setOrderBy}
        orderDirection={orderDirection}
        onOrderDirectionChange={setOrderDirection}
        onRefresh={handleRefresh}
      />
      <div className={styles.gridWrapper}>
        <div className={styles.delegatesList} ref={delegatesContainerRef}>
          {delegatesLoading ? (
            Array(8).fill(0).map((_, i) => (
              <React.Fragment key={`loading-delegate-${i}`}>
                {renderLoadingDelegate()}
              </React.Fragment>
            ))
          ) : delegates?.length ? (
            <>
              {delegates.map((delegate: Delegate) => (
                <VoterCard 
                  key={delegate.id}
                  delegate={delegate}
                  onClick={onVoterClick}
                />
              ))}
              {isFetchingMoreDelegates && (
                <div className={styles.loadingMore}>
                  <div className={styles.loadingIndicator}>Loading more voters...</div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>No voters found</div>
          )}
        </div>
      </div>
    </div>
  );
}