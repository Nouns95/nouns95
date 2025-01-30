import { WalletType } from '../presentation/apps/Wallet/WalletApp';
import { Chain } from 'viem';

export interface WalletData {
  address: string;
  chainId?: number;
  publicKey?: string;
}

export interface UserData {
  id: string;
  wallet: WalletData;
}

export interface PrivyWalletResponse {
  user: UserData;
  wallet: WalletData;
}

export interface WalletListOptions {
  walletList: string[];
}

export interface LoginOptions {
  disableSignup?: boolean;
}

export interface LoginCallbacks {
  onComplete?: (params: {
    user: UserData;
    isNewUser: boolean;
    wasAlreadyAuthenticated: boolean;
    loginMethod: string;
    account: WalletData;
  }) => void;
  onError?: (error: { code: string; message: string }) => void;
}

export interface LogoutCallbacks {
  onSuccess?: () => void;
}

export interface ConnectWalletResponse {
  wallet: {
    type: string;
    address: string;
    chainId?: string;
    publicKey?: string;
    meta?: {
      name: string;
      icon: string;
      id: string;
    };
    imported: boolean;
  };
}

declare module '@privy-io/react-auth' {
  export interface PrivyClientConfig {
    appId: string;
    timeout?: number;
    loginMethods?: readonly ['wallet'];
    appearance?: {
      theme?: 'dark' | 'light';
      accentColor?: string;
      showWalletLoginFirst?: boolean;
      walletChainType?: 'ethereum-and-solana' | 'ethereum-only' | 'solana-only';
    };
    embeddedWallets?: {
      createOnLogin?: 'users-without-wallets' | 'all-users' | 'no-users';
    };
    supportedChains?: Chain[];
    defaultChain?: Chain;
  }

  export class PrivyClient {
    constructor(config: PrivyClientConfig);
    login(options: LoginOptions): Promise<void>;
    connectEthereum(): Promise<PrivyWalletResponse>;
    connectSolana(): Promise<PrivyWalletResponse>;
    disconnect(chain: WalletType): Promise<void>;
    disconnectAll(): Promise<void>;
  }

  export interface PrivyContextValue {
    login: (options: LoginOptions) => Promise<void>;
    logout: () => Promise<void>;
    connectWallet: (options?: WalletListOptions) => Promise<void>;
    ready: boolean;
    authenticated: boolean;
    user: UserData | null;
    client: PrivyClient;
    wallets: {
      address: string;
      chainId?: number;
      publicKey?: string;
      chainName: string;
    }[];
  }

  export function usePrivy(): PrivyContextValue;
  
  export function useLogin(callbacks?: LoginCallbacks): {
    login: (options?: LoginOptions) => void;
  };

  export function useLogout(callbacks?: LogoutCallbacks): {
    logout: () => Promise<void>;
  };

  export function useConnectWallet(callbacks?: {
    onSuccess?: (response: ConnectWalletResponse) => void;
    onError?: (error: { code: string; message: string }) => void;
  }): {
    connectWallet: (options?: WalletListOptions) => void;
  };
} 
