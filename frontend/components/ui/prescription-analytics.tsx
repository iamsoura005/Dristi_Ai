"use client"

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Eye, 
  Calendar,
  BarChart3,
  LineChart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Activity
} from 'lucide-react'

interface ProgressionData {
  right_eye: {
    sphere: Array<{date: string, value: number}>
    cylinder: Array<{date: string, value: number}>
  }
  left_eye: {
    sphere: Array<{date: string, value: number}>
    cylinder: Array<{date: string, value: number}>
  }
  summary: {
    total_prescriptions: number
    date_range: {
      start: string | null
      end: string | null
    }
    trends: {
      right_sphere_change?: number
      right_sphere_trend?: string
      left_sphere_change?: number
      left_sphere_trend?: string
    }
  }
}

interface PrescriptionAnalyticsProps {
  familyMemberId?: number
  className?: string
}

export function PrescriptionAnalytics({ 
  familyMemberId,
  className = '' 
}: PrescriptionAnalyticsProps) {
  const { t } = useTranslation()
  const [progressionData, setProgressionData] = useState<ProgressionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState(5)
  const [selectedEye, setSelectedEye] = useState<'both' | 'right' | 'left'>('both')

  const timeRanges = [
    { value: 2, label: '2 Years' },
    { value: 5, label: '5 Years' },
    { value: 10, label: '10 Years' },
    { value: 20, label: 'All Time' }
  ]

  useEffect(() => {
    fetchProgressionData()
  }, [selectedTimeRange, familyMemberId])

  const fetchProgressionData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const params = new URLSearchParams({
        years: selectedTimeRange.toString()
      })
      
      if (familyMemberId) {
        params.append('family_member_id', familyMemberId.toString())
      }

      const response = await fetch(`/api/prescription/analytics/progression?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProgressionData(data.progression_data)
      }
    } catch (error) {
      console.error('Error fetching progression data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />
      case 'stable':
        return <Minus className="h-4 w-4 text-blue-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-red-600 bg-red-50'
      case 'decreasing':
        return 'text-green-600 bg-green-50'
      case 'stable':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatPowerValue = (value: number) => {
    return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2)
  }

  const renderSimpleChart = (data: Array<{date: string, value: number}>, color: string) => {
    if (data.length < 2) return null

    const maxValue = Math.max(...data.map(d => Math.abs(d.value)))
    const minValue = Math.min(...data.map(d => d.value))
    const range = maxValue - minValue || 1

    return (
      <div className="h-20 flex items-end gap-1">
        {data.map((point, index) => {
          const height = Math.abs(point.value - minValue) / range * 60 + 10
          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center"
            >
              <div
                className={`w-full ${color} rounded-t`}
                style={{ height: `${height}px` }}
                title={`${point.date}: ${formatPowerValue(point.value)}`}
              />
              <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                {new Date(point.date).getFullYear()}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!progressionData || progressionData.summary.total_prescriptions === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Prescription Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">No prescription history available</p>
          <p className="text-sm text-gray-500">
            Add at least 2 prescriptions to see progression analytics
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Prescription Analytics
            </CardTitle>
            
            <div className="flex gap-2">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(Number(e.target.value))}
                className="px-3 py-1 border rounded text-sm"
              >
                {timeRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedEye}
                onChange={(e) => setSelectedEye(e.target.value as 'both' | 'right' | 'left')}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="both">Both Eyes</option>
                <option value="right">Right Eye</option>
                <option value="left">Left Eye</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {progressionData.summary.total_prescriptions}
              </div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {progressionData.summary.date_range.start ? 
                  Math.round((new Date().getTime() - new Date(progressionData.summary.date_range.start).getTime()) / (1000 * 60 * 60 * 24 * 365)) 
                  : 0}
              </div>
              <div className="text-sm text-gray-600">Years Tracked</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                {getTrendIcon(progressionData.summary.trends.right_sphere_trend || 'stable')}
                <span className="text-sm font-medium">Right Eye</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {progressionData.summary.trends.right_sphere_change ? 
                  `${formatPowerValue(progressionData.summary.trends.right_sphere_change)} change` 
                  : 'No change'}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                {getTrendIcon(progressionData.summary.trends.left_sphere_trend || 'stable')}
                <span className="text-sm font-medium">Left Eye</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {progressionData.summary.trends.left_sphere_change ? 
                  `${formatPowerValue(progressionData.summary.trends.left_sphere_change)} change` 
                  : 'No change'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Right Eye Trends */}
        {(selectedEye === 'both' || selectedEye === 'right') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-4 w-4" />
                Right Eye Progression
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sphere Progression */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Sphere (SPH)</span>
                    <Badge className={getTrendColor(progressionData.summary.trends.right_sphere_trend || 'stable')}>
                      {progressionData.summary.trends.right_sphere_trend || 'stable'}
                    </Badge>
                  </div>
                  {renderSimpleChart(progressionData.right_eye.sphere, 'bg-blue-500')}
                  {progressionData.right_eye.sphere.length > 0 && (
                    <div className="text-xs text-gray-600 mt-2">
                      Latest: {formatPowerValue(progressionData.right_eye.sphere[progressionData.right_eye.sphere.length - 1]?.value || 0)}
                    </div>
                  )}
                </div>

                {/* Cylinder Progression */}
                {progressionData.right_eye.cylinder.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Cylinder (CYL)</span>
                    </div>
                    {renderSimpleChart(progressionData.right_eye.cylinder, 'bg-purple-500')}
                    <div className="text-xs text-gray-600 mt-2">
                      Latest: {formatPowerValue(progressionData.right_eye.cylinder[progressionData.right_eye.cylinder.length - 1]?.value || 0)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Left Eye Trends */}
        {(selectedEye === 'both' || selectedEye === 'left') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-4 w-4" />
                Left Eye Progression
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sphere Progression */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Sphere (SPH)</span>
                    <Badge className={getTrendColor(progressionData.summary.trends.left_sphere_trend || 'stable')}>
                      {progressionData.summary.trends.left_sphere_trend || 'stable'}
                    </Badge>
                  </div>
                  {renderSimpleChart(progressionData.left_eye.sphere, 'bg-green-500')}
                  {progressionData.left_eye.sphere.length > 0 && (
                    <div className="text-xs text-gray-600 mt-2">
                      Latest: {formatPowerValue(progressionData.left_eye.sphere[progressionData.left_eye.sphere.length - 1]?.value || 0)}
                    </div>
                  )}
                </div>

                {/* Cylinder Progression */}
                {progressionData.left_eye.cylinder.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Cylinder (CYL)</span>
                    </div>
                    {renderSimpleChart(progressionData.left_eye.cylinder, 'bg-orange-500')}
                    <div className="text-xs text-gray-600 mt-2">
                      Latest: {formatPowerValue(progressionData.left_eye.cylinder[progressionData.left_eye.cylinder.length - 1]?.value || 0)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Trend Insights */}
            {progressionData.summary.trends.right_sphere_trend === 'increasing' || 
             progressionData.summary.trends.left_sphere_trend === 'increasing' ? (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800">Prescription Strength Increasing</div>
                  <div className="text-sm text-yellow-700 mt-1">
                    Your prescription has been getting stronger over time. Consider:
                  </div>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Regular eye exams every 12 months</li>
                    <li>• Discussing myopia control options with your eye doctor</li>
                    <li>• Reducing screen time and taking regular breaks</li>
                    <li>• Spending more time outdoors</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-green-800">Stable Prescription</div>
                  <div className="text-sm text-green-700 mt-1">
                    Your prescription has remained stable. Continue with regular checkups every 2 years.
                  </div>
                </div>
              </div>
            )}

            {/* Next Checkup Reminder */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-blue-800">Next Eye Exam</div>
                <div className="text-sm text-blue-700 mt-1">
                  Based on your prescription history, we recommend scheduling your next eye exam within the next 6 months.
                </div>
                <Button size="sm" className="mt-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
