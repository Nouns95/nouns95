'use client';

import React from 'react';
import { Noun_orderBy, OrderDirection } from '../../domain/types/graphql';
import { getTraitOptions, TraitFilters, TRAIT_TYPES } from '../utils/trait-utils';
import { Win95Dropdown } from './Win95Dropdown';
import styles from './ProbeFilters.module.css';

interface ProbeFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  orderBy: Noun_orderBy;
  onOrderByChange: (orderBy: Noun_orderBy) => void;
  orderDirection: OrderDirection;
  onOrderDirectionChange: (direction: OrderDirection) => void;
  traitFilters: TraitFilters;
  onTraitFiltersChange: (filters: TraitFilters) => void;
  onRefresh: () => void;
}

export function ProbeFilters({
  searchQuery,
  onSearchChange,
  // orderBy,
  onOrderByChange,
  // orderDirection,
  onOrderDirectionChange,
  traitFilters,
  onTraitFiltersChange,
  // onRefresh
}: ProbeFiltersProps) {
  return (
    <div className={styles.container}>
      <div className={styles.searchSection}>
        <label className={styles.label} htmlFor="search-input">Search:</label>
        <input
          id="search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by Noun ID or owner address..."
          className={styles.searchInput}
        />
        <button 
          className={styles.clearButton}
          onClick={() => onSearchChange('')}
          disabled={!searchQuery}
          title="Clear search"
        >
          ✕
        </button>
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.quickFilters}>
          <button 
            className={styles.quickFilter}
            onClick={() => {
              onOrderByChange(Noun_orderBy.id);
              onOrderDirectionChange(OrderDirection.desc);
              onSearchChange('');
              onTraitFiltersChange({});
            }}
          >
            Latest Nouns
          </button>
          <button 
            className={styles.quickFilter}
            onClick={() => {
              onOrderByChange(Noun_orderBy.id);
              onOrderDirectionChange(OrderDirection.asc);
              onSearchChange('');
              onTraitFiltersChange({});
            }}
          >
            Earliest Nouns
          </button>
        </div>

        {/* Trait Filters - Right Side */}
        <div className={styles.traitFilters}>
          <div className={styles.traitGrid}>
            {TRAIT_TYPES.map((traitType) => {
              const options = getTraitOptions(traitType);
              const currentValue = traitFilters[traitType];
              
              return (
                <div key={traitType} className={styles.traitGroup}>
                  <label className={styles.traitLabel} htmlFor={`trait-${traitType}`}>
                    {traitType.charAt(0).toUpperCase() + traitType.slice(1)}:
                  </label>
                  <Win95Dropdown
                    value={currentValue ?? ''}
                    onChange={(value) => {
                      const newValue = value === '' ? undefined : (typeof value === 'string' ? parseInt(value) : value as number);
                      onTraitFiltersChange({
                        ...traitFilters,
                        [traitType]: newValue
                      });
                    }}
                    options={[
                      { value: '', label: `All ${traitType}s` },
                      ...options.map((option) => ({
                        value: option.value,
                        label: option.label
                      }))
                    ]}
                    style={{ width: '100%', minWidth: '120px' }}
                  />
                </div>
              );
            })}
            
            {/* Clear all trait filters button */}
            <button
              className={styles.clearTraitsButton}
              onClick={() => onTraitFiltersChange({})}
              disabled={Object.keys(traitFilters).length === 0}
              title="Clear all trait filters"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
