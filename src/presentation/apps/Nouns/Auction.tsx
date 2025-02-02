'use client';

import { useQuery } from '@apollo/client';
import { useState, useEffect } from 'react';
import { CURRENT_AUCTION_QUERY, AUCTION_HISTORY_QUERY } from '../../../domain/nouns/graphql/queries/auction';
import { NOUNDERS_NOUNS_QUERY } from '../../../domain/nouns/graphql/queries/noun';
import type { AuctionsQueryResponse, Bid, Noun } from '../../../domain/nouns/types/graphql';
import { NounImage } from './AuctionNounImage';
import { StaticNounImage } from './StaticNounImage';
import { formatEther } from 'viem';
import styles from './Auction.module.css';
import { getTraitName } from './utils/trait-name-utils';
import { BidderInfo } from './BidderInfo';
import BidButton from './BidButton';

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

function LoadingSkeleton() {
  return (
    <div className={styles['loading-skeleton']}>
      <div className={styles['skeleton-image']}></div>
      <div className={styles['skeleton-traits']}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className={styles['skeleton-trait']}></div>
        ))}
      </div>
    </div>
  );
}

export default function Auction() {
  const [activeTab, setActiveTab] = useState<TabType>('Auction');
  const [searchInput, setSearchInput] = useState('');
  const [viewingNounId, setViewingNounId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  // Query for current auction
  const { data: currentAuctionData, loading: currentLoading } = useQuery<AuctionsQueryResponse>(
    CURRENT_AUCTION_QUERY,
    {
      pollInterval: viewingNounId ? undefined : 5000, // Only poll when viewing current auction
      fetchPolicy: 'cache-and-network'
    }
  );

  // Query for historical auction when viewing a specific Noun
  const { data: historicalData, loading: historicalLoading } = useQuery<AuctionsQueryResponse>(
    AUCTION_HISTORY_QUERY,
    {
      variables: {
        nounId: viewingNounId || ''
      },
      skip: !viewingNounId || !currentAuctionData || Number(viewingNounId) % 10 === 0, // Skip if viewing current auction, no data, or Nounder Noun
      fetchPolicy: 'network-only' // Change to network-only to match Nounder Nouns speed
    }
  );

  // Query for Nounders Nouns
  const { data: noundersData, loading: noundersLoading } = useQuery(NOUNDERS_NOUNS_QUERY, {
    fetchPolicy: 'cache-first' // Use cache-first to make it fast
  });

  // Update countdown in real-time
  useEffect(() => {
    if (!currentAuctionData?.auctions?.[0]) return;
    
    const auction = currentAuctionData.auctions[0];
    const endTime = Number(auction.endTime);
    
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const secondsRemaining = endTime - now;
      setCountdown(formatCountdown(Math.max(0, secondsRemaining)));
    };

    // Update immediately and then every second
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [currentAuctionData?.auctions]);

  if (currentLoading && !currentAuctionData?.auctions?.[0]) return <LoadingSkeleton />;
  if (!currentAuctionData?.auctions?.[0]) return <div className="p-4">No active auction</div>;

  const currentAuction = currentAuctionData.auctions[0];
  const currentNounId = currentAuction.noun.id;
  
  // Get the auction data we should display
  const historicalAuction = historicalData?.auctions?.[0];
  const isNounderNoun = viewingNounId && Number(viewingNounId) % 10 === 0;
  const nounderNoun = isNounderNoun && noundersData?.nouns ? 
    noundersData.nouns.find((noun: Noun) => Number(noun.id) === Number(viewingNounId)) : 
    null;
  
  // Debug logging
  console.log('Nounder Noun Debug:', {
    viewingNounId,
    isNounderNoun,
    nounderNounFound: !!nounderNoun,
    nounderNounId: nounderNoun?.id,
    nounderNounSeed: nounderNoun?.seed,
    noundersDataLoaded: !!noundersData?.nouns,
    noundersLoading,
    totalNounderNouns: noundersData?.nouns?.length
  });
  
  // Only show loading state when we're actually loading data
  const isLoading = viewingNounId ? 
    (isNounderNoun ? noundersLoading : historicalLoading) : 
    false;
  const auction = isLoading ? null : (!isNounderNoun && viewingNounId && historicalAuction) ? historicalAuction : currentAuction;
  const bids = (auction?.bids as Bid[]) || [];
  const currentBid = auction?.amount ? formatEther(BigInt(auction.amount)) : '0';

  const handlePreviousNoun = () => {
    const currentId = viewingNounId || currentNounId;
    const prevId = String(Math.max(1, Number(currentId) - 1));
    setViewingNounId(prevId === currentNounId ? null : prevId);
  };

  const handleNextNoun = () => {
    if (!viewingNounId) return; // Already at current auction
    const nextId = String(Math.min(Number(currentNounId), Number(viewingNounId) + 1));
    setViewingNounId(nextId === currentNounId ? null : nextId);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchId = Number(searchInput);
    if (isNaN(searchId) || searchId < 1 || searchId > Number(currentNounId)) {
      return; // Invalid ID
    }
    setViewingNounId(searchId === Number(currentNounId) ? null : String(searchId));
    setSearchInput('');
  };

  const handleCurrentAuction = () => {
    setViewingNounId(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Auction':
        return (
          <div className={styles['auction-container']}>
            <div className={styles['auction-image']}>
              {isLoading ? (
                <div 
                  style={{ 
                    width: 320, 
                    height: 320, 
                    background: '#c0c0c0',
                    border: '2px solid',
                    borderColor: '#808080 #ffffff #ffffff #808080'
                  }} 
                />
              ) : viewingNounId ? (
                <StaticNounImage nounId={viewingNounId} width={320} height={320} />
              ) : (
                <NounImage width={320} height={320} />
              )}
              <div className={styles['noun-traits']}>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className={styles['trait-item']}>
                      <span className={styles['trait-label']}>{['Head', 'Glasses', 'Accessory', 'Body', 'Background'][i]}</span>
                      <span className={styles['trait-value']}>Loading...</span>
                    </div>
                  ))
                ) : isNounderNoun && nounderNoun?.seed ? (
                  <>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Head</span>
                      <span className={styles['trait-value']}>{getTraitName('head', Number(nounderNoun.seed.head))}</span>
                    </div>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Glasses</span>
                      <span className={styles['trait-value']}>{getTraitName('glasses', Number(nounderNoun.seed.glasses))}</span>
                    </div>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Accessory</span>
                      <span className={styles['trait-value']}>{getTraitName('accessory', Number(nounderNoun.seed.accessory))}</span>
                    </div>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Body</span>
                      <span className={styles['trait-value']}>{getTraitName('body', Number(nounderNoun.seed.body))}</span>
                    </div>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Background</span>
                      <span className={styles['trait-value']}>{getTraitName('background', Number(nounderNoun.seed.background))}</span>
                    </div>
                  </>
                ) : auction?.noun?.seed ? (
                  <>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Head</span>
                      <span className={styles['trait-value']}>{getTraitName('head', Number(auction.noun.seed.head))}</span>
                    </div>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Glasses</span>
                      <span className={styles['trait-value']}>{getTraitName('glasses', Number(auction.noun.seed.glasses))}</span>
                    </div>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Accessory</span>
                      <span className={styles['trait-value']}>{getTraitName('accessory', Number(auction.noun.seed.accessory))}</span>
                    </div>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Body</span>
                      <span className={styles['trait-value']}>{getTraitName('body', Number(auction.noun.seed.body))}</span>
                    </div>
                    <div className={styles['trait-item']}>
                      <span className={styles['trait-label']}>Background</span>
                      <span className={styles['trait-value']}>{getTraitName('background', Number(auction.noun.seed.background))}</span>
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
                    {isNounderNoun ? 
                      `Noun ${nounderNoun?.id || viewingNounId}` : 
                      `Noun ${auction?.noun.id || ''}`}
                    {viewingNounId && !isNounderNoun && auction?.endTime && (
                      <span className={styles['end-date']}>
                        <span className={styles['end-date-header']}>Auction Ended</span>
                        {formatTimestamp(auction.endTime)}
                      </span>
                    )}
                  </>
                )}
              </h1>

              <div className={styles['auction-status']}>
                <div className={styles['status-item']}>
                  <div className={styles.label}>
                    {isNounderNoun ? 'Status' : (viewingNounId ? 'Winning Bid' : 'Current Bid')}
                  </div>
                  <div className={styles.value}>
                    {isLoading ? '\u00A0' : (isNounderNoun ? 'Not Auctioned' : `Ξ ${currentBid}`)}
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
                            isNounderNoun 
                              ? "0x2573C60a6D127755aA2DC85e342F7da2378a0Cc5"
                              : auction?.noun?.owner?.id || ''
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
                  ) : isNounderNoun ? (
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
                  ) : bids.length === 0 ? (
                    <p>No bids yet</p>
                  ) : (
                    bids.map((bid: Bid) => (
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
        return (
          <div className={styles['win95-window']}>
            <div className={styles['win95-window-title']}>Crystal Ball</div>
            <div className={styles['win95-window-content']}>
              <p>Coming soon...</p>
            </div>
          </div>
        );
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