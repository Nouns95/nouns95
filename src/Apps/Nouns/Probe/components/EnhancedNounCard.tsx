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
    delegate?: {
      id: string;
      delegatedVotes: string;
    };
  };
  __ensName?: string | null; // Preloaded ENS data for owner
  __delegateEnsName?: string | null; // Preloaded ENS data for delegate
  __cachedImage?: string | null; // Cached SVG image data
}

interface EnhancedNounCardProps {
  noun: NounData;
  onClick?: (nounId: string) => void;
}

export function EnhancedNounCard({ noun, onClick }: EnhancedNounCardProps) {
  const [ensName, setEnsName] = useState<string | null>(noun.__delegateEnsName || null);
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    onClick?.(noun.id);
  };

  const handleDelegateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Could implement navigation to delegate's profile in the future
  };

  // Get the delegate address (fallback to owner if no delegate)
  const delegateAddress = noun.owner.delegate?.id || noun.owner.id;
  const shortDelegate = delegateAddress.slice(0, 6) + '...' + delegateAddress.slice(-4);
  const isDelegateSameAsOwner = noun.owner.delegate?.id?.toLowerCase() === noun.owner.id.toLowerCase();

  // ENS resolution effect - use preloaded data or fallback to resolution
  useEffect(() => {
    if (!delegateAddress) return;

    // If we already have preloaded ENS data for delegate, use it
    if (noun.__delegateEnsName !== undefined) {
      setEnsName(noun.__delegateEnsName);
      return;
    }

    // Check if we already have cached result
    const cached = ensResolver.getCached(delegateAddress);
    if (cached !== undefined) {
      setEnsName(cached);
      return;
    }

    // Start background resolution - no loading state
    ensResolver.resolve(delegateAddress).then((name) => {
      setEnsName(name);
    }).catch(() => {
      // Silent failure - just don't update the ENS name
    });
  }, [delegateAddress, noun.__delegateEnsName]);

  // Display logic for delegate - clean and simple
  const getDelegateDisplay = () => {
    if (!noun.owner.delegate?.id) {
      return 'No delegate';
    }
    const displayName = ensName || shortDelegate;
    return isDelegateSameAsOwner ? `${displayName} (self)` : displayName;
  };

  const handleImageError = () => {
    setImageError(true);
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
        {noun.__cachedImage && !imageError ? (
          // Use cached image data (base64 SVG data URL, standard img is appropriate)
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={noun.__cachedImage}
            alt={`Noun ${noun.id}`}
            width={160}
            height={160}
            className={styles.nounImage}
            onError={handleImageError}
            style={{ 
              display: 'block',
              objectFit: 'contain'
            }}
          />
        ) : (
          // Fallback to StaticNounImage (generates SVG on the fly)
          <StaticNounImage 
            nounId={noun.id}
            width={160}
            height={160}
            className={styles.nounImage}
            skipLoading={false}
          />
        )}
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.nounId}>Noun {noun.id}</h3>
          <div 
            className={`${styles.owner} ${ensName ? styles.ensName : ''}`}
            onClick={handleDelegateClick}
            title={noun.owner.delegate?.id ? 
              (ensName ? `${ensName} (${noun.owner.delegate.id})` : noun.owner.delegate.id) :
              'No delegate set'
            }
          >
            {getDelegateDisplay()}
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