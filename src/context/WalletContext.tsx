import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import type { Signer } from 'ethers';

interface WalletContextType {
  signer: Signer | null;
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  signer: null,
  address: null,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [signer, setSigner] = useState<Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = async () => {
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Create Web3Provider and get signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const newSigner = provider.getSigner();
      const newAddress = await newSigner.getAddress();

      setSigner(newSigner);
      setAddress(newAddress);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnect = () => {
    setSigner(null);
    setAddress(null);
    setIsConnected(false);
  };

  // Handle account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', () => {
        disconnect();
      });
    }

    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', () => {
          disconnect();
        });
      }
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        signer,
        address,
        isConnected,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}; 