"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Eye, 
  Brain, 
  Target, 
  Info, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download,
  HelpCircle,
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AttentionStats {
  center_of_attention: { x: number; y: number }
  attention_concentration: number
  dominant_quadrant: string
  quadrant_scores: { [key: string]: number }
  max_attention_value: number
  coverage_percentage: number
}

interface MedicalInterpretation {
  focus_description: string
  clinical_relevance: string
  confidence_explanation: string
  recommendations: string[]
}

interface ExplanationData {
  heatmap_base64: string
  overlay_base64: string
  attention_stats: AttentionStats
  layer_used: string
  success: boolean
  error?: string
}

interface MultiClassExplanation {
  class_index: number
  confidence: number
  rank: number
  explanation: ExplanationData
}

interface ExplainableAIData {
  main_explanation: ExplanationData
  multi_class_explanations: { [key: string]: MultiClassExplanation }
  medical_interpretation: MedicalInterpretation
  explanation_available: boolean
  error?: string
}

interface Props {
  originalImage: string
  explainableData: ExplainableAIData | null
  predictedClass: string
  confidence: number
  className?: string
}

export default function HeatmapVisualization({ 
  originalImage, 
  explainableData, 
  predictedClass, 
  confidence,
  className 
}: Props) {
  const [selectedView, setSelectedView] = useState<'heatmap' | 'overlay' | 'original'>('overlay')
  const [selectedClass, setSelectedClass] = useState<string>(predictedClass)
  const [zoom, setZoom] = useState(1)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement>(null)

  // Update selected class when predicted class changes
  useEffect(() => {
    setSelectedClass(predictedClass)
  }, [predictedClass])

  if (!explainableData || !explainableData.explanation_available) {
    return (
      <Card className={`glass ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Brain className="w-5 h-5" />
            <span>AI Explanation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-gray-300">
              {explainableData?.error 
                ? `Explanation generation failed: ${explainableData.error}`
                : "Explainable AI visualization is not available for this prediction."
              }
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const currentExplanation = explainableData.multi_class_explanations[selectedClass]?.explanation 
    || explainableData.main_explanation

  if (!currentExplanation || !currentExplanation.success) {
    return (
      <Card className={`glass ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Brain className="w-5 h-5" />
            <span>AI Explanation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-gray-300">
              No explanation available for the selected class.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    setTooltipPosition({ x, y })
    setShowTooltip(true)
    setTimeout(() => setShowTooltip(false), 3000)
  }

  const downloadImage = () => {
    const link = document.createElement('a')
    link.href = selectedView === 'heatmap' ? currentExplanation.heatmap_base64 
               : selectedView === 'overlay' ? currentExplanation.overlay_base64 
               : originalImage
    link.download = `${selectedClass}_${selectedView}_explanation.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getQuadrantColor = (quadrant: string, isActive: boolean) => {
    if (!isActive) return 'bg-gray-600/30'
    
    const intensity = currentExplanation.attention_stats.quadrant_scores[quadrant] || 0
    if (intensity > 0.7) return 'bg-red-500/70'
    if (intensity > 0.4) return 'bg-yellow-500/70'
    return 'bg-blue-500/70'
  }

  const getImageToDisplay = () => {
    switch (selectedView) {
      case 'heatmap':
        return currentExplanation.heatmap_base64
      case 'overlay':
        return currentExplanation.overlay_base64
      case 'original':
      default:
        return originalImage
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>AI Explanation & Reasoning</span>
            </div>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
              {currentExplanation.layer_used}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Class Selection */}
      {Object.keys(explainableData.multi_class_explanations).length > 1 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-white text-sm">Select Class to Explain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(explainableData.multi_class_explanations).map(([className, data]) => (
                <Button
                  key={className}
                  variant={selectedClass === className ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedClass(className)}
                  className={`${
                    selectedClass === className 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  {className.replace('_', ' ')}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {(data.confidence * 100).toFixed(1)}%
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Visualization */}
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Visual Explanation</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadImage}
                className="bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(1)}
                className="bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
            <TabsList className="grid w-full grid-cols-3 bg-gray-700/50">
              <TabsTrigger value="original" className="data-[state=active]:bg-blue-500">
                Original
              </TabsTrigger>
              <TabsTrigger value="overlay" className="data-[state=active]:bg-blue-500">
                Overlay
              </TabsTrigger>
              <TabsTrigger value="heatmap" className="data-[state=active]:bg-blue-500">
                Heatmap
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 relative">
              <div className="relative overflow-hidden rounded-lg border border-gray-600">
                <img
                  ref={imageRef}
                  src={getImageToDisplay()}
                  alt={`${selectedView} view`}
                  className="w-full h-auto cursor-crosshair transition-transform duration-200"
                  style={{ transform: `scale(${zoom})` }}
                  onClick={handleImageClick}
                />
                
                {/* Attention Center Marker */}
                {selectedView !== 'original' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full"
                    style={{
                      left: `${currentExplanation.attention_stats.center_of_attention.x * 100}%`,
                      top: `${currentExplanation.attention_stats.center_of_attention.y * 100}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                )}

                {/* Tooltip */}
                <AnimatePresence>
                  {showTooltip && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute bg-black/80 text-white p-2 rounded text-xs"
                      style={{
                        left: tooltipPosition.x,
                        top: tooltipPosition.y - 40
                      }}
                    >
                      Center of Attention
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Zoom Controls */}
              <div className="absolute top-2 right-2 flex flex-col space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(zoom + 0.25, 3))}
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(zoom - 0.25, 0.5))}
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <TabsContent value="original" className="mt-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-gray-300">
                  This is the original fundus image that was analyzed by the AI model.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="overlay" className="mt-4">
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription className="text-gray-300">
                  The overlay shows the original image with the AI's attention heatmap superimposed. 
                  Red areas indicate where the model focused most when making its decision.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="heatmap" className="mt-4">
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription className="text-gray-300">
                  Pure heatmap visualization showing exactly where the AI model paid attention. 
                  Warmer colors (red/yellow) indicate higher attention, cooler colors (blue) indicate lower attention.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Attention Statistics */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-white">Attention Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quadrant Analysis */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Focus Distribution</h4>
              <div className="grid grid-cols-2 gap-1 h-24 mb-2">
                {['top_left', 'top_right', 'bottom_left', 'bottom_right'].map((quadrant) => (
                  <div
                    key={quadrant}
                    className={`rounded border border-gray-600 flex items-center justify-center text-xs text-white ${
                      getQuadrantColor(quadrant, currentExplanation.attention_stats.dominant_quadrant === quadrant)
                    }`}
                  >
                    {(currentExplanation.attention_stats.quadrant_scores[quadrant] * 100).toFixed(1)}%
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                Dominant: {currentExplanation.attention_stats.dominant_quadrant.replace('_', ' ')}
              </p>
            </div>

            {/* Statistics */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-300">Coverage:</span>
                <span className="text-sm text-white">
                  {currentExplanation.attention_stats.coverage_percentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-300">Concentration:</span>
                <span className="text-sm text-white">
                  {currentExplanation.attention_stats.attention_concentration.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-300">Max Attention:</span>
                <span className="text-sm text-white">
                  {(currentExplanation.attention_stats.max_attention_value * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Interpretation */}
      {explainableData.medical_interpretation && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Eye className="w-5 h-5" />
              <span>Medical Interpretation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-blue-300 mb-1">Focus Description</h4>
              <p className="text-sm text-gray-300">
                {explainableData.medical_interpretation.focus_description}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-blue-300 mb-1">Clinical Relevance</h4>
              <p className="text-sm text-gray-300">
                {explainableData.medical_interpretation.clinical_relevance}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-blue-300 mb-1">Confidence Analysis</h4>
              <p className="text-sm text-gray-300">
                {explainableData.medical_interpretation.confidence_explanation}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-blue-300 mb-2">Recommendations</h4>
              <ul className="space-y-1">
                {explainableData.medical_interpretation.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start space-x-2">
                    <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <HelpCircle className="w-5 h-5" />
            <span>How to Interpret</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• <strong>Red/Yellow areas:</strong> High attention - the AI focused on these regions</p>
            <p>• <strong>Blue areas:</strong> Low attention - these regions had minimal influence</p>
            <p>• <strong>Center marker:</strong> The primary focus point of the AI's attention</p>
            <p>• <strong>Coverage:</strong> Percentage of image area that received significant attention</p>
            <p>• <strong>Concentration:</strong> How focused vs. distributed the attention pattern is</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}