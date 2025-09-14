"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function APITestPage() {
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testHealthEndpoint = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/health')
      if (response.ok) {
        const data = await response.json()
        addResult(`✅ Health check successful: ${JSON.stringify(data.status)}`)
      } else {
        addResult(`❌ Health check failed: ${response.status}`)
      }
    } catch (error) {
      addResult(`❌ Health check error: ${error}`)
    }
    setLoading(false)
  }

  const testWalletEndpoint = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/wallet/test')
      if (response.ok) {
        const data = await response.json()
        addResult(`✅ Wallet test successful: ${data.message}`)
      } else {
        addResult(`❌ Wallet test failed: ${response.status}`)
      }
    } catch (error) {
      addResult(`❌ Wallet test error: ${error}`)
    }
    setLoading(false)
  }

  const testNonceEndpoint = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/wallet/nonce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: '0x1234567890123456789012345678901234567890'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        addResult(`✅ Nonce test successful: ${data.nonce}`)
      } else {
        const errorData = await response.json()
        addResult(`❌ Nonce test failed: ${JSON.stringify(errorData)}`)
      }
    } catch (error) {
      addResult(`❌ Nonce test error: ${error}`)
    }
    setLoading(false)
  }

  const testProxyEndpoint = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/wallet/test')
      if (response.ok) {
        const data = await response.json()
        addResult(`✅ Proxy test successful: ${data.message}`)
      } else {
        addResult(`❌ Proxy test failed: ${response.status}`)
      }
    } catch (error) {
      addResult(`❌ Proxy test error: ${error}`)
    }
    setLoading(false)
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-2xl">API Connection Test</CardTitle>
            <CardDescription className="text-white/80">
              Test frontend to backend API connectivity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={testHealthEndpoint} 
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                Test Health Endpoint
              </Button>
              
              <Button 
                onClick={testWalletEndpoint} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Test Wallet Endpoint
              </Button>
              
              <Button 
                onClick={testNonceEndpoint} 
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Test Nonce Endpoint
              </Button>
              
              <Button 
                onClick={testProxyEndpoint} 
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Test Proxy Endpoint
              </Button>
            </div>
            
            <div className="flex justify-between items-center">
              <h3 className="text-white text-lg font-semibold">Test Results:</h3>
              <Button 
                onClick={clearResults} 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Clear Results
              </Button>
            </div>
            
            <div className="bg-black/20 rounded-lg p-4 max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-white/60">No tests run yet. Click a button above to test API connectivity.</p>
              ) : (
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <div key={index} className="text-sm font-mono text-white/90">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
