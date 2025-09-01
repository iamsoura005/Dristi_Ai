"use client"

import { motion } from "framer-motion"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"

interface ProgressBarProps {
  progress: number
  status: 'validating' | 'processing' | 'analyzing' | 'completed' | 'error'
  message?: string
  showPercentage?: boolean
  className?: string
}

export function ProgressBar({ 
  progress, 
  status, 
  message, 
  showPercentage = true, 
  className = '' 
}: ProgressBarProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'validating':
        return 'from-yellow-500 to-orange-500'
      case 'processing':
        return 'from-blue-500 to-purple-500'
      case 'analyzing':
        return 'from-purple-500 to-pink-500'
      case 'completed':
        return 'from-green-500 to-emerald-500'
      case 'error':
        return 'from-red-500 to-red-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'validating':
      case 'processing':
      case 'analyzing':
        return <Loader2 className="w-4 h-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'error':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    if (message) return message
    
    switch (status) {
      case 'validating':
        return 'Validating image quality...'
      case 'processing':
        return 'Processing image...'
      case 'analyzing':
        return 'Running AI analysis...'
      case 'completed':
        return 'Analysis completed successfully!'
      case 'error':
        return 'Analysis failed'
      default:
        return 'Preparing...'
    }
  }

  return (
    <div className={`w-full space-y-3 ${className}`}>
      {/* Status Message */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm font-medium text-white">
          {getStatusIcon()}
          <span>{getStatusMessage()}</span>
        </div>
        {showPercentage && (
          <span className="text-sm font-bold text-white">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        {/* Background track */}
        <div className="absolute inset-0 bg-gray-700" />
        
        {/* Progress fill */}
        <motion.div
          className={`absolute left-0 top-0 h-full bg-gradient-to-r ${getStatusColor()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ 
            duration: 0.5, 
            ease: "easeOut" 
          }}
        />
        
        {/* Animated shimmer effect for active states */}
        {(status === 'validating' || status === 'processing' || status === 'analyzing') && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: [-100, 400],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              width: '100px',
            }}
          />
        )}
      </div>

      {/* Detailed progress steps indicator */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className={`flex items-center space-x-1 ${progress >= 25 ? 'text-blue-400' : ''}`}>
          <div className={`w-2 h-2 rounded-full ${progress >= 25 ? 'bg-blue-400' : 'bg-gray-600'}`} />
          <span>Upload</span>
        </div>
        <div className={`flex items-center space-x-1 ${progress >= 50 ? 'text-yellow-400' : ''}`}>
          <div className={`w-2 h-2 rounded-full ${progress >= 50 ? 'bg-yellow-400' : 'bg-gray-600'}`} />
          <span>Validate</span>
        </div>
        <div className={`flex items-center space-x-1 ${progress >= 75 ? 'text-purple-400' : ''}`}>
          <div className={`w-2 h-2 rounded-full ${progress >= 75 ? 'bg-purple-400' : 'bg-gray-600'}`} />
          <span>Analyze</span>
        </div>
        <div className={`flex items-center space-x-1 ${progress >= 100 ? 'text-green-400' : ''}`}>
          <div className={`w-2 h-2 rounded-full ${progress >= 100 ? 'bg-green-400' : 'bg-gray-600'}`} />
          <span>Complete</span>
        </div>
      </div>
    </div>
  )
}

export default ProgressBar