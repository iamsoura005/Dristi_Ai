"use client"

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { Switch } from './switch'
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Key,
  Eye,
  EyeOff,
  Smartphone,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Trash2,
  Settings,
  Activity,
  FileText,
  Users,
  Database
} from 'lucide-react'

interface SecurityScore {
  score: number
  level: string
  color: string
  recommendations: Array<{
    type: string
    message: string
    priority: string
  }>
}

interface PrivacySettings {
  data_sharing_analytics: boolean
  data_sharing_research: boolean
  marketing_communications: boolean
  appointment_reminders: boolean
  family_data_sharing: boolean
  doctor_data_sharing: boolean
  data_retention_period: number
}

interface AuditLog {
  timestamp: string
  resource_type: string
  action: string
  ip_address: string
  additional_data?: any
}

export function SecurityDashboard() {
  const { t } = useTranslation()
  const [securityScore, setSecurityScore] = useState<SecurityScore | null>(null)
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [mfaSetupOpen, setMfaSetupOpen] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [mfaSecret, setMfaSecret] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  useEffect(() => {
    fetchSecurityData()
  }, [])

  const fetchSecurityData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const headers = { 'Authorization': `Bearer ${token}` }

      // Fetch security score
      const scoreResponse = await fetch('/api/security/security/score', { headers })
      if (scoreResponse.ok) {
        const scoreData = await scoreResponse.json()
        setSecurityScore(scoreData.security_score)
      }

      // Fetch privacy settings
      const privacyResponse = await fetch('/api/security/privacy/settings', { headers })
      if (privacyResponse.ok) {
        const privacyData = await privacyResponse.json()
        setPrivacySettings(privacyData.settings)
      }

      // Fetch recent audit logs
      const logsResponse = await fetch('/api/security/audit/logs?limit=10', { headers })
      if (logsResponse.ok) {
        const logsData = await logsResponse.json()
        setAuditLogs(logsData.logs)
      }

    } catch (error) {
      console.error('Error fetching security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupMFA = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/security/mfa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setQrCode(data.qr_code)
        setMfaSecret(data.secret)
        setBackupCodes(data.backup_codes)
        setMfaSetupOpen(true)
      }
    } catch (error) {
      console.error('Error setting up MFA:', error)
    }
  }

  const updatePrivacySetting = async (setting: string, value: boolean | number) => {
    try {
      const token = localStorage.getItem('auth_token')
      const updatedSettings = { ...privacySettings, [setting]: value }
      
      const response = await fetch('/api/security/privacy/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: updatedSettings })
      })

      if (response.ok) {
        setPrivacySettings(updatedSettings)
      }
    } catch (error) {
      console.error('Error updating privacy setting:', error)
    }
  }

  const exportData = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/security/data/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Download the data as JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dristi-data-export-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  const requestDataDeletion = async () => {
    if (!confirm('Are you sure you want to request deletion of all your data? This action cannot be undone.')) {
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/security/data/deletion-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'User requested account deletion' })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Data deletion request submitted. Request ID: ${data.request_id}`)
      }
    } catch (error) {
      console.error('Error requesting data deletion:', error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (level: string) => {
    switch (level) {
      case 'excellent':
        return <ShieldCheck className="h-8 w-8 text-green-600" />
      case 'good':
        return <Shield className="h-8 w-8 text-blue-600" />
      case 'fair':
        return <ShieldAlert className="h-8 w-8 text-yellow-600" />
      default:
        return <ShieldAlert className="h-8 w-8 text-red-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          {securityScore && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {getScoreIcon(securityScore.level)}
                <div>
                  <div className={`text-3xl font-bold ${getScoreColor(securityScore.score)}`}>
                    {securityScore.score}/100
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    {securityScore.level} Security
                  </div>
                </div>
              </div>

              {securityScore.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Recommendations:</h4>
                  {securityScore.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium">{rec.message}</div>
                        <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'} className="mt-1">
                          {rec.priority} priority
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multi-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Authenticator App</div>
                <div className="text-sm text-gray-600">
                  Add an extra layer of security to your account
                </div>
              </div>
              <Button onClick={setupMFA} variant="outline">
                <Key className="h-4 w-4 mr-2" />
                Setup MFA
              </Button>
            </div>

            {mfaSetupOpen && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="text-center">
                  <h4 className="font-medium mb-2">Scan QR Code</h4>
                  <img src={qrCode} alt="MFA QR Code" className="mx-auto mb-4" />
                  <p className="text-sm text-gray-600">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Backup Codes</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="bg-gray-100 p-2 rounded">
                        {code}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Save these backup codes in a safe place. You can use them to access your account if you lose your phone.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {privacySettings && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Analytics Data Sharing</div>
                    <div className="text-sm text-gray-600">
                      Allow anonymous data to improve our services
                    </div>
                  </div>
                  <Switch
                    checked={privacySettings.data_sharing_analytics}
                    onCheckedChange={(checked) => updatePrivacySetting('data_sharing_analytics', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Research Data Sharing</div>
                    <div className="text-sm text-gray-600">
                      Contribute to medical research (anonymized)
                    </div>
                  </div>
                  <Switch
                    checked={privacySettings.data_sharing_research}
                    onCheckedChange={(checked) => updatePrivacySetting('data_sharing_research', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Marketing Communications</div>
                    <div className="text-sm text-gray-600">
                      Receive updates about new features and services
                    </div>
                  </div>
                  <Switch
                    checked={privacySettings.marketing_communications}
                    onCheckedChange={(checked) => updatePrivacySetting('marketing_communications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Family Data Sharing</div>
                    <div className="text-sm text-gray-600">
                      Allow family members to view shared health data
                    </div>
                  </div>
                  <Switch
                    checked={privacySettings.family_data_sharing}
                    onCheckedChange={(checked) => updatePrivacySetting('family_data_sharing', checked)}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Data Retention Period</div>
                    <div className="text-sm text-gray-600">
                      How long to keep your data after account deletion
                    </div>
                  </div>
                  <select
                    value={privacySettings.data_retention_period}
                    onChange={(e) => updatePrivacySetting('data_retention_period', parseInt(e.target.value))}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    <option value={1}>1 Year</option>
                    <option value={3}>3 Years</option>
                    <option value={7}>7 Years (Recommended)</option>
                    <option value={10}>10 Years</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Export Your Data</div>
                <div className="text-sm text-gray-600">
                  Download all your data in JSON format
                </div>
              </div>
              <Button onClick={exportData} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Delete Account</div>
                <div className="text-sm text-gray-600">
                  Permanently delete your account and all data
                </div>
              </div>
              <Button onClick={requestDataDeletion} variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Request Deletion
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLogs.length > 0 ? (
              auditLogs.map((log, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {log.action.replace('_', ' ')} on {log.resource_type}
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(log.timestamp).toLocaleString()} • {log.ip_address}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-600">
                No recent activity
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
