"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Search,
  Eye,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  ExternalLink,
  Download
} from "lucide-react"
import { Button } from "./button"

interface TestResult {
  id: string
  date: string
  type: 'eye_disease' | 'color_blindness'
  predicted_class: string
  confidence: number
  status: 'normal' | 'abnormal' | 'uncertain'
  all_scores?: Record<string, number>
}

interface HistoricalResultsProps {
  results: TestResult[]
  className?: string
  onResultSelect?: (result: TestResult) => void
  onExport?: (results: TestResult[]) => void
}

export function HistoricalResults({ 
  results, 
  className = "",
  onResultSelect,
  onExport
}: HistoricalResultsProps) {
  const [filteredResults, setFilteredResults] = useState<TestResult[]>(results)
  const [filterType, setFilterType] = useState<'all' | 'eye_disease' | 'color_blindness'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'type'>('date')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedResults, setSelectedResults] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    let filtered = results

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(result => result.type === filterType)
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(result => 
        result.predicted_class.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'confidence':
          return b.confidence - a.confidence
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })

    setFilteredResults(filtered)
  }, [results, filterType, searchTerm, sortBy])

  const getStatusIcon = (status: string, confidence: number) => {
    if (status === 'normal') return <CheckCircle className="w-4 h-4 text-green-400" />
    if (status === 'uncertain' || confidence < 0.7) return <AlertTriangle className="w-4 h-4 text-yellow-400" />
    return <AlertTriangle className="w-4 h-4 text-red-400" />
  }

  const getStatusColor = (status: string, confidence: number) => {
    if (status === 'normal') return 'border-green-500/50 bg-green-500/10'
    if (status === 'uncertain' || confidence < 0.7) return 'border-yellow-500/50 bg-yellow-500/10'
    return 'border-red-500/50 bg-red-500/10'
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const toggleSelectResult = (id: string) => {
    setSelectedResults(prev => 
      prev.includes(id) 
        ? prev.filter(resultId => resultId !== id)
        : [...prev, id]
    )
  }

  const handleExportSelected = () => {
    const selected = filteredResults.filter(result => selectedResults.includes(result.id))
    onExport?.(selected)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Test History</h3>
          <p className="text-gray-400">{filteredResults.length} test{filteredResults.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="border-gray-600 text-white hover:bg-gray-700"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          {selectedResults.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSelected}
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export ({selectedResults.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass rounded-lg p-4 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search results..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Test Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Tests</option>
                  <option value="eye_disease">Eye Disease</option>
                  <option value="color_blindness">Color Blindness</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="date">Date</option>
                  <option value="confidence">Confidence</option>
                  <option value="type">Type</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Timeline */}
      <div className="space-y-4">
        {filteredResults.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 glass rounded-lg"
          >
            <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No test results found</h3>
            <p className="text-gray-400">Try adjusting your filters or search terms.</p>
          </motion.div>
        ) : (
          filteredResults.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass rounded-lg p-6 border cursor-pointer transition-all duration-200 hover:border-blue-500/50 ${
                selectedResults.includes(result.id) ? 'ring-2 ring-blue-500/50' : ''
              } ${getStatusColor(result.status, result.confidence)}`}
              onClick={() => onResultSelect?.(result)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedResults.includes(result.id)}
                    onChange={(e) => {
                      e.stopPropagation()
                      toggleSelectResult(result.id)
                    }}
                    className="mt-1 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />

                  {/* Status Icon */}
                  <div className="mt-1">
                    {getStatusIcon(result.status, result.confidence)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-white capitalize">
                          {result.predicted_class.replace('_', ' ')}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(result.date)}
                          </span>
                          <span className="flex items-center capitalize">
                            <Eye className="w-4 h-4 mr-1" />
                            {result.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">
                          {Math.round(result.confidence * 100)}%
                        </div>
                        <div className="text-xs text-gray-400">Confidence</div>
                      </div>
                    </div>

                    {/* Confidence Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          result.confidence >= 0.8 ? 'bg-green-500' :
                          result.confidence >= 0.6 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${result.confidence * 100}%` }}
                      />
                    </div>

                    {/* Additional Scores (if available) */}
                    {result.all_scores && Object.keys(result.all_scores).length > 1 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {Object.entries(result.all_scores)
                          .filter(([condition]) => condition !== result.predicted_class)
                          .slice(0, 3)
                          .map(([condition, score]) => (
                            <div key={condition} className="text-gray-400">
                              <span className="capitalize">{condition.replace('_', ' ')}: </span>
                              <span className="text-white">{Math.round(score * 100)}%</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onResultSelect?.(result)
                    }}
                    className="h-8 w-8 p-0 hover:bg-white/20"
                  >
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle more actions
                    }}
                    className="h-8 w-8 p-0 hover:bg-white/20"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {filteredResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-lg p-6"
        >
          <h4 className="text-lg font-semibold text-white mb-4">Summary Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {filteredResults.filter(r => r.status === 'normal').length}
              </div>
              <div className="text-sm text-gray-400">Normal</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {filteredResults.filter(r => r.status === 'abnormal').length}
              </div>
              <div className="text-sm text-gray-400">Abnormal</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {filteredResults.filter(r => r.status === 'uncertain' || r.confidence < 0.7).length}
              </div>
              <div className="text-sm text-gray-400">Uncertain</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Math.round(filteredResults.reduce((sum, r) => sum + r.confidence, 0) / filteredResults.length * 100)}%
              </div>
              <div className="text-sm text-gray-400">Avg Confidence</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default HistoricalResults