/**
 * MetaMask Wallet Authentication Service
 * Handles wallet connection, signature verification, and user authentication
 */

import { User } from './auth'

declare global {
  interface Window {
    ethereum?: any
  }
}

export interface WalletAuthResponse {
  user: User
  access_token: string
  is_new_user: boolean
}

export interface ProfileData {
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  date_of_birth?: string
  gender?: string
  preferred_language?: string
}

class MetaMaskAuthService {
  private static instance: MetaMaskAuthService
  private baseUrl = 'http://localhost:5001'

  static getInstance(): MetaMaskAuthService {
    if (!MetaMaskAuthService.instance) {
      MetaMaskAuthService.instance = new MetaMaskAuthService()
    }
    return MetaMaskAuthService.instance
  }

  /**
   * Check if MetaMask is installed
   */
  isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
  }

  /**
   * Connect to MetaMask wallet
   */
  async connectWallet(): Promise<string> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.')
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your MetaMask wallet.')
      }

      return accounts[0]
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the connection request.')
      }
      throw new Error(`Failed to connect wallet: ${error.message}`)
    }
  }

  /**
   * Get current connected account
   */
  async getCurrentAccount(): Promise<string | null> {
    if (!this.isMetaMaskInstalled()) {
      return null
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      })
      return accounts.length > 0 ? accounts[0] : null
    } catch (error) {
      console.error('Failed to get current account:', error)
      return null
    }
  }

  /**
   * Get nonce for wallet signature
   */
  async getNonce(walletAddress: string): Promise<{ message: string; nonce: string }> {
    const response = await fetch(`${this.baseUrl}/api/wallet/nonce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet_address: walletAddress,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get nonce')
    }

    return response.json()
  }

  /**
   * Sign message with MetaMask
   */
  async signMessage(message: string, walletAddress: string): Promise<string> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed')
    }

    try {
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      })

      return signature
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the signature request.')
      }
      throw new Error(`Failed to sign message: ${error.message}`)
    }
  }

  /**
   * Verify signature and authenticate user
   */
  async verifySignature(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<WalletAuthResponse> {
    const response = await fetch(`${this.baseUrl}/api/wallet/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet_address: walletAddress,
        signature,
        message,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to verify signature')
    }

    return response.json()
  }

  /**
   * Complete user profile after wallet authentication
   */
  async completeProfile(profileData: ProfileData, token: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/wallet/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update profile')
    }

    const data = await response.json()
    return data.user
  }

  /**
   * Full wallet authentication flow
   */
  async authenticateWithWallet(): Promise<WalletAuthResponse> {
    try {
      // Step 1: Connect wallet
      const walletAddress = await this.connectWallet()

      // Step 2: Get nonce
      const { message, nonce } = await this.getNonce(walletAddress)

      // Step 3: Sign message
      const signature = await this.signMessage(message, walletAddress)

      // Step 4: Verify signature and authenticate
      const authResponse = await this.verifySignature(walletAddress, signature, message)

      return authResponse
    } catch (error) {
      console.error('Wallet authentication failed:', error)
      throw error
    }
  }

  /**
   * Listen for account changes
   */
  onAccountsChanged(callback: (accounts: string[]) => void): void {
    if (this.isMetaMaskInstalled()) {
      window.ethereum.on('accountsChanged', callback)
    }
  }

  /**
   * Listen for chain changes
   */
  onChainChanged(callback: (chainId: string) => void): void {
    if (this.isMetaMaskInstalled()) {
      window.ethereum.on('chainChanged', callback)
    }
  }

  /**
   * Remove event listeners
   */
  removeAllListeners(): void {
    if (this.isMetaMaskInstalled()) {
      window.ethereum.removeAllListeners('accountsChanged')
      window.ethereum.removeAllListeners('chainChanged')
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo(): Promise<{ chainId: string; networkName: string }> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed')
    }

    const chainId = await window.ethereum.request({ method: 'eth_chainId' })
    
    const networkNames: { [key: string]: string } = {
      '0x1': 'Ethereum Mainnet',
      '0x5': 'Goerli Testnet',
      '0xaa36a7': 'Sepolia Testnet',
      '0x539': 'Local Hardhat Network',
    }

    return {
      chainId,
      networkName: networkNames[chainId] || 'Unknown Network',
    }
  }

  /**
   * Switch to a specific network
   */
  async switchNetwork(chainId: string): Promise<void> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed')
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      })
    } catch (error: any) {
      if (error.code === 4902) {
        throw new Error('Network not added to MetaMask. Please add it manually.')
      }
      throw new Error(`Failed to switch network: ${error.message}`)
    }
  }
}

export const metaMaskAuthService = MetaMaskAuthService.getInstance()
export default metaMaskAuthService
