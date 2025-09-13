"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, Loader2, Wallet, Shield, Clock, Globe } from "lucide-react";

interface TestResult {
  name: string;
  status: "pending" | "success" | "error" | "warning";
  message: string;
  details?: string;
}

export default function MetaMaskTestSuite() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: "MetaMask Detection", status: "pending", message: "Checking if MetaMask is installed..." },
    { name: "Wallet Connection", status: "pending", message: "Testing wallet connection..." },
    { name: "Account Access", status: "pending", message: "Verifying account access..." },
    { name: "Network Check", status: "pending", message: "Checking network configuration..." },
    { name: "Signature Test", status: "pending", message: "Testing message signing..." },
    { name: "Backend Authentication", status: "pending", message: "Testing backend auth flow..." },
    { name: "Session Persistence", status: "pending", message: "Checking session storage..." },
    { name: "Error Handling", status: "pending", message: "Testing error scenarios..." },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState(0);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ));
  };

  const runTests = async () => {
    setIsRunning(true);
    setCurrentTest(0);

    // Test 1: MetaMask Detection
    try {
      if (typeof window.ethereum !== 'undefined') {
        updateTest(0, { 
          status: "success", 
          message: "MetaMask detected successfully",
          details: `Provider: ${window.ethereum.isMetaMask ? 'MetaMask' : 'Unknown'}`
        });
      } else {
        updateTest(0, { 
          status: "error", 
          message: "MetaMask not detected",
          details: "Please install MetaMask browser extension"
        });
        setIsRunning(false);
        return;
      }
    } catch (error) {
      updateTest(0, { 
        status: "error", 
        message: "Error detecting MetaMask",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    setCurrentTest(1);

    // Test 2: Wallet Connection
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        updateTest(1, { 
          status: "success", 
          message: "Wallet connected successfully",
          details: `Connected account: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`
        });
      } else {
        updateTest(1, { 
          status: "error", 
          message: "No accounts found",
          details: "User may have denied connection"
        });
      }
    } catch (error: any) {
      updateTest(1, { 
        status: "error", 
        message: "Failed to connect wallet",
        details: error.message || "Connection rejected"
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    setCurrentTest(2);

    // Test 3: Account Access
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        updateTest(2, { 
          status: "success", 
          message: "Account access verified",
          details: `Active account: ${accounts[0]}`
        });
      } else {
        updateTest(2, { 
          status: "warning", 
          message: "No active accounts",
          details: "User needs to connect wallet first"
        });
      }
    } catch (error: any) {
      updateTest(2, { 
        status: "error", 
        message: "Failed to access accounts",
        details: error.message
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    setCurrentTest(3);

    // Test 4: Network Check
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const networkName = getNetworkName(chainId);
      updateTest(3, { 
        status: "success", 
        message: `Connected to ${networkName}`,
        details: `Chain ID: ${chainId}`
      });
    } catch (error: any) {
      updateTest(3, { 
        status: "error", 
        message: "Failed to get network info",
        details: error.message
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    setCurrentTest(4);

    // Test 5: Signature Test
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        const message = `Test signature - ${new Date().toISOString()}`;
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, accounts[0]]
        });
        
        updateTest(4, { 
          status: "success", 
          message: "Message signed successfully",
          details: `Signature: ${signature.substring(0, 10)}...`
        });
      } else {
        updateTest(4, { 
          status: "error", 
          message: "No account available for signing"
        });
      }
    } catch (error: any) {
      updateTest(4, { 
        status: "error", 
        message: "Signature failed",
        details: error.message
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    setCurrentTest(5);

    // Test 6: Backend Authentication
    try {
      const response = await fetch('/api/wallet/test');
      if (response.ok) {
        const data = await response.json();
        updateTest(5, { 
          status: "success", 
          message: "Backend connection successful",
          details: `Endpoints available: ${data.endpoints?.length || 0}`
        });
      } else {
        updateTest(5, { 
          status: "error", 
          message: "Backend connection failed",
          details: `HTTP ${response.status}`
        });
      }
    } catch (error: any) {
      updateTest(5, { 
        status: "error", 
        message: "Backend unreachable",
        details: error.message
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    setCurrentTest(6);

    // Test 7: Session Persistence
    try {
      const testData = { timestamp: Date.now(), test: "metamask" };
      localStorage.setItem('metamask_test', JSON.stringify(testData));
      const retrieved = localStorage.getItem('metamask_test');
      
      if (retrieved && JSON.parse(retrieved).test === "metamask") {
        updateTest(6, { 
          status: "success", 
          message: "Session storage working",
          details: "LocalStorage read/write successful"
        });
      } else {
        updateTest(6, { 
          status: "error", 
          message: "Session storage failed"
        });
      }
    } catch (error: any) {
      updateTest(6, { 
        status: "error", 
        message: "Session storage error",
        details: error.message
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    setCurrentTest(7);

    // Test 8: Error Handling
    try {
      // Test invalid method call
      try {
        await window.ethereum.request({ method: 'invalid_method' });
        updateTest(7, { 
          status: "warning", 
          message: "Error handling needs improvement",
          details: "Invalid method should have thrown error"
        });
      } catch (expectedError) {
        updateTest(7, { 
          status: "success", 
          message: "Error handling working correctly",
          details: "Invalid methods properly rejected"
        });
      }
    } catch (error: any) {
      updateTest(7, { 
        status: "error", 
        message: "Error handling test failed",
        details: error.message
      });
    }

    setIsRunning(false);
    setCurrentTest(-1);
  };

  const getNetworkName = (chainId: string) => {
    const networks: { [key: string]: string } = {
      '0x1': 'Ethereum Mainnet',
      '0x3': 'Ropsten Testnet',
      '0x4': 'Rinkeby Testnet',
      '0x5': 'Goerli Testnet',
      '0x89': 'Polygon Mainnet',
      '0x13881': 'Polygon Mumbai',
    };
    return networks[chainId] || `Unknown Network (${chainId})`;
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  const getTestIcon = (index: number) => {
    const icons = [Wallet, Wallet, Shield, Globe, Shield, Wallet, Clock, AlertCircle];
    const Icon = icons[index];
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 glass rounded-xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">MetaMask Test Suite</h2>
        <p className="text-gray-300">Comprehensive testing of MetaMask integration</p>
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={runTests}
          disabled={isRunning}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            "Run All Tests"
          )}
        </button>
      </div>

      <div className="space-y-4">
        {tests.map((test, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border transition-all ${
              currentTest === index 
                ? 'border-blue-400 bg-blue-500/10' 
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-gray-400">
                  {getTestIcon(index)}
                </div>
                <div>
                  <div className="font-medium text-white">{test.name}</div>
                  <div className="text-sm text-gray-300">{test.message}</div>
                  {test.details && (
                    <div className="text-xs text-gray-400 mt-1">{test.details}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                {getStatusIcon(test.status)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
