'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, FileText, Eye, Calendar, Download } from 'lucide-react';
import { toast } from 'sonner';

interface HealthRecord {
  recordId: number;
  patientAddress: string;
  ipfsHash: string;
  timestamp: number;
  recordType: string;
  isActive: boolean;
  data?: {
    record_type: string;
    test_results: any;
    doctor_notes: string;
    recommendations: string[];
    created_at: string;
  };
}

const HealthPassport: React.FC = () => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthRecords();
  }, []);

  const fetchHealthRecords = async () => {
    try {
      const response = await fetch('/api/blockchain/health-passport/records', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      } else {
        toast.error('Failed to fetch health records');
      }
    } catch (error) {
      console.error('Error fetching health records:', error);
      toast.error('Error fetching health records');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRecordTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'eye_test':
        return <Eye className="w-5 h-5" />;
      case 'prescription':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getRecordTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'eye_test':
        return <Badge className="bg-blue-100 text-blue-800">Eye Test</Badge>;
      case 'prescription':
        return <Badge className="bg-green-100 text-green-800">Prescription</Badge>;
      case 'diagnosis':
        return <Badge className="bg-purple-100 text-purple-800">Diagnosis</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const downloadRecord = (record: HealthRecord) => {
    if (record.data) {
      const dataStr = JSON.stringify(record.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `health_record_${record.recordId}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Digital Health Passport
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Digital Health Passport
          </CardTitle>
          <CardDescription>
            Your secure, immutable health records stored on blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No health records found</p>
              <p className="text-sm text-gray-400">
                Your health records will appear here after completing tests
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.recordId}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {getRecordTypeIcon(record.recordType)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">
                            Health Record #{record.recordId}
                          </h3>
                          {getRecordTypeBadge(record.recordType)}
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(record.timestamp)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="font-mono text-xs">
                              IPFS: {record.ipfsHash.substring(0, 20)}...
                            </span>
                          </div>
                        </div>

                        {record.data && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <h4 className="font-medium text-sm mb-2">Record Details</h4>
                            
                            {record.data.test_results && (
                              <div className="mb-2">
                                <p className="text-xs text-gray-500">Test Results:</p>
                                <p className="text-sm">
                                  {record.data.test_results.condition || 'Normal'}
                                  {record.data.test_results.confidence && (
                                    <span className="text-gray-500 ml-2">
                                      ({Math.round(record.data.test_results.confidence * 100)}% confidence)
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}

                            {record.data.doctor_notes && (
                              <div className="mb-2">
                                <p className="text-xs text-gray-500">Doctor's Notes:</p>
                                <p className="text-sm">{record.data.doctor_notes}</p>
                              </div>
                            )}

                            {record.data.recommendations && record.data.recommendations.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500">Recommendations:</p>
                                <ul className="text-sm list-disc list-inside">
                                  {record.data.recommendations.map((rec, index) => (
                                    <li key={index}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadRecord(record)}
                        disabled={!record.data}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Digital Health Passport</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Immutable Records</p>
              <p className="text-sm text-muted-foreground">
                Your health records are permanently stored on blockchain and cannot be altered or deleted
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Decentralized Storage</p>
              <p className="text-sm text-muted-foreground">
                Detailed health data is stored on IPFS for privacy and accessibility
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Controlled Access</p>
              <p className="text-sm text-muted-foreground">
                Only you and authorized emergency doctors can access your records
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthPassport;
