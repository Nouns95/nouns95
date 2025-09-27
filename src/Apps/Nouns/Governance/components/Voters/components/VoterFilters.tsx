import React from 'react';
import { Delegate_orderBy, OrderDirection } from '@/src/Apps/Nouns/domain/graphql/queries/delegates';
import styles from './VoterFilters.module.css';

interface VoterFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  orderBy: Delegate_orderBy;
  onOrderByChange: (orderBy: Delegate_orderBy) => void;
  orderDirection: OrderDirection;
  onOrderDirectionChange: (direction: OrderDirection) => void;
  onRefresh: () => void;
}

export function VoterFilters({
  searchQuery,
  onSearchChange,
  orderBy,
  onOrderByChange,
  orderDirection,
  onOrderDirectionChange,
  onRefresh
}: VoterFiltersProps) {
  return (
    <div className={styles.container}>
      <div className={styles.searchSection}>
        <label className={styles.label} htmlFor="voter-search-input">Search:</label>
        <input
          id="voter-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by voter address..."
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
              onOrderByChange(Delegate_orderBy.delegatedVotes);
              onOrderDirectionChange(OrderDirection.desc);
              onSearchChange('');
            }}
          >
            Top Voters
          </button>
          <button 
            className={styles.quickFilter}
            onClick={() => {
              onOrderByChange(Delegate_orderBy.tokenHoldersRepresentedAmount);
              onOrderDirectionChange(OrderDirection.desc);
              onSearchChange('');
            }}
          >
            Most Delegates
          </button>
        </div>

        <div className={styles.sortSection}>
          <div className={styles.sortGroup}>
            <label className={styles.label} htmlFor="order-by-select">Order By:</label>
            <select
              id="order-by-select"
              className={styles.select}
              value={orderBy}
              onChange={(e) => onOrderByChange(e.target.value as Delegate_orderBy)}
            >
              <option value={Delegate_orderBy.delegatedVotes}>Voting Power</option>
              <option value={Delegate_orderBy.tokenHoldersRepresentedAmount}>Delegates</option>
              <option value={Delegate_orderBy.id}>Address</option>
            </select>
          </div>

          <div className={styles.sortGroup}>
            <label className={styles.label} htmlFor="direction-select">Direction:</label>
            <select
              id="direction-select"
              className={styles.select}
              value={orderDirection}
              onChange={(e) => onOrderDirectionChange(e.target.value as OrderDirection)}
            >
              <option value={OrderDirection.desc}>High to Low</option>
              <option value={OrderDirection.asc}>Low to High</option>
            </select>
          </div>

          <button 
            className={styles.refreshButton}
            onClick={onRefresh}
            title="Refresh data"
          >
            🔄
          </button>
        </div>
      </div>
    </div>
  );
}
