'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { NOUN_DETAIL_QUERY } from '../../domain/graphql/queries/noun';
import { StaticNounImage } from '../../Auction/StaticNounImage';
import { getTraitName } from '../../domain/utils/trait-name-utils';
import { ensResolver } from '../utils/ensResolver';
import styles from './NounDetail.module.css';

interface NounDetailProps {
  nounId: string;
  onBack: () => void;
}

interface Vote {
  id: string;
  support: boolean;
  votes: string;
  blockNumber: string;
  voter: {
    id: string;
  };
  proposal: {
    id: string;
    title: string;
    status: string;
  };
}

interface NounDetailData {
  noun: {
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
    votes: Vote[];
  };
}

export function NounDetail({ nounId, onBack }: NounDetailProps) {
  const [ensName, setEnsName] = useState<string | null>(null);
  const resolvedAddressRef = useRef<string | null>(null);
  
  console.log('NounDetail rendering with nounId:', nounId);

  const { loading, error, data } = useQuery<NounDetailData>(NOUN_DETAIL_QUERY, {
    variables: { id: nounId },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    errorPolicy: 'all'
  });

  // ENS resolution for owner - completely background, no loading states
  useEffect(() => {
    if (!data?.noun?.owner?.id) {
      setEnsName(null);
      resolvedAddressRef.current = null;
      return;
    }

    const ownerAddress = data.noun.owner.id;

    // If we already resolved this address, don't do it again
    if (resolvedAddressRef.current === ownerAddress) {
      return;
    }

    // Check if we already have cached result
    const cached = ensResolver.getCached(ownerAddress);
    if (cached !== undefined) {
      setEnsName(cached);
      resolvedAddressRef.current = ownerAddress;
      return;
    }

    // Start background resolution - no loading state
    ensResolver.resolve(ownerAddress).then((name) => {
      setEnsName(name);
      resolvedAddressRef.current = ownerAddress;
    }).catch(() => {
      // Silent failure - just don't update the ENS name
      resolvedAddressRef.current = ownerAddress;
    });
  }, [data?.noun?.owner?.id]);

  const getSupportDisplay = (support: boolean) => {
    return support ? 'For' : 'Against';
  };

  const formatVotes = (votes: string) => {
    const voteCount = parseFloat(votes);
    return voteCount.toFixed(2);
  };

  const getOwnerDisplay = () => {
    if (!data?.noun?.owner?.id) return '';
    if (ensName) return ensName;
    return data.noun.owner.id.slice(0, 6) + '...' + data.noun.owner.id.slice(-4);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onBack}>
            ← Back to Grid
          </button>
          <h1 className={styles.title}>Loading Noun {nounId}...</h1>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.loadingImage}></div>
          <div className={styles.loadingContent}>
            <div className={styles.loadingLine}></div>
            <div className={styles.loadingLine}></div>
            <div className={styles.loadingLine}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.noun) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onBack}>
            ← Back to Grid
          </button>
          <h1 className={styles.title}>Error Loading Noun</h1>
        </div>
        <div className={styles.errorMessage}>
          {error?.message || 'Noun not found'}
        </div>
      </div>
    );
  }

  const noun = data.noun;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          ← Back to Grid
        </button>
        <h1 className={styles.title}>Noun {noun.id}</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.imageSection}>
          <StaticNounImage 
            nounId={noun.id}
            width={320}
            height={320}
            className={styles.nounImage}
          />
          
          <div 
            className={styles.nounTraits}
            style={{
              width: '320px',
              background: '#ffffff',
              border: '2px solid',
              borderColor: '#808080 #ffffff #ffffff #808080',
              padding: '0.5rem',
              boxSizing: 'border-box',
              marginTop: '-2px'
            }}
          >
            <div className={styles.traitItem}>
              <span className={styles.traitLabel}>Head</span>
              <span className={styles.traitValue}>
                {getTraitName('head', Number(noun.seed.head))}
              </span>
            </div>
            
            <div className={styles.traitItem}>
              <span className={styles.traitLabel}>Glasses</span>
              <span className={styles.traitValue}>
                {getTraitName('glasses', Number(noun.seed.glasses))}
              </span>
            </div>
            
            <div className={styles.traitItem}>
              <span className={styles.traitLabel}>Accessory</span>
              <span className={styles.traitValue}>
                {getTraitName('accessory', Number(noun.seed.accessory))}
              </span>
            </div>
            
            <div className={styles.traitItem}>
              <span className={styles.traitLabel}>Body</span>
              <span className={styles.traitValue}>
                {getTraitName('body', Number(noun.seed.body))}
              </span>
            </div>
            
            <div className={styles.traitItem}>
              <span className={styles.traitLabel}>Background</span>
              <span className={styles.traitValue}>
                {getTraitName('background', Number(noun.seed.background))}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.basicInfo}>
            <h2 className={styles.sectionTitle}>Basic Information</h2>
            
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Token ID:</span>
                <span className={styles.value}>#{noun.id}</span>
              </div>
              
              <div className={styles.infoItem}>
                <span className={styles.label}>Owner:</span>
                <span className={`${styles.value} ${ensName ? styles.ensValue : ''}`}>
                  {getOwnerDisplay()}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.votesSection}>
            <h2 className={styles.sectionTitle}>
              Voting History ({noun.votes.length} votes)
            </h2>
            
            {noun.votes.length === 0 ? (
              <div className={styles.noVotes}>
                This Noun has not voted on any proposals yet.
              </div>
            ) : (
              <div className={styles.votesList}>
                {noun.votes.map((vote) => (
                  <div key={vote.id} className={styles.voteItem}>
                    <div className={styles.voteHeader}>
                      <span className={`${styles.voteSupport} ${vote.support ? styles.supportFor : styles.supportAgainst}`}>
                        {getSupportDisplay(vote.support)}
                      </span>
                      <span className={styles.voteCount}>
                        {formatVotes(vote.votes)} votes
                      </span>
                    </div>
                    
                    <div className={styles.proposalInfo}>
                      <span className={styles.proposalTitle}>
                        Proposal #{vote.proposal.id}: {vote.proposal.title}
                      </span>
                      <span className={styles.proposalStatus}>
                        Status: {vote.proposal.status}
                      </span>
                    </div>
                    
                    <div className={styles.voteDetails}>
                      <span className={styles.blockNumber}>
                        Block #{vote.blockNumber}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
