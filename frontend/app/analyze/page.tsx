"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Upload, FileImage, CheckCircle, AlertTriangle, Loader2, Eye, Brain, ArrowRight, Download, History, TrendingUp } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import EmailButton from "@/components/ui/email-button"
import ProgressBar from "@/components/ui/progress-bar"
import InteractiveImagePreview from "@/components/ui/interactive-image-preview"
import ConfidenceVisualization from "@/components/ui/confidence-visualization"
import HistoricalResults from "@/components/ui/historical-results"
import ImageQualityChecker from "@/components/ui/image-quality-checker"
import CameraIntegration from "@/components/ui/camera-integration"
import { ComparisonCharts } from "@/components/ui/comparison-charts"
import ExportFunctionality from "@/components/ui/export-functionality"
import FundusTutorial from "@/components/ui/fundus-tutorial"
import ShareableLinks from "@/components/ui/shareable-links"
import ImageEnhancementSuggestions from "@/components/ui/image-enhancement-suggestions"
import HeatmapVisualization from "@/components/ui/heatmap-visualization"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [progress, setProgress] = useState(0)
  const [analysisStatus, setAnalysisStatus] = useState<'validating' | 'processing' | 'analyzing' | 'completed' | 'error'>('validating')
  const [statusMessage, setStatusMessage] = useState('')
  const [showHistoricalResults, setShowHistoricalResults] = useState(false)
  const [imageQuality, setImageQuality] = useState<any>(null)
  const [showTutorial, setShowTutorial] = useState(false)
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null)
  const [showEnhancement, setShowEnhancement] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Mock historical data - in real app, this would come from API
  const mockHistoricalResults = [
    {
      id: '1',
      date: new Date().toISOString(),
      type: 'eye_disease' as const,
      predicted_class: 'normal',
      confidence: 0.95,
      status: 'normal' as const,
      all_scores: { normal: 0.95, cataract: 0.03, glaucoma: 0.01, diabetic_retinopathy: 0.01 }
    },
    {
      id: '2', 
      date: new Date(Date.now() - 86400000).toISOString(),
      type: 'eye_disease' as const,
      predicted_class: 'diabetic_retinopathy',
      confidence: 0.87,
      status: 'abnormal' as const,
      all_scores: { diabetic_retinopathy: 0.87, normal: 0.08, glaucoma: 0.03, cataract: 0.02 }
    }
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setError(null)
    setResults(null)

    if (selectedFile) {
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Submit handler called")
    if (!file) {
      setError("Please select an image to analyze")
      return
    }

    if (imageQuality && !imageQuality.isValid) {
      // Show warning but don't prevent submission
      setError("Warning: Low quality image detected. Analysis results may be less accurate, but you can still proceed.")
    }

    setLoading(true)
    setError(null)
    setProgress(0)
    setAnalysisStatus('validating')
    setStatusMessage('Preparing image for analysis...')

    try {
      console.log("Uploading file:", file.name)
      const formData = new FormData()
      formData.append("file", file)

      // Progress simulation
      setProgress(25)
      setAnalysisStatus('validating')
      setStatusMessage('Validating image quality...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      setProgress(50)
      setAnalysisStatus('processing')
      setStatusMessage('Processing image data...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      setProgress(75)
      setAnalysisStatus('analyzing')
      setStatusMessage('Running AI analysis...')
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      console.log("Sending request to backend", `${apiUrl}/predict`)

      // First check if backend is reachable
      try {
        const healthCheck = await fetch(`${apiUrl}/health`, { method: 'GET' })
        if (!healthCheck.ok) {
          throw new Error(`Backend server is not responding (status: ${healthCheck.status})`)
        }
      } catch (healthError) {
        throw new Error('Backend server is not reachable. Please ensure the backend is running on port 5000.')
      }

      const response = await fetch(`${apiUrl}/predict`, {
        method: "POST",
        body: formData,
      })

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text()
        console.error('Non-JSON response received:', responseText)
        throw new Error(`Server returned non-JSON response. Status: ${response.status}. Response: ${responseText.substring(0, 200)}...`)
      }

      const data = await response.json()
      
      setProgress(100)
      setAnalysisStatus('completed')
      setStatusMessage('Analysis completed successfully!')
      
      if (!response.ok) {
        setAnalysisStatus('error')
        // Handle specific validation errors from backend
        if (data.error && data.suggestion) {
          const errorMessage = `${data.error}\n\n${data.suggestion}`
          if (data.image_type) {
            setError(`${errorMessage}\n\nDetected type: ${data.image_type.replace('_', ' ')}`)
          } else {
            setError(errorMessage)
          }
        } else {
          setError(data.error || `Server error: ${response.status}`)
        }
        return
      }
      
      // Handle successful prediction with potential warnings
      if (data.status === 'low_confidence') {
        setError(`⚠️ ${data.message}\n\n${data.suggestion || ''}`)
      }
      
      setResults(data)
    } catch (err) {
      setAnalysisStatus('error')
      setError(`Error analyzing image: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const downloadPdf = async () => {
    if (!resultsRef.current || !results) return
    
    setDownloadingPdf(true)
    try {
      console.log('Starting PDF generation...')
      
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })
      
      // Set up the PDF content - use white background for better printing
      doc.setFillColor(255, 255, 255) // White background for better printing
      doc.rect(0, 0, 210, 297, 'F') // Fill the entire page
      
      // Add title with dark text for better visibility when printed
      doc.setTextColor(0, 0, 0) // Black text
      doc.setFontSize(24)
      doc.text('Eye Disease Analysis Report', 105, 25, { align: 'center' })
      
      // Add logo/header
      doc.setDrawColor(59, 130, 246) // Blue color for header line
      doc.setLineWidth(0.5)
      doc.line(20, 30, 190, 30)
      
      // Add test date
      doc.setFontSize(12)
      doc.setTextColor(80, 80, 80) // Dark gray
      doc.text(`Analysis Date: ${new Date().toLocaleDateString()}`, 105, 40, { align: 'center' })
      
      // Add diagnosis section
      doc.setTextColor(0, 0, 0) // Black text
      doc.setFontSize(18)
      doc.text('Diagnosis Results', 20, 55)
      
      doc.setFontSize(16)
      doc.text('Diagnosis:', 20, 70)
      doc.setTextColor(59, 130, 246) // Blue color
      const diagnosisText = results.predicted_class ? results.predicted_class.replace('_', ' ').toUpperCase() : 'N/A'
      doc.text(diagnosisText, 70, 70) // Aligned to the right of the label
      
      // Add confidence
      doc.setTextColor(0, 0, 0) // Black text
      doc.setFontSize(16)
      doc.text('Confidence:', 20, 85)
      doc.setTextColor(59, 130, 246) // Blue color
      const confidenceText = results.confidence ? `${(results.confidence * 100).toFixed(2)}%` : 'N/A'
      doc.text(confidenceText, 70, 85) // Aligned to the right of the label
      
      // Add status section
      doc.setTextColor(0, 0, 0) // Black text
      doc.setFontSize(16)
      doc.text('Status:', 20, 100)
      
      // Set status color based on result
      const isNormal = results.predicted_class?.toLowerCase().includes('normal')
      if (isNormal) {
        doc.setTextColor(0, 128, 0) // Green for normal
        doc.text('NORMAL', 70, 100)
      } else {
        doc.setTextColor(220, 53, 69) // Red for abnormal
        doc.text('REQUIRES ATTENTION', 70, 100)
      }
      
      // Add a divider
      doc.setDrawColor(200, 200, 200) // Light gray
      doc.setLineWidth(0.2)
      doc.line(20, 110, 190, 110)
      
      // Add detailed analysis title
      doc.setTextColor(0, 0, 0) // Black text
      doc.setFontSize(18)
      doc.text('Detailed Analysis', 20, 125)
      
      // Add detailed analysis data
      let yPosition = 155
      if (results.all_scores) {
        Object.entries(results.all_scores).forEach(([condition, score]) => {
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(14)
          const conditionName = condition.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
          doc.text(`${conditionName}:`, 20, yPosition)
          
          // Draw progress bar background
          doc.setFillColor(75, 85, 99) // Gray background
          doc.rect(100, yPosition - 4, 80, 5, 'F')
          
          // Draw progress bar fill
          const scoreValue = typeof score === 'number' ? score : 0
          const width = scoreValue * 80
          doc.setFillColor(59, 130, 246) // Blue fill
          doc.rect(100, yPosition - 4, width, 5, 'F')
          
          // Add percentage text
          doc.setTextColor(255, 255, 255)
          doc.text(`${(scoreValue * 100).toFixed(1)}%`, 190, yPosition, { align: 'right' })
          
          yPosition += 15
        })
      }
      
      // Add explanation section
      yPosition += 20
      doc.setFillColor(75, 85, 99, 0.5) // Semi-transparent gray
      doc.roundedRect(20, yPosition, 170, 40, 3, 3, 'F')
      
      doc.setTextColor(59, 130, 246)
      doc.setFontSize(16)
      doc.text('Medical Recommendation', 30, yPosition + 15)
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      let explanation = 'Please consult with an ophthalmologist for a comprehensive evaluation.'
      if (results.predicted_class === 'normal') {
        explanation = 'No signs of retinal disease detected. Regular check-ups are still recommended.'
      } else if (results.predicted_class) {
        explanation = `Potential signs of ${results.predicted_class.replace('_', ' ')} detected. Please consult with an ophthalmologist for a comprehensive evaluation.`
      }
      const explanationLines = doc.splitTextToSize(explanation, 150)
      doc.text(explanationLines, 30, yPosition + 25)
      
      // Add disclaimer
      yPosition += 60
      doc.setTextColor(200, 200, 200)
      doc.setFontSize(10)
      const disclaimer = 'Disclaimer: This AI analysis is for screening purposes only and should not replace professional medical diagnosis. Please consult with a qualified healthcare provider for definitive diagnosis and treatment.'
      const disclaimerLines = doc.splitTextToSize(disclaimer, 170)
      doc.text(disclaimerLines, 20, yPosition)
      
      // Add footer
      doc.setTextColor(150, 150, 150)
      doc.setFontSize(9)
      doc.text('Generated by Dristi AI', 105, 285, { align: 'center' })
      
      // Save the PDF - using the correct method for jsPDF v3.0.1
      const filename = `eye-disease-analysis-${new Date().toISOString().split('T')[0]}.pdf`
      console.log('Saving PDF:', filename)
      
      // Use the standard save method
      doc.save(filename)
      
      console.log('PDF generated successfully!')
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const renderResults = () => {
    if (!results) return null

    const { predicted_class, confidence, all_scores } = results
    const formattedConfidence = (confidence * 100).toFixed(2)

    return (
      <div className="space-y-8">
        <motion.div
          ref={resultsRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-xl w-full max-w-3xl mx-auto mt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold flex items-center">
              <Brain className="mr-2 text-blue-400" />
              Analysis Results
            </h3>
            <div className="flex gap-2">
              <ShareableLinks
                testResult={{
                  id: 'current-test',
                  date: new Date().toISOString(),
                  type: 'eye_disease',
                  predicted_class,
                  confidence,
                  status: predicted_class === 'normal' ? 'normal' : 'abnormal',
                  all_scores
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
          </div>

          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium">Diagnosis:</span>
              <span className="text-xl font-bold text-blue-400 capitalize">{predicted_class.replace("_", " ")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Confidence:</span>
              <span className="text-xl font-bold text-blue-400">{formattedConfidence}%</span>
            </div>
          </div>

          <h4 className="text-xl font-semibold mb-3">Detailed Analysis</h4>
          <div className="space-y-3">
            {Object.entries(all_scores).map(([condition, score]) => (
              <div key={condition} className="flex items-center justify-between">
                <span className="capitalize">{condition.replace("_", " ")}:</span>
                <div className="flex items-center">
                  <div className="w-48 h-3 bg-gray-700 rounded-full overflow-hidden mr-3">
                    <div
                      className={`h-full rounded-full ${condition === predicted_class ? "bg-blue-500" : "bg-gray-500"}`}
                      style={{ width: `${(score as number) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{((score as number) * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <h4 className="text-lg font-semibold mb-2 flex items-center">
              <Eye className="mr-2 text-blue-400" />
              What This Means
            </h4>
            <p className="text-white">
              {predicted_class === "normal" 
                ? "No signs of retinal disease detected. Regular check-ups are still recommended."
                : `Potential signs of ${predicted_class.replace("_", " ")} detected. Please consult with an ophthalmologist for a comprehensive evaluation.`
              }
            </p>
          </div>
        </motion.div>

        {/* Enhanced Confidence Visualization */}
        <ConfidenceVisualization
          scores={all_scores || {}}
          primaryPrediction={predicted_class}
          overallConfidence={confidence}
          className="max-w-3xl mx-auto"
        />

        {/* Explainable AI Heatmap Visualization */}
        {results.explainable_ai && (
          <HeatmapVisualization
            originalImage={preview || ''}
            explainableData={results.explainable_ai}
            predictedClass={predicted_class}
            confidence={confidence}
            className="max-w-6xl mx-auto"
          />
        )}

        {/* Comparison Charts */}
        <ComparisonCharts
          results={mockHistoricalResults}
          className="max-w-6xl mx-auto"
          onExport={(chartType) => console.log('Exporting chart:', chartType)}
        />

        {/* Export Functionality */}
        <div className="max-w-3xl mx-auto flex justify-center">
          <ExportFunctionality
            results={mockHistoricalResults}
            trigger={
              <Button
                variant="outline"
                className="border-green-500/50 text-white hover:bg-green-500/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export All Data
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Eye className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-blue-400 uppercase tracking-wider">AI Analysis</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              <span className="text-white">Retinal</span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
                Image Analysis
              </span>
            </h1>

            <p className="text-xl text-white max-w-3xl mx-auto leading-relaxed">
              Upload a retinal fundus image to analyze for potential eye diseases. Our AI system validates image quality and provides accurate medical screening results.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass rounded-xl p-8 max-w-3xl mx-auto"
          >
            {/* Historical Results Toggle */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Upload Retinal Fundus Image</h2>
              <Button
                variant="outline"
                onClick={() => setShowTutorial(true)}
                className="border-purple-500/50 text-black hover:bg-purple-500/10 mr-2"
              >
                <Eye className="w-4 h-4 mr-2" />
                Tutorial
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowHistoricalResults(!showHistoricalResults)}
                className="border-blue-500/50 text-black hover:bg-blue-500/10"
              >
                <History className="w-4 h-4 mr-2" />
                {showHistoricalResults ? 'Hide' : 'Show'} History
              </Button>
            </div>

            {/* Historical Results Panel */}
            {showHistoricalResults && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <HistoricalResults
                  results={mockHistoricalResults}
                  onResultSelect={(result) => {
                    console.log('Selected result:', result)
                    setShowHistoricalResults(false)
                  }}
                  onExport={(results) => {
                    console.log('Exporting results:', results)
                  }}
                />
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <p className="text-white">
                  Please upload a high-quality retinal fundus photograph taken with proper medical equipment. 
                  The system will validate the image before analysis to ensure accurate results.
                </p>
              </div>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center ${
                  preview ? "border-blue-500/50" : "border-gray-700"
                } hover:border-blue-500/50 transition-colors cursor-pointer`}
                onClick={() => {
                  console.log("Upload area clicked");
                  document.getElementById('image-upload')?.click();
                }}
              >
                {preview ? (
                  <div className="space-y-4">
                    <InteractiveImagePreview
                      src={preview}
                      alt="Uploaded fundus image"
                      className="mx-auto max-w-md"
                      showQualityIndicator={true}
                      qualityScore={imageQuality?.overallScore || 0}
                    />
                    <p className="text-sm text-white">Click upload to analyze this image or select a different one</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                      <FileImage className="w-10 h-10 text-blue-400" />
                    </div>
                    <p className="text-lg font-medium text-white">Upload your retinal fundus image here</p>
                    <p className="text-sm text-white">Accepts medical fundus photographs in JPG, PNG, or JPEG format (max 10MB)</p><br></br>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    console.log("File selected:", e.target.files?.[0]?.name);
                    console.log("File input changed");
                    handleFileChange(e);
                  }}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-blue-500/50 text-black hover:bg-blue-500/10"
                    >
                      Select Image
                    </Button>
                    <CameraIntegration
                      onImageCapture={(blob, url) => {
                        // Convert blob to File object
                        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' })
                        setFile(file)
                        setPreview(url)
                        setError(null)
                        setResults(null)
                      }}
                    />
                  </div>
                </label>
              </div>

              {/* Progress Indicator */}
              {loading && (
                <ProgressBar
                  progress={progress}
                  status={analysisStatus}
                  message={statusMessage}
                  className="mt-6"
                />
              )}

              {/* Image Quality Checker */}
              {file && preview && (
                <ImageQualityChecker
                  imageFile={file}
                  imagePreview={preview}
                  onQualityCheck={setImageQuality}
                  className="mt-6"
                />
              )}

              {/* Image Enhancement Suggestions */}
              {file && preview && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-black">Image Enhancement</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEnhancement(!showEnhancement)}
                      className="border-purple-500/50 text-black hover:bg-purple-500/10"
                    >
                      {showEnhancement ? 'Hide' : 'Show'} Enhancement
                    </Button>
                  </div>
                  {showEnhancement && (
                    <ImageEnhancementSuggestions
                      imageFile={file}
                      imageUrl={enhancedImageUrl || preview}
                      onEnhancedImage={(enhancedUrl) => {
                        setEnhancedImageUrl(enhancedUrl)
                        console.log('Enhanced image created:', enhancedUrl)
                      }}
                      className="mt-4"
                    />
                  )}
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 rounded-lg border flex items-start ${
                    error.includes('⚠️') 
                      ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                      : 'bg-red-500/20 border-red-500/50 text-red-400'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="whitespace-pre-line">{error}</div>
                    {error.includes('fundus') && (
                      <div className="mt-3 p-3 bg-black/20 rounded-lg border border-gray-600">
                        <h4 className="font-semibold mb-2">What is a fundus image?</h4>
                        <p className="text-sm opacity-90">
                          A fundus image is a photograph of the back of the eye (retina) taken with specialized medical equipment. 
                          It shows the retina, optic disc, and blood vessels, and appears as a circular area with a dark background.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              <Button
                  type="submit"
                  disabled={loading || !file}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-6 text-lg rounded-xl shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {statusMessage || 'Processing...'}
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-5 h-5 mr-2" />
                      Start Analysis
                    </>
                  )}
                </Button>
            </form>
          </motion.div>

          {/* Results Section */}
          {renderResults()}

          {/* Info Cards */}
          {!results && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
            >
              {[
                {
                  icon: Eye,
                  title: "Advanced Detection",
                  description: "Our AI can detect multiple retinal conditions with high accuracy",
                  gradient: "from-blue-500 to-cyan-500",
                },
                {
                  icon: Brain,
                  title: "AI-Powered Analysis",
                  description: "Trained on millions of retinal images for precise disease classification",
                  gradient: "from-purple-500 to-pink-500",
                },
                {
                  icon: CheckCircle,
                  title: "Clinical Grade",
                  description: "Validated against expert diagnoses with over 90% accuracy",
                  gradient: "from-green-500 to-emerald-500",
                },
              ].map((card, index) => {
                const Icon = card.icon
                return (
                  <motion.div
                    key={index}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="glass rounded-xl p-6 text-center"
                  >
                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-r ${card.gradient} flex items-center justify-center`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                    <p className="text-gray-200">{card.description}</p>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* Tutorial Modal */}
      <FundusTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={() => {
          console.log('Tutorial completed!')
          setShowTutorial(false)
        }}
      />
    </div>
  )
}