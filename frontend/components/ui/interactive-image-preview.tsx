"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Move, Info } from "lucide-react"
import { Button } from "./button"

interface InteractiveImagePreviewProps {
  src: string
  alt?: string
  className?: string
  onImageLoad?: () => void
  showQualityIndicator?: boolean
  qualityScore?: number
}

export function InteractiveImagePreview({ 
  src, 
  alt = "Image preview", 
  className = "",
  onImageLoad,
  showQualityIndicator = false,
  qualityScore = 0
}: InteractiveImagePreviewProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      })
    }
    onImageLoad?.()
  }, [onImageLoad])

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.5))
  }

  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ 
      x: e.clientX - position.x, 
      y: e.clientY - position.y 
    })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.max(0.5, Math.min(5, prev * delta)))
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400 bg-green-500/20 border-green-500/50'
    if (score >= 0.6) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50'
    return 'text-red-400 bg-red-500/20 border-red-500/50'
  }

  const getQualityText = (score: number) => {
    if (score >= 0.8) return 'Excellent'
    if (score >= 0.6) return 'Good'
    return 'Poor'
  }

  return (
    <>
      <div className={`relative overflow-hidden rounded-lg border border-gray-700 bg-gray-900 ${className}`}>
        {/* Image Container */}
        <div 
          ref={containerRef}
          className="relative w-full h-64 md:h-80 lg:h-96 cursor-move select-none overflow-hidden"
          onWheel={handleWheel}
        >
          <motion.img
            ref={imageRef}
            src={src}
            alt={alt}
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
            onLoad={handleImageLoad}
            drag={false}
            initial={{ opacity: 0 }}
            animate={{ opacity: imageLoaded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Loading Overlay */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          )}

          {/* Quality Indicator */}
          {showQualityIndicator && imageLoaded && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`absolute top-4 left-4 px-3 py-1 rounded-full border text-xs font-medium ${getQualityColor(qualityScore)}`}
            >
              <div className="flex items-center space-x-1">
                <Info className="w-3 h-3" />
                <span>Quality: {getQualityText(qualityScore)} ({Math.round(qualityScore * 100)}%)</span>
              </div>
            </motion.div>
          )}

          {/* Image Info */}
          {imageLoaded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 px-3 py-1 bg-black/70 rounded-lg text-xs text-white"
            >
              {imageDimensions.width} × {imageDimensions.height} px
            </motion.div>
          )}

          {/* Zoom Level Indicator */}
          {scale !== 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 rounded-lg text-xs text-white"
            >
              {Math.round(scale * 100)}%
            </motion.div>
          )}
        </div>

        {/* Control Panel */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <div className="bg-black/70 rounded-lg p-2 flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="h-8 w-8 p-0 hover:bg-white/20"
              disabled={scale >= 5}
            >
              <ZoomIn className="h-4 w-4 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="h-8 w-8 p-0 hover:bg-white/20"
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 w-8 p-0 hover:bg-white/20"
            >
              <RotateCcw className="h-4 w-4 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8 w-8 p-0 hover:bg-white/20"
            >
              <Maximize2 className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>

        {/* Pan Indicator */}
        {scale > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 rounded-lg px-3 py-1 text-xs text-white flex items-center space-x-1">
            <Move className="h-3 w-3" />
            <span>Click and drag to pan</span>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={toggleFullscreen}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 bg-black/70 hover:bg-black/90 text-white"
            >
              ✕
            </Button>
          </div>
        </motion.div>
      )}
    </>
  )
}

export default InteractiveImagePreview