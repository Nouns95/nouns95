"use client";

import React, { useState, useMemo } from 'react';
import { MenuBar, MenuBarItem } from '@/src/Shell/Window/components/Menu/MenuBar';
import { WindowService } from '@/src/Shell/Window/domain/services/WindowService';
import { useWindowStore } from '@/src/Shell/Window/domain/stores/WindowStore';
import { NounsGrid } from './components/NounsGrid';
import { EnhancedNounsGrid } from './components/EnhancedNounsGrid';
import { ProbeFilters } from './components/ProbeFilters';
import { NounDetail } from './components/NounDetail';
import { Noun_orderBy, OrderDirection } from '../domain/types/graphql';
import { TraitFilters } from './utils/trait-utils';
import styles from './Probe.module.css';

const Probe: React.FC = () => {
  // State for filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState<Noun_orderBy>(Noun_orderBy.id);
  const [orderDirection, setOrderDirection] = useState<OrderDirection>(OrderDirection.desc);
  const [traitFilters, setTraitFilters] = useState<TraitFilters>({});
  const [refreshKey, setRefreshKey] = useState(0);
  
  // State for navigation
  const [selectedNounId, setSelectedNounId] = useState<string | null>(null);
  
  // State for performance mode toggle
  const [useEnhancedMode, setUseEnhancedMode] = useState(true);

  // Memoize trait filters to prevent unnecessary re-renders
  const memoizedTraitFilters = useMemo(() => traitFilters, [traitFilters]);

  // Get the current window's ID by finding the focused window with our app ID
  const currentWindowId = useWindowStore((state) => {
    const window = state.windows.find(w => w.applicationId === 'probe' && w.isFocused);
    return window?.id || null;
  });
  const windowService = WindowService.getInstance();

  const handleClose = () => {
    if (currentWindowId) {
      windowService.closeWindow(currentWindowId);
    }
  };

  const handleSearch = () => {
    // Focus on search input if filters are visible
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.focus();
    }
  };

  const handleAnalyze = () => {
    // Could implement analysis features in the future
    // Debug log removed
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleNounClick = (nounId: string) => {
    setSelectedNounId(nounId);
  };

  const handleBackToGrid = () => {
    setSelectedNounId(null);
  };

  const MENU_ITEMS: MenuBarItem[] = [
    {
      id: 'file',
      label: 'File',
      items: [
        { id: 'file-search', label: 'Focus Search', action: handleSearch },
        { id: 'file-analyze', label: 'Run Analysis', action: handleAnalyze, disabled: true },
        { id: 'file-separator-0', separator: true },
        { 
          id: 'file-toggle-mode', 
          label: useEnhancedMode ? '⚡ Enhanced Mode (ON)' : '🔄 GraphQL Mode (ON)', 
          action: () => setUseEnhancedMode(!useEnhancedMode)
        },
        { id: 'file-separator-1', separator: true },
        { id: 'file-refresh', label: 'Refresh', action: handleRefresh },
        { id: 'file-separator-2', separator: true },
        { id: 'file-close', label: 'Close', action: handleClose }
      ]
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { 
          id: 'view-latest', 
          label: 'Latest Nouns', 
          action: () => {
            setOrderBy(Noun_orderBy.id);
            setOrderDirection(OrderDirection.desc);
            setSearchQuery('');
          }
        },
        { 
          id: 'view-first', 
          label: 'Earliest Nouns', 
          action: () => {
            setOrderBy(Noun_orderBy.id);
            setOrderDirection(OrderDirection.asc);
            setSearchQuery('');
          }
        },
        { 
          id: 'view-nounders', 
          label: 'Nounder Nouns', 
          action: () => {
            setOrderBy(Noun_orderBy.id);
            setOrderDirection(OrderDirection.asc);
            setSearchQuery('0');
          }
        },
        { id: 'view-separator-1', separator: true },
        { 
          id: 'view-background', 
          label: 'Group by Background', 
          action: () => {
            setOrderBy(Noun_orderBy.seed__background);
            setOrderDirection(OrderDirection.asc);
            setSearchQuery('');
          }
        },
        { 
          id: 'view-head', 
          label: 'Group by Head', 
          action: () => {
            setOrderBy(Noun_orderBy.seed__head);
            setOrderDirection(OrderDirection.asc);
            setSearchQuery('');
          }
        },
        { 
          id: 'view-body', 
          label: 'Group by Body', 
          action: () => {
            setOrderBy(Noun_orderBy.seed__body);
            setOrderDirection(OrderDirection.asc);
            setSearchQuery('');
          }
        },
        { 
          id: 'view-glasses', 
          label: 'Group by Glasses', 
          action: () => {
            setOrderBy(Noun_orderBy.seed__glasses);
            setOrderDirection(OrderDirection.asc);
            setSearchQuery('');
          }
        },
        { 
          id: 'view-accessory', 
          label: 'Group by Accessory', 
          action: () => {
            setOrderBy(Noun_orderBy.seed__accessory);
            setOrderDirection(OrderDirection.asc);
            setSearchQuery('');
          }
        },
        { 
          id: 'view-owner', 
          label: 'Group by Owner', 
          action: () => {
            setOrderBy(Noun_orderBy.owner);
            setOrderDirection(OrderDirection.asc);
            setSearchQuery('');
          }
        },
        { id: 'view-separator-2', separator: true },
        { id: 'view-refresh', label: 'Refresh', action: handleRefresh }
      ]
    },
    {
      id: 'tools',
      label: 'Tools',
      items: [
        { id: 'tools-export', label: 'Export Data', disabled: true },
        { id: 'tools-import', label: 'Import Data', disabled: true },
        { id: 'tools-separator-1', separator: true },
        { id: 'tools-settings', label: 'Settings', disabled: true }
      ]
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { id: 'help-docs', label: 'Documentation', disabled: true },
        { id: 'help-separator-1', separator: true },
        { id: 'help-about', label: 'About Nouns Probe', disabled: true }
      ]
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.probeMain}>
        <MenuBar items={MENU_ITEMS} />
        <div className={styles.content}>
          {selectedNounId ? (
            <NounDetail 
              nounId={selectedNounId}
              onBack={handleBackToGrid}
            />
          ) : (
            <>
              <ProbeFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                orderBy={orderBy}
                onOrderByChange={setOrderBy}
                orderDirection={orderDirection}
                onOrderDirectionChange={setOrderDirection}
                traitFilters={memoizedTraitFilters}
                onTraitFiltersChange={setTraitFilters}
                onRefresh={handleRefresh}
              />
              <div className={styles.gridWrapper}>
                {useEnhancedMode ? (
                  <EnhancedNounsGrid
                    key={refreshKey}
                    searchQuery={searchQuery}
                    onNounClick={handleNounClick}
                    orderBy={orderBy}
                    orderDirection={orderDirection}
                    traitFilters={memoizedTraitFilters}
                    refreshKey={refreshKey}
                  />
                ) : (
                  <NounsGrid
                    key={refreshKey}
                    searchQuery={searchQuery}
                    onNounClick={handleNounClick}
                    orderBy={orderBy}
                    orderDirection={orderDirection}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Probe;
