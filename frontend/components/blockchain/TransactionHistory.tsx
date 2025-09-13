'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, ExternalLink, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Transaction {
  hash: string;
  type: string;
  amount: number;
  timestamp: string;
  confirmations: number;
  direction?: 'sent' | 'received';
  to?: string;
  from?: string;
}

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactionHistory();
  }, []);

  const fetchTransactionHistory = async () => {
    try {
      const response = await fetch('/api/blockchain/wallet/transactions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      } else {
        toast.error('Failed to fetch transaction history');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Error fetching transaction history');
    } finally {
      setLoading(false);
    }
  };

  const getExplorerUrl = (hash: string, type: string): string => {
    if (type === 'BTC') {
      return `https://blockstream.info/testnet/tx/${hash}`;
    } else {
      return `https://goerli.etherscan.io/tx/${hash}`;
    }
  };

  const formatDate = (timestamp: string): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (confirmations: number, type: string) => {
    const requiredConfirmations = type === 'BTC' ? 3 : 12;
    
    if (confirmations >= requiredConfirmations) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Confirmed</Badge>;
    } else if (confirmations > 0) {
      return <Badge variant="secondary">Pending ({confirmations}/{requiredConfirmations})</Badge>;
    } else {
      return <Badge variant="outline">Unconfirmed</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Transaction History
        </CardTitle>
        <CardDescription>
          View all your cryptocurrency transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No transactions found</p>
            <p className="text-sm text-gray-400">
              Your transaction history will appear here once you start using your wallet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx, index) => (
              <div
                key={tx.hash || index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    {tx.direction === 'sent' ? (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {tx.direction === 'sent' ? 'Sent' : 'Received'} {tx.type}
                      </p>
                      {getStatusBadge(tx.confirmations, tx.type)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(tx.timestamp)}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      {tx.hash.substring(0, 20)}...
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-medium ${
                    tx.direction === 'sent' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {tx.direction === 'sent' ? '-' : '+'}{tx.amount} {tx.type}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(getExplorerUrl(tx.hash, tx.type), '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
