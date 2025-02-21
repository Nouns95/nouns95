import type { AppKitNetwork } from '@reown/appkit/networks'
import { BitcoinAdapter } from '@reown/appkit-adapter-bitcoin'
import { mainnet, base, solana, bitcoin } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { cookieStorage, createStorage, http, fallback } from 'wagmi'
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
  url: typeof window !== 'undefined' ? window.location.origin : 'https://nouns95.wtf',
  icons: ['/icons/shell/TaskBar/StartMenu/StartMenu.png'],
}

export const bitcoinAdapter = new BitcoinAdapter({
  projectId
})

export const solanaWeb3JsAdapter = new SolanaAdapter({
  wallets: [new HuobiWalletAdapter(), new SolflareWalletAdapter()]
})

// Create fallback transports with multiple RPC providers
const mainnetTransport = fallback([
  http(process.env.NEXT_PUBLIC_RPC_URL),
  http('https://mainnet.infura.io/v3/a7abc362801345d587dfe2e9a750d2e8'),
  http('https://eth-mainnet.g.alchemy.com/v2/11in8BYkVbrKcuvj51C5gTeWzAoUgfg6'),
  http('https://rpc.ankr.com/eth')
])

const baseTransport = fallback([
  http('https://base.publicnode.com'),
  http('https://1rpc.io/base'),
  http('https://base.meowrpc.com')
])

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  transports: {
    [mainnet.id]: mainnetTransport,
    [base.id]: baseTransport
  },
  ssr: true,
  projectId,
  networks,
})

export const config = wagmiAdapter.wagmiConfig