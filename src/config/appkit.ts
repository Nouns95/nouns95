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
  icons: ['https://nouns95.wtf/icons/shell/TaskBar/StartMenu/StartMenu.png'],
}

export const bitcoinAdapter = new BitcoinAdapter({
  projectId
})

export const solanaWeb3JsAdapter = new SolanaAdapter({
  wallets: [new HuobiWalletAdapter(), new SolflareWalletAdapter()]
})

// Simplified RPC configuration with timeout settings
const mainnetTransport = http(process.env.NEXT_PUBLIC_RPC_URL, {
  timeout: 10000, // 10 second timeout
  retryCount: 3,
  retryDelay: 1000, // 1 second between retries
})

// Fallback only if primary fails completely
const mainnetWithFallback = fallback([
  mainnetTransport,
  http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`, {
    timeout: 10000,
    retryCount: 2,
    retryDelay: 1000,
  })
])

// Simplified Base configuration
const baseTransport = http('https://base.publicnode.com', {
  timeout: 10000,
  retryCount: 3,
  retryDelay: 1000,
})

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: typeof window === 'undefined' ? undefined : cookieStorage
  }),
  transports: {
    [mainnet.id]: mainnetWithFallback,
    [base.id]: baseTransport
  },
  ssr: true,
  projectId,
  networks,
  syncConnectedChain: false, // Prevent unnecessary chain syncing during SSR
})

export const config = wagmiAdapter.wagmiConfig