"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  Zap,
  Contrast,
  Focus,
  Crop,
  Info,
  Lightbulb,
  Camera,
  RotateCw
} from "lucide-react"

interface QualityCheck {
  name: string
  status: 'pass' | 'warning' | 'fail'
  score: number
  message: string
  suggestion?: string
  icon: React.ComponentType<any>
}

interface ImageQualityResult {
  overallScore: number
  overallStatus: 'excellent' | 'good' | 'poor' | 'failed'
  checks: QualityCheck[]
  recommendations: string[]
  isValid: boolean
}

interface ImageQualityCheckerProps {
  imageFile: File | null
  imagePreview: string | null
  onQualityCheck?: (result: ImageQualityResult) => void
  className?: string
  realTimeChecking?: boolean
}

export function ImageQualityChecker({ 
  imageFile, 
  imagePreview, 
  onQualityCheck,
  className = "",
  realTimeChecking = true
}: ImageQualityCheckerProps) {
  const [qualityResult, setQualityResult] = useState<ImageQualityResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [imageData, setImageData] = useState<ImageData | null>(null)

  const analyzeImageQuality = useCallback(async (file: File): Promise<ImageQualityResult> => {
    return new Promise((resolve) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        setImageData(imageData)
        
        const checks: QualityCheck[] = [
          checkResolution(img.width, img.height),
          checkAspectRatio(img.width, img.height),
          checkBrightness(imageData),
          checkContrast(imageData),
          checkBlur(imageData),
          checkColorBalance(imageData),
          checkCentralFocus(imageData),
          checkNoiseLevel(imageData)
        ]

        const overallScore = checks.reduce((sum, check) => sum + check.score, 0) / checks.length
        const failedChecks = checks.filter(check => check.status === 'fail').length
        const warningChecks = checks.filter(check => check.status === 'warning').length

        let overallStatus: 'excellent' | 'good' | 'poor' | 'failed'
        if (failedChecks > 0) {
          overallStatus = 'failed'
        } else if (overallScore >= 0.9) {
          overallStatus = 'excellent'
        } else if (overallScore >= 0.7) {
          overallStatus = 'good'
        } else {
          overallStatus = 'poor'
        }

        const recommendations = generateRecommendations(checks)
        const isValid = failedChecks === 0 && overallScore >= 0.5

        const result: ImageQualityResult = {
          overallScore,
          overallStatus,
          checks,
          recommendations,
          isValid
        }

        resolve(result)
      }

      img.src = URL.createObjectURL(file)
    })
  }, [])

  useEffect(() => {
    if (imageFile && realTimeChecking) {
      setIsChecking(true)
      analyzeImageQuality(imageFile).then(result => {
        setQualityResult(result)
        onQualityCheck?.(result)
        setIsChecking(false)
      })
    }
  }, [imageFile, realTimeChecking, analyzeImageQuality, onQualityCheck])

  const checkResolution = (width: number, height: number): QualityCheck => {
    const minRes = 224
    const optimalRes = 512
    const maxRes = 2048

    if (width < minRes || height < minRes) {
      return {
        name: 'Resolution',
        status: 'fail',
        score: 0,
        message: `Image too small (${width}×${height}px)`,
        suggestion: `Minimum resolution required: ${minRes}×${minRes}px`,
        icon: Crop
      }
    } else if (width > maxRes || height > maxRes) {
      return {
        name: 'Resolution',
        status: 'warning',
        score: 0.7,
        message: `Image very large (${width}×${height}px)`,
        suggestion: 'Consider resizing for faster processing',
        icon: Crop
      }
    } else if (width >= optimalRes && height >= optimalRes) {
      return {
        name: 'Resolution',
        status: 'pass',
        score: 1.0,
        message: `Optimal resolution (${width}×${height}px)`,
        icon: Crop
      }
    } else {
      return {
        name: 'Resolution',
        status: 'warning',
        score: 0.8,
        message: `Acceptable resolution (${width}×${height}px)`,
        suggestion: `Better quality with ${optimalRes}×${optimalRes}px or higher`,
        icon: Crop
      }
    }
  }

  const checkAspectRatio = (width: number, height: number): QualityCheck => {
    const aspectRatio = width / height
    const ideal = 1.0 // Square
    const tolerance = 0.3

    if (Math.abs(aspectRatio - ideal) <= tolerance) {
      return {
        name: 'Aspect Ratio',
        status: 'pass',
        score: 1.0,
        message: 'Good aspect ratio for fundus images',
        icon: Crop
      }
    } else {
      return {
        name: 'Aspect Ratio',
        status: 'warning',
        score: 0.6,
        message: `Aspect ratio: ${aspectRatio.toFixed(2)}:1`,
        suggestion: 'Fundus images work best with square aspect ratios',
        icon: Crop
      }
    }
  }

  const checkBrightness = (imageData: ImageData): QualityCheck => {
    const { data } = imageData
    let totalBrightness = 0
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      totalBrightness += brightness
    }
    
    const avgBrightness = totalBrightness / (data.length / 4)
    const normalizedBrightness = avgBrightness / 255

    if (normalizedBrightness < 0.2) {
      return {
        name: 'Brightness',
        status: 'fail',
        score: 0.3,
        message: 'Image too dark',
        suggestion: 'Increase lighting or adjust camera exposure',
        icon: Zap
      }
    } else if (normalizedBrightness > 0.8) {
      return {
        name: 'Brightness',
        status: 'warning',
        score: 0.6,
        message: 'Image too bright',
        suggestion: 'Reduce lighting or adjust camera exposure',
        icon: Zap
      }
    } else if (normalizedBrightness >= 0.4 && normalizedBrightness <= 0.6) {
      return {
        name: 'Brightness',
        status: 'pass',
        score: 1.0,
        message: 'Optimal brightness level',
        icon: Zap
      }
    } else {
      return {
        name: 'Brightness',
        status: 'warning',
        score: 0.8,
        message: 'Acceptable brightness level',
        suggestion: 'Slight adjustment could improve quality',
        icon: Zap
      }
    }
  }

  const checkContrast = (imageData: ImageData): QualityCheck => {
    const { data, width, height } = imageData
    let variance = 0
    let mean = 0
    
    // Calculate mean
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      mean += brightness
    }
    mean /= (data.length / 4)
    
    // Calculate variance
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      variance += Math.pow(brightness - mean, 2)
    }
    variance /= (data.length / 4)
    
    const contrast = Math.sqrt(variance) / 255

    if (contrast < 0.15) {
      return {
        name: 'Contrast',
        status: 'fail',
        score: 0.3,
        message: 'Low contrast detected',
        suggestion: 'Adjust lighting or camera settings for better contrast',
        icon: Contrast
      }
    } else if (contrast >= 0.25) {
      return {
        name: 'Contrast',
        status: 'pass',
        score: 1.0,
        message: 'Good contrast level',
        icon: Contrast
      }
    } else {
      return {
        name: 'Contrast',
        status: 'warning',
        score: 0.7,
        message: 'Acceptable contrast',
        suggestion: 'Slightly higher contrast would be better',
        icon: Contrast
      }
    }
  }

  const checkBlur = (imageData: ImageData): QualityCheck => {
    const { data, width, height } = imageData
    let sharpness = 0
    
    // Simple edge detection for blur assessment
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4
        const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
        const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3
        const down = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3
        
        sharpness += Math.abs(current - right) + Math.abs(current - down)
      }
    }
    
    sharpness /= ((width - 2) * (height - 2) * 2 * 255)

    if (sharpness < 0.1) {
      return {
        name: 'Focus',
        status: 'fail',
        score: 0.2,
        message: 'Image appears blurry',
        suggestion: 'Ensure proper focus and steady camera position',
        icon: Focus
      }
    } else if (sharpness >= 0.2) {
      return {
        name: 'Focus',
        status: 'pass',
        score: 1.0,
        message: 'Image is sharp and well-focused',
        icon: Focus
      }
    } else {
      return {
        name: 'Focus',
        status: 'warning',
        score: 0.7,
        message: 'Image focus is acceptable',
        suggestion: 'Ensure camera is properly focused',
        icon: Focus
      }
    }
  }

  const checkColorBalance = (imageData: ImageData): QualityCheck => {
    const { data } = imageData
    let totalR = 0, totalG = 0, totalB = 0
    
    for (let i = 0; i < data.length; i += 4) {
      totalR += data[i]
      totalG += data[i + 1]
      totalB += data[i + 2]
    }
    
    const pixels = data.length / 4
    const avgR = totalR / pixels
    const avgG = totalG / pixels
    const avgB = totalB / pixels
    
    const redDominance = avgR / (avgG + avgB + 1)
    
    // Fundus images typically have red/orange tones
    if (redDominance >= 0.8 && redDominance <= 1.5) {
      return {
        name: 'Color Balance',
        status: 'pass',
        score: 1.0,
        message: 'Good color balance for fundus imaging',
        icon: Eye
      }
    } else if (redDominance < 0.6) {
      return {
        name: 'Color Balance',
        status: 'warning',
        score: 0.6,
        message: 'Color balance may not be optimal for fundus analysis',
        suggestion: 'Ensure proper medical fundus imaging conditions',
        icon: Eye
      }
    } else {
      return {
        name: 'Color Balance',
        status: 'warning',
        score: 0.8,
        message: 'Acceptable color balance',
        icon: Eye
      }
    }
  }

  const checkCentralFocus = (imageData: ImageData): QualityCheck => {
    const { data, width, height } = imageData
    const centerX = Math.floor(width / 2)
    const centerY = Math.floor(height / 2)
    const radius = Math.min(width, height) / 4
    
    let centerBrightness = 0
    let edgeBrightness = 0
    let centerPixels = 0
    let edgePixels = 0
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
        
        if (distance <= radius) {
          centerBrightness += brightness
          centerPixels++
        } else if (distance >= radius * 2) {
          edgeBrightness += brightness
          edgePixels++
        }
      }
    }
    
    if (centerPixels === 0 || edgePixels === 0) {
      return {
        name: 'Central Focus',
        status: 'warning',
        score: 0.7,
        message: 'Cannot assess central focus',
        icon: Focus
      }
    }
    
    const centerAvg = centerBrightness / centerPixels
    const edgeAvg = edgeBrightness / edgePixels
    const ratio = centerAvg / (edgeAvg + 1)
    
    if (ratio >= 1.5) {
      return {
        name: 'Central Focus',
        status: 'pass',
        score: 1.0,
        message: 'Good central focus pattern',
        icon: Focus
      }
    } else if (ratio >= 1.2) {
      return {
        name: 'Central Focus',
        status: 'warning',
        score: 0.8,
        message: 'Acceptable central focus',
        suggestion: 'Center the retinal area in the image',
        icon: Focus
      }
    } else {
      return {
        name: 'Central Focus',
        status: 'fail',
        score: 0.4,
        message: 'Poor central focus pattern',
        suggestion: 'Ensure the retinal area is centered and well-lit',
        icon: Focus
      }
    }
  }

  const checkNoiseLevel = (imageData: ImageData): QualityCheck => {
    const { data, width, height } = imageData
    let noise = 0
    let count = 0
    
    // Sample random pixels to check for noise
    for (let i = 0; i < 1000; i++) {
      const x = Math.floor(Math.random() * (width - 2)) + 1
      const y = Math.floor(Math.random() * (height - 2)) + 1
      const idx = (y * width + x) * 4
      
      const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
      const neighbors = [
        (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3,
        (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3,
        (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3,
        (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3
      ]
      
      const avgNeighbor = neighbors.reduce((sum, val) => sum + val, 0) / neighbors.length
      noise += Math.abs(current - avgNeighbor)
      count++
    }
    
    const avgNoise = noise / count / 255
    
    if (avgNoise < 0.05) {
      return {
        name: 'Noise Level',
        status: 'pass',
        score: 1.0,
        message: 'Low noise level',
        icon: Camera
      }
    } else if (avgNoise < 0.1) {
      return {
        name: 'Noise Level',
        status: 'warning',
        score: 0.8,
        message: 'Acceptable noise level',
        suggestion: 'Consider better lighting conditions',
        icon: Camera
      }
    } else {
      return {
        name: 'Noise Level',
        status: 'fail',
        score: 0.4,
        message: 'High noise level detected',
        suggestion: 'Improve lighting and reduce camera ISO',
        icon: Camera
      }
    }
  }

  const generateRecommendations = (checks: QualityCheck[]): string[] => {
    const recommendations: string[] = []
    
    checks.forEach(check => {
      if (check.suggestion && (check.status === 'fail' || check.status === 'warning')) {
        recommendations.push(check.suggestion)
      }
    })
    
    // Add general recommendations
    if (checks.some(check => check.name === 'Brightness' && check.status !== 'pass')) {
      recommendations.push('Use proper medical lighting equipment for fundus photography')
    }
    
    if (checks.some(check => check.name === 'Focus' && check.status !== 'pass')) {
      recommendations.push('Ensure the camera is properly focused on the retinal area')
    }
    
    return [...new Set(recommendations)] // Remove duplicates
  }

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-400 bg-green-500/20 border-green-500/50'
      case 'good': return 'text-blue-400 bg-blue-500/20 border-blue-500/50'
      case 'poor': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50'
      case 'failed': return 'text-red-400 bg-red-500/20 border-red-500/50'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/50'
    }
  }

  const getCheckStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'fail': return <XCircle className="w-4 h-4 text-red-400" />
      default: return null
    }
  }

  if (!imageFile || !imagePreview) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-xl p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
            <Eye className="w-4 h-4 text-white" />
          </div>
          Image Quality Analysis
        </h3>
        {isChecking && (
          <div className="flex items-center space-x-2 text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span className="text-sm">Analyzing...</span>
          </div>
        )}
      </div>

      {qualityResult && (
        <>
          {/* Overall Score */}
          <div className={`p-4 rounded-lg border mb-6 ${getOverallStatusColor(qualityResult.overallStatus)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold">Overall Quality</span>
              <span className="text-2xl font-bold">
                {Math.round(qualityResult.overallScore * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="capitalize font-medium">
                {qualityResult.overallStatus}
              </span>
              <span className={`text-sm ${qualityResult.isValid ? 'text-green-400' : 'text-red-400'}`}>
                {qualityResult.isValid ? 'Ready for analysis' : 'Needs improvement'}
              </span>
            </div>
          </div>

          {/* Individual Checks */}
          <div className="space-y-3 mb-6">
            <h4 className="text-lg font-semibold text-white">Quality Checks</h4>
            {qualityResult.checks.map((check, index) => {
              const Icon = check.icon
              return (
                <motion.div
                  key={check.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white">{check.name}</span>
                        {getCheckStatusIcon(check.status)}
                      </div>
                      <p className="text-sm text-gray-400">{check.message}</p>
                      {check.suggestion && (
                        <p className="text-xs text-blue-400 mt-1">{check.suggestion}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      {Math.round(check.score * 100)}%
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Recommendations */}
          {qualityResult.recommendations.length > 0 && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                <Lightbulb className="w-4 h-4 mr-2 text-blue-400" />
                Improvement Recommendations
              </h4>
              <ul className="space-y-2">
                {qualityResult.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

export default ImageQualityChecker