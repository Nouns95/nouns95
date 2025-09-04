'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { PROBE_NOUNS_QUERY } from '../../domain/graphql/queries/noun';
import { NounCard } from './NounCard';
import { Noun_orderBy, OrderDirection } from '../../domain/types/graphql';
import styles from './NounsGrid.module.css';

interface NounData {
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
}

interface NounsGridProps {
  searchQuery?: string;
  onNounClick?: (nounId: string) => void;
  orderBy?: Noun_orderBy;
  orderDirection?: OrderDirection;
}

// Background loading constants
const BATCH_SIZE = 1000; // Max GraphQL limit per request
const MAX_EXPECTED_NOUNS = 2000; // Conservative estimate for total Nouns

export function NounsGrid({ 
  searchQuery = '', 
  onNounClick,
  orderBy = Noun_orderBy.id,
  orderDirection = OrderDirection.desc
}: NounsGridProps) {
  const [allNouns, setAllNouns] = useState<NounData[]>([]);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { error: queryError, fetchMore } = useQuery(PROBE_NOUNS_QUERY, {
    variables: {
      first: BATCH_SIZE,
      skip: 0,
      orderBy: Noun_orderBy.id, // Always fetch by ID for consistent pagination
      orderDirection: OrderDirection.desc
    },
    onCompleted: (initialData) => {
      if (initialData.nouns.length > 0) {
        setAllNouns(initialData.nouns);
        
        // Start background loading if we got a full batch
        if (initialData.nouns.length === BATCH_SIZE) {
          loadAllNounsInBackground(initialData.nouns);
        } else {
          setIsLoadingComplete(true);
        }
      }
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first'
  });

  // Background loading function
  const loadAllNounsInBackground = async (initialNouns: NounData[]) => {
    let allLoadedNouns = [...initialNouns];
    let skip = BATCH_SIZE;
    let hasMore = true;

    try {
      while (hasMore && skip < MAX_EXPECTED_NOUNS) {
        const result = await fetchMore({
          variables: {
            first: BATCH_SIZE,
            skip,
            orderBy: Noun_orderBy.id,
            orderDirection: OrderDirection.desc
          },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult || !fetchMoreResult.nouns.length) {
              return prev;
            }
            return {
              ...prev,
              nouns: [...prev.nouns, ...fetchMoreResult.nouns]
            };
          }
        });

        if (result.data?.nouns) {
          const newNouns = result.data.nouns;
          
          // Deduplicate by ID
          const existingIds = new Set(allLoadedNouns.map(n => n.id));
          const uniqueNewNouns = newNouns.filter((noun: NounData) => !existingIds.has(noun.id));
          
          allLoadedNouns = [...allLoadedNouns, ...uniqueNewNouns];
          setAllNouns([...allLoadedNouns]);

          // Check if we've reached the end
          if (newNouns.length < BATCH_SIZE) {
            hasMore = false;
          } else {
            skip += BATCH_SIZE;
          }

          // Small delay to prevent overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          hasMore = false;
        }
      }
    } catch (err) {
      console.error('Background loading error:', err);
      setError('Failed to load some Nouns. Partial data is still available.');
    } finally {
      setIsLoadingComplete(true);
    }
  };

  // Filter and sort all loaded nouns based on search query and sort preferences
  const filteredAndSortedNouns = React.useMemo(() => {
    if (allNouns.length === 0) return [];
    
    // Filter based on search query
    let filteredNouns = allNouns;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredNouns = allNouns.filter((noun: NounData) => 
        noun.id.includes(query) ||
        noun.owner.id.toLowerCase().includes(query)
      );
    }
    
    // Sort based on orderBy and orderDirection
    const sortedNouns = [...filteredNouns].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      switch (orderBy) {
        case Noun_orderBy.id:
          // Parse as numbers for proper numeric sorting
          aValue = parseInt(a.id);
          bValue = parseInt(b.id);
          break;
        case Noun_orderBy.seed:
        case Noun_orderBy.seed__id:
          // Sort by combined seed values for general seed sorting
          aValue = `${a.seed.background}${a.seed.body}${a.seed.accessory}${a.seed.head}${a.seed.glasses}`;
          bValue = `${b.seed.background}${b.seed.body}${b.seed.accessory}${b.seed.head}${b.seed.glasses}`;
          break;
        case Noun_orderBy.seed__background:
          aValue = parseInt(a.seed.background);
          bValue = parseInt(b.seed.background);
          break;
        case Noun_orderBy.seed__body:
          aValue = parseInt(a.seed.body);
          bValue = parseInt(b.seed.body);
          break;
        case Noun_orderBy.seed__accessory:
          aValue = parseInt(a.seed.accessory);
          bValue = parseInt(b.seed.accessory);
          break;
        case Noun_orderBy.seed__head:
          aValue = parseInt(a.seed.head);
          bValue = parseInt(b.seed.head);
          break;
        case Noun_orderBy.seed__glasses:
          aValue = parseInt(a.seed.glasses);
          bValue = parseInt(b.seed.glasses);
          break;
        case Noun_orderBy.owner:
        case Noun_orderBy.owner__id:
          aValue = a.owner.id.toLowerCase();
          bValue = b.owner.id.toLowerCase();
          break;
        case Noun_orderBy.owner__tokenBalance:
        case Noun_orderBy.owner__tokenBalanceRaw:
        case Noun_orderBy.owner__totalTokensHeld:
        case Noun_orderBy.owner__totalTokensHeldRaw:
          // Note: These fields aren't available in our current data structure
          // Fallback to owner address sorting
          aValue = a.owner.id.toLowerCase();
          bValue = b.owner.id.toLowerCase();
          break;
        case Noun_orderBy.votes:
          // Note: Votes field isn't available in our current data structure
          // Fallback to ID sorting
          aValue = parseInt(a.id);
          bValue = parseInt(b.id);
          break;
        default:
          // Default to ID sorting
          aValue = parseInt(a.id);
          bValue = parseInt(b.id);
      }
      
      // Handle numeric vs string comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return orderDirection === OrderDirection.desc ? bValue - aValue : aValue - bValue;
      } else {
        // String comparison
        aValue = String(aValue);
        bValue = String(bValue);
        if (orderDirection === OrderDirection.desc) {
          return bValue.localeCompare(aValue);
        } else {
          return aValue.localeCompare(bValue);
        }
      }
    });
    
    return sortedNouns;
  }, [allNouns, searchQuery, orderBy, orderDirection]);



  if (queryError) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorTitle}>Error Loading Nouns</div>
        <div className={styles.errorMessage}>
          {queryError.message || 'Failed to load Nouns data'}
        </div>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {/* Render actual Noun cards */}
        {filteredAndSortedNouns.map((noun: NounData) => (
          <NounCard 
            key={noun.id}
            noun={noun}
            onClick={onNounClick}
          />
        ))}
      </div>
      

      
      {filteredAndSortedNouns.length === 0 && isLoadingComplete && (
        <div className={styles.noResults}>
          {searchQuery 
            ? `No Nouns found matching "${searchQuery}"`
            : 'No Nouns found'
          }
        </div>
      )}
      
      {error && (
        <div className={styles.errorMessage}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
