"use client";

import React, { useState } from 'react'
import Image from 'next/image'
import { useAppKit } from '@reown/appkit/react'
import { useAppKitAccount } from '@reown/appkit/react'
import { useAppKitNetwork } from '@reown/appkit/react'
import { useAppKitState } from '@reown/appkit/react'
import { useWalletInfo } from '@reown/appkit/react'
import { useDisconnect } from '@reown/appkit/react'
import ConnectWallet from './components/ConnectWallet'
import { AddressDisplay } from './components/AddressDisplay';
import { NetworkDisplay } from './components/NetworkDisplay';
import { useEnsResolution } from './utils/useEnsResolution';
import styles from './WalletApp.module.css'


type TabType = 'Account' | 'Network' | 'SendSwap'

const getNetworkType = (networkId?: string): 'ethereum' | 'base' | 'solana' | 'bitcoin' => {
  if (!networkId) return 'ethereum';
  if (networkId.startsWith('eip155:1')) return 'ethereum';
  if (networkId.startsWith('eip155:8453')) return 'base';
  if (networkId.startsWith('solana:')) return 'solana';
  if (networkId.startsWith('bip122:')) return 'bitcoin';
  return 'ethereum'; // Default to ethereum
};

export default function WalletApp() {
  const { isConnected, address } = useAppKitAccount()
  const { chainId } = useAppKitNetwork()
  const { selectedNetworkId } = useAppKitState()
  const { walletInfo } = useWalletInfo()
  const { disconnect } = useDisconnect()
  const { open } = useAppKit()
  const [activeTab, setActiveTab] = useState<TabType>('Account')
  const { ensName, ensAvatar } = useEnsResolution(address)

  // Set up wallet event listeners - using useEffect for proper lifecycle
  React.useEffect(() => {
    // Wallet app initialized
  }, [isConnected, address, chainId])

  if (!isConnected) {
    return <ConnectWallet />
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Account':
        return (
          <div className={`${styles.tabContent} ${styles.walletTabBg}`}>
            <div className={styles.walletProfileInTab}>
              <AddressDisplay 
                address={address} 
                network={getNetworkType(selectedNetworkId)}
                ensName={ensName}
                ensAvatar={ensAvatar}
              />
              <div className={`${styles.walletActions} ${styles.noBorder}`}>
                <button onClick={() => open({ view: 'Account' })} className="win95-btn">
                  View Details
                </button>
              </div>
            </div>
          </div>
        )
      case 'Network':
        return (
          <div className={`${styles.tabContent} ${styles.walletTabBg}`}>
            <div className={styles.walletProfileInTab}>
              <NetworkDisplay 
                chainId={typeof chainId === 'number' ? chainId : undefined} 
                networkId={selectedNetworkId}
              />
            </div>
          </div>
        )
      case 'SendSwap':
        return (
          <div className={`${styles.tabContent} ${styles.walletTabBg}`}>
            <div className={styles.walletProfileInTab}>
              <div className={styles.sendInterface}>
                <div className={styles.walletInfoDisplay}>
                  <div className={styles.walletInfoLabel}>Connected Wallet:</div>
                  <div className={styles.walletInfoValue}>
                    {walletInfo?.name || 'Unknown Wallet'}
                  </div>
                  {walletInfo?.icon && (
                    <div className={styles.walletIconDisplay}>
                      <Image src={walletInfo.icon} alt={walletInfo.name} width={48} height={48} />
                    </div>
                  )}
                </div>
                <div className={`${styles.walletActions} ${styles.noBorder}`}>
                  <button onClick={() => open({ view: 'WalletSend' })} className="win95-btn">
                    Send Tokens
                  </button>
                  <button onClick={() => open({ view: 'Swap' })} className="win95-btn">
                    Swap Tokens
                  </button>
                  <button onClick={() => open({ view: 'OnRampProviders' })} className={`win95-btn ${styles.fullWidthBtn}`}>
                    Buy with Fiat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className={styles.walletApp}>
      <div className={styles.walletContent}>
        <div className={styles.win95Tabs}>
          <div className={styles.tabButtons}>
            <button 
              className={`${styles.tabButton} ${activeTab === 'Account' ? styles.active : ''}`}
              onClick={() => setActiveTab('Account')}
            >
              Account
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'Network' ? styles.active : ''}`}
              onClick={() => setActiveTab('Network')}
            >
              Network
            </button>
          </div>
          <div className={styles.tabButtonsSecondRow}>
            <button 
              className={`${styles.tabButton} ${styles.tabButtonWide} ${activeTab === 'SendSwap' ? styles.active : ''}`}
              onClick={() => setActiveTab('SendSwap')}
            >
              Send / Swap / Buy
            </button>
          </div>
          <div className={styles.tabPanel}>
            {renderTabContent()}
          </div>
        </div>
      </div>
      <div className={styles.walletActions}>
        <button onClick={() => disconnect()} className="win95-btn">
          Disconnect
        </button>
      </div>
    </div>
  )
} 