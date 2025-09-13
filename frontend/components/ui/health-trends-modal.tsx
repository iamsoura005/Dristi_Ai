"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, TrendingUp, Calendar, Eye, TestTube, Activity, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
} from 'recharts'

interface TestResult {
  id: number
  type: string
  result: string
  date: string
  confidence: number
}

interface HealthTrendsModalProps {
  isOpen: boolean
  onClose: () => void
  testHistory: TestResult[]
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6']

export default function HealthTrendsModal({ isOpen, onClose, testHistory }: HealthTrendsModalProps) {
  const [activeChart, setActiveChart] = useState<'confidence' | 'results' | 'timeline'>('confidence')

  if (!isOpen) return null

  // Process test history data for charts
  const confidenceData = testHistory.map((test, index) => ({
    test: `Test ${index + 1}`,
    date: new Date(test.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    confidence: test.confidence,
    type: test.type
  }))

  // Group results by outcome
  const resultCounts = testHistory.reduce((acc, test) => {
    const result = test.result
    acc[result] = (acc[result] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const resultsData = Object.entries(resultCounts).map(([result, count]) => ({
    result,
    count,
    percentage: Math.round((count / testHistory.length) * 100)
  }))

  // Monthly test frequency
  const monthlyData = testHistory.reduce((acc, test) => {
    const month = new Date(test.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const timelineData = Object.entries(monthlyData).map(([month, count]) => ({
    month,
    tests: count
  }))

  // Calculate statistics
  const avgConfidence = Math.round(testHistory.reduce((sum, test) => sum + test.confidence, 0) / testHistory.length)
  const normalResults = testHistory.filter(test => 
    test.result === 'Normal' || test.result === 'Normal Vision'
  ).length
  const normalPercentage = Math.round((normalResults / testHistory.length) * 100)

  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Health Trends Analysis</h2>
              <p className="text-gray-400">Your medical test progress over time</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center space-x-3">
              <TestTube className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">{testHistory.length}</div>
                <div className="text-sm text-gray-400">Total Tests</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">{avgConfidence}%</div>
                <div className="text-sm text-gray-400">Avg Confidence</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center space-x-3">
              <Eye className="w-8 h-8 text-emerald-400" />
              <div>
                <div className="text-2xl font-bold text-white">{normalPercentage}%</div>
                <div className="text-sm text-gray-400">Normal Results</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-white">{Object.keys(monthlyData).length}</div>
                <div className="text-sm text-gray-400">Active Months</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Navigation */}
        <div className="flex space-x-1 bg-white/5 rounded-xl p-1 mb-6">
          {[
            { id: 'confidence', label: 'Confidence Trends', icon: TrendingUp },
            { id: 'results', label: 'Result Distribution', icon: BarChart3 },
            { id: 'timeline', label: 'Test Timeline', icon: Calendar }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveChart(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                  activeChart === tab.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Chart Content */}
        <motion.div
          key={activeChart}
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/5 rounded-xl p-6 border border-white/10"
        >
          {activeChart === 'confidence' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Confidence Score Trends</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={confidenceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      domain={[80, 100]}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgb(31 41 55)',
                        border: '1px solid rgb(75 85 99)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="confidence" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeChart === 'results' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Test Result Distribution</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resultsData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ result, percentage }) => `${result} (${percentage}%)`}
                      >
                        {resultsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgb(31 41 55)',
                          border: '1px solid rgb(75 85 99)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-white">Detailed Breakdown</h4>
                  {resultsData.map((item, index) => (
                    <div key={item.result} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-white font-medium">{item.result}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">{item.count} tests</div>
                        <div className="text-gray-400 text-sm">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeChart === 'timeline' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Testing Activity Timeline</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgb(31 41 55)',
                        border: '1px solid rgb(75 85 99)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Bar 
                      dataKey="tests" 
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Close
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            Export Trends Report
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}