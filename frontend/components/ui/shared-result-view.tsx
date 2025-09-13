"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Eye, 
  Calendar, 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Download,
  ExternalLink,
  Lock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import ConfidenceVisualization from "@/components/ui/confidence-visualization"

interface SharedResultData {
  id: string
  date: string
  type: 'eye_disease' | 'color_blindness'
  predicted_class: string
  confidence: number
  status: 'normal' | 'abnormal' | 'uncertain'
  all_scores?: Record<string, number>
  patient_info?: {
    initials: string
    age_range: string
    test_id: string
  }
  access_level: 'view' | 'full'
  expires_at: string
  shared_by: string
}

interface SharedResultViewProps {
  shareId: string
  accessLevel: string
  expiryTime: string
}

export function SharedResultView({ shareId, accessLevel, expiryTime }: SharedResultViewProps) {
  const [resultData, setResultData] = useState<SharedResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    // Check if link is expired
    const expiryDate = new Date(parseInt(expiryTime))
    const now = new Date()
    
    if (now > expiryDate) {
      setIsExpired(true)
      setLoading(false)
      return
    }

    // Load shared result data
    loadSharedResult()
  }, [shareId, expiryTime])

  const loadSharedResult = async () => {
    try {
      // Simulate API call to fetch shared result
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock data - in real app, this would come from API
      const mockData: SharedResultData = {
        id: shareId,
        date: new Date().toISOString(),
        type: 'eye_disease',
        predicted_class: 'normal',
        confidence: 0.92,
        status: 'normal',
        all_scores: {
          normal: 0.92,
          cataract: 0.04,
          glaucoma: 0.02,
          diabetic_retinopathy: 0.02
        },
        patient_info: {
          initials: 'J.D.',
          age_range: '45-55',
          test_id: shareId.substring(0, 8).toUpperCase()
        },
        access_level: accessLevel as 'view' | 'full',
        expires_at: expiryTime,
        shared_by: 'Medical Clinic'
      }

      setResultData(mockData)
    } catch (err) {
      setError('Failed to load shared result')
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    if (!resultData) return
    
    // Create a simple text report
    const report = `
MEDICAL TEST RESULT REPORT
==========================

Patient: ${resultData.patient_info?.initials || 'Anonymous'}
Test ID: ${resultData.patient_info?.test_id || resultData.id}
Date: ${new Date(resultData.date).toLocaleDateString()}
Type: ${resultData.type.replace('_', ' ').toUpperCase()}

RESULTS:
--------
Diagnosis: ${resultData.predicted_class.replace('_', ' ').toUpperCase()}
Confidence: ${Math.round(resultData.confidence * 100)}%
Status: ${resultData.status.toUpperCase()}

${resultData.access_level === 'full' && resultData.all_scores ? 
`DETAILED SCORES:
${Object.entries(resultData.all_scores).map(([condition, score]) => 
  `${condition.replace('_', ' ')}: ${Math.round(score * 100)}%`
).join('\n')}` : ''}

IMPORTANT DISCLAIMER:
This report is for informational purposes only and should not replace 
professional medical diagnosis. Please consult with a qualified healthcare 
provider for definitive diagnosis and treatment.

Generated: ${new Date().toLocaleString()}
Shared by: ${resultData.shared_by}
    `.trim()

    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `medical-result-${resultData.patient_info?.test_id || 'report'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 mx-auto mb-4"
          >
            <Shield className="w-12 h-12 text-blue-400" />
          </motion.div>
          <p className="text-white text-lg">Loading secure medical result...</p>
          <p className="text-gray-400 text-sm mt-2">Verifying access permissions</p>
        </div>
      </div>
    )
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="glass rounded-xl p-8 max-w-md mx-auto text-center">
          <Clock className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Link Expired</h1>
          <p className="text-gray-300 mb-6">
            This shared medical result link has expired and is no longer accessible.
          </p>
          <p className="text-sm text-gray-400">
            Please request a new link from the healthcare provider who shared this result.
          </p>
        </div>
      </div>
    )
  }

  if (error || !resultData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="glass rounded-xl p-8 max-w-md mx-auto text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Access Error</h1>
          <p className="text-gray-300 mb-6">
            {error || 'Unable to access this shared medical result.'}
          </p>
          <p className="text-sm text-gray-400">
            Please verify the link and try again, or contact the healthcare provider.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Shared Medical Result</h1>
                <p className="text-sm text-gray-400">Secure Healthcare Data</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-green-400">
                <Lock className="w-4 h-4" />
                <span className="text-sm">Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Access Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 mb-8"
        >
          <div className="flex items-start justify-between">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <div>
                <div className="text-sm text-gray-400">Patient ID</div>
                <div className="text-white font-medium">
                  {resultData.patient_info?.initials || 'Anonymous'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Test ID</div>
                <div className="text-white font-medium">
                  {resultData.patient_info?.test_id || resultData.id.substring(0, 8).toUpperCase()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Test Date</div>
                <div className="text-white font-medium">
                  {new Date(resultData.date).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Access Level</div>
                <div className={`font-medium capitalize ${
                  resultData.access_level === 'full' ? 'text-blue-400' : 'text-yellow-400'
                }`}>
                  {resultData.access_level}
                </div>
              </div>
            </div>
            <Button
              onClick={downloadReport}
              variant="outline"
              size="sm"
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </motion.div>

        {/* Test Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Eye className="w-6 h-6 mr-3 text-blue-400" />
              Test Results
            </h2>
            <div className="text-sm text-gray-400">
              {resultData.type.replace('_', ' ').toUpperCase()}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">Primary Diagnosis</div>
                <div className="text-xl font-bold text-white capitalize">
                  {resultData.predicted_class.replace('_', ' ')}
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">Confidence Level</div>
                <div className="text-xl font-bold text-blue-400">
                  {Math.round(resultData.confidence * 100)}%
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-3">Overall Status</div>
              <div className="flex items-center space-x-2">
                {resultData.status === 'normal' ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <span className="text-green-400 font-semibold">Normal</span>
                  </>
                ) : resultData.status === 'abnormal' ? (
                  <>
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    <span className="text-red-400 font-semibold">Abnormal</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-6 h-6 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">Uncertain</span>
                  </>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-300">
                {resultData.status === 'normal' 
                  ? 'No signs of disease detected'
                  : resultData.status === 'abnormal'
                  ? 'Abnormalities detected - consultation recommended'
                  : 'Results inconclusive - further testing may be needed'
                }
              </div>
            </div>
          </div>

          {/* Detailed Analysis */}
          {resultData.access_level === 'full' && resultData.all_scores && (
            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Detailed Analysis</h3>
              <div className="space-y-3">
                {Object.entries(resultData.all_scores).map(([condition, score]) => (
                  <div key={condition} className="flex items-center justify-between">
                    <span className="capitalize text-gray-300">
                      {condition.replace('_', ' ')}:
                    </span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            condition === resultData.predicted_class ? 'bg-blue-500' : 'bg-gray-500'
                          }`}
                          style={{ width: `${score * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-white w-12 text-right">
                        {Math.round(score * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Enhanced Visualization for Full Access */}
        {resultData.access_level === 'full' && resultData.all_scores && (
          <ConfidenceVisualization
            scores={resultData.all_scores}
            primaryPrediction={resultData.predicted_class}
            overallConfidence={resultData.confidence}
            className="mb-8"
          />
        )}

        {/* Medical Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6"
        >
          <h4 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Important Medical Disclaimer
          </h4>
          <div className="text-sm text-yellow-200 space-y-2">
            <p>
              This AI analysis is provided for screening purposes only and should not replace 
              professional medical diagnosis or consultation with a qualified healthcare provider.
            </p>
            <p>
              The results shown are based on artificial intelligence analysis and may not be 
              100% accurate. Always consult with a licensed physician for proper medical evaluation 
              and treatment recommendations.
            </p>
            <p>
              This shared link expires on {new Date(parseInt(resultData.expires_at)).toLocaleDateString()} 
              and has been provided by {resultData.shared_by} for consultation purposes.
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>Powered by Hackloop Medical AI • Secure Healthcare Technology</p>
          <p className="mt-1">
            This is a secure, encrypted medical data sharing platform
          </p>
        </div>
      </div>
    </div>
  )
}

export default SharedResultView