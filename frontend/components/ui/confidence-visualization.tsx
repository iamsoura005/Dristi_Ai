"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle, AlertCircle, Info } from "lucide-react"

interface ConfidenceGaugeProps {
  score: number
  label: string
  isPrimary?: boolean
  showIcon?: boolean
  className?: string
}

interface ConfidenceVisualizationProps {
  scores: Record<string, number>
  primaryPrediction: string
  overallConfidence: number
  className?: string
}

export function ConfidenceGauge({ 
  score, 
  label, 
  isPrimary = false, 
  showIcon = true,
  className = ""
}: ConfidenceGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score)
    }, 100)
    return () => clearTimeout(timer)
  }, [score])

  const percentage = Math.round(score * 100)
  
  const getColor = () => {
    if (score >= 0.8) return isPrimary ? 'text-green-400' : 'text-green-300'
    if (score >= 0.6) return isPrimary ? 'text-yellow-400' : 'text-yellow-300'
    if (score >= 0.4) return isPrimary ? 'text-orange-400' : 'text-orange-300'
    return isPrimary ? 'text-red-400' : 'text-red-300'
  }

  const getBackgroundColor = () => {
    if (score >= 0.8) return 'from-green-500 to-emerald-500'
    if (score >= 0.6) return 'from-yellow-500 to-orange-500'
    if (score >= 0.4) return 'from-orange-500 to-red-500'
    return 'from-red-500 to-red-600'
  }

  const getIcon = () => {
    if (score >= 0.8) return <CheckCircle className="w-4 h-4" />
    if (score >= 0.6) return <AlertCircle className="w-4 h-4" />
    return <AlertTriangle className="w-4 h-4" />
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {showIcon && (
            <span className={getColor()}>
              {getIcon()}
            </span>
          )}
          <span className={`font-medium capitalize ${isPrimary ? 'text-white text-lg' : 'text-gray-300'}`}>
            {label.replace('_', ' ')}
          </span>
        </div>
        <span className={`font-bold ${getColor()} ${isPrimary ? 'text-lg' : 'text-sm'}`}>
          {percentage}%
        </span>
      </div>
      
      <div className={`relative ${isPrimary ? 'h-4' : 'h-3'} bg-gray-700 rounded-full overflow-hidden`}>
        <motion.div
          className={`absolute left-0 top-0 h-full bg-gradient-to-r ${getBackgroundColor()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${animatedScore * 100}%` }}
          transition={{ 
            duration: 1.2, 
            ease: "easeOut",
            delay: isPrimary ? 0 : 0.2 
          }}
        />
        
        {/* Glow effect for primary prediction */}
        {isPrimary && (
          <motion.div
            className={`absolute left-0 top-0 h-full bg-gradient-to-r ${getBackgroundColor()} rounded-full blur-sm opacity-50`}
            initial={{ width: 0 }}
            animate={{ width: `${animatedScore * 100}%` }}
            transition={{ 
              duration: 1.2, 
              ease: "easeOut" 
            }}
          />
        )}
      </div>
    </div>
  )
}

export function ConfidenceVisualization({ 
  scores, 
  primaryPrediction, 
  overallConfidence,
  className = ""
}: ConfidenceVisualizationProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  const getConfidenceLevel = (score: number) => {
    if (score >= 0.9) return { level: 'Very High', color: 'text-green-400', description: 'Highly confident diagnosis' }
    if (score >= 0.8) return { level: 'High', color: 'text-green-400', description: 'Confident diagnosis' }
    if (score >= 0.7) return { level: 'Moderate', color: 'text-yellow-400', description: 'Moderately confident' }
    if (score >= 0.6) return { level: 'Low', color: 'text-orange-400', description: 'Low confidence - consider retesting' }
    return { level: 'Very Low', color: 'text-red-400', description: 'Very low confidence - manual review recommended' }
  }

  const confidenceInfo = getConfidenceLevel(overallConfidence)
  const sortedScores = Object.entries(scores).sort(([,a], [,b]) => b - a)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-xl p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          Confidence Analysis
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1"
        >
          <Info className="w-4 h-4" />
          <span>{showDetails ? 'Hide' : 'Show'} Details</span>
        </button>
      </div>

      {/* Overall Confidence */}
      <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-medium text-white">Overall Confidence</span>
          <span className={`text-xl font-bold ${confidenceInfo.color}`}>
            {Math.round(overallConfidence * 100)}%
          </span>
        </div>
        
        <div className="relative h-6 bg-gray-700 rounded-full overflow-hidden mb-2">
          <motion.div
            className={`absolute left-0 top-0 h-full bg-gradient-to-r ${
              overallConfidence >= 0.8 ? 'from-green-500 to-emerald-500' :
              overallConfidence >= 0.6 ? 'from-yellow-500 to-orange-500' :
              'from-red-500 to-red-600'
            } rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${overallConfidence * 100}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className={`font-medium ${confidenceInfo.color}`}>
            {confidenceInfo.level} Confidence
          </span>
          <span className="text-gray-400">
            {confidenceInfo.description}
          </span>
        </div>
      </div>

      {/* Primary Prediction */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-3">Primary Diagnosis</h4>
        <ConfidenceGauge
          score={scores[primaryPrediction] || 0}
          label={primaryPrediction}
          isPrimary={true}
          className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30"
        />
      </div>

      {/* Detailed Scores */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <h4 className="text-lg font-semibold text-white">All Predictions</h4>
          <div className="space-y-3">
            {sortedScores.map(([condition, score], index) => (
              <motion.div
                key={condition}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ConfidenceGauge
                  score={score}
                  label={condition}
                  isPrimary={condition === primaryPrediction}
                  showIcon={false}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Confidence Interpretation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 rounded-lg bg-gray-800/50 border border-gray-700"
      >
        <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
          <Info className="w-4 h-4 mr-2 text-blue-400" />
          Understanding Confidence Scores
        </h4>
        <div className="text-sm text-gray-300 space-y-1">
          <div className="flex justify-between">
            <span>90-100%:</span>
            <span className="text-green-400">Very High - Reliable diagnosis</span>
          </div>
          <div className="flex justify-between">
            <span>80-89%:</span>
            <span className="text-green-400">High - Confident diagnosis</span>
          </div>
          <div className="flex justify-between">
            <span>70-79%:</span>
            <span className="text-yellow-400">Moderate - Consider clinical correlation</span>
          </div>
          <div className="flex justify-between">
            <span>60-69%:</span>
            <span className="text-orange-400">Low - Professional review recommended</span>
          </div>
          <div className="flex justify-between">
            <span>&lt;60%:</span>
            <span className="text-red-400">Very Low - Manual review required</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ConfidenceVisualization