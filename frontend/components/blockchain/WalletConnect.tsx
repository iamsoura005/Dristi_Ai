'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWeb3 } from '@/lib/web3/Web3Context';
import { Wallet, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const WalletConnect: React.FC = () => {
  const { connectWallet, isConnected, account, loading, error, chainId } = useWeb3();
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      if (!error) {
        toast.success('Wallet connected successfully!');
      }
    } catch (err) {
      toast.error('Failed to connect wallet');
    }
  };

  const handleCreateWallet = async () => {
    setIsCreatingWallet(true);
    try {
      const response = await fetch('/api/blockchain/wallet/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          password: 'user_password', // In production, get this from user input
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Crypto wallet created successfully!');
        // Optionally refresh the page or update state
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create wallet');
      }
    } catch (error) {
      toast.error('Error creating wallet');
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const getNetworkName = (chainId: number | null): string => {
    switch (chainId) {
      case 1:
        return 'Ethereum Mainnet';
      case 5:
        return 'Goerli Testnet';
      case 11155111:
        return 'Sepolia Testnet';
      case 1337:
        return 'Local Hardhat';
      default:
        return 'Unknown Network';
    }
  };

  const isCorrectNetwork = (chainId: number | null): boolean => {
    // Accept Goerli, Sepolia, or local Hardhat for development
    return chainId === 5 || chainId === 11155111 || chainId === 1337;
  };

  if (isConnected && account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Wallet Connected
          </CardTitle>
          <CardDescription>
            Your MetaMask wallet is successfully connected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800">Connected Account</p>
            <p className="text-xs text-green-600 font-mono break-all">
              {account}
            </p>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800">Network</p>
            <p className="text-xs text-blue-600">
              {getNetworkName(chainId)}
            </p>
          </div>

          {!isCorrectNetwork(chainId) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please switch to Goerli Testnet or Sepolia Testnet for the best experience.
              </AlertDescription>
            </Alert>
          )}

          <div className="pt-4 space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCreateWallet}
              disabled={isCreatingWallet}
            >
              {isCreatingWallet ? 'Creating...' : 'Create Dristi Wallet'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Create a secure wallet for storing your health tokens and Bitcoin
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* MetaMask Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect MetaMask
          </CardTitle>
          <CardDescription>
            Connect your MetaMask wallet to access blockchain features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleConnectWallet}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Connecting...' : 'Connect MetaMask'}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have MetaMask?{' '}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Download here
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-xs font-bold">1</span>
            </div>
            <div>
              <p className="font-medium">Install MetaMask</p>
              <p className="text-sm text-muted-foreground">
                Download and install the MetaMask browser extension
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-xs font-bold">2</span>
            </div>
            <div>
              <p className="font-medium">Create or Import Wallet</p>
              <p className="text-sm text-muted-foreground">
                Set up your MetaMask wallet with a secure password
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-xs font-bold">3</span>
            </div>
            <div>
              <p className="font-medium">Connect to Dristi AI</p>
              <p className="text-sm text-muted-foreground">
                Click "Connect MetaMask" to link your wallet
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-xs font-bold">4</span>
            </div>
            <div>
              <p className="font-medium">Start Earning Tokens</p>
              <p className="text-sm text-muted-foreground">
                Complete eye tests and health activities to earn rewards
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Blockchain Features</CardTitle>
          <CardDescription>
            What you can do with your connected wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xs font-bold">DRST</span>
            </div>
            <div>
              <p className="font-medium">Earn DRST Coins</p>
              <p className="text-sm text-muted-foreground">
                Get rewarded for eye tests, exercises, and family activities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xs font-bold">VSC</span>
            </div>
            <div>
              <p className="font-medium">VisionCoins Based on Health</p>
              <p className="text-sm text-muted-foreground">
                Earn tokens based on your eye health condition
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-xs font-bold">NFT</span>
            </div>
            <div>
              <p className="font-medium">Achievement Badges</p>
              <p className="text-sm text-muted-foreground">
                Collect unique NFT badges for your accomplishments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xs font-bold">📋</span>
            </div>
            <div>
              <p className="font-medium">Digital Health Passport</p>
              <p className="text-sm text-muted-foreground">
                Secure, immutable health records on blockchain
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletConnect;
