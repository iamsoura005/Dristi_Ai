"use client"

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'
import { LanguageSelector } from './language-selector'
import { VoiceAssistant } from './voice-assistant'
import { 
  Eye, 
  Users, 
  Calendar, 
  MapPin, 
  Activity, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Heart,
  Brain,
  Stethoscope,
  Upload,
  Search,
  Plus,
  BarChart3
} from 'lucide-react'

interface DashboardData {
  user: any
  recentAnalyses: any[]
  familyMembers: any[]
  upcomingAppointments: any[]
  healthInsights: any[]
  statistics: any
}

interface EnhancedDashboardProps {
  onNavigate?: (path: string) => void
  className?: string
}

export function EnhancedDashboard({ 
  onNavigate,
  className = '' 
}: EnhancedDashboardProps) {
  const { t } = useTranslation()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')

  useEffect(() => {
    fetchDashboardData()
  }, [selectedTimeRange])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      
      // Fetch multiple data sources in parallel
      const [
        userResponse,
        analysesResponse,
        familyResponse,
        appointmentsResponse,
        statisticsResponse
      ] = await Promise.all([
        fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/ai/history?limit=5', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/family/members', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/appointments?status=upcoming&limit=3', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/ai/statistics', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const userData = userResponse.ok ? await userResponse.json() : null
      const analysesData = analysesResponse.ok ? await analysesResponse.json() : { history: [] }
      const familyData = familyResponse.ok ? await familyResponse.json() : { family_members: [] }
      const appointmentsData = appointmentsResponse.ok ? await appointmentsResponse.json() : { appointments: [] }
      const statisticsData = statisticsResponse.ok ? await statisticsResponse.json() : { statistics: {} }

      setDashboardData({
        user: userData?.user,
        recentAnalyses: analysesData.history || [],
        familyMembers: familyData.family_members || [],
        upcomingAppointments: appointmentsData.appointments || [],
        healthInsights: generateHealthInsights(analysesData.history, statisticsData.statistics),
        statistics: statisticsData.statistics || {}
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateHealthInsights = (analyses: any[], statistics: any) => {
    const insights = []

    if (analyses.length > 0) {
      const latestAnalysis = analyses[0]
      if (latestAnalysis.follow_up_required) {
        insights.push({
          type: 'warning',
          title: 'Follow-up Required',
          description: `Your latest analysis detected ${latestAnalysis.predicted_condition}. Please consult a doctor.`,
          action: 'Book Appointment',
          actionPath: '/appointments'
        })
      }
    }

    if (statistics.total_analyses > 5) {
      insights.push({
        type: 'success',
        title: 'Regular Monitoring',
        description: `Great job! You've completed ${statistics.total_analyses} eye health analyses.`,
        action: 'View Trends',
        actionPath: '/analytics'
      })
    }

    if (analyses.length === 0) {
      insights.push({
        type: 'info',
        title: 'Start Your Eye Health Journey',
        description: 'Upload your first eye image to get AI-powered health insights.',
        action: 'Analyze Now',
        actionPath: '/analyze'
      })
    }

    return insights
  }

  const handleVoiceAction = (action: string, data?: any) => {
    switch (action) {
      case 'camera':
        onNavigate?.('/analyze')
        break
      case 'emergency':
        // Handle emergency action
        window.open('tel:108', '_self') // Emergency number in India
        break
      case 'read_results':
        if (dashboardData?.recentAnalyses.length > 0) {
          const latest = dashboardData.recentAnalyses[0]
          const speech = new SpeechSynthesisUtterance(
            `Your latest analysis shows ${latest.predicted_condition} with ${Math.round(latest.confidence_score * 100)}% confidence.`
          )
          speechSynthesis.speak(speech)
        }
        break
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'normal':
        return 'text-green-600 bg-green-50'
      case 'diabetic_retinopathy':
      case 'glaucoma':
      case 'age_related_macular_degeneration':
        return 'text-red-600 bg-red-50'
      case 'cataract':
      case 'hypertensive_retinopathy':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Language Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t('dashboard.welcome')}, {dashboardData?.user?.first_name}!
          </h1>
          <p className="text-gray-600">
            Monitor your eye health and manage your family's wellness
          </p>
        </div>
        <LanguageSelector variant="compact" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Analyses</p>
                <p className="text-2xl font-bold">{dashboardData?.statistics.total_analyses || 0}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Family Members</p>
                <p className="text-2xl font-bold">{dashboardData?.familyMembers.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Appointments</p>
                <p className="text-2xl font-bold">{dashboardData?.upcomingAppointments.length || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Confidence</p>
                <p className="text-2xl font-bold">
                  {dashboardData?.statistics.average_confidence 
                    ? `${Math.round(dashboardData.statistics.average_confidence * 100)}%`
                    : '0%'
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Insights */}
      {dashboardData?.healthInsights && dashboardData.healthInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {t('dashboard.health_insights')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.healthInsights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                insight.type === 'warning' ? 'border-red-500 bg-red-50' :
                insight.type === 'success' ? 'border-green-500 bg-green-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate?.(insight.actionPath)}
                  >
                    {insight.action}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Analyses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t('dashboard.recent_analyses')}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate?('/analyze')}
              >
                <Upload className="h-4 w-4 mr-2" />
                {t('dashboard.upload_image')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData?.recentAnalyses.length === 0 ? (
              <div className="text-center py-8">
                <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No analyses yet</p>
                <Button onClick={() => onNavigate?('/analyze')}>
                  Start Your First Analysis
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData?.recentAnalyses.slice(0, 3).map((analysis, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{analysis.predicted_condition}</p>
                      <p className="text-sm text-gray-600">
                        {Math.round(analysis.confidence_score * 100)}% confidence
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getConditionColor(analysis.predicted_condition)}>
                        {analysis.predicted_condition}
                      </Badge>
                      {analysis.follow_up_required && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Family Health Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('dashboard.family_health')}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate?('/family')}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('dashboard.add_family_member')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData?.familyMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No family members added</p>
                <Button onClick={() => onNavigate?('/family')}>
                  Add Family Members
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData?.familyMembers.slice(0, 3).map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-600 capitalize">{member.relationship}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">Healthy</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            {t('dashboard.quick_actions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => onNavigate?('/analyze')}
            >
              <Upload className="h-6 w-6 mb-2" />
              <span className="text-sm">{t('dashboard.upload_image')}</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => onNavigate?('/doctors')}
            >
              <Search className="h-6 w-6 mb-2" />
              <span className="text-sm">Find Doctors</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => onNavigate?('/appointments')}
            >
              <Calendar className="h-6 w-6 mb-2" />
              <span className="text-sm">{t('dashboard.book_appointment')}</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => onNavigate?('/analytics')}
            >
              <BarChart3 className="h-6 w-6 mb-2" />
              <span className="text-sm">View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Assistant */}
      <VoiceAssistant
        onNavigate={onNavigate}
        onAction={handleVoiceAction}
      />
    </div>
  )
}
