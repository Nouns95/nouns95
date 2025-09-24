'use client'

import React, { useEffect } from 'react'
import { useAppKit } from '@reown/appkit/react'
import { useAppKitNetwork } from '@reown/appkit/react'
import { useAppKitState } from '@reown/appkit/react'
import styles from '../WalletApp.module.css'

export default function ConnectWallet() {
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
    <div className={styles.walletApp}>
      <div className={styles.walletContent}>
        <div className={styles.connectView}>
          <div className={styles.connectButtons}>
            <button onClick={() => open()} className="win95-btn">
              Connect Wallet
            </button>
            <button onClick={() => open({ view: 'Networks' })} className="win95-btn">
              Select Network
            </button>
            <button onClick={() => open({ view: 'WhatIsAWallet' })} className="win95-btn">
              What is a Wallet?
            </button>
            <button onClick={() => open({ view: 'WhatIsANetwork' })} className="win95-btn">
              What is a Network?
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}