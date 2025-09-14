"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function WalletAPITestPage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('testpassword123');

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testWalletCreateEndpoint = async () => {
    setLoading(true);
    try {
      // Check if we have a token first
      const token = localStorage.getItem("token") ||
                    localStorage.getItem("access_token") ||
                    localStorage.getItem("auth_token") ||
                    localStorage.getItem("hackloop_auth_token");

      if (!token) {
        addResult(`❌ No authentication token found. Please log in first.`);
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/blockchain/wallet/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      const data = await response.text();

      if (response.ok) {
        addResult(`✅ Wallet create test successful: ${data}`);
      } else {
        addResult(`❌ Wallet create test failed (${response.status}): ${data}`);
      }
    } catch (error) {
      addResult(`❌ Wallet create test error: ${error}`);
    }
    setLoading(false);
  };

  const testWalletCreateWithProxy = async () => {
    setLoading(true);
    try {
      // Test using Next.js proxy
      const response = await fetch('/api/blockchain/wallet/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      const data = await response.text();
      
      if (response.ok) {
        addResult(`✅ Proxy wallet create test successful: ${data}`);
      } else {
        addResult(`❌ Proxy wallet create test failed (${response.status}): ${data}`);
      }
    } catch (error) {
      addResult(`❌ Proxy wallet create test error: ${error}`);
    }
    setLoading(false);
  };

  const testWalletBalances = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/blockchain/wallet/balances`);

      const data = await response.text();
      
      if (response.ok) {
        addResult(`✅ Wallet balances test successful: ${data}`);
      } else {
        addResult(`❌ Wallet balances test failed (${response.status}): ${data}`);
      }
    } catch (error) {
      addResult(`❌ Wallet balances test error: ${error}`);
    }
    setLoading(false);
  };

  const checkAuthStatus = () => {
    const token = localStorage.getItem("token") ||
                  localStorage.getItem("access_token") ||
                  localStorage.getItem("auth_token") ||
                  localStorage.getItem("hackloop_auth_token");

    if (token) {
      addResult(`✅ Authentication token found: ${token.substring(0, 20)}...`);
    } else {
      addResult(`❌ No authentication token found. Please log in at /login first.`);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Wallet API Test</CardTitle>
            <CardDescription className="text-white/80">
              Test wallet creation and balance API endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-white">Test Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter test password"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={checkAuthStatus}
                disabled={loading}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Check Auth
              </Button>

              <Button
                onClick={testWalletCreateEndpoint}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Test Direct API
              </Button>

              <Button
                onClick={testWalletCreateWithProxy}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Test Proxy API
              </Button>

              <Button
                onClick={testWalletBalances}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Test Balances
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={clearResults} 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Clear Results
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="text-white font-medium">Test Results:</h3>
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

            <Alert className="bg-yellow-500/10 border-yellow-500/20">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-100">
                <strong>Note:</strong> The wallet creation endpoint requires JWT authentication. 
                Without a valid token, you'll see "Invalid token" errors, which is expected behavior.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
