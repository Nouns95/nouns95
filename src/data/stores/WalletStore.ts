import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WalletType } from '../../presentation/apps/Wallet/WalletApp';
import { PrivyWalletResponse } from '../../types/wallet';

export type ChainConnection = {
  isConnected: boolean;
  address: string | null;
  profileId: string | null;
  chainId?: number;
  publicKey?: string;
};

type WalletState = {
  ethereum: ChainConnection;
  solana: ChainConnection;
  setChainConnection: (chain: WalletType, response: PrivyWalletResponse) => void;
  disconnect: (chain: WalletType) => void;
  disconnectAll: () => void;
};

const initialChainState: ChainConnection = {
  isConnected: false,
  address: null,
  profileId: null,
  chainId: undefined,
  publicKey: undefined
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      ethereum: { ...initialChainState },
      solana: { ...initialChainState },
      
      setChainConnection: (chain, { user, wallet }) =>
        set((state) => ({
          ...state,
          [chain]: {
            ...state[chain],
            isConnected: true,
            address: wallet.address,
            profileId: user.id,
            chainId: wallet.chainId,
            publicKey: wallet.publicKey
          },
        })),
        
      disconnect: (chain) =>
        set((state) => ({
          ...state,
          [chain]: { ...initialChainState },
        })),
        
      disconnectAll: () =>
        set(() => ({
          ethereum: { ...initialChainState },
          solana: { ...initialChainState },
        })),
    }),
    {
      name: 'wallet-storage',
    }
  )
); 
