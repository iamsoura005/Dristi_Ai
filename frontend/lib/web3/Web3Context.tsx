'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

// Contract ABIs (these would be imported from the blockchain build artifacts)
import DigitalHealthPassportABI from './abis/DigitalHealthPassport.json';
import DRSTCoinABI from './abis/DRSTCoin.json';
import VisionCoinABI from './abis/VisionCoin.json';
import AchievementNFTABI from './abis/AchievementNFT.json';

interface Web3ContextType {
  web3: Web3 | null;
  account: string | null;
  isConnected: boolean;
  chainId: number | null;
  contracts: {
    healthPassport: Contract | null;
    drstCoin: Contract | null;
    visionCoin: Contract | null;
    achievementNFT: Contract | null;
  };
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: string) => Promise<void>;
  getBalance: (address?: string) => Promise<string>;
  getTokenBalance: (tokenContract: Contract, address?: string) => Promise<string>;
  sendTransaction: (to: string, value: string) => Promise<string>;
  loading: boolean;
  error: string | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Contract addresses (these would come from deployment)
const CONTRACT_ADDRESSES = {
  // Goerli testnet addresses (replace with actual deployed addresses)
  healthPassport: '0x...',
  drstCoin: '0x...',
  visionCoin: '0x...',
  achievementNFT: '0x...',
};

// Supported networks
const SUPPORTED_NETWORKS = {
  '0x5': 'Goerli Testnet',
  '0x1': 'Ethereum Mainnet',
  '0x539': 'Local Hardhat',
};

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [contracts, setContracts] = useState({
    healthPassport: null,
    drstCoin: null,
    visionCoin: null,
    achievementNFT: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Web3 and check for existing connection
  useEffect(() => {
    initializeWeb3();
    checkExistingConnection();
  }, []);

  // Listen for account and network changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      };
    }
  }, []);

  const initializeWeb3 = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        
        const chainId = await web3Instance.eth.getChainId();
        setChainId(chainId);
        
        initializeContracts(web3Instance);
      } catch (error) {
        console.error('Failed to initialize Web3:', error);
        setError('Failed to initialize Web3');
      }
    }
  };

  const initializeContracts = (web3Instance: Web3) => {
    try {
      const healthPassport = new web3Instance.eth.Contract(
        DigitalHealthPassportABI as any,
        CONTRACT_ADDRESSES.healthPassport
      );

      const drstCoin = new web3Instance.eth.Contract(
        DRSTCoinABI as any,
        CONTRACT_ADDRESSES.drstCoin
      );

      const visionCoin = new web3Instance.eth.Contract(
        VisionCoinABI as any,
        CONTRACT_ADDRESSES.visionCoin
      );

      const achievementNFT = new web3Instance.eth.Contract(
        AchievementNFTABI as any,
        CONTRACT_ADDRESSES.achievementNFT
      );

      setContracts({
        healthPassport,
        drstCoin,
        visionCoin,
        achievementNFT,
      });
    } catch (error) {
      console.error('Failed to initialize contracts:', error);
    }
  };

  const checkExistingConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Failed to check existing connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // Check if we're on the correct network
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (!SUPPORTED_NETWORKS[currentChainId as keyof typeof SUPPORTED_NETWORKS]) {
          setError('Please switch to a supported network (Goerli Testnet or Ethereum Mainnet)');
        }
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    setError(null);
  };

  const switchNetwork = async (targetChainId: string) => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    } catch (error: any) {
      // If the network doesn't exist, add it
      if (error.code === 4902) {
        // Add network logic here for custom networks
        throw new Error('Network not found. Please add the network manually.');
      }
      throw error;
    }
  };

  const getBalance = async (address?: string): Promise<string> => {
    if (!web3) throw new Error('Web3 not initialized');
    
    const targetAddress = address || account;
    if (!targetAddress) throw new Error('No address provided');

    const balance = await web3.eth.getBalance(targetAddress);
    return web3.utils.fromWei(balance, 'ether');
  };

  const getTokenBalance = async (tokenContract: Contract, address?: string): Promise<string> => {
    if (!web3) throw new Error('Web3 not initialized');
    
    const targetAddress = address || account;
    if (!targetAddress) throw new Error('No address provided');

    const balance = await tokenContract.methods.balanceOf(targetAddress).call();
    return web3.utils.fromWei(balance, 'ether');
  };

  const sendTransaction = async (to: string, value: string): Promise<string> => {
    if (!web3 || !account) throw new Error('Wallet not connected');

    const valueWei = web3.utils.toWei(value, 'ether');
    
    const txHash = await web3.eth.sendTransaction({
      from: account,
      to,
      value: valueWei,
    });

    return txHash.transactionHash;
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
      setIsConnected(true);
    }
  };

  const handleChainChanged = (chainId: string) => {
    setChainId(parseInt(chainId, 16));
    // Reload the page to reset the dapp state
    window.location.reload();
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const value: Web3ContextType = {
    web3,
    account,
    isConnected,
    chainId,
    contracts,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getBalance,
    getTokenBalance,
    sendTransaction,
    loading,
    error,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

// Custom hooks for specific contracts
export const useHealthPassport = () => {
  const { contracts } = useWeb3();
  return contracts.healthPassport;
};

export const useDRSTCoin = () => {
  const { contracts } = useWeb3();
  return contracts.drstCoin;
};

export const useVisionCoin = () => {
  const { contracts } = useWeb3();
  return contracts.visionCoin;
};

export const useAchievementNFT = () => {
  const { contracts } = useWeb3();
  return contracts.achievementNFT;
};
