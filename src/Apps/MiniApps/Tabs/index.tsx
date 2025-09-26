"use client";

import React, { useState } from 'react';
import styles from './Tabs.module.css';

type Network = 'mainnet' | 'sepolia' | 'l2' | 'metagov' | 'nouns';

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

  const metagovOrganizations = [
    {
      name: "Nouncil",
      address: "0xcC2688350d29623E2A0844Cc8885F9050F0f6Ed5",
      links: [
        { name: "camp", url: "https://www.nouns.camp/voters/0xcC2688350d29623E2A0844Cc8885F9050F0f6Ed5" },
        { name: "safe", url: "https://app.safe.global/home?safe=eth:0xcC2688350d29623E2A0844Cc8885F9050F0f6Ed5" }
      ]
    },
    {
      name: "League of Lils",
      address: "0xDCb4117e3A00632efCaC3C169E0B23959f555E5e",
      links: [
        { name: "camp", url: "https://www.nouns.camp/voters/0xDCb4117e3A00632efCaC3C169E0B23959f555E5e" },
        { name: "safe", url: "https://app.safe.global/home?safe=eth:0xDCb4117e3A00632efCaC3C169E0B23959f555E5e" }
      ]
    },
    {
      name: "Zero Weight",
      address: "0x0a049e014999A489b3D7174B8f70D4200b0Ce79B",
      links: [
        { name: "camp", url: "https://www.nouns.camp/voters/0x0a049e014999A489b3D7174B8f70D4200b0Ce79B" }
      ]
    },
    {
      name: "Bonfire Guild",
      address: "0x43fA3b63A91E5979BFB096ed19Cc2Fe24Bd71cea",
      links: [
        { name: "camp", url: "https://www.nouns.camp/voters/0x43fA3b63A91E5979BFB096ed19Cc2Fe24Bd71cea" },
        { name: "safe", url: "https://app.safe.global/home?safe=eth:0x43fA3b63A91E5979BFB096ed19Cc2Fe24Bd71cea" }
      ]
    },
    {
      name: "Nounders",
      address: "0x86030dbbCe1c771Ff6622C20455cd3619aa93c05",
      links: [
        { name: "camp", url: "https://www.nouns.camp/voters/0x86030dbbCe1c771Ff6622C20455cd3619aa93c05" },
        { name: "safe", url: "https://app.safe.global/home?safe=eth:0x86030dbbCe1c771Ff6622C20455cd3619aa93c05" }
      ]
    },
    {
      name: "Shark DAO",
      address: "0x16C88a1f5580d5a6dAE0F7701E0b7C1341B8BFA6",
      links: [
        { name: "camp", url: "https://www.nouns.camp/voters/0x16C88a1f5580d5a6dAE0F7701E0b7C1341B8BFA6" },
        { name: "snapshot", url: "https://snapshot.org/#/sharkdao.eth/" },
        { name: "safe", url: "https://app.safe.global/home?safe=eth:0x16C88a1f5580d5a6dAE0F7701E0b7C1341B8BFA6" }
      ]
    },
    {
      name: "pNouns",
      address: "0x75Da258B48596C742750D389fAdEEF7c8d5fac4c",
      links: [
        { name: "camp", url: "https://www.nouns.camp/voters/0x75Da258B48596C742750D389fAdEEF7c8d5fac4c" },
        { name: "snapshot", url: "https://snapshot.org/#/pnounsdao.eth/" }
      ]
    },
    {
      name: "Goop Governance Pool",
      address: "0x6b2645b468a828a12fea8c7d644445eb808ec2b1",
      links: [
        { name: "camp", url: "https://www.nouns.camp/voters/0x6b2645b468a828a12fea8c7d644445eb808ec2b1" }
      ]
    },
    {
      name: "Nouns Amigos",
      address: "0x5CE2a14f80B3578D54346fdE637E2FFBb87BcBa3",
      links: [
        { name: "camp", url: "https://www.nouns.camp/voters/0x5CE2a14f80B3578D54346fdE637E2FFBb87BcBa3" },
        { name: "safe", url: "https://app.safe.global/home?safe=eth:0x5CE2a14f80B3578D54346fdE637E2FFBb87BcBa3" }
      ]
    },
    {
      name: "Lil Nouncil",
      address: "0xADa31Add8450CA0422983B9a3103633b78938617",
      links: [
        { name: "safe", url: "https://app.safe.global/home?safe=eth:0xADa31Add8450CA0422983B9a3103633b78938617" },
        { name: "safe/messages", url: "https://app.safe.global/transactions/messages?safe=eth:0xADa31Add8450CA0422983B9a3103633b78938617" }
      ]
    },
    {
      name: "Wave Protocol",
      address: "0xa25499f89f435b183334709a8dd0b6bc3a611ec0",
      links: [
        { name: "camp", url: "https://www.nouns.camp/voters/0xa25499f89f435b183334709a8dd0b6bc3a611ec0" }
      ]
    }
  ];

  const nounsTokens = [
    {
      name: "NFT Backed ERC-20 Factory",
      address: "0x12C90168d42EF56980f6479046754063d939eb6e",
      links: [
        { name: "etherscan", url: "https://etherscan.io/address/0x12C90168d42EF56980f6479046754063d939eb6e" }
      ]
    },
    {
      name: "NFT Backed ERC-20 Factory [Sepolia]",
      address: "0x3Ee7C7eaa83aBDf28F0aFca4a19fEf4613825B3C",
      links: [
        { name: "etherscan sepolia", url: "https://sepolia.etherscan.io/address/0x3Ee7C7eaa83aBDf28F0aFca4a19fEf4613825B3C" }
      ]
    },
    {
      name: "$NOUNS [Mainnet]",
      address: "0x5c1760c98be951A4067DF234695c8014D8e7619C",
      links: [
        { name: "etherscan", url: "https://etherscan.io/address/0x5c1760c98be951A4067DF234695c8014D8e7619C" },
        { name: "camp", url: "https://nouns.camp/" }
      ]
    },
    {
      name: "$NOUNS [Base]",
      address: "0x0a93a7BE7e7e426fC046e204C44d6b03A302b631",
      links: [
        { name: "basescan", url: "https://basescan.org/address/0x0a93a7BE7e7e426fC046e204C44d6b03A302b631" },
        { name: "uniswap", url: "https://app.uniswap.org/" },
        { name: "dexscreener", url: "https://dexscreener.com/" }
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
      case 'metagov':
        return (
          <div className={styles.contractsList}>
            {metagovOrganizations.map((org, index) => (
              <div key={index} className={styles.contractItem}>
                <div className={styles.contractHeader}>
                  <span className={styles.contractName}>{org.name}:</span>
                  <div className={styles.chainLinks}>
                    {org.links.map((link, linkIndex) => (
                      <span key={linkIndex}>
                        <a 
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.etherscanLink}
                        >
                          {link.name} ↗
                        </a>
                        {linkIndex < org.links.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.contractAddress}>
                  ↳ {org.address}
                </div>
              </div>
            ))}
          </div>
        );
      case 'nouns':
        return (
          <div className={styles.contractsList}>
            {nounsTokens.map((token, index) => (
              <div key={index} className={styles.contractItem}>
                <div className={styles.contractHeader}>
                  <span className={styles.contractName}>{token.name}:</span>
                  <div className={styles.chainLinks}>
                    {token.links.map((link, linkIndex) => (
                      <span key={linkIndex}>
                        <a 
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.etherscanLink}
                        >
                          {link.name} ↗
                        </a>
                        {linkIndex < token.links.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.contractAddress}>
                  ↳ {token.address}
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
              {(['mainnet', 'sepolia', 'l2', 'metagov', 'nouns'] as Network[]).map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'nouns' ? '$nouns' : tab.charAt(0).toUpperCase() + tab.slice(1)}
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


