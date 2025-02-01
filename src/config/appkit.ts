import type { AppKitNetwork } from '@reown/appkit/networks'
import { BitcoinAdapter } from '@reown/appkit-adapter-bitcoin'
import { mainnet, base, solana, bitcoin } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { cookieStorage, createStorage, http } from 'wagmi'
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'
import { HuobiWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, base, solana, bitcoin]

// Define metadata for wallet connections
export const metadata = {
  name: 'Nouns95',
  description: 'Nouns95 - A Web3 Operating System',
  url: 'https://nouns95.xyz',
  icons: [
    'https://nouns95.xyz/icons/favicon.ico',
    'https://nouns95.xyz/icons/icon-192.png',
    'https://nouns95.xyz/icons/icon-512.png'
  ],
  themeColor: '#000000',
  background: '#ffffff'
}

export const bitcoinAdapter = new BitcoinAdapter({
  projectId
})

export const solanaWeb3JsAdapter = new SolanaAdapter({
  wallets: [new HuobiWalletAdapter(), new SolflareWalletAdapter()]
})

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  transports: {
    [mainnet.id]: http('https://mainnet.infura.io/v3/a7abc362801345d587dfe2e9a750d2e8'),
    [base.id]: http('https://base.publicnode.com')
  },
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig