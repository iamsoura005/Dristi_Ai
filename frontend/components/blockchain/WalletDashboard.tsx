'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWeb3 } from '@/lib/web3/Web3Context';
import { Wallet, Send, History, Trophy, Shield, Coins } from 'lucide-react';
import { toast } from 'sonner';
import WalletConnect from './WalletConnect';
import SendCrypto from './SendCrypto';
import TransactionHistory from './TransactionHistory';
import HealthPassport from './HealthPassport';
import AchievementBadges from './AchievementBadges';

interface WalletBalance {
  ETH: string;
  DRST: string;
  VSC: string;
  BTC: string;
}

interface WalletAddresses {
  ethereum: string;
  bitcoin: string;
}

const WalletDashboard: React.FC = () => {
  const { isConnected, account, loading } = useWeb3();
  const [balances, setBalances] = useState<WalletBalance>({
    ETH: '0',
    DRST: '0',
    VSC: '0',
    BTC: '0',
  });
  const [addresses, setAddresses] = useState<WalletAddresses>({
    ethereum: '',
    bitcoin: '',
  });
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isConnected && account) {
      fetchWalletData();
    }
  }, [isConnected, account]);

  const fetchWalletData = async () => {
    setLoadingBalances(true);
    try {
      const response = await fetch('/api/blockchain/wallet/balances', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBalances(data.balances);
        setAddresses(data.addresses);
      } else {
        toast.error('Failed to fetch wallet balances');
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Error fetching wallet data');
    } finally {
      setLoadingBalances(false);
    }
  };

  const formatBalance = (balance: string, decimals: number = 4): string => {
    const num = parseFloat(balance);
    return num.toFixed(decimals);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} address copied to clipboard`);
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Connect your MetaMask wallet to access blockchain features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalletConnect />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Crypto Wallet</h1>
          <p className="text-muted-foreground">
            Manage your digital assets and health records
          </p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700">
          Connected
        </Badge>
      </div>

      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ethereum (ETH)</CardTitle>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-xs">ETH</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingBalances ? '...' : formatBalance(balances.ETH)}
            </div>
            <p className="text-xs text-muted-foreground">
              Native cryptocurrency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DRST Coins</CardTitle>
            <Coins className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingBalances ? '...' : formatBalance(balances.DRST)}
            </div>
            <p className="text-xs text-muted-foreground">
              Reward tokens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VisionCoins (VSC)</CardTitle>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-xs">VSC</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingBalances ? '...' : formatBalance(balances.VSC)}
            </div>
            <p className="text-xs text-muted-foreground">
              Health-based tokens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bitcoin (BTC)</CardTitle>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold text-xs">BTC</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingBalances ? '...' : formatBalance(balances.BTC, 8)}
            </div>
            <p className="text-xs text-muted-foreground">
              Digital gold
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Addresses */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Addresses</CardTitle>
          <CardDescription>
            Your cryptocurrency addresses for receiving funds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Ethereum Address</p>
              <p className="text-sm text-muted-foreground font-mono">
                {addresses.ethereum || account}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(addresses.ethereum || account || '', 'Ethereum')}
            >
              Copy
            </Button>
          </div>
          
          {addresses.bitcoin && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Bitcoin Address</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {addresses.bitcoin}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(addresses.bitcoin, 'Bitcoin')}
              >
                Copy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for different features */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="send">
            <Send className="w-4 h-4 mr-2" />
            Send
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="health">
            <Shield className="w-4 h-4 mr-2" />
            Health
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Trophy className="w-4 h-4 mr-2" />
            NFTs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col"
                onClick={() => setActiveTab('send')}
              >
                <Send className="w-6 h-6 mb-2" />
                Send Crypto
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col"
                onClick={() => setActiveTab('history')}
              >
                <History className="w-6 h-6 mb-2" />
                View History
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col"
                onClick={() => setActiveTab('health')}
              >
                <Shield className="w-6 h-6 mb-2" />
                Health Records
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col"
                onClick={() => setActiveTab('achievements')}
              >
                <Trophy className="w-6 h-6 mb-2" />
                Achievements
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send">
          <SendCrypto onSuccess={fetchWalletData} />
        </TabsContent>

        <TabsContent value="history">
          <TransactionHistory />
        </TabsContent>

        <TabsContent value="health">
          <HealthPassport />
        </TabsContent>

        <TabsContent value="achievements">
          <AchievementBadges />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletDashboard;
