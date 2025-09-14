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
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  // Connection state management
  private isConnecting = false
  private connectionPromise: Promise<string> | null = null
  private isAuthenticating = false
  private authenticationPromise: Promise<WalletAuthResponse> | null = null

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
   * Connect to MetaMask wallet with race condition protection
   */
  async connectWallet(): Promise<string> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.')
    }

    // If already connecting, return the existing promise
    if (this.isConnecting && this.connectionPromise) {
      console.log('⏳ Connection already in progress, waiting for existing request...')
      return this.connectionPromise
    }

    // Check if already connected first
    try {
      const currentAccount = await this.getCurrentAccount()
      if (currentAccount) {
        console.log('✅ Already connected to:', currentAccount)
        return currentAccount
      }
    } catch (error) {
      console.log('🔍 No existing connection, proceeding with new connection...')
    }

    // Set connecting state and create new connection promise
    this.isConnecting = true
    this.connectionPromise = this._performConnection()

    try {
      const result = await this.connectionPromise
      return result
    } finally {
      // Reset connection state
      this.isConnecting = false
      this.connectionPromise = null
    }
  }

  /**
   * Internal method to perform the actual connection
   */
  private async _performConnection(): Promise<string> {
    try {
      console.log('🔗 Requesting MetaMask account access...')
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your MetaMask wallet.')
      }

      console.log('✅ MetaMask connection successful:', accounts[0])
      return accounts[0]
    } catch (error: any) {
      console.error('❌ MetaMask connection failed:', error)

      if (error.code === 4001) {
        throw new Error('User rejected the connection request.')
      }
      if (error.code === -32002) {
        throw new Error('MetaMask is already processing a connection request. Please check your MetaMask extension.')
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
    console.log('🔍 Getting nonce for wallet:', walletAddress)
    console.log('🌐 API URL:', `${this.baseUrl}/api/wallet/nonce`)

    try {
      const response = await fetch(`${this.baseUrl}/api/wallet/nonce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
        }),
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Error response:', errorText)
        throw new Error(`Failed to get nonce: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Nonce received:', data.nonce)
      return data
    } catch (error) {
      console.error('❌ Fetch error:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to backend server. Please ensure the backend is running on port 5000.')
      }
      throw error
    }
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
   * Full wallet authentication flow with race condition protection
   */
  async authenticateWithWallet(): Promise<WalletAuthResponse> {
    // If already authenticating, return the existing promise
    if (this.isAuthenticating && this.authenticationPromise) {
      console.log('⏳ Authentication already in progress, waiting for existing request...')
      return this.authenticationPromise
    }

    // Set authenticating state and create new authentication promise
    this.isAuthenticating = true
    this.authenticationPromise = this._performAuthentication()

    try {
      const result = await this.authenticationPromise
      return result
    } finally {
      // Reset authentication state
      this.isAuthenticating = false
      this.authenticationPromise = null
    }
  }

  /**
   * Internal method to perform the actual authentication
   */
  private async _performAuthentication(): Promise<WalletAuthResponse> {
    console.log('🚀 Starting wallet authentication flow...')

    try {
      // Step 1: Connect wallet
      console.log('📱 Step 1: Connecting wallet...')
      const walletAddress = await this.connectWallet()
      console.log('✅ Wallet connected:', walletAddress)

      // Step 2: Get nonce
      console.log('🔑 Step 2: Getting nonce...')
      const { message, nonce } = await this.getNonce(walletAddress)
      console.log('✅ Nonce received')

      // Step 3: Sign message
      console.log('✍️ Step 3: Signing message...')
      const signature = await this.signMessage(message, walletAddress)
      console.log('✅ Message signed')

      // Step 4: Verify signature and authenticate
      console.log('🔐 Step 4: Verifying signature...')
      const authResponse = await this.verifySignature(walletAddress, signature, message)
      console.log('✅ Authentication successful')

      return authResponse
    } catch (error) {
      console.error('❌ Wallet authentication failed:', error)
      throw error
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): { isConnecting: boolean; isAuthenticating: boolean } {
    return {
      isConnecting: this.isConnecting,
      isAuthenticating: this.isAuthenticating
    }
  }

  /**
   * Reset connection state (use in case of errors)
   */
  resetConnectionState(): void {
    console.log('🔄 Resetting MetaMask connection state...')
    this.isConnecting = false
    this.connectionPromise = null
    this.isAuthenticating = false
    this.authenticationPromise = null
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
