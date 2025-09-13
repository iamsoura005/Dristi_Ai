"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Sun, 
  Moon, 
  Contrast, 
  Palette, 
  Eye, 
  AlertTriangle, 
  CheckCircle,
  Zap,
  Settings,
  RotateCcw,
  Download,
  Info
} from "lucide-react"
import { Button } from "./button"

interface ImageAnalysis {
  brightness: {
    current: number
    recommended: number
    status: 'too_dark' | 'too_bright' | 'optimal'
  }
  contrast: {
    current: number
    recommended: number
    status: 'too_low' | 'too_high' | 'optimal'
  }
  saturation: {
    current: number
    recommended: number
    status: 'too_low' | 'too_high' | 'optimal'
  }
  sharpness: {
    current: number
    status: 'blurry' | 'sharp' | 'over_sharpened'
  }
  overallQuality: {
    score: number
    grade: 'excellent' | 'good' | 'fair' | 'poor'
    issues: string[]
  }
}

interface ImageEnhancementProps {
  imageFile: File | null
  imageUrl: string | null
  onEnhancedImage?: (enhancedImageUrl: string) => void
  className?: string
}

export function ImageEnhancementSuggestions({ 
  imageFile, 
  imageUrl, 
  onEnhancedImage,
  className = ""
}: ImageEnhancementProps) {
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    gamma: 0
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [autoEnhanced, setAutoEnhanced] = useState(false)
  const [realTimeAnalysis, setRealTimeAnalysis] = useState<ImageAnalysis | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalImageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imageUrl && imageFile) {
      analyzeImage()
    }
  }, [imageUrl, imageFile])

  // Real-time analysis when adjustments change
  useEffect(() => {
    if (analysis && (adjustments.brightness !== 0 || adjustments.contrast !== 0 || adjustments.saturation !== 0)) {
      performRealTimeAnalysis()
    }
  }, [adjustments, analysis])

  const analyzeImage = async () => {
    if (!imageUrl) return
    
    setIsAnalyzing(true)
    
    try {
      // Load image for analysis
      const img = new Image()
      img.crossOrigin = "anonymous"
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageUrl
      })

      originalImageRef.current = img

      // Create canvas for analysis
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = imageData.data

      // Analyze image properties
      const analysisResult = performImageAnalysis(pixels, canvas.width, canvas.height)
      setAnalysis(analysisResult)

      // Set recommended adjustments based on analysis
      const recommendedAdjustments = calculateOptimalAdjustments(analysisResult)
      setAdjustments(recommendedAdjustments)
      setAutoEnhanced(false)

    } catch (error) {
      console.error('Error analyzing image:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const calculateOptimalAdjustments = (analysis: ImageAnalysis) => {
    const adjustments = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      gamma: 0
    }

    // Calculate brightness adjustment (more aggressive scaling)
    if (analysis.brightness.status === 'too_dark') {
      adjustments.brightness = Math.min(50, (120 - analysis.brightness.current) * 0.8)
    } else if (analysis.brightness.status === 'too_bright') {
      adjustments.brightness = Math.max(-50, (120 - analysis.brightness.current) * 0.8)
    }

    // Calculate contrast adjustment
    if (analysis.contrast.status === 'too_low') {
      adjustments.contrast = Math.min(60, (50 - analysis.contrast.current) * 1.2)
    } else if (analysis.contrast.status === 'too_high') {
      adjustments.contrast = Math.max(-40, (50 - analysis.contrast.current) * 0.8)
    }

    // Calculate saturation adjustment
    if (analysis.saturation.status === 'too_low') {
      adjustments.saturation = Math.min(0.4, (0.5 - analysis.saturation.current) * 1.5)
    } else if (analysis.saturation.status === 'too_high') {
      adjustments.saturation = Math.max(-0.3, (0.5 - analysis.saturation.current) * 1.2)
    }

    return adjustments
  }

  const performRealTimeAnalysis = () => {
    if (!analysis) return

    // Simulate the effect of current adjustments on image quality
    const projectedBrightness = Math.max(0, Math.min(255, analysis.brightness.current + adjustments.brightness * 2))
    const projectedContrast = Math.max(0, Math.min(100, analysis.contrast.current + adjustments.contrast * 0.8))
    const projectedSaturation = Math.max(0, Math.min(1, analysis.saturation.current + adjustments.saturation))

    // Determine new statuses
    const brightnessStatus = projectedBrightness < 80 ? 'too_dark' : projectedBrightness > 180 ? 'too_bright' : 'optimal'
    const contrastStatus = projectedContrast < 30 ? 'too_low' : projectedContrast > 80 ? 'too_high' : 'optimal'
    const saturationStatus = projectedSaturation < 0.3 ? 'too_low' : projectedSaturation > 0.8 ? 'too_high' : 'optimal'

    // Calculate new quality score
    const brightnessScore = brightnessStatus === 'optimal' ? 25 : 15
    const contrastScore = contrastStatus === 'optimal' ? 25 : 15
    const saturationScore = saturationStatus === 'optimal' ? 25 : 15
    const sharpnessScore = analysis.sharpness.status === 'sharp' ? 25 : 10
    const overallScore = brightnessScore + contrastScore + saturationScore + sharpnessScore

    const grade = overallScore >= 90 ? 'excellent' :
                  overallScore >= 75 ? 'good' :
                  overallScore >= 60 ? 'fair' : 'poor'

    const issues: string[] = []
    if (brightnessStatus !== 'optimal') issues.push(`Image will be ${brightnessStatus.replace('_', ' ')}`)
    if (contrastStatus !== 'optimal') issues.push(`Contrast will be ${contrastStatus.replace('_', ' ')}`)
    if (saturationStatus !== 'optimal') issues.push(`Saturation will be ${saturationStatus.replace('_', ' ')}`)

    setRealTimeAnalysis({
      brightness: {
        current: projectedBrightness,
        recommended: analysis.brightness.recommended,
        status: brightnessStatus
      },
      contrast: {
        current: projectedContrast,
        recommended: analysis.contrast.recommended,
        status: contrastStatus
      },
      saturation: {
        current: projectedSaturation,
        recommended: analysis.saturation.recommended,
        status: saturationStatus
      },
      sharpness: analysis.sharpness,
      overallQuality: {
        score: overallScore,
        grade,
        issues
      }
    })
  }

  const performImageAnalysis = (pixels: Uint8ClampedArray, width: number, height: number): ImageAnalysis => {
    let totalBrightness = 0
    let totalContrast = 0
    let totalSaturation = 0
    let edgePixels = 0

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]

      // Calculate brightness (luminance)
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b
      totalBrightness += brightness

      // Calculate saturation
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const saturation = max === 0 ? 0 : (max - min) / max
      totalSaturation += saturation

      // Simple edge detection for sharpness
      if (i < pixels.length - 4) {
        const nextR = pixels[i + 4]
        const diff = Math.abs(r - nextR)
        if (diff > 30) edgePixels++
      }
    }

    const pixelCount = pixels.length / 4
    const avgBrightness = totalBrightness / pixelCount
    const avgSaturation = totalSaturation / pixelCount
    const sharpness = (edgePixels / pixelCount) * 100

    // Calculate contrast using standard deviation
    let varianceSum = 0
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b
      varianceSum += Math.pow(brightness - avgBrightness, 2)
    }
    const contrast = Math.sqrt(varianceSum / pixelCount)

    // Determine status and recommendations
    const brightnessStatus = avgBrightness < 80 ? 'too_dark' : avgBrightness > 180 ? 'too_bright' : 'optimal'
    const contrastStatus = contrast < 30 ? 'too_low' : contrast > 80 ? 'too_high' : 'optimal'
    const saturationStatus = avgSaturation < 0.3 ? 'too_low' : avgSaturation > 0.8 ? 'too_high' : 'optimal'
    const sharpnessStatus = sharpness < 5 ? 'blurry' : sharpness > 20 ? 'over_sharpened' : 'sharp'

    // Calculate recommendations
    const recommendedBrightness = brightnessStatus === 'too_dark' ? avgBrightness + 30 :
                                 brightnessStatus === 'too_bright' ? avgBrightness - 30 : avgBrightness
    const recommendedContrast = contrastStatus === 'too_low' ? contrast + 20 :
                               contrastStatus === 'too_high' ? contrast - 20 : contrast
    const recommendedSaturation = saturationStatus === 'too_low' ? avgSaturation + 0.2 :
                                 saturationStatus === 'too_high' ? avgSaturation - 0.2 : avgSaturation

    // Calculate overall quality score
    const brightnessScore = brightnessStatus === 'optimal' ? 25 : 15
    const contrastScore = contrastStatus === 'optimal' ? 25 : 15
    const saturationScore = saturationStatus === 'optimal' ? 25 : 15
    const sharpnessScore = sharpnessStatus === 'sharp' ? 25 : 10
    const overallScore = brightnessScore + contrastScore + saturationScore + sharpnessScore

    const grade = overallScore >= 90 ? 'excellent' :
                  overallScore >= 75 ? 'good' :
                  overallScore >= 60 ? 'fair' : 'poor'

    const issues: string[] = []
    if (brightnessStatus !== 'optimal') issues.push(`Image is ${brightnessStatus.replace('_', ' ')}`)
    if (contrastStatus !== 'optimal') issues.push(`Contrast is ${contrastStatus.replace('_', ' ')}`)
    if (saturationStatus !== 'optimal') issues.push(`Saturation is ${saturationStatus.replace('_', ' ')}`)
    if (sharpnessStatus !== 'sharp') issues.push(`Image appears ${sharpnessStatus}`)

    return {
      brightness: {
        current: avgBrightness,
        recommended: recommendedBrightness,
        status: brightnessStatus
      },
      contrast: {
        current: contrast,
        recommended: recommendedContrast,
        status: contrastStatus
      },
      saturation: {
        current: avgSaturation,
        recommended: recommendedSaturation,
        status: saturationStatus
      },
      sharpness: {
        current: sharpness,
        status: sharpnessStatus
      },
      overallQuality: {
        score: overallScore,
        grade,
        issues
      }
    }
  }

  const applyEnhancements = async () => {
    if (!originalImageRef.current || !canvasRef.current) return

    setIsApplying(true)

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = originalImageRef.current
      canvas.width = img.width
      canvas.height = img.height

      // Apply enhancements using improved canvas filters
      let filters = []
      
      if (adjustments.brightness !== 0) {
        // More effective brightness scaling
        const brightness = 100 + (adjustments.brightness * 1.5)
        filters.push(`brightness(${Math.max(10, Math.min(300, brightness))}%)`)
      }
      
      if (adjustments.contrast !== 0) {
        // More effective contrast scaling
        const contrast = 100 + (adjustments.contrast * 1.8)
        filters.push(`contrast(${Math.max(10, Math.min(300, contrast))}%)`)
      }
      
      if (adjustments.saturation !== 0) {
        // More effective saturation scaling
        const saturation = 100 + (adjustments.saturation * 150)
        filters.push(`saturate(${Math.max(0, Math.min(300, saturation))}%)`)
      }

      // Apply filters and draw image
      ctx.filter = filters.length > 0 ? filters.join(' ') : 'none'
      ctx.drawImage(img, 0, 0)

      // Convert to blob and create URL
      canvas.toBlob((blob) => {
        if (blob && onEnhancedImage) {
          const enhancedUrl = URL.createObjectURL(blob)
          onEnhancedImage(enhancedUrl)
          setAutoEnhanced(true)
        }
      }, 'image/jpeg', 0.95)

    } catch (error) {
      console.error('Error applying enhancements:', error)
    } finally {
      setIsApplying(false)
    }
  }

  const applyAutoEnhancements = () => {
    if (!analysis) return
    
    const optimalAdjustments = calculateOptimalAdjustments(analysis)
    setAdjustments(optimalAdjustments)
    
    // Auto-apply the enhancements
    setTimeout(() => {
      applyEnhancements()
    }, 100)
  }

  const resetAdjustments = () => {
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      gamma: 0
    })
    setAutoEnhanced(false)
    setRealTimeAnalysis(null)
  }

  const getStatusIcon = (status: string) => {
    if (status === 'optimal' || status === 'sharp') {
      return <CheckCircle className="w-4 h-4 text-green-400" />
    }
    return <AlertTriangle className="w-4 h-4 text-yellow-400" />
  }

  const getQualityColor = (grade: string) => {
    switch (grade) {
      case 'excellent': return 'text-green-400'
      case 'good': return 'text-blue-400'
      case 'fair': return 'text-yellow-400'
      case 'poor': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  if (!imageUrl) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-xl p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
            <Zap className="w-4 h-4 text-white" />
          </div>
          Image Enhancement
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-purple-400 hover:text-purple-300"
        >
          <Settings className="w-4 h-4 mr-2" />
          {showAdvanced ? 'Simple' : 'Advanced'}
        </Button>
      </div>

      {isAnalyzing ? (
        <div className="text-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 mx-auto mb-4"
          >
            <Eye className="w-8 h-8 text-purple-400" />
          </motion.div>
          <p className="text-gray-300">Analyzing image quality...</p>
        </div>
      ) : analysis ? (
        <div className="space-y-6">
          {/* Overall Quality Score */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-medium text-white">Image Quality</span>
              <span className={`text-xl font-bold ${getQualityColor(analysis.overallQuality.grade)}`}>
                {analysis.overallQuality.score}/100
              </span>
            </div>
            <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
              <motion.div
                className={`absolute left-0 top-0 h-full rounded-full ${
                  analysis.overallQuality.grade === 'excellent' ? 'bg-green-500' :
                  analysis.overallQuality.grade === 'good' ? 'bg-blue-500' :
                  analysis.overallQuality.grade === 'fair' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${analysis.overallQuality.score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium capitalize ${getQualityColor(analysis.overallQuality.grade)}`}>
                {analysis.overallQuality.grade}
              </span>
              <span className="text-gray-400">
                Medical Grade Quality
              </span>
            </div>
          </div>

          {/* Real-time Analysis Feedback */}
          {realTimeAnalysis && (adjustments.brightness !== 0 || adjustments.contrast !== 0 || adjustments.saturation !== 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
            >
              <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Real-time Preview Analysis
              </h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="text-sm">
                  <span className="text-gray-400">Projected Quality:</span>
                  <span className={`ml-2 font-semibold ${getQualityColor(realTimeAnalysis.overallQuality.grade)}`}>
                    {realTimeAnalysis.overallQuality.score}/100 ({realTimeAnalysis.overallQuality.grade})
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Status:</span>
                  <span className={`ml-2 ${
                    realTimeAnalysis.overallQuality.issues.length === 0 ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {realTimeAnalysis.overallQuality.issues.length === 0 ? 'Optimal' : 'Needs adjustment'}
                  </span>
                </div>
              </div>
              {realTimeAnalysis.overallQuality.issues.length > 0 && (
                <div className="text-xs text-yellow-200">
                  <strong>Issues:</strong> {realTimeAnalysis.overallQuality.issues.join(', ')}
                </div>
              )}
            </motion.div>
          )}

          {/* Auto Enhancement Suggestion */}
          {analysis && analysis.overallQuality.score < 75 && !autoEnhanced && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-purple-400 mb-1">Auto Enhancement Available</h4>
                  <p className="text-xs text-purple-200">Apply AI-recommended enhancements for optimal quality</p>
                </div>
                <Button
                  onClick={applyAutoEnhancements}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Auto Enhance
                </Button>
              </div>
            </motion.div>
          )}

          {/* Quick Recommendations */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <Sun className="w-5 h-5 text-yellow-400" />
                {getStatusIcon(analysis.brightness.status)}
              </div>
              <div className="text-sm text-gray-300">Brightness</div>
              <div className="text-lg font-semibold text-white">
                {Math.round(analysis.brightness.current)}
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <Contrast className="w-5 h-5 text-blue-400" />
                {getStatusIcon(analysis.contrast.status)}
              </div>
              <div className="text-sm text-gray-300">Contrast</div>
              <div className="text-lg font-semibold text-white">
                {Math.round(analysis.contrast.current)}
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <Palette className="w-5 h-5 text-purple-400" />
                {getStatusIcon(analysis.saturation.status)}
              </div>
              <div className="text-sm text-gray-300">Saturation</div>
              <div className="text-lg font-semibold text-white">
                {Math.round(analysis.saturation.current * 100)}%
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <Eye className="w-5 h-5 text-green-400" />
                {getStatusIcon(analysis.sharpness.status)}
              </div>
              <div className="text-sm text-gray-300">Sharpness</div>
              <div className="text-lg font-semibold text-white">
                {Math.round(analysis.sharpness.current)}%
              </div>
            </div>
          </div>

          {/* Enhancement Controls */}
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <h4 className="text-lg font-semibold text-white">Manual Adjustments</h4>
              
              {/* Brightness */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-300 flex items-center">
                    <Sun className="w-4 h-4 mr-2 text-yellow-400" />
                    Brightness
                  </label>
                  <span className="text-sm text-white">{adjustments.brightness > 0 ? '+' : ''}{adjustments.brightness}</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={5}
                  value={adjustments.brightness}
                  onChange={(e) => setAdjustments(prev => ({ ...prev, brightness: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-300 flex items-center">
                    <Contrast className="w-4 h-4 mr-2 text-blue-400" />
                    Contrast
                  </label>
                  <span className="text-sm text-white">{adjustments.contrast > 0 ? '+' : ''}{adjustments.contrast}</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={5}
                  value={adjustments.contrast}
                  onChange={(e) => setAdjustments(prev => ({ ...prev, contrast: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Saturation */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-300 flex items-center">
                    <Palette className="w-4 h-4 mr-2 text-purple-400" />
                    Saturation
                  </label>
                  <span className="text-sm text-white">{adjustments.saturation > 0 ? '+' : ''}{Math.round(adjustments.saturation * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.1}
                  value={adjustments.saturation}
                  onChange={(e) => setAdjustments(prev => ({ ...prev, saturation: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Enhancement Slider Real-time Values */}
              {(adjustments.brightness !== 0 || adjustments.contrast !== 0 || adjustments.saturation !== 0) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600"
                >
                  <h5 className="text-sm font-medium text-white mb-2">Current Adjustments</h5>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {adjustments.brightness !== 0 && (
                      <div className="text-center">
                        <div className="text-yellow-400">Brightness</div>
                        <div className="text-white font-medium">{adjustments.brightness > 0 ? '+' : ''}{adjustments.brightness}</div>
                      </div>
                    )}
                    {adjustments.contrast !== 0 && (
                      <div className="text-center">
                        <div className="text-blue-400">Contrast</div>
                        <div className="text-white font-medium">{adjustments.contrast > 0 ? '+' : ''}{adjustments.contrast}</div>
                      </div>
                    )}
                    {adjustments.saturation !== 0 && (
                      <div className="text-center">
                        <div className="text-purple-400">Saturation</div>
                        <div className="text-white font-medium">{adjustments.saturation > 0 ? '+' : ''}{Math.round(adjustments.saturation * 100)}%</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={applyEnhancements}
              disabled={isApplying}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isApplying ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 mr-2"
                  >
                    <Zap className="w-4 h-4" />
                  </motion.div>
                  Applying...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Apply Manual Settings
                </>
              )}
            </Button>
            
            {analysis && analysis.overallQuality.score < 90 && (
              <Button
                onClick={applyAutoEnhancements}
                disabled={isApplying}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4"
              >
                <Settings className="w-4 h-4 mr-2" />
                Auto Fix
              </Button>
            )}
            
            <Button
              onClick={resetAdjustments}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Enhancement Status */}
          {autoEnhanced && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/30 rounded-lg p-3"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">Enhancement Applied Successfully</span>
              </div>
              <p className="text-xs text-green-200 mt-1">Image has been enhanced and is ready for analysis</p>
            </motion.div>
          )}

          {/* Enhancement Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-200">
                <strong>Enhancement Tips:</strong> For medical imaging, maintain natural color balance 
                and avoid over-processing. Enhanced images are for preview only - use original for diagnosis.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Upload an image to see enhancement suggestions</p>
        </div>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  )
}

export default ImageEnhancementSuggestions