'use client'

import React, { useEffect } from 'react'
import { useAppKit } from '@reown/appkit/react'
import { useAppKitNetwork } from '@reown/appkit/react'
import { useAppKitState } from '@reown/appkit/react'
import './WalletApp.styles.css'

export default function ConnectEth() {
  const { open, close } = useAppKit()
  const { chainId } = useAppKitNetwork()
  const { selectedNetworkId } = useAppKitState()

  // Effect to handle network changes
  useEffect(() => {
    if (selectedNetworkId && !chainId) {
      close()
    }
  }, [selectedNetworkId, chainId, close])

  return (
    <div className="wallet-app win95-window">
      <div className="connect-view">
        <div className="connect-buttons">
          <button onClick={() => open()} className="win95-btn">
            Connect Wallet
          </button>
          <button onClick={() => open({ view: 'Networks' })} className="win95-btn">
            Select Network
          </button>
          <button onClick={() => open({ view: 'WhatIsANetwork' })} className="win95-btn">
            What is Blockchain?
          </button>
        </div>
      </div>
    </div>
  )
}
