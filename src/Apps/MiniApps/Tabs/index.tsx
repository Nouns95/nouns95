"use client";

import React, { useState } from 'react';
import styles from './Tabs.module.css';

type Network = 'mainnet' | 'sepolia' | 'l2';

const Tabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Network>('mainnet');

  const mainnetContracts = [
    {
      name: "Treasury [Executor/Timelock]",
      address: "0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71"
    },
    {
      name: "DAO Governor [Proposing/Voting]",
      address: "0x6f3E6272A167e8AcCb32072d08E0957F9c79223d"
    },
    {
      name: "Token Buyer [ETH → USDC]",
      address: "0x4f2acdc74f6941390d9b1804fabc3e780388cfe5"
    },
    {
      name: "Payer [USDC Payments]",
      address: "0xd97Bcd9f47cEe35c0a9ec1dc40C1269afc9E8E1D"
    },
    {
      name: "Auction House Proxy",
      address: "0x830BD73E4184ceF73443C15111a1DF14e495C706"
    },
    {
      name: "Nouns Token [Delegations]",
      address: "0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03"
    },
    {
      name: "Descriptor [Traits/Artwork, v3]",
      address: "0x33a9c445fb4fb21f2c030a6b2d3e2f12d017bfac"
    },
    {
      name: "Data Proxy [Candidates/Feedback]",
      address: "0xf790A5f59678dd733fb3De93493A91f472ca1365"
    },
    {
      name: "Stream Factory",
      address: "0x0fd206FC7A7dBcD5661157eDCb1FFDD0D02A61ff"
    },
    {
      name: "Treasury V1",
      address: "0x0BC3807Ec262cB779b38D65b38158acC3bfedE10"
    },
    {
      name: "Fork Escrow",
      address: "0x44d97D22B3d37d837cE4b22773aAd9d1566055D9"
    },
    {
      name: "Fork DAO Deployer",
      address: "0xcD65e61f70e0b1Aa433ca1d9A6FC2332e9e73cE3"
    },
    {
      name: "Client Rewards Proxy",
      address: "0x883860178F95d0C82413eDc1D6De530cB4771d55"
    }
  ];

  const sepoliaContracts = [
    {
      name: "DAO Governor",
      address: "0x35d2670d7C8931AACdd37C89Ddcb0638c3c44A57"
    },
    {
      name: "Auction House",
      address: "0x488609b7113fcf3b761a05956300d605e8f6bcaf"
    },
    {
      name: "Token",
      address: "0x4c4674bb72a096855496a7204962297bd7e12b85"
    },
    {
      name: "Treasury",
      address: "0x07e5D6a1550aD5E597A9b0698A474AA080A2fB28"
    },
    {
      name: "Data Proxy",
      address: "0x9040f720AA8A693F950B9cF94764b4b06079D002"
    },
    {
      name: "Descriptor v3",
      address: "0x79E04ebCDf1ac2661697B23844149b43acc002d5"
    }
  ];

  const l2Contracts = [
    {
      name: "Noun's L2 Alias [OP Stack]",
      address: "0xc2B42Fc9F9D8B2Cf86C068CaE131088095480082",
      chains: [
        { name: "base", url: "https://basescan.org/address/" },
        { name: "zora", url: "https://explorer.zora.energy/address/" },
        { name: "op", url: "https://optimistic.etherscan.io/address/" }
      ]
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'mainnet':
        return (
          <div className={styles.contractsList}>
            {mainnetContracts.map((contract, index) => (
              <div key={index} className={styles.contractItem}>
                <div className={styles.contractHeader}>
                  <span className={styles.contractName}>{contract.name}:</span>
                  <a 
                    href={`https://etherscan.io/address/${contract.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.etherscanLink}
                  >
                    etherscan ↗
                  </a>
                </div>
                <div className={styles.contractAddress}>
                  ↳ {contract.address}
                </div>
              </div>
            ))}
          </div>
        );
      case 'sepolia':
        return (
          <div className={styles.contractsList}>
            {sepoliaContracts.map((contract, index) => (
              <div key={index} className={styles.contractItem}>
                <div className={styles.contractHeader}>
                  <span className={styles.contractName}>{contract.name}:</span>
                  <a 
                    href={`https://sepolia.etherscan.io/address/${contract.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.etherscanLink}
                  >
                    etherscan ↗
                  </a>
                </div>
                <div className={styles.contractAddress}>
                  ↳ {contract.address}
                </div>
              </div>
            ))}
          </div>
        );
      case 'l2':
        return (
          <div className={styles.contractsList}>
            {l2Contracts.map((contract, index) => (
              <div key={index} className={styles.contractItem}>
                <div className={styles.contractHeader}>
                  <span className={styles.contractName}>{contract.name}:</span>
                  <div className={styles.chainLinks}>
                    {contract.chains.map((chain, chainIndex) => (
                      <span key={chainIndex}>
                        <a 
                          href={`${chain.url}${contract.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.etherscanLink}
                        >
                          {chain.name} ↗
                        </a>
                        {chainIndex < contract.chains.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.contractAddress}>
                  ↳ {contract.address}
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabsMain}>
        <div className={styles.content}>
          <div className={styles.tabsArea}>
            <div className={styles.tabs}>
              {(['mainnet', 'sepolia', 'l2'] as Network[]).map((tab) => (
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
    </div>
  );
};

export default Tabs;


