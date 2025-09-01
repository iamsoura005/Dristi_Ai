"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, X, Circle, FlipHorizontal, CheckCircle } from "lucide-react"
import { Button } from "./button"

interface CameraIntegrationProps {
  onImageCapture?: (imageBlob: Blob, imageUrl: string) => void
  onClose?: () => void
  className?: string
}

export function CameraIntegration({ 
  onImageCapture, 
  onClose,
  className = ""
}: CameraIntegrationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      })
      
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error('Camera error:', err)
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }, [stream])

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob)
        setCapturedImage(imageUrl)
        onImageCapture?.(blob, imageUrl)
      }
    }, 'image/jpeg', 0.95)
  }, [onImageCapture])

  const handleOpen = () => {
    setIsOpen(true)
    startCamera()
  }

  const handleClose = () => {
    stopCamera()
    setCapturedImage(null)
    setIsOpen(false)
    onClose?.()
  }

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="outline"
        className={`border-green-500/50 text-black hover:bg-green-500/10 ${className}`}
      >
        <Camera className="w-4 h-4 mr-2" />
        Take Photo
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="relative w-full max-w-4xl bg-gray-900 rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-gray-800">
                <h3 className="text-lg font-semibold text-white">Camera Capture</h3>
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Camera View */}
              <div className="relative aspect-video bg-black">
                {capturedImage ? (
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-64 h-64 border-2 border-white/50 rounded-full"></div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Controls */}
              <div className="p-4 bg-gray-800">
                {capturedImage ? (
                  <div className="flex justify-center space-x-4">
                    <Button onClick={() => setCapturedImage(null)} variant="outline">
                      Retake
                    </Button>
                    <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Use Photo
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => setFacingMode(facingMode === 'user' ? 'environment' : 'user')}
                      variant="ghost"
                    >
                      <FlipHorizontal className="w-5 h-5" />
                    </Button>
                    <Button onClick={captureImage} className="bg-white text-black rounded-full w-16 h-16 p-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-black rounded-full"></div>
                    </Button>
                    <div></div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" />
    </>
  )
}

export default CameraIntegration