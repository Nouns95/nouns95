"use client";

import React, { useCallback } from 'react';
import { usePrivy, useConnectWallet, useLogin, useLogout } from '@privy-io/react-auth';
import { useWalletStore } from '../../../../data/stores/WalletStore';
import '../styles.css';

export default function EthereumConnect() {
  const { ready, authenticated } = usePrivy();
  const { setChainConnection, disconnect, disconnectAll } = useWalletStore();
  const { ethereum } = useWalletStore();
  
  const clearAllWalletState = useCallback(async () => {
    try {
      // Clear wallet store state first
      disconnectAll(); // Clear all wallet connections
      disconnect('ethereum'); // Ensure ethereum is specifically cleared

      // Clear all Privy-related localStorage items
      if (window.localStorage) {
        // Clear Privy's core data
        window.localStorage.removeItem('privy-app-store');
        window.localStorage.removeItem('privy-device-key');
        
        // Clear any Privy auth tokens
        window.localStorage.removeItem('privy-token');
        window.localStorage.removeItem('privy-refresh-token');
        
        // Clear our persisted wallet state
        window.localStorage.removeItem('wallet-storage');
        
        // Clear Privy's wallet connection cache
        window.localStorage.removeItem('privy-wallets');
        window.localStorage.removeItem('privy-embedded-wallets');
        window.localStorage.removeItem('privy-preferred-wallet');
        
        // Clear WalletConnect specific items
        window.localStorage.removeItem('wagmi.wallet');
        window.localStorage.removeItem('wagmi.connected');
        window.localStorage.removeItem('wagmi.injected-provider');
        window.localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
        window.localStorage.removeItem('walletconnect');
        
        // Clear any other Privy-related items
        Object.keys(window.localStorage).forEach(key => {
          if (key.startsWith('privy-') || 
              key.includes('wallet') || 
              key.includes('zerion') ||
              key.includes('WALLET_CONNECT') ||
              key.includes('wagmi')) {
            window.localStorage.removeItem(key);
          }
        });
      }

      // Clear session storage as well
      if (window.sessionStorage) {
        Object.keys(window.sessionStorage).forEach(key => {
          if (key.startsWith('privy-') || 
              key.includes('wallet') ||
              key.includes('zerion') ||
              key.includes('WALLET_CONNECT') ||
              key.includes('wagmi')) {
            window.sessionStorage.removeItem(key);
          }
        });
      }

      // Force a small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error during state cleanup:', error);
      // Even if there's an error, try to disconnect
      try {
        disconnectAll();
        disconnect('ethereum');
      } catch (e) {
        console.error('Final disconnect attempt failed:', e);
      }
    }
  }, [disconnect, disconnectAll]);

  const { login } = useLogin({
    onComplete: ({ user, isNewUser, wasAlreadyAuthenticated, loginMethod }) => {
      console.log('Login successful:', {
        user,
        isNewUser,
        wasAlreadyAuthenticated,
        loginMethod
      });
    },
    onError: async (error) => {
      console.error('Login error:', error);
      await clearAllWalletState();
    }
  });

  const { logout } = useLogout({
    onSuccess: async () => {
      console.log('Privy logout successful - performing full cleanup');
      await clearAllWalletState();
    }
  });

  const handleFullLogout = useCallback(async () => {
    try {
      console.log('Starting full logout process');
      
      // First clear all state
      await clearAllWalletState();
      
      // Then attempt to logout from Privy
      try {
        await logout();
      } catch (logoutError) {
        console.error('Privy logout failed:', logoutError);
        // Continue with cleanup even if Privy logout fails
      }
      
      // Clear state again to ensure everything is clean
      await clearAllWalletState();
    } catch (error) {
      console.error('Error during full logout:', error);
      // Final attempt to clear everything
      await clearAllWalletState();
    }
  }, [logout, clearAllWalletState]);

  const { connectWallet } = useConnectWallet({
    onSuccess: (response) => {
      console.log('Full wallet response:', response);
      const wallet = response.wallet;
      
      // Check if it's an Ethereum wallet
      if (wallet?.type === 'ethereum') {
        // Extract and convert chainId to number
        const chainIdStr = wallet.chainId?.split(':')[1]; // '1' from 'eip155:1'
        const chainId = chainIdStr ? parseInt(chainIdStr, 10) : undefined;
        
        if (!wallet.address) {
          console.error('Wallet connected but address is missing');
          clearAllWalletState();
          return;
        }

        // Transform ConnectWalletResponse to PrivyWalletResponse format
        const walletData = {
          user: {
            id: wallet.address, // Use wallet address as user ID
            wallet: {
              address: wallet.address,
              chainId
            }
          },
          wallet: {
            address: wallet.address,
            chainId
          }
        };

        // First update the store
        setChainConnection('ethereum', walletData);

        // Then clear any stale connection data
        if (window.localStorage) {
          // Only clear specific connection-related items
          window.localStorage.removeItem('walletconnect');
          window.localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
          window.localStorage.removeItem('privy-wallets');
          window.localStorage.removeItem('privy-preferred-wallet');
        }

        console.log('Wallet connection successful:', walletData);
      } else {
        console.log('Not an Ethereum wallet:', response);
        clearAllWalletState();
      }
    },
    onError: (error) => {
      console.error('Error connecting wallet:', error);
      clearAllWalletState();
    }
  });

  const handleLogin = useCallback(async () => {
    try {
      // Clear any existing state before login attempt
      await clearAllWalletState();
      
      login({
        disableSignup: true
      });
    } catch (error) {
      console.error('Error during login:', error);
      await clearAllWalletState();
    }
  }, [login, clearAllWalletState]);

  const handleConnectWallet = useCallback(() => {
    try {
      // Only clear connection-specific cache before attempting connection
      if (window.localStorage) {
        window.localStorage.removeItem('walletconnect');
        window.localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
        window.localStorage.removeItem('privy-wallets');
        window.localStorage.removeItem('privy-preferred-wallet');
      }

      connectWallet({
        walletList: [
          'metamask',
          'coinbase_wallet',
          'rainbow',
          'zerion',
          'wallet_connect',
          'uniswap',
          'rabby_wallet',
          'cryptocom',
          'okx_wallet',
          'safe',
          'detected_wallets'
        ]
      });
    } catch (error) {
      console.error('Error initiating wallet connection:', error);
      clearAllWalletState();
    }
  }, [connectWallet, clearAllWalletState]);

  if (!ready) {
    return <div className="wallet-loading">Loading Ethereum wallet...</div>;
  }

  if (!authenticated) {
    return (
      <div className="wallet-connect">
        <button 
          disabled={!ready}
          onClick={handleLogin}
        >
          Login to Connect Ethereum Wallet
        </button>
      </div>
    );
  }

  if (!ethereum.isConnected) {
    return (
      <div className="wallet-connect">
        <button onClick={handleConnectWallet}>
          Connect Ethereum Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-profile">
      <div className="wallet-address">
        Address: {ethereum.address?.slice(0, 6)}...{ethereum.address?.slice(-4)}
      </div>
      {ethereum.chainId && (
        <div className="wallet-chain">Chain ID: {ethereum.chainId}</div>
      )}
      <div className="wallet-actions">
        <button 
          className="wallet-disconnect" 
          onClick={handleFullLogout}
        >
          Disconnect Wallet
        </button>
      </div>
    </div>
  );
} 