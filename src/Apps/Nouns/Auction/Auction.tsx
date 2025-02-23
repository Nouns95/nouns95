'use client';

import { useQuery } from '@apollo/client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useBlock, useWriteContract } from 'wagmi';
import { CURRENT_AUCTION_QUERY, AUCTION_HISTORY_QUERY } from '../domain/graphql/queries/auction';
import { NOUNDERS_NOUNS_QUERY } from '../domain/graphql/queries/noun';
import type { Bid } from '../domain/types/graphql';
import { AuctionNounImage } from '.';
import { StaticNounImage } from './StaticNounImage';
import { CrystalBallNounImage } from './CrystalBallNounImage';
import { formatEther } from 'viem';
import { keccak256, encodePacked } from 'viem';
import styles from './Auction.module.css';
import { getTraitName } from './utils/trait-name-utils';
import { BidderInfo } from './BidderInfo';
import BidButton from './BidButton';
import { ImageData } from './utils/image-data';
import Image from 'next/image';

interface AuctionData {
  id: string;
  amount: string;
  startTime?: string;
  endTime: string;
  settled?: boolean;
  bids: Bid[];
  noun: {
    id: string;
    owner: {
      id: string;
    };
    seed: {
      background: string;
      body: string;
      accessory: string;
      head: string;
      glasses: string;
    };
  };
}

interface NounderNoun {
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

interface NounderQueryResponse {
  nouns: Array<NounderNoun>;
}

// Contract constants
const NOUNS_AUCTION_HOUSE_ABI = [{
  name: 'settleCurrentAndCreateNewAuction',
  type: 'function',
  stateMutability: 'nonpayable',
  inputs: [],
  outputs: [],
}] as const;

const NOUNS_AUCTION_HOUSE_ADDRESS = '0x830BD73E4184ceF73443C15111a1DF14e495C706';

// Base query options for consistent data fetching
const baseQueryOptions = {
  fetchPolicy: 'cache-and-network' as const,
  nextFetchPolicy: 'cache-first' as const
};

// Utility functions
function formatTimestamp(timestamp: string): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatCurrentDate(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatCountdown(secondsRemaining: number): string {
  if (secondsRemaining <= 0) return 'Ended';
  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = Math.floor(secondsRemaining % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
}

type TabType = 'Auction' | 'Crystal Ball';

// Custom hooks
function useViewingState(viewingNounId: string | null, currentAuctionId?: string) {
  return useMemo(() => {
    const isCurrentAuction = !viewingNounId;
    const isNounderNoun = viewingNounId && Number(viewingNounId) % 10 === 0;
    
    return {
      isCurrentAuction,
      isNounderNoun,
      nounId: isCurrentAuction ? currentAuctionId : viewingNounId
    };
  }, [viewingNounId, currentAuctionId]);
}

function useAuctionData(viewingState: ReturnType<typeof useViewingState>, activeTab: TabType) {
  const { isCurrentAuction, isNounderNoun, nounId } = viewingState;

  const currentAuctionQuery = useQuery<{ auctions: AuctionData[] }>(
    CURRENT_AUCTION_QUERY,
    {
      ...baseQueryOptions,
      pollInterval: (isCurrentAuction && activeTab === 'Auction') ? 5000 : 0
    }
  );

  const historicalQuery = useQuery<{ auctions: AuctionData[] }>(
    AUCTION_HISTORY_QUERY,
    {
      ...baseQueryOptions,
      skip: isCurrentAuction || isNounderNoun || !nounId,
      variables: { nounId }
    }
  );

  const nounderQuery = useQuery<NounderQueryResponse>(
    NOUNDERS_NOUNS_QUERY,
    {
      ...baseQueryOptions,
      skip: !isNounderNoun || !nounId,
      variables: { nounId }
    }
  );

  return useMemo(() => {
    const currentAuction = currentAuctionQuery.data?.auctions?.[0];
    const historicalAuction = historicalQuery.data?.auctions?.[0];
    const nounderNoun = nounderQuery.data?.nouns?.find((n: NounderNoun) => n.id === nounId);

    // Transform Nounder data to match auction structure if needed
    const transformedNounderNoun = nounderNoun ? {
      id: nounderNoun.id,
      amount: '0',
      endTime: '0',
      bids: [] as Bid[],
      noun: {
        id: nounderNoun.id,
        owner: { id: "0x2573C60a6D127755aA2DC85e342F7da2378a0Cc5" },
        seed: nounderNoun.seed
      }
    } : undefined;

    return {
      data: isCurrentAuction ? currentAuction 
          : isNounderNoun ? transformedNounderNoun
          : historicalAuction,
      loading: currentAuctionQuery.loading || historicalQuery.loading || nounderQuery.loading,
      currentAuctionId: currentAuction?.noun.id
    };
  }, [isCurrentAuction, isNounderNoun, nounId, currentAuctionQuery, historicalQuery, nounderQuery]);
}

export default function Auction() {
  const [activeTab, setActiveTab] = useState<TabType>('Auction');
  const [searchInput, setSearchInput] = useState('');
  const [viewingNounId, setViewingNounId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  
  const { data: block } = useBlock({
    watch: true,
  });

  const { writeContract, isPending } = useWriteContract();

  const viewingState = useViewingState(viewingNounId);
  const { data: auctionData, loading: isLoading, currentAuctionId } = useAuctionData(viewingState, activeTab);

  // Update countdown timer
  useEffect(() => {
    if (!auctionData?.endTime || activeTab !== 'Auction' || !viewingState.isCurrentAuction) return;
    
    const endTime = Number(auctionData.endTime);
    
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const secondsRemaining = endTime - now;
      setCountdown(formatCountdown(Math.max(0, secondsRemaining)));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [auctionData?.endTime, activeTab, viewingState.isCurrentAuction]);

  const handleSettle = useCallback(() => {
    writeContract({
      abi: NOUNS_AUCTION_HOUSE_ABI,
      address: NOUNS_AUCTION_HOUSE_ADDRESS,
      functionName: 'settleCurrentAndCreateNewAuction',
    });
  }, [writeContract]);

  const handlePreviousNoun = useCallback(() => {
    const currentId = viewingNounId || currentAuctionId;
    const prevId = String(Math.max(1, Number(currentId) - 1));
    setViewingNounId(prevId === currentAuctionId ? null : prevId);
  }, [viewingNounId, currentAuctionId]);

  const handleNextNoun = useCallback(() => {
    if (!viewingNounId || !currentAuctionId) return;
    const nextId = String(Math.min(Number(currentAuctionId), Number(viewingNounId) + 1));
    setViewingNounId(nextId === currentAuctionId ? null : nextId);
  }, [viewingNounId, currentAuctionId]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const searchId = Number(searchInput);
    if (isNaN(searchId) || searchId < 1 || !currentAuctionId || searchId > Number(currentAuctionId)) {
      return;
    }
    setViewingNounId(searchId === Number(currentAuctionId) ? null : String(searchId));
    setSearchInput('');
  }, [searchInput, currentAuctionId]);

  const handleCurrentAuction = useCallback(() => {
    setViewingNounId(null);
  }, []);

  const currentBid = auctionData?.amount ? formatEther(BigInt(auctionData.amount)) : '0';

  const renderCrystalBall = () => {
    if (!auctionData || !block?.hash) return null;
    
    const currentId = Number(auctionData.noun.id);
    const endsIn9 = currentId % 10 === 9;
    const nextNounIds = endsIn9 
      ? [String(currentId + 1), String(currentId + 2)] // Show both next nouns when current ends in 9
      : [String(currentId + 1)]; // Otherwise just show next noun
    
    return (
      <div className={styles['crystal-ball-container']}>
        <button 
          className={styles['settle-button']}
          onClick={handleSettle}
          disabled={isPending}
        >
          {isPending ? 'Settling...' : 'Settle Noun'}
        </button>
        {nextNounIds.map((nextNounId) => {
          // Generate the seed using the same logic as CrystalBallNounImage
          const encodedData = encodePacked(
            ['bytes32', 'uint256'],
            [block.hash as `0x${string}`, BigInt(nextNounId)]
          );
          const pseudorandomness = keccak256(encodedData);
          
          // Get pseudorandom parts using the same shifts as in CrystalBallNounImage
          const getPseudorandomPart = (shiftAmount: number, partCount: number): number => {
            const bn = BigInt(pseudorandomness);
            const shifted = bn >> BigInt(shiftAmount);
            const mask = (BigInt(1) << BigInt(48)) - BigInt(1);
            const masked = shifted & mask;
            return Number(masked % BigInt(partCount));
          };

          const seed = {
            background: getPseudorandomPart(0, ImageData.bgcolors.length),
            body: getPseudorandomPart(48, ImageData.images.bodies.length),
            accessory: getPseudorandomPart(96, ImageData.images.accessories.length),
            head: getPseudorandomPart(144, ImageData.images.heads.length),
            glasses: getPseudorandomPart(192, ImageData.images.glasses.length),
          };
          
          return (
            <div key={nextNounId} className={styles['crystal-ball-image']}>
              <CrystalBallNounImage 
                nounId={nextNounId} 
                width={320}
                height={320}
                className={styles['noun-image']}
              />
              <div className={styles['crystal-ball-traits']}>
                <div className={styles['trait-item']}>
                  <span className={styles['trait-label']}>Noun #</span>
                  <span className={styles['trait-value']}>
                    {nextNounId}
                  </span>
                </div>
                <div className={styles['trait-item']}>
                  <span className={styles['trait-label']}>Head</span>
                  <span className={styles['trait-value']}>
                    {getTraitName('head', seed.head)}
                  </span>
                </div>
                <div className={styles['trait-item']}>
                  <span className={styles['trait-label']}>Glasses</span>
                  <span className={styles['trait-value']}>
                    {getTraitName('glasses', seed.glasses)}
                  </span>
                </div>
                <div className={styles['trait-item']}>
                  <span className={styles['trait-label']}>Accessory</span>
                  <span className={styles['trait-value']}>
                    {getTraitName('accessory', seed.accessory)}
                  </span>
                </div>
                <div className={styles['trait-item']}>
                  <span className={styles['trait-label']}>Body</span>
                  <span className={styles['trait-value']}>
                    {getTraitName('body', seed.body)}
                  </span>
                </div>
                <div className={styles['trait-item']}>
                  <span className={styles['trait-label']}>Background</span>
                  <span className={styles['trait-value']}>
                    {getTraitName('background', seed.background)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Auction':
        return (
          <div className={styles['auction-container']}>
            <div className={styles['auction-image']}>
              {isLoading ? (
                <Image
                  src="/icons/apps/auction/loading.gif"
                  alt="Loading..."
                  width={320}
                  height={320}
                  className={styles['noun-image']}
                  unoptimized
                />
              ) : viewingNounId ? (
                <StaticNounImage 
                  nounId={viewingNounId} 
                  width={320} 
                  height={320}
                  className={styles['noun-image']}
                  skipLoading={true}
                />
              ) : (
                <AuctionNounImage 
                  width={320} 
                  height={320}
                  className={styles['noun-image']}
                  skipLoading={true}
                />
              )}
              <div className={styles['noun-traits']}>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className={styles['trait-item']}>
                      <span className={styles['trait-label']}>{['Head', 'Glasses', 'Accessory', 'Body', 'Background'][i]}</span>
                      <span className={styles['trait-value']}>Loading...</span>
                    </div>
                  ))
                ) : viewingState.isNounderNoun && auctionData?.noun?.seed ? (
                  <>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Head</span>
                      <span className={styles['trait-value']}>{getTraitName('head', Number(auctionData.noun.seed.head))}</span>
                    </div>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Glasses</span>
                      <span className={styles['trait-value']}>{getTraitName('glasses', Number(auctionData.noun.seed.glasses))}</span>
                    </div>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Accessory</span>
                      <span className={styles['trait-value']}>{getTraitName('accessory', Number(auctionData.noun.seed.accessory))}</span>
                    </div>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Body</span>
                      <span className={styles['trait-value']}>{getTraitName('body', Number(auctionData.noun.seed.body))}</span>
                    </div>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Background</span>
                      <span className={styles['trait-value']}>{getTraitName('background', Number(auctionData.noun.seed.background))}</span>
                    </div>
                  </>
                ) : auctionData?.noun?.seed ? (
                  <>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Head</span>
                      <span className={styles['trait-value']}>{getTraitName('head', Number(auctionData.noun.seed.head))}</span>
                    </div>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Glasses</span>
                      <span className={styles['trait-value']}>{getTraitName('glasses', Number(auctionData.noun.seed.glasses))}</span>
                    </div>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Accessory</span>
                      <span className={styles['trait-value']}>{getTraitName('accessory', Number(auctionData.noun.seed.accessory))}</span>
                    </div>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Body</span>
                      <span className={styles['trait-value']}>{getTraitName('body', Number(auctionData.noun.seed.body))}</span>
                    </div>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Background</span>
                      <span className={styles['trait-value']}>{getTraitName('background', Number(auctionData.noun.seed.background))}</span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            <div className={styles['auction-details']}>
              <div className={styles['auction-nav']}>
                <button 
                  className={`${styles['nav-button']} ${viewingNounId === '1' ? styles.disabled : ''}`}
                  onClick={handlePreviousNoun}
                  disabled={viewingNounId === '1'}
                >
                  ←
                </button>
                <span className={styles.date}>{formatCurrentDate()}</span>
                <button 
                  className={`${styles['nav-button']} ${!viewingNounId ? styles.disabled : ''}`}
                  onClick={handleNextNoun}
                  disabled={!viewingNounId}
                >
                  →
                </button>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                  <input 
                    type="text" 
                    placeholder="Search an ID"
                    className={styles['search-input']}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </form>
                <button 
                  className={`${styles['current-button']} ${!viewingNounId ? styles.disabled : ''}`}
                  onClick={handleCurrentAuction}
                  disabled={!viewingNounId}
                >
                  Current Auction
                </button>
              </div>

              <h1 className={styles['noun-title']}>
                {isLoading ? 'Loading...' : (
                  <>
                    {viewingState.isNounderNoun ? 
                      `Noun ${viewingState.nounId}` : 
                      `Noun ${auctionData?.noun.id || ''}`}
                    {viewingNounId && !viewingState.isNounderNoun && auctionData?.endTime && (
                      <span className={styles['end-date']}>
                        <span className={styles['end-date-header']}>Auction Ended</span>
                        {formatTimestamp(auctionData.endTime)}
                      </span>
                    )}
                  </>
                )}
              </h1>

              <div className={styles['auction-status']}>
                <div className={styles['status-item']}>
                  <div className={styles.label}>
                    {viewingState.isNounderNoun ? 'Status' : (viewingNounId ? 'Winning Bid' : 'Current Bid')}
                  </div>
                  <div className={styles.value}>
                    {isLoading ? '\u00A0' : (viewingState.isNounderNoun ? 'Not Auctioned' : `Ξ ${currentBid}`)}
                  </div>
                </div>
                {!viewingNounId ? (
                  <div className={styles['status-item']}>
                    <div className={styles.label}>
                      Auction ends in
                    </div>
                    <div className={styles.value}>
                      {isLoading ? '\u00A0' : countdown}
                    </div>
                  </div>
                ) : (
                  <div className={styles['status-item']}>
                    <div className={styles.label}>
                      Owner
                    </div>
                    <div className={styles.value}>
                      {isLoading ? '\u00A0' : (
                        <BidderInfo 
                          address={
                            viewingState.isNounderNoun 
                              ? "0x2573C60a6D127755aA2DC85e342F7da2378a0Cc5"
                              : auctionData?.noun?.owner?.id || ''
                          } 
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!viewingNounId && (
                <BidButton />
              )}

              <div className={styles['bid-history']}>
                <h2>Bid History</h2>
                <div className={styles['bids-list']}>
                  {isLoading ? (
                    <div className={styles['bid-item']}>
                      <div className={styles['bidder-info']}>
                        <div className={styles['bidder-pfp']}></div>
                        <div></div>
                      </div>
                      <div className={styles['bid-details']}>
                        <div></div>
                        <button className={styles['view-tx']} disabled>↗</button>
                      </div>
                    </div>
                  ) : viewingState.isNounderNoun ? (
                    <div className={styles['bid-item']}>
                      <BidderInfo address="0x2573C60a6D127755aA2DC85e342F7da2378a0Cc5" />
                      <div className={styles['bid-details']}>
                        <div>nounders.eth</div>
                        <a 
                          href="https://etherscan.io/address/0x2573C60a6D127755aA2DC85e342F7da2378a0Cc5"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles['view-tx']}
                        >
                          ↗
                        </a>
                      </div>
                    </div>
                  ) : auctionData?.bids.length === 0 ? (
                    <p>No bids yet</p>
                  ) : (
                    auctionData?.bids.map((bid: Bid) => (
                      <div key={bid.id} className={styles['bid-item']}>
                        <BidderInfo address={bid.bidder.id} />
                        <div className={styles['bid-details']}>
                          <div>Ξ {formatEther(BigInt(bid.amount))}</div>
                          <a 
                            href={`https://etherscan.io/address/${bid.bidder.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles['view-tx']}
                          >
                            ↗
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'Crystal Ball':
        return renderCrystalBall();
    }
  };

  return (
    <div className={styles['nouns-auction']}>
      <div className={styles['auction-tabs']}>
        <div className={styles['auction-tab-buttons']}>
          <button 
            className={`${styles['auction-tab-button']} ${activeTab === 'Auction' ? styles.active : ''}`}
            onClick={() => setActiveTab('Auction')}
          >
            Auction
          </button>
          <button 
            className={`${styles['auction-tab-button']} ${activeTab === 'Crystal Ball' ? styles.active : ''}`}
            onClick={() => setActiveTab('Crystal Ball')}
          >
            Crystal Ball
          </button>
        </div>
        <div className={styles['auction-tab-panel']}>
          <div className={styles['auction-tab-content']}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
} 