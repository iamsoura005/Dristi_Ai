"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Shield, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { metaMaskAuthService } from '@/lib/metamask-auth'
import { useAuth } from './auth-provider'
import { toast } from 'sonner'

interface MetaMaskAuthProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function MetaMaskAuth({ onSuccess, onError }: MetaMaskAuthProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [currentAccount, setCurrentAccount] = useState<string | null>(null)
  const [networkInfo, setNetworkInfo] = useState<{ chainId: string; networkName: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()

  useEffect(() => {
    checkConnection()
    setupEventListeners()

    return () => {
      metaMaskAuthService.removeAllListeners()
    }
  }, [])

  const checkConnection = async () => {
    try {
      const account = await metaMaskAuthService.getCurrentAccount()
      setCurrentAccount(account)
      
      if (account && metaMaskAuthService.isMetaMaskInstalled()) {
        const network = await metaMaskAuthService.getNetworkInfo()
        setNetworkInfo(network)
      }
    } catch (error) {
      console.error('Failed to check connection:', error)
    }
  }

  const setupEventListeners = () => {
    metaMaskAuthService.onAccountsChanged((accounts: string[]) => {
      if (accounts.length === 0) {
        setCurrentAccount(null)
        setNetworkInfo(null)
      } else {
        setCurrentAccount(accounts[0])
        checkConnection()
      }
    })

    metaMaskAuthService.onChainChanged(() => {
      checkConnection()
    })
  }

  const handleConnectWallet = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      // Authenticate with wallet
      const authResponse = await metaMaskAuthService.authenticateWithWallet()
      
      // Store token and user data
      localStorage.setItem('token', authResponse.access_token)
      localStorage.setItem('user', JSON.stringify(authResponse.user))
      
      // Update auth context (simulate login)
      // Note: We'll need to update the auth provider to handle wallet auth
      
      toast.success('Successfully connected with MetaMask!')
      
      if (onSuccess) {
        onSuccess()
      }
      
      // Refresh to update the app state
      window.location.reload()
      
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to connect wallet'
      setError(errorMessage)
      toast.error(errorMessage)
      
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const installMetaMask = () => {
    window.open('https://metamask.io/download/', '_blank')
  }

  if (!metaMaskAuthService.isMetaMaskInstalled()) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center ">
          <CardTitle className="flex items-center justify-center gap-2 text-black">
            <Wallet className="w-6 h-6 text-orange-500" />
            MetaMask Required
          </CardTitle>
          <CardDescription>
            MetaMask wallet is required to access blockchain features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please install MetaMask browser extension to continue with wallet authentication.
            </AlertDescription>
          </Alert>
          
          <Button onClick={installMetaMask} className="w-full" size="lg">
            <ExternalLink className="w-4 h-4 mr-2" />
            Install MetaMask
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              After installing, refresh this page to continue
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-black">
      <CardHeader className="text-center ">
        <CardTitle className="flex items-center justify-center gap-2 text-white">
          <Wallet className="w-6 h-6 text-white" />
          Connect with MetaMask
        </CardTitle>
        <CardDescription>
          Secure authentication using your MetaMask wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentAccount ? (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Wallet Connected</span>
              </div>
              <p className="text-xs text-green-600 font-mono break-all">
                {currentAccount}
              </p>
            </div>

            {networkInfo && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">Network</span>
                  <Badge variant="secondary" className="text-xs">
                    {networkInfo.networkName}
                  </Badge>
                </div>
              </div>
            )}

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                size="lg"
              >
                {isConnecting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                  />
                ) : (
                  <Shield className="w-5 h-5 mr-2" />
                )}
                {isConnecting ? 'Authenticating...' : 'Sign & Authenticate'}
              </Button>
            </motion.div>
          </div>
        ) : (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              size="lg"
            >
              {isConnecting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                />
              ) : (
                <Wallet className="w-5 h-5 mr-2" />
              )}
              {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
            </Button>
          </motion.div>
        )}

        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Secure & Decentralized</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Your private keys never leave your device
          </p>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Why MetaMask Authentication?</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• No passwords to remember</li>
            <li>• Enhanced security with cryptographic signatures</li>
            <li>• Direct access to blockchain features</li>
            <li>• Seamless token and NFT management</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
