'use client';

import React, { useState, useEffect } from 'react';
import { StaticNounImage } from '../../Auction/StaticNounImage';
import { getTraitName } from '../../domain/utils/trait-name-utils';
import { ensResolver } from '../utils/ensResolver';
import styles from './NounCard.module.css';

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

interface NounCardProps {
  noun: NounData;
  onClick?: (nounId: string) => void;
}

export function NounCard({ noun, onClick }: NounCardProps) {
  const [ensName, setEnsName] = useState<string | null>(null);

  const handleClick = () => {
    onClick?.(noun.id);
  };

  const handleOwnerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Could implement navigation to owner's profile in the future
  };

  const shortOwner = noun.owner.id.slice(0, 6) + '...' + noun.owner.id.slice(-4);

  // ENS resolution effect - completely background, no loading states
  useEffect(() => {
    if (!noun.owner.id) return;

    // Check if we already have cached result
    const cached = ensResolver.getCached(noun.owner.id);
    if (cached !== undefined) {
      setEnsName(cached);
      return;
    }

    // Start background resolution - no loading state
    ensResolver.resolve(noun.owner.id).then((name) => {
      setEnsName(name);
    }).catch(() => {
      // Silent failure - just don't update the ENS name
    });
  }, [noun.owner.id]);

  // Display logic for owner - clean and simple
  const getOwnerDisplay = () => {
    return ensName || shortOwner;
  };

  return (
    <div 
      className={`${styles.card} ${onClick ? styles.clickable : ''}`}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className={styles.imageContainer}>
        <StaticNounImage 
          nounId={noun.id}
          width={160}
          height={160}
          className={styles.nounImage}
          skipLoading={false}
        />
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.nounId}>Noun {noun.id}</h3>
          <div 
            className={`${styles.owner} ${ensName ? styles.ensName : ''}`}
            onClick={handleOwnerClick}
            title={ensName ? `${ensName} (${noun.owner.id})` : noun.owner.id}
          >
            {getOwnerDisplay()}
          </div>
        </div>
        
        <div className={styles.traits}>
          <div className={styles.trait}>
            <span className={styles.traitLabel}>Head:</span>
            <span className={styles.traitValue}>
              {getTraitName('head', Number(noun.seed.head))}
            </span>
          </div>
          <div className={styles.trait}>
            <span className={styles.traitLabel}>Glasses:</span>
            <span className={styles.traitValue}>
              {getTraitName('glasses', Number(noun.seed.glasses))}
            </span>
          </div>
          <div className={styles.trait}>
            <span className={styles.traitLabel}>Accessory:</span>
            <span className={styles.traitValue}>
              {getTraitName('accessory', Number(noun.seed.accessory))}
            </span>
          </div>
          <div className={styles.trait}>
            <span className={styles.traitLabel}>Body:</span>
            <span className={styles.traitValue}>
              {getTraitName('body', Number(noun.seed.body))}
            </span>
          </div>
          <div className={styles.trait}>
            <span className={styles.traitLabel}>Background:</span>
            <span className={styles.traitValue}>
              {getTraitName('background', Number(noun.seed.background))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
