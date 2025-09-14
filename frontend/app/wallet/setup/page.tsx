"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wallet, 
  Shield, 
  Coins, 
  CheckCircle, 
  ArrowRight, 
  AlertCircle,
  Key,
  Lock,
  Eye,
  Heart
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import WalletCreationModal from '@/components/wallet/WalletCreationModal';

export default function WalletSetupPage() {
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user already has a wallet
  useEffect(() => {
    checkWalletStatus();
  }, []);

  const checkWalletStatus = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/blockchain/wallet/balances', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setHasWallet(true);
        // Redirect to dashboard if wallet exists
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else if (response.status === 404) {
        setHasWallet(false);
      } else {
        throw new Error('Failed to check wallet status');
      }
    } catch (error) {
      console.error('Error checking wallet status:', error);
      setHasWallet(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletCreated = () => {
    setHasWallet(true);
    toast.success('Wallet created successfully! Redirecting to dashboard...');
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
            <Wallet className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-white">Checking wallet status...</p>
        </div>
      </div>
    );
  }

  if (hasWallet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Wallet Already Set Up!</h2>
            <p className="text-white/70 mb-4">
              You already have a blockchain wallet configured. Redirecting to your dashboard...
            </p>
            <Button 
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              Set Up Your Blockchain Wallet
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Create a secure wallet to store your health tokens and participate in the Dristi AI ecosystem
            </p>
          </motion.div>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="bg-white/10 backdrop-blur-md border-white/20 h-full">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Coins className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Earn Health Tokens</h3>
                <p className="text-white/70 text-sm">
                  Receive DRST and VSC tokens for completing eye tests and health assessments
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-white/10 backdrop-blur-md border-white/20 h-full">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Secure Storage</h3>
                <p className="text-white/70 text-sm">
                  Your wallet is encrypted and secured with military-grade encryption
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="bg-white/10 backdrop-blur-md border-white/20 h-full">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Health Records</h3>
                <p className="text-white/70 text-sm">
                  Store your health data securely on the blockchain with full ownership
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Setup Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="w-6 h-6 text-blue-400" />
                Create Your Blockchain Wallet
              </CardTitle>
              <CardDescription className="text-white/70">
                Set up a secure wallet to start earning and managing your health tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-blue-500/10 border-blue-500/20">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-300">
                  Your wallet will support Ethereum, Bitcoin, DRST tokens, and VisionCoins (VSC)
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <Key className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-white font-medium">Secure Encryption</p>
                    <p className="text-white/60 text-sm">Your private keys are encrypted with your password</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <Lock className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-white font-medium">Full Control</p>
                    <p className="text-white/60 text-sm">You own and control your wallet completely</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">Health Token Integration</p>
                    <p className="text-white/60 text-sm">Seamlessly earn tokens from eye tests and health assessments</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={() => setShowCreationModal(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Create Wallet
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <WalletCreationModal
        isOpen={showCreationModal}
        onClose={() => setShowCreationModal(false)}
        onSuccess={handleWalletCreated}
      />
    </div>
  );
}
