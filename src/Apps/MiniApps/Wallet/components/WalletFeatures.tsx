'use client'

import React from 'react'
import { useAppKit } from '@reown/appkit/react'
import { useAppKitAccount } from '@reown/appkit/react'
import { useAppKitState } from '@reown/appkit/react'
import { useWalletInfo } from '@reown/appkit/react'

interface WalletFeaturesProps {
  onFeatureSelect?: (feature: string) => void
}

export function WalletFeatures({ onFeatureSelect }: WalletFeaturesProps) {
  const { open } = useAppKit()
  const { isConnected, address } = useAppKitAccount()
  const { selectedNetworkId } = useAppKitState()
  const { walletInfo } = useWalletInfo()

  if (!isConnected) {
    return (
      <div className="wallet-features">
        <div className="feature-item">
          <button onClick={() => open()} className="win95-btn feature-btn">
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  const features = [
    {
      title: 'Send Tokens',
      description: 'Send cryptocurrency to another address',
      action: () => open({ view: 'WalletSend' })
    },
    {
      title: 'Swap Tokens',
      description: 'Exchange one token for another',
      action: () => open({ view: 'Swap' })
    },
    {
      title: 'Buy Crypto',
      description: 'Purchase crypto with fiat currency',
      action: () => open({ view: 'OnRampProviders' })
    },
    {
      title: 'Switch Network',
      description: 'Change blockchain network',
      action: () => open({ view: 'Networks' })
    },
    {
      title: 'All Wallets',
      description: 'View all available wallets',
      action: () => open({ view: 'AllWallets' })
    },
    {
      title: 'Account Details',
      description: 'View your account information',
      action: () => open({ view: 'Account' })
    },
    {
      title: 'Swap with Params',
      description: 'Open swap with preset tokens',
      action: () => open({ 
        view: 'Swap',
        arguments: {
          amount: '1.0',
          fromToken: 'ETH',
          toToken: 'USDC'
        }
      })
    }
  ]

  return (
    <div className="wallet-features">
      <div className="wallet-status">
        <div className="status-item">
          <span className="status-label">Wallet:</span>
          <span className="status-value">{walletInfo?.name || 'Connected'}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Address:</span>
          <span className="status-value address-short">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Network:</span>
          <span className="status-value">
            {selectedNetworkId?.includes('eip155:1') ? 'Ethereum' :
             selectedNetworkId?.includes('eip155:8453') ? 'Base' :
             selectedNetworkId?.includes('solana') ? 'Solana' :
             selectedNetworkId?.includes('bip122') ? 'Bitcoin' : 'Unknown'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Status:</span>
          <span className="status-value">Connected</span>
        </div>
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-item">
            <button 
              onClick={() => {
                feature.action()
                onFeatureSelect?.(feature.title)
              }}
              className="win95-btn feature-btn"
            >
              <div className="feature-content">
                <div className="feature-title">{feature.title}</div>
                <div className="feature-description">{feature.description}</div>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
