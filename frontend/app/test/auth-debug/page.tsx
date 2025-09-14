"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, User, Wallet } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { authService } from '@/lib/auth';

export default function AuthDebugPage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const { user, isAuthenticated, loginWithWallet, logout } = useAuth();

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBackendAuth = async () => {
    setLoading(true);
    try {
      addResult('🔍 Testing backend authentication endpoints...');
      
      // Test registration first
      const registerResponse = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          first_name: 'Test',
          last_name: 'User',
          role: 'patient'
        })
      });

      if (registerResponse.ok) {
        addResult('✅ Registration endpoint working');
      } else if (registerResponse.status === 400) {
        addResult('⚠️ User might already exist (expected)');
      } else {
        addResult(`❌ Registration failed: ${registerResponse.status}`);
      }

      // Test login
      const loginResponse = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (loginResponse.ok) {
        const data = await loginResponse.json();
        addResult('✅ Login endpoint working');
        addResult(`🎉 Token received: ${data.access_token.substring(0, 20)}...`);
        
        // Store token temporarily for testing
        localStorage.setItem('test_token', data.access_token);
        
        // Test /auth/me endpoint
        const meResponse = await fetch('http://localhost:5000/auth/me', {
          headers: { 'Authorization': `Bearer ${data.access_token}` }
        });
        
        if (meResponse.ok) {
          const userData = await meResponse.json();
          addResult(`✅ /auth/me working: ${userData.user.first_name} ${userData.user.last_name}`);
        } else {
          addResult(`❌ /auth/me failed: ${meResponse.status}`);
        }
      } else {
        addResult(`❌ Login failed: ${loginResponse.status}`);
      }
    } catch (error) {
      addResult(`❌ Backend auth test error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuthService = async () => {
    setLoading(true);
    try {
      addResult('🔧 Testing AuthService...');
      
      // Test login through auth service
      const result = await authService.login(email, password);
      addResult(`✅ AuthService login successful: ${result.user.first_name} ${result.user.last_name}`);
      addResult(`🔑 Token stored: ${result.access_token.substring(0, 20)}...`);
      
      // Test isAuthenticated
      const isAuth = authService.isAuthenticated();
      addResult(`✅ isAuthenticated: ${isAuth}`);
      
      // Test getCurrentUser
      const currentUser = await authService.getCurrentUser();
      addResult(`✅ getCurrentUser: ${currentUser.first_name} ${currentUser.last_name}`);
      
    } catch (error) {
      addResult(`❌ AuthService test error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testMetaMaskAuth = async () => {
    setLoading(true);
    try {
      addResult('🦊 Testing MetaMask authentication...');
      
      const walletAuthResponse = await loginWithWallet();
      addResult(`✅ MetaMask auth successful!`);
      addResult(`👤 User: ${walletAuthResponse.user.first_name} ${walletAuthResponse.user.last_name}`);
      addResult(`🔑 Token: ${walletAuthResponse.access_token.substring(0, 20)}...`);
      addResult(`🆕 New user: ${walletAuthResponse.is_new_user}`);
      
    } catch (error) {
      addResult(`❌ MetaMask auth error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogout = async () => {
    try {
      addResult('🚪 Testing logout...');
      await logout();
      addResult('✅ Logout successful');
    } catch (error) {
      addResult(`❌ Logout error: ${error}`);
    }
  };

  const checkCurrentAuth = () => {
    addResult(`🔍 Current auth status:`);
    addResult(`  - isAuthenticated: ${isAuthenticated}`);
    addResult(`  - user: ${user ? `${user.first_name} ${user.last_name}` : 'null'}`);
    addResult(`  - user role: ${user?.role || 'none'}`);
    
    const token = authService.getToken();
    addResult(`  - token: ${token ? `${token.substring(0, 20)}...` : 'none'}`);
    addResult(`  - token valid: ${token ? authService.isTokenValid(token) : 'N/A'}`);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-2xl flex items-center gap-2">
              <User className="w-6 h-6" />
              Authentication Debug
            </CardTitle>
            <CardDescription className="text-white/80">
              Debug and test authentication flows (traditional and MetaMask)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAuthenticated && user && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-100">
                  <strong>Authenticated:</strong> {user.first_name} {user.last_name} ({user.role})
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-white">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={testBackendAuth} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Test Backend
              </Button>

              <Button 
                onClick={testAuthService} 
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Test AuthService
              </Button>

              <Button 
                onClick={testMetaMaskAuth} 
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wallet className="w-4 h-4 mr-2" />}
                Test MetaMask
              </Button>

              <Button 
                onClick={checkCurrentAuth} 
                className="bg-purple-600 hover:bg-purple-700"
              >
                Check Status
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={testLogout} 
                disabled={!isAuthenticated}
                variant="outline"
                className="border-red-500/20 text-red-300 hover:bg-red-500/10"
              >
                Test Logout
              </Button>

              <Button 
                onClick={clearResults} 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Clear Results
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
