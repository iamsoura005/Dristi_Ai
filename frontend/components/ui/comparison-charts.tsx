"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieChartIcon,
  Calendar,
  Filter,
  Download,
  Share2
} from "lucide-react"
import { Button } from "./button"

interface TestResult {
  id: string
  date: string
  type: 'eye_disease' | 'color_blindness'
  predicted_class: string
  confidence: number
  status: 'normal' | 'abnormal' | 'uncertain'
}

interface ComparisonChartsProps {
  results: TestResult[]
  className?: string
  onExport?: (chartType: string) => void
}

function ComparisonCharts({ 
  results, 
  className = "",
  onExport
}: ComparisonChartsProps) {
  const [chartType, setChartType] = useState<'timeline' | 'distribution' | 'trends'>('timeline')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month')
  const [showConfidenceOnly, setShowConfidenceOnly] = useState(false)

  // Process data for timeline chart
  const getTimelineData = () => {
    const filtered = filterByTimeRange(results)
    return filtered.map(result => ({
      date: new Date(result.date).toLocaleDateString(),
      confidence: Math.round(result.confidence * 100),
      status: result.status,
      type: result.type,
      condition: result.predicted_class
    })).reverse()
  }

  // Process data for distribution chart
  const getDistributionData = () => {
    const filtered = filterByTimeRange(results)
    const distribution = filtered.reduce((acc, result) => {
      const condition = result.predicted_class.replace('_', ' ')
      acc[condition] = (acc[condition] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(distribution).map(([condition, count]) => ({
      condition: condition.charAt(0).toUpperCase() + condition.slice(1),
      count,
      percentage: Math.round((count / filtered.length) * 100)
    }))
  }

  // Process data for trends
  const getTrendsData = () => {
    const filtered = filterByTimeRange(results)
    const trends = filtered.reduce((acc, result) => {
      const month = new Date(result.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (!acc[month]) {
        acc[month] = { normal: 0, abnormal: 0, uncertain: 0, totalConfidence: 0, count: 0 }
      }
      acc[month][result.status]++
      acc[month].totalConfidence += result.confidence
      acc[month].count++
      return acc
    }, {} as Record<string, any>)

    return Object.entries(trends).map(([month, data]) => ({
      month,
      normal: data.normal,
      abnormal: data.abnormal,
      uncertain: data.uncertain,
      avgConfidence: Math.round((data.totalConfidence / data.count) * 100)
    }))
  }

  const filterByTimeRange = (data: TestResult[]) => {
    const now = new Date()
    const cutoff = new Date()
    
    switch (timeRange) {
      case 'week':
        cutoff.setDate(now.getDate() - 7)
        break
      case 'month':
        cutoff.setMonth(now.getMonth() - 1)
        break
      case 'year':
        cutoff.setFullYear(now.getFullYear() - 1)
        break
      case 'all':
        return data
    }
    
    return data.filter(result => new Date(result.date) >= cutoff)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#10B981'
      case 'abnormal': return '#EF4444'
      case 'uncertain': return '#F59E0B'
      default: return '#6B7280'
    }
  }

  const confidenceColors = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0']

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/50 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{`Date: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}${entry.dataKey === 'confidence' || entry.dataKey === 'avgConfidence' ? '%' : ''}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderTimelineChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={getTimelineData()}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="date" 
          stroke="#9CA3AF"
          fontSize={12}
        />
        <YAxis 
          stroke="#9CA3AF"
          fontSize={12}
          domain={showConfidenceOnly ? [0, 100] : ['dataMin - 10', 'dataMax + 10']}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="confidence" 
          stroke="#3B82F6" 
          strokeWidth={3}
          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )

  const renderDistributionChart = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4">Condition Distribution</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={getDistributionData()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="condition" 
              stroke="#9CA3AF"
              fontSize={11}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#9CA3AF" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4">Percentage Breakdown</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={getDistributionData()}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ condition, percentage }) => `${condition}: ${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {getDistributionData().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={confidenceColors[index % confidenceColors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const renderTrendsChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={getTrendsData()}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
        <YAxis stroke="#9CA3AF" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="normal" stackId="a" fill="#10B981" name="Normal" />
        <Bar dataKey="abnormal" stackId="a" fill="#EF4444" name="Abnormal" />
        <Bar dataKey="uncertain" stackId="a" fill="#F59E0B" name="Uncertain" />
      </BarChart>
    </ResponsiveContainer>
  )

  const getInsights = () => {
    const filtered = filterByTimeRange(results)
    const avgConfidence = filtered.reduce((sum, r) => sum + r.confidence, 0) / filtered.length
    const normalCount = filtered.filter(r => r.status === 'normal').length
    const normalPercentage = (normalCount / filtered.length) * 100
    
    const trend = filtered.length >= 2 ? 
      (filtered[filtered.length - 1].confidence > filtered[0].confidence ? 'improving' : 'declining') : 
      'stable'

    return {
      avgConfidence: Math.round(avgConfidence * 100),
      normalPercentage: Math.round(normalPercentage),
      trend,
      totalTests: filtered.length
    }
  }

  const insights = getInsights()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-xl p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white flex items-center">
          <TrendingUp className="w-6 h-6 mr-3 text-blue-400" />
          Test Results Analysis
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport?.(chartType)}
            className="border-gray-600 text-white hover:bg-black-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-600 text-white hover:bg-black-700"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Chart Type</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
            className="w-full px-3 py-2 bg-black-700 border border-gray-600 rounded-lg text-white text-sm"
          >
            <option value="timeline">Timeline</option>
            <option value="distribution">Distribution</option>
            <option value="trends">Monthly Trends</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Time Range</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="w-full px-3 py-2 bg-black-700 border border-gray-600 rounded-lg text-white text-sm"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center text-sm text-gray-300">
            <input
              type="checkbox"
              checked={showConfidenceOnly}
              onChange={(e) => setShowConfidenceOnly(e.target.checked)}
              className="mr-2 rounded"
            />
            Confidence Only
          </label>
        </div>

        <div className="flex items-end justify-end">
          <span className="text-sm text-gray-400">
            {filterByTimeRange(results).length} tests
          </span>
        </div>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Confidence</p>
              <p className="text-2xl font-bold text-blue-400">{insights.avgConfidence}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Normal Results</p>
              <p className="text-2xl font-bold text-green-400">{insights.normalPercentage}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Trend</p>
              <p className="text-lg font-bold text-purple-400 capitalize">{insights.trend}</p>
            </div>
            {insights.trend === 'improving' ? 
              <TrendingUp className="w-8 h-8 text-green-400" /> :
              <TrendingDown className="w-8 h-8 text-red-400" />
            }
          </div>
        </div>

        <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Tests</p>
              <p className="text-2xl font-bold text-gray-300">{insights.totalTests}</p>
            </div>
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Chart Display */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        {chartType === 'timeline' && renderTimelineChart()}
        {chartType === 'distribution' && renderDistributionChart()}
        {chartType === 'trends' && renderTrendsChart()}
      </div>

      {/* Chart Description */}
      <div className="mt-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
        <h4 className="text-sm font-semibold text-white mb-2">Chart Insights</h4>
        <p className="text-sm text-gray-300">
          {chartType === 'timeline' && 
            `Timeline shows confidence scores over time. Your average confidence is ${insights.avgConfidence}% with a ${insights.trend} trend.`
          }
          {chartType === 'distribution' && 
            `Distribution shows the frequency of different conditions detected. ${insights.normalPercentage}% of tests show normal results.`
          }
          {chartType === 'trends' && 
            `Monthly trends show patterns in test results over time, helping identify seasonal variations or health changes.`
          }
        </p>
      </div>
    </motion.div>
  )
}

export { ComparisonCharts }
export default ComparisonCharts