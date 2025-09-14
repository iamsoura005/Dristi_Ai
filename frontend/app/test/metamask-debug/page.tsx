"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, Wallet } from 'lucide-react';
import { metaMaskAuthService } from '@/lib/metamask-auth';

export default function MetaMaskDebugPage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    checkMetaMaskStatus();
  }, []);

  const checkMetaMaskStatus = async () => {
    try {
      if (metaMaskAuthService.isMetaMaskInstalled()) {
        addResult('✅ MetaMask is installed');
        const account = await metaMaskAuthService.getCurrentAccount();
        if (account) {
          setCurrentAccount(account);
          addResult(`✅ MetaMask connected to: ${account}`);
        } else {
          addResult('⚠️ MetaMask not connected');
        }
      } else {
        addResult('❌ MetaMask not installed');
      }
    } catch (error) {
      addResult(`❌ Error checking MetaMask: ${error}`);
    }
  };

  const testBackendConnectivity = async () => {
    setLoading(true);
    try {
      addResult('🔍 Testing backend connectivity...');
      
      // Test health endpoint
      const healthResponse = await fetch('http://localhost:5000/health');
      if (healthResponse.ok) {
        addResult('✅ Backend health check passed');
      } else {
        addResult(`❌ Backend health check failed: ${healthResponse.status}`);
        return;
      }

      // Test wallet endpoints
      const walletTestResponse = await fetch('http://localhost:5000/api/wallet/test');
      if (walletTestResponse.ok) {
        const data = await walletTestResponse.json();
        addResult(`✅ Wallet endpoints available: ${data.message}`);
      } else {
        addResult(`❌ Wallet endpoints failed: ${walletTestResponse.status}`);
      }
    } catch (error) {
      addResult(`❌ Backend connectivity error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testWalletConnection = async () => {
    setLoading(true);
    try {
      addResult('🔗 Testing wallet connection...');
      const account = await metaMaskAuthService.connectWallet();
      setCurrentAccount(account);
      addResult(`✅ Wallet connected: ${account}`);
    } catch (error) {
      addResult(`❌ Wallet connection failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testNonceGeneration = async () => {
    if (!currentAccount) {
      addResult('❌ Please connect wallet first');
      return;
    }

    setLoading(true);
    try {
      addResult('🔑 Testing nonce generation...');
      const { message, nonce } = await metaMaskAuthService.getNonce(currentAccount);
      addResult(`✅ Nonce generated: ${nonce}`);
      addResult(`📝 Message to sign: ${message.substring(0, 50)}...`);
    } catch (error) {
      addResult(`❌ Nonce generation failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testFullAuthFlow = async () => {
    setLoading(true);
    try {
      addResult('🚀 Starting full authentication flow...');

      // Check connection state first
      const connectionState = metaMaskAuthService.getConnectionState();
      addResult(`🔍 Connection state: connecting=${connectionState.isConnecting}, authenticating=${connectionState.isAuthenticating}`);

      if (connectionState.isConnecting || connectionState.isAuthenticating) {
        addResult('⚠️ Already connecting/authenticating, waiting...');
        return;
      }

      // Step 1: Connect wallet
      addResult('📱 Step 1: Connecting wallet...');
      const walletAddress = await metaMaskAuthService.connectWallet();
      setCurrentAccount(walletAddress);
      addResult(`✅ Wallet connected: ${walletAddress}`);

      // Step 2: Get nonce
      addResult('🔑 Step 2: Getting nonce...');
      const { message, nonce } = await metaMaskAuthService.getNonce(walletAddress);
      addResult(`✅ Nonce received: ${nonce}`);

      // Step 3: Sign message
      addResult('✍️ Step 3: Signing message...');
      const signature = await metaMaskAuthService.signMessage(message, walletAddress);
      addResult(`✅ Message signed: ${signature.substring(0, 20)}...`);

      // Step 4: Verify signature
      addResult('🔐 Step 4: Verifying signature...');
      const authResponse = await metaMaskAuthService.verifySignature(walletAddress, signature, message);
      addResult(`✅ Authentication successful!`);
      addResult(`🎉 Access token received: ${authResponse.access_token.substring(0, 20)}...`);
      addResult(`👤 User: ${authResponse.user.first_name} ${authResponse.user.last_name}`);

      // Store token in localStorage
      localStorage.setItem('hackloop_auth_token', authResponse.access_token);
      addResult(`💾 Token stored in localStorage`);

    } catch (error) {
      addResult(`❌ Authentication flow failed: ${error}`);
      // Reset state on error
      metaMaskAuthService.resetConnectionState();
      addResult(`🔄 Connection state reset`);
    } finally {
      setLoading(false);
    }
  };

  const checkStoredAuth = () => {
    const token = localStorage.getItem('hackloop_auth_token') ||
                  localStorage.getItem('auth_token') ||
                  localStorage.getItem('access_token') ||
                  localStorage.getItem('token');
    
    if (token) {
      addResult(`✅ Auth token found: ${token.substring(0, 20)}...`);
    } else {
      addResult('❌ No auth token found in localStorage');
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const clearAuth = () => {
    localStorage.removeItem('hackloop_auth_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    addResult('🗑️ Cleared all auth tokens');
  };

  const testRaceCondition = async () => {
    addResult('🏁 Testing race condition protection...');

    // Trigger multiple simultaneous connection attempts
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(
        metaMaskAuthService.connectWallet()
          .then(address => addResult(`✅ Connection ${i + 1} successful: ${address}`))
          .catch(error => addResult(`❌ Connection ${i + 1} failed: ${error.message}`))
      );
    }

    addResult('🚀 Started 3 simultaneous connection attempts...');
    await Promise.allSettled(promises);
    addResult('🏁 Race condition test completed');
  };

  const checkConnectionState = () => {
    const state = metaMaskAuthService.getConnectionState();
    addResult(`🔍 Connection State:`);
    addResult(`  - isConnecting: ${state.isConnecting}`);
    addResult(`  - isAuthenticating: ${state.isAuthenticating}`);
  };

  const resetConnectionState = () => {
    metaMaskAuthService.resetConnectionState();
    addResult('🔄 Connection state reset manually');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-2xl flex items-center gap-2">
              <Wallet className="w-6 h-6" />
              MetaMask Authentication Debug
            </CardTitle>
            <CardDescription className="text-white/80">
              Debug and test MetaMask authentication flow step by step
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentAccount && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-100">
                  <strong>Connected:</strong> {currentAccount}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={testBackendConnectivity}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Test Backend
              </Button>

              <Button
                onClick={testWalletConnection}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Connect Wallet
              </Button>

              <Button
                onClick={testNonceGeneration}
                disabled={loading || !currentAccount}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Test Nonce
              </Button>

              <Button
                onClick={testFullAuthFlow}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Full Auth Flow
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={testRaceCondition}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                Test Race Condition
              </Button>

              <Button
                onClick={checkConnectionState}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Check State
              </Button>

              <Button
                onClick={resetConnectionState}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Reset State
              </Button>

              <Button
                onClick={clearResults}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Clear Results
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={checkStoredAuth}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Check Auth
              </Button>

              <Button
                onClick={clearAuth}
                variant="outline"
                className="border-red-500/20 text-red-300 hover:bg-red-500/10"
              >
                Clear Auth
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="text-white font-medium">Debug Results:</h3>
              <div className="bg-black/20 rounded-lg p-4 max-h-96 overflow-y-auto">
                {results.length === 0 ? (
                  <p className="text-white/60">No tests run yet...</p>
                ) : (
                  results.map((result, index) => (
                    <div key={index} className="text-sm text-white/90 font-mono mb-1">
                      {result}
                    </div>
                  ))
                )}
              </div>
            </div>

            <Alert className="bg-blue-500/10 border-blue-500/20">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-100">
                <strong>Instructions:</strong> 
                <br />1. Test Backend - Verify backend connectivity
                <br />2. Connect Wallet - Connect to MetaMask
                <br />3. Test Nonce - Generate authentication nonce
                <br />4. Full Auth Flow - Complete authentication process
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
