"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Loader2, AlertCircle, CheckCircle, Key, Lock, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface WalletCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function authHeader() {
  if (typeof window === "undefined") return {} as any;
  const token = localStorage.getItem("token") || 
                localStorage.getItem("access_token") || 
                localStorage.getItem("auth_token") ||
                localStorage.getItem("hackloop_auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function WalletCreationModal({ isOpen, onClose, onSuccess }: WalletCreationModalProps) {
  const [walletPassword, setWalletPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [step, setStep] = useState<'form' | 'creating' | 'success'>('form');
  const [walletInfo, setWalletInfo] = useState<any>(null);

  const validatePassword = () => {
    if (!walletPassword) {
      toast.error("Please enter a password for your wallet");
      return false;
    }
    
    if (walletPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return false;
    }

    if (walletPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    return true;
  };

  const createWallet = async () => {
    if (!validatePassword()) return;

    setIsCreatingWallet(true);
    setStep('creating');

    try {
      const headers = authHeader();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/blockchain/wallet/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          password: walletPassword
        })
      });

      if (response.ok) {
        const data = await response.json();
        setWalletInfo(data.wallet);
        setStep('success');
        toast.success('Wallet created successfully!');
        
        // Auto-close after 3 seconds and call success callback
        setTimeout(() => {
          handleClose();
          onSuccess();
        }, 3000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create wallet');
        setStep('form');
      }
    } catch (error: any) {
      console.error('Error creating wallet:', error);
      toast.error('Error creating wallet: ' + error.message);
      setStep('form');
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const handleClose = () => {
    setWalletPassword("");
    setConfirmPassword("");
    setStep('form');
    setWalletInfo(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <Card className="bg-gray-900/95 backdrop-blur-md border-gray-700">
            {step === 'form' && (
              <>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    Create Your Blockchain Wallet
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Set up a secure wallet to store your health tokens (DRST, VSC) and cryptocurrencies.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-blue-500/10 border-blue-500/20">
                    <AlertCircle className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-300">
                      Your wallet will be encrypted with your password. Keep it safe and secure!
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="wallet-password" className="text-white text-sm flex items-center gap-2 mb-1">
                        <Key className="w-4 h-4" />
                        Wallet Password
                      </label>
                      <Input
                        id="wallet-password"
                        type="password"
                        value={walletPassword}
                        onChange={(e) => setWalletPassword(e.target.value)}
                        placeholder="Enter a secure password (min 8 characters)"
                        className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                        disabled={isCreatingWallet}
                      />
                    </div>

                    <div>
                      <label htmlFor="confirm-password" className="text-white text-sm flex items-center gap-2 mb-1">
                        <Lock className="w-4 h-4" />
                        Confirm Password
                      </label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                        disabled={isCreatingWallet}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      disabled={isCreatingWallet}
                      className="flex-1 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createWallet}
                      disabled={isCreatingWallet || !walletPassword || !confirmPassword}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Create Wallet
                    </Button>
                  </div>
                </CardContent>
              </>
            )}

            {step === 'creating' && (
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Creating Your Wallet</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Generating secure keys and setting up your blockchain wallet...
                    </p>
                  </div>
                </div>
              </CardContent>
            )}

            {step === 'success' && walletInfo && (
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Wallet Created Successfully!</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Your blockchain wallet is ready to use.
                    </p>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Wallet className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">Ethereum Address:</span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono break-all">
                      {walletInfo.eth_address}
                    </p>
                  </div>

                  <p className="text-xs text-gray-500">
                    Redirecting to your wallet dashboard...
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
