"use client";

import React, { useCallback } from 'react';
import { usePrivy, useConnectWallet, useLogin, useLogout } from '@privy-io/react-auth';
import { useWalletStore } from '../../../../data/stores/WalletStore';
import '../styles.css';

export default function SolanaConnect() {
  const { ready, authenticated } = usePrivy();
  const { setChainConnection, disconnect, disconnectAll } = useWalletStore();
  const { solana } = useWalletStore();
  
  const clearAllWalletState = useCallback(async () => {
    try {
      // Clear wallet store state first
      disconnectAll(); // Clear all wallet connections
      disconnect('solana'); // Ensure solana is specifically cleared

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
        
        // Clear Phantom specific items
        window.localStorage.removeItem('phantom-recent');
        window.localStorage.removeItem('phantom.wallet');
        
        // Clear any other Privy-related items
        Object.keys(window.localStorage).forEach(key => {
          if (key.startsWith('privy-') || 
              key.includes('wallet') || 
              key.includes('phantom') ||
              key.includes('solana')) {
            window.localStorage.removeItem(key);
          }
        });
      }

      // Clear session storage as well
      if (window.sessionStorage) {
        Object.keys(window.sessionStorage).forEach(key => {
          if (key.startsWith('privy-') || 
              key.includes('wallet') ||
              key.includes('phantom') ||
              key.includes('solana')) {
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
        disconnect('solana');
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
      
      // Check if it's a Solana wallet
      if (wallet?.type === 'solana') {
        if (!wallet.address || !wallet.publicKey) {
          console.error('Wallet connected but address or publicKey is missing');
          clearAllWalletState();
          return;
        }

        // Transform ConnectWalletResponse to PrivyWalletResponse format
        const walletData = {
          user: {
            id: wallet.address, // Use wallet address as user ID
            wallet: {
              address: wallet.address,
              publicKey: wallet.publicKey
            }
          },
          wallet: {
            address: wallet.address,
            publicKey: wallet.publicKey
          }
        };

        // First update the store
        setChainConnection('solana', walletData);

        // Then clear any stale connection data
        if (window.localStorage) {
          // Only clear specific connection-related items
          window.localStorage.removeItem('phantom-recent');
          window.localStorage.removeItem('phantom.wallet');
          
          // Clear Privy's connection cache but not the whole state
          window.localStorage.removeItem('privy-wallets');
          window.localStorage.removeItem('privy-preferred-wallet');
        }

        console.log('Wallet connection successful:', walletData);
      } else {
        console.log('Not a Solana wallet:', response);
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
        window.localStorage.removeItem('phantom-recent');
        window.localStorage.removeItem('phantom.wallet');
        window.localStorage.removeItem('privy-wallets');
        window.localStorage.removeItem('privy-preferred-wallet');
      }

      connectWallet({
        walletList: ['phantom', 'detected_wallets'] // Support Phantom and any detected Solana wallets
      });
    } catch (error) {
      console.error('Error initiating wallet connection:', error);
      clearAllWalletState();
    }
  }, [connectWallet, clearAllWalletState]);

  if (!ready) {
    return <div className="wallet-loading">Loading Solana wallet...</div>;
  }

  if (!authenticated) {
    return (
      <div className="wallet-connect">
        <button 
          disabled={!ready}
          onClick={handleLogin}
        >
          Login to Connect Solana Wallet
        </button>
      </div>
    );
  }

  if (!solana.isConnected) {
    return (
      <div className="wallet-connect">
        <button onClick={handleConnectWallet}>
          Connect Solana Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-profile">
      <div className="wallet-address">
        Address: {solana.address?.slice(0, 6)}...{solana.address?.slice(-4)}
      </div>
      {solana.publicKey && (
        <div className="wallet-pubkey">
          Public Key: {solana.publicKey.slice(0, 6)}...
        </div>
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