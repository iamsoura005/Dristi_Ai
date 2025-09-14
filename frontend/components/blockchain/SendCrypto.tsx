'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SendCryptoProps {
  onSuccess?: () => void;
}

const SendCrypto: React.FC<SendCryptoProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    type: '',
    toAddress: '',
    amount: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');

  const cryptoTypes = [
    { value: 'ETH', label: 'Ethereum (ETH)', description: 'Native Ethereum cryptocurrency' },
    { value: 'DRST', label: 'DRST Coins', description: 'Dristi AI reward tokens' },
    { value: 'VSC', label: 'VisionCoins (VSC)', description: 'Health-based tokens' },
    { value: 'BTC', label: 'Bitcoin (BTC)', description: 'Digital gold' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.type) return 'Please select a cryptocurrency type';
    if (!formData.toAddress) return 'Please enter a recipient address';
    if (!formData.amount || parseFloat(formData.amount) <= 0) return 'Please enter a valid amount';
    if (!formData.password) return 'Please enter your wallet password';

    // Basic address validation
    if (formData.type === 'BTC') {
      // Bitcoin address validation (simplified)
      if (!formData.toAddress.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) && 
          !formData.toAddress.match(/^bc1[a-z0-9]{39,59}$/)) {
        return 'Invalid Bitcoin address format';
      }
    } else {
      // Ethereum address validation
      if (!formData.toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return 'Invalid Ethereum address format';
      }
    }

    return null;
  };

  const handleSend = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    setTxHash('');

    try {
      const response = await fetch('/api/blockchain/wallet/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          type: formData.type,
          to_address: formData.toAddress,
          amount: formData.amount,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTxHash(data.transaction_hash);
        toast.success(`${formData.type} sent successfully!`);
        
        // Reset form
        setFormData({
          type: '',
          toAddress: '',
          amount: '',
          password: '',
        });

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(data.error || 'Failed to send transaction');
      }
    } catch (error) {
      console.error('Error sending crypto:', error);
      toast.error('Error sending transaction');
    } finally {
      setLoading(false);
    }
  };

  const getExplorerUrl = (hash: string, type: string): string => {
    if (type === 'BTC') {
      return `https://blockstream.info/testnet/tx/${hash}`;
    } else {
      // Ethereum (Goerli testnet)
      return `https://goerli.etherscan.io/tx/${hash}`;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Cryptocurrency
          </CardTitle>
          <CardDescription>
            Send your digital assets to another wallet address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cryptocurrency Type */}
          <div className="space-y-2">
            <label htmlFor="crypto-type" className="text-sm font-medium">Cryptocurrency Type</label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select cryptocurrency" />
              </SelectTrigger>
              <SelectContent>
                {cryptoTypes.map((crypto) => (
                  <SelectItem key={crypto.value} value={crypto.value}>
                    <div>
                      <div className="font-medium">{crypto.label}</div>
                      <div className="text-sm text-muted-foreground">{crypto.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Address */}
          <div className="space-y-2">
            <label htmlFor="to-address" className="text-sm font-medium">Recipient Address</label>
            <Input
              id="to-address"
              placeholder={
                formData.type === 'BTC' 
                  ? 'Enter Bitcoin address (e.g., 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa)'
                  : 'Enter Ethereum address (e.g., 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6)'
              }
              value={formData.toAddress}
              onChange={(e) => handleInputChange('toAddress', e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">Amount</label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
            />
            {formData.type && (
              <p className="text-sm text-muted-foreground">
                Amount in {formData.type}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Wallet Password</label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your wallet password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Required to decrypt your private keys for signing
            </p>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={loading || !formData.type || !formData.toAddress || !formData.amount || !formData.password}
            className="w-full"
            size="lg"
          >
            {loading ? 'Sending...' : `Send ${formData.type || 'Crypto'}`}
          </Button>
        </CardContent>
      </Card>

      {/* Transaction Success */}
      {txHash && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Transaction Sent Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="font-medium text-green-800">Transaction Hash</p>
              <p className="text-sm text-green-600 font-mono break-all">
                {txHash}
              </p>
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(getExplorerUrl(txHash, formData.type), '_blank')}
            >
              View on Block Explorer
            </Button>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your transaction has been submitted to the network. It may take a few minutes to confirm.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Important Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Double-check the recipient address</p>
              <p className="text-sm text-muted-foreground">
                Cryptocurrency transactions are irreversible. Make sure the address is correct.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Network fees apply</p>
              <p className="text-sm text-muted-foreground">
                Small network fees will be deducted from your balance for processing.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Confirmation time varies</p>
              <p className="text-sm text-muted-foreground">
                Bitcoin transactions may take 10-60 minutes, Ethereum transactions typically take 1-5 minutes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SendCrypto;
