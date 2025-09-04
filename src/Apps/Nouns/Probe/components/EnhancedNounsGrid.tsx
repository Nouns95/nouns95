'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { EnhancedNounCard } from './EnhancedNounCard';
import { Noun_orderBy, OrderDirection } from '../../domain/types/graphql';
import { useCachedNouns } from '../hooks/useCachedNouns';
import { enhancedENSService } from '../services/enhancedENSService';
import { TraitFilters } from '../utils/trait-utils';
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
  __ensName?: string | null; // Enhanced with backend ENS data
  __cachedImage?: string | null; // Cached SVG image data
}

interface EnhancedNounsGridProps {
  searchQuery?: string;
  onNounClick?: (nounId: string) => void;
  orderBy?: Noun_orderBy;
  orderDirection?: OrderDirection;
  traitFilters?: TraitFilters;
  refreshKey?: number;
}

export function EnhancedNounsGrid({ 
  searchQuery = '', 
  onNounClick,
  orderBy = Noun_orderBy.id,
  orderDirection = OrderDirection.desc,
  traitFilters = {},
  refreshKey = 0
}: EnhancedNounsGridProps) {
  const {
    nouns: allNouns,
    loading: initialLoading,
    error,
    isLoadingComplete,
    // totalCount,
    // meta,
    // loadMore,
    // hasMore,
    loadingMore
  } = useCachedNouns({
    searchQuery,
    orderBy,
    orderDirection,
    traitFilters,
    refreshKey
  });

  // Preload ENS data when nouns are loaded (with ref to prevent excessive calls)
  const lastPreloadedCountRef = useRef(0);
  useEffect(() => {
    if (allNouns.length > 0 && allNouns.length !== lastPreloadedCountRef.current) {
      lastPreloadedCountRef.current = allNouns.length;
      
      // Only preload if we have a significant batch or completed loading
      if (allNouns.length >= 100 || isLoadingComplete) {
        try {
          enhancedENSService.preloadFromNounData(allNouns);
        } catch (error) {
          console.warn('ENS preloading error:', error);
          // Don't throw - ENS is optional
        }
      }
    }
  }, [allNouns, isLoadingComplete]);

  // Client-side filtering and sorting for real-time search
  // Note: Trait filtering is now handled server-side for better performance
  const filteredAndSortedNouns = useMemo(() => {
    if (allNouns.length === 0) return [];
    
    // Apply client-side search filter for instant results (server-side search may have some delay)
    let filteredNouns = allNouns;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredNouns = allNouns.filter((noun: NounData) => 
        noun.id.includes(query) ||
        noun.owner.id.toLowerCase().includes(query) ||
        (noun.__ensName && noun.__ensName.toLowerCase().includes(query))
      );
    }
    
    // Client-side sorting for instant response (data comes pre-sorted from backend)
    const sortedNouns = [...filteredNouns].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      switch (orderBy) {
        case Noun_orderBy.id:
          aValue = parseInt(a.id);
          bValue = parseInt(b.id);
          break;
        case Noun_orderBy.seed:
        case Noun_orderBy.seed__id:
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
        default:
          aValue = parseInt(a.id);
          bValue = parseInt(b.id);
      }
      
      // Handle numeric vs string comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return orderDirection === OrderDirection.desc ? bValue - aValue : aValue - bValue;
      } else {
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

  // Remove loading screen - let components load naturally

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorTitle}>Error Loading Nouns</div>
        <div className={styles.errorMessage}>{error}</div>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  // Create skeleton cards that match the exact layout
  const renderSkeletonCards = (count: number) => {
    return Array.from({ length: count }, (_, index) => (
      <div 
        key={`skeleton-${index}`} 
        style={{ 
          // Exact same styling as .card
          background: '#c0c0c0',
          border: '2px outset #c0c0c0',
          padding: '8px',
          margin: '4px',
          minWidth: '180px',
          maxWidth: '220px',
          minHeight: '280px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          opacity: 0.7
        }}
      >
        {/* Image container - exact same as .imageContainer */}
        <div style={{
          position: 'relative',
          textAlign: 'center',
          marginBottom: '8px',
          width: '160px',
          height: '160px',
          marginLeft: 'auto',
          marginRight: 'auto',
          border: '1px inset #c0c0c0',
          display: 'block',
          flexShrink: 0,
          background: '#808080'
        }}>
          {/* Skeleton image */}
          <div style={{
            width: '100%',
            height: '100%',
            background: '#808080'
          }}></div>
        </div>
        
        {/* Content section - exact same as .content */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minHeight: '100px'
        }}>
          {/* Header - exact same as .header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '4px',
            borderBottom: '1px solid #808080'
          }}>
            {/* Noun ID placeholder */}
            <div style={{ 
              background: '#808080', 
              width: '80px', 
              height: '14px',
              display: 'block' 
            }}></div>
            {/* Owner placeholder */}
            <div style={{ 
              background: '#808080', 
              width: '60px', 
              height: '11px',
              display: 'block' 
            }}></div>
          </div>
          
          {/* Traits - exact same as .traits */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                lineHeight: '1.2'
              }}>
                {/* Trait label placeholder */}
                <div style={{ 
                  background: '#808080', 
                  width: `${['Head:', 'Glasses:', 'Accessory:', 'Body:', 'Background:'][i].length * 6}px`, 
                  height: '11px',
                  display: 'block',
                  minWidth: '60px'
                }}></div>
                {/* Trait value placeholder */}
                <div style={{ 
                  background: '#808080', 
                  width: `${[70, 65, 80, 75, 85][i]}px`, 
                  height: '11px',
                  display: 'block' 
                }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {/* Show skeleton cards immediately when loading and no data */}
        {initialLoading && allNouns.length === 0 ? (
          renderSkeletonCards(12)
        ) : (
          <>
            {/* Render actual loaded nouns */}
            {filteredAndSortedNouns.map((noun: NounData) => (
              <EnhancedNounCard 
                key={noun.id}
                noun={noun}
                onClick={onNounClick}
              />
            ))}
            
            {/* Show additional skeleton cards when loading more */}
            {loadingMore && renderSkeletonCards(6)}
          </>
        )}
      </div>
      

      
      {/* No results message */}
      {filteredAndSortedNouns.length === 0 && isLoadingComplete && !initialLoading && (
        <div className={styles.noResults}>
          {searchQuery 
            ? `No Nouns found matching "${searchQuery}"`
            : 'No Nouns found'
          }
        </div>
      )}
    </div>
  );
}
