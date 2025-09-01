"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Share2, 
  Link, 
  Copy, 
  Mail, 
  MessageSquare, 
  CheckCircle,
  QrCode,
  Lock,
  Eye,
  Calendar,
  X,
  Download
} from "lucide-react"
import { Button } from "./button"
import QRCode from "qrcode"

interface TestResult {
  id: string
  date: string
  type: 'eye_disease' | 'color_blindness'
  predicted_class: string
  confidence: number
  status: 'normal' | 'abnormal' | 'uncertain'
  all_scores?: Record<string, number>
}

interface ShareableLinkProps {
  testResult: TestResult
  className?: string
  trigger?: React.ReactNode
}

export function ShareableLinks({ 
  testResult, 
  className = "",
  trigger
}: ShareableLinkProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [accessLevel, setAccessLevel] = useState<'view' | 'full'>('view')
  const [expiryDays, setExpiryDays] = useState(7)
  const [isGenerating, setIsGenerating] = useState(false)

  const generateShareableLink = async () => {
    setIsGenerating(true)
    
    try {
      // Simulate API call to generate secure link
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const linkId = Math.random().toString(36).substring(2, 15)
      const baseUrl = window.location.origin
      const shareableUrl = `${baseUrl}/shared-result/${linkId}?access=${accessLevel}&expires=${Date.now() + (expiryDays * 24 * 60 * 60 * 1000)}`
      
      setShareUrl(shareableUrl)
      
      // Generate QR Code
      const qrCode = await QRCode.toDataURL(shareableUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1e40af',
          light: '#ffffff'
        }
      })
      setQrCodeUrl(qrCode)
      
    } catch (error) {
      console.error('Failed to generate shareable link:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Medical Test Results - ${testResult.type.replace('_', ' ')}`)
    const body = encodeURIComponent(
      `I'm sharing my medical test results with you for consultation.\n\n` +
      `Test Type: ${testResult.type.replace('_', ' ')}\n` +
      `Date: ${new Date(testResult.date).toLocaleDateString()}\n` +
      `Result: ${testResult.predicted_class.replace('_', ' ')}\n` +
      `Confidence: ${Math.round(testResult.confidence * 100)}%\n\n` +
      `View detailed results: ${shareUrl}\n\n` +
      `This link will expire in ${expiryDays} days.`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `Medical Test Results - ${testResult.type.replace('_', ' ')}\n` +
      `Date: ${new Date(testResult.date).toLocaleDateString()}\n` +
      `Result: ${testResult.predicted_class.replace('_', ' ')}\n` +
      `View details: ${shareUrl}`
    )
    window.open(`https://wa.me/?text=${message}`)
  }

  const downloadQRCode = () => {
    const link = document.createElement('a')
    link.download = `medical-result-qr-${testResult.id}.png`
    link.href = qrCodeUrl
    link.click()
  }

  const DefaultTrigger = () => (
    <Button
      onClick={() => setIsOpen(true)}
      variant="outline"
      className={`border-purple-500/50 text-white hover:bg-purple-500/10 ${className}`}
    >
      <Share2 className="w-4 h-4 mr-2" />
      Share Results
    </Button>
  )

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>
          {trigger}
        </div>
      ) : (
        <DefaultTrigger />
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl p-6 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Share2 className="w-5 h-5 mr-2" />
                  Share Medical Results
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Test Result Summary */}
              <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Test Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white ml-2 capitalize">{testResult.type.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white ml-2">{new Date(testResult.date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Result:</span>
                    <span className="text-white ml-2 capitalize">{testResult.predicted_class.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Confidence:</span>
                    <span className="text-white ml-2">{Math.round(testResult.confidence * 100)}%</span>
                  </div>
                </div>
              </div>

              {!shareUrl ? (
                <div className="space-y-6">
                  {/* Access Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Access Level</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setAccessLevel('view')}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          accessLevel === 'view'
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                            : 'border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        <Eye className="w-5 h-5 mb-2" />
                        <div className="font-medium">View Only</div>
                        <div className="text-xs text-gray-500">Basic results and diagnosis</div>
                      </button>
                      <button
                        onClick={() => setAccessLevel('full')}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          accessLevel === 'full'
                            ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                            : 'border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        <Lock className="w-5 h-5 mb-2" />
                        <div className="font-medium">Full Access</div>
                        <div className="text-xs text-gray-500">Complete results and data</div>
                      </button>
                    </div>
                  </div>

                  {/* Expiry */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Link Expiry</label>
                    <select
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value={1}>1 day</option>
                      <option value={3}>3 days</option>
                      <option value={7}>1 week</option>
                      <option value={14}>2 weeks</option>
                      <option value={30}>1 month</option>
                    </select>
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={generateShareableLink}
                    disabled={isGenerating}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isGenerating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 mr-2"
                        >
                          <Link className="w-4 h-4" />
                        </motion.div>
                        Generating Secure Link...
                      </>
                    ) : (
                      <>
                        <Link className="w-4 h-4 mr-2" />
                        Generate Shareable Link
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Generated Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Shareable Link</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                      />
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {copied && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-green-400 mt-1"
                      >
                        Link copied to clipboard!
                      </motion.p>
                    )}
                  </div>

                  {/* QR Code */}
                  {qrCodeUrl && (
                    <div className="text-center">
                      <label className="block text-sm font-medium text-gray-300 mb-3">QR Code</label>
                      <div className="inline-block p-4 bg-white rounded-lg">
                        <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                      </div>
                      <Button
                        onClick={downloadQRCode}
                        variant="outline"
                        size="sm"
                        className="mt-2 border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download QR
                      </Button>
                    </div>
                  )}

                  {/* Share Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Quick Share</label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={shareViaEmail}
                        variant="outline"
                        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                      <Button
                        onClick={shareViaWhatsApp}
                        variant="outline"
                        className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>

                  {/* Link Info */}
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">Access Level:</span>
                      <span className="text-white capitalize">{accessLevel}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Expires:</span>
                      <span className="text-white">
                        {new Date(Date.now() + (expiryDays * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Lock className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-200">
                        <strong>Security Notice:</strong> This link provides secure access to your medical results. 
                        Only share with trusted healthcare professionals. The link will automatically expire after the specified time.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ShareableLinks