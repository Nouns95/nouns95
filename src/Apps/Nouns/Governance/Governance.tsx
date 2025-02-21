'use client';

import React, { useState } from 'react';
import { MenuBar, MenuBarItem } from '@/src/shell/Window/components/Menu/MenuBar';
import { WindowService } from '@/src/shell/Window/domain/services/WindowService';
import { useWindowStore } from '@/src/shell/Window/domain/stores/WindowStore';
import { TreasuryBalance } from './components/Common/TreasuryBalance';
import { GovernanceOverview } from './components/Common/GovernanceOverview';
import { ProposalsList } from './components/Proposals/ProposalsList';
import ProposalDetails from './components/Proposals/[id]';
import CandidateDetails from './components/Candidates/[id]';
import { CandidatesList } from './components/Candidates/CandidatesList';
import styles from './Governance.module.css';

type Tab = 'proposals' | 'candidates' | 'topics';

export default function Governance() {
  const [activeTab, setActiveTab] = useState<Tab>('proposals');
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Get the current window's ID by finding the focused window with our app ID
  const windows = useWindowStore((state) => state.windows);
  const currentWindow = windows.find(w => w.applicationId === 'governance' && w.isFocused);
  const windowService = WindowService.getInstance();

  const handleClose = () => {
    if (currentWindow) {
      windowService.closeWindow(currentWindow.id);
    }
  };

  const handleProposalClick = (proposalId: string) => {
    setSelectedProposalId(proposalId);
  };

  const handleBackToProposals = () => {
    setSelectedProposalId(null);
  };

  const MENU_ITEMS: MenuBarItem[] = [
    {
      id: 'file',
      label: 'File',
      items: [
        { id: 'file-refresh', label: 'Refresh', disabled: true },
        { id: 'file-separator-1', separator: true },
        { id: 'file-close', label: 'Close', action: handleClose }
      ]
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { id: 'view-active', label: 'Active Proposals', action: handleBackToProposals },
        { id: 'view-history', label: 'Proposal History', disabled: true },
        { id: 'view-separator-1', separator: true },
        { id: 'view-refresh', label: 'Refresh', disabled: true }
      ]
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { id: 'help-docs', label: 'Documentation', disabled: true },
        { id: 'help-separator-1', separator: true },
        { id: 'help-about', label: 'About Nouns Governance', disabled: true }
      ]
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'proposals':
        if (selectedProposalId) {
          return (
            <ProposalDetails 
              id={selectedProposalId}
              onBackToList={handleBackToProposals}
            />
          );
        }
        return (
          <ProposalsList 
            onProposalClick={handleProposalClick}
          />
        );
      case 'candidates':
        if (selectedProposalId) {
          return (
            <CandidateDetails 
              id={selectedProposalId}
              onBackToList={handleBackToProposals}
            />
          );
        }
        return (
          <CandidatesList 
            onCandidateClick={handleProposalClick}
          />
        );
      case 'topics':
        return <div>Topics content coming soon...</div>;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <MenuBar items={MENU_ITEMS} />
      <div className={styles.content}>
        <div className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
          <button 
            className={styles.sidebarToggle}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? 'Expand' : 'Collapse'}
          </button>
          <div className={styles.sidebarContent}>
            <TreasuryBalance />
            <GovernanceOverview />
          </div>
        </div>
        <div className={`${styles.proposalsSection} ${isSidebarCollapsed ? styles.expanded : ''}`}>
          <div className={styles.tabs}>
            {(['proposals', 'candidates', 'topics'] as Tab[]).map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className={styles.tabContent}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
} 