"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Upload, Eye, AlertCircle, Info, Download, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Navigation } from "@/components/navigation"
import { toast } from "sonner"
import ShareableLinks from "@/components/ui/shareable-links"
import EmailButton from "@/components/ui/email-button"
import jsPDF from "jspdf"

interface RefractiveResult {
  classification: string
  confidence: number
  class_probabilities?: {
    [key: string]: number
  }
  quality_assessment: {
    quality_level: string
    overall_score: number
    metrics: {
      resolution_score: number
      contrast_score: number
      brightness_score: number
      sharpness_score: number
    }
  }
  recommendations: string[]
  model_version: string
  status: string
  message: string
  note?: string
}

export default function RefractiveAnalysisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<RefractiveResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
      setResult(null)
      
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setError(null)
      setResult(null)
      
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const analyzeImage = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('http://127.0.0.1:5000/analyze/refractive-power', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      setResult(data)
      toast.success('Myopia classification completed!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const downloadPdf = async () => {
    if (!resultsRef.current || !result) return

    setDownloadingPdf(true)
    try {
      console.log('Starting PDF generation...')

      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      // Add header
      doc.setFontSize(20)
      doc.setTextColor(40, 40, 40)
      doc.text('Myopia Classification Analysis Report', 20, 30)

      // Add date
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 40)

      // Add main result
      doc.setFontSize(16)
      doc.setTextColor(40, 40, 40)
      doc.text('Analysis Results:', 20, 60)

      doc.setFontSize(14)
      doc.text(`Classification: ${result.classification}`, 20, 75)
      doc.text(`Confidence: ${(result.confidence * 100).toFixed(1)}%`, 20, 85)
      doc.text(`Quality Level: ${result.quality_assessment.quality_level}`, 20, 95)
      doc.text(`Overall Score: ${result.quality_assessment.overall_score.toFixed(1)}%`, 20, 105)

      // Add quality metrics
      doc.text('Quality Metrics:', 20, 125)
      doc.setFontSize(12)
      doc.text(`Resolution: ${result.quality_assessment.metrics.resolution_score.toFixed(1)}%`, 25, 135)
      doc.text(`Contrast: ${result.quality_assessment.metrics.contrast_score.toFixed(1)}%`, 25, 145)
      doc.text(`Brightness: ${result.quality_assessment.metrics.brightness_score.toFixed(1)}%`, 25, 155)
      doc.text(`Sharpness: ${result.quality_assessment.metrics.sharpness_score.toFixed(1)}%`, 25, 165)

      // Add recommendations
      if (result.recommendations && result.recommendations.length > 0) {
        doc.setFontSize(14)
        doc.text('Recommendations:', 20, 185)
        doc.setFontSize(12)
        let yPos = 195
        result.recommendations.forEach((rec, index) => {
          doc.text(`${index + 1}. ${rec}`, 25, yPos)
          yPos += 10
        })
      }

      // Add footer
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      doc.text('This report is for informational purposes only. Consult a healthcare professional for medical advice.', 20, 280)

      // Save the PDF
      const filename = `myopia-analysis-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(filename)

      console.log('PDF generated successfully!')
      toast.success('PDF report downloaded successfully!')
    } catch (err) {
      console.error('Error generating PDF:', err)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setDownloadingPdf(false)
    }
  }



  const getQualityColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'bg-green-500'
      case 'good': return 'bg-blue-500'
      case 'fair': return 'bg-yellow-500'
      case 'poor': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }



  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        > 
          <br></br>
          <br></br>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-glass mb-4">
              Myopia Classification Analysis
            </h1>
            <p className="text-glass-muted text-lg max-w-2xl mx-auto">
              Upload a fundus image to detect myopia (nearsightedness) using AI-powered analysis
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="enhanced-glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 refractive-text">
                  <Upload className="w-5 h-5" />
                  Upload Fundus Image
                </CardTitle>
                <CardDescription className="refractive-muted">
                  Select a high-quality fundus photograph for analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-glass-accent/30 rounded-lg p-8 text-center cursor-pointer hover:border-glass-accent/50 transition-colors"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-64 mx-auto rounded-lg"
                      />
                      <p className="text-glass text-sm">{selectedFile?.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Eye className="w-16 h-16 mx-auto text-glass-accent" />
                      <div>
                        <p className="refractive-text font-medium">
                          Drop your fundus image here or click to browse
                        </p>
                        <p className="refractive-muted text-sm mt-2">
                          Supports JPG, PNG, TIFF formats
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  aria-label="Upload fundus image for myopia analysis"
                  title="Select a fundus image file"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile && (
                  <Button
                    onClick={analyzeImage}
                    disabled={isAnalyzing}
                    className="w-full mt-4 glass-strong bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-600/90 hover:to-purple-700/90"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Analyze for Myopia
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Results Section */}
            <Card className="enhanced-glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 refractive-text">
                  <Eye className="w-5 h-5" />
                  Analysis Results
                </CardTitle>
                <CardDescription className="refractive-muted">
                  Myopia classification results and image quality
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-4 border-red-500/50 bg-red-500/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-400">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {result && (
                  <div ref={resultsRef} className="space-y-6">
                    {/* Main Result */}
                    <div className="text-center p-6 glass-strong rounded-lg">
                      <h3 className="text-2xl font-bold refractive-text mb-2">
                        {result.classification}
                      </h3>
                      <p className="refractive-muted mb-4">
                        {result.classification === 'Myopia' 
                          ? 'Myopia (nearsightedness) detected' 
                          : 'Normal vision pattern detected'}
                      </p>
                      <div className="flex items-center justify-center gap-4">
                        <Badge className={result.classification === 'Myopia' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                          {result.classification}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="refractive-muted text-sm">Confidence:</span>
                          <span className="refractive-text font-medium">
                            {(result.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Class Probabilities */}
                      {result.class_probabilities && (
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          {Object.entries(result.class_probabilities).map(([className, prob]) => (
                            <div key={className} className="flex justify-between">
                              <span className="refractive-muted">{className}:</span>
                              <span className="refractive-text font-medium">
                                {(prob as number * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quality Assessment */}
                    <div className="space-y-3">
                      <h4 className="font-semibold refractive-text">Image Quality Assessment</h4>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getQualityColor(result.quality_assessment.quality_level)}`} />
                        <span className="refractive-text capitalize">
                          {result.quality_assessment.quality_level} Quality
                        </span>
                        <span className="refractive-muted text-sm">
                          ({(result.quality_assessment.overall_score * 100).toFixed(0)}%)
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-glass-muted">Resolution:</span>
                          <Progress 
                            value={result.quality_assessment.metrics.resolution_score * 100} 
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <span className="text-glass-muted">Contrast:</span>
                          <Progress 
                            value={result.quality_assessment.metrics.contrast_score * 100} 
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <span className="text-glass-muted">Brightness:</span>
                          <Progress 
                            value={result.quality_assessment.metrics.brightness_score * 100} 
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <span className="text-glass-muted">Sharpness:</span>
                          <Progress 
                            value={result.quality_assessment.metrics.sharpness_score * 100} 
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {result.recommendations.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-glass">Recommendations</h4>
                        <div className="space-y-2">
                          {result.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <span className="text-glass-muted">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Share and Download Options */}
                    <div className="flex flex-wrap gap-3 justify-center pt-4 border-t border-gray-700">
                      <ShareableLinks
                        testResult={{
                          id: 'current-myopia-test',
                          date: new Date().toISOString(),
                          type: 'eye_disease',
                          predicted_class: result.classification,
                          confidence: result.confidence,
                          status: result.classification === 'Myopia' ? 'abnormal' : 'normal',
                          all_scores: result.class_probabilities || {}
                        }}
                        trigger={
                          <Button
                            variant="outline"
                            className="border-purple-500/50 text-white hover:bg-purple-500/10 bg-black"
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Share Results
                          </Button>
                        }
                      />
                      <EmailButton
                        type="comprehensive"
                        variant="outline"
                        className="border-purple-500/50 text-white hover:bg-purple-500/10 bg-black"
                      >
                        Email Report
                      </EmailButton>
                      <Button
                        onClick={downloadPdf}
                        disabled={downloadingPdf}
                        variant="outline"
                        className="flex items-center gap-2 border-blue-500/50 text-white hover:bg-blue-500/10 bg-black"
                      >
                        {downloadingPdf ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Download PDF
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Demo Note */}
                    {result.note && (
                      <Alert className="border-yellow-500/50 bg-yellow-500/10">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-yellow-400">
                          {result.note}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {!result && !error && !isAnalyzing && (
                  <div className="text-center py-12 text-glass-muted">
                    <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Upload a fundus image to begin analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
