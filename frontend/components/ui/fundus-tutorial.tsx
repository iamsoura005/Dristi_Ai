"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, X, ArrowRight, ArrowLeft, CheckCircle, Lightbulb } from "lucide-react"
import { Button } from "./button"

interface TutorialStep {
  title: string
  description: string
  tips: string[]
}

interface FundusTutorialProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

export function FundusTutorial({ isOpen, onClose, onComplete }: FundusTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps: TutorialStep[] = [
    {
      title: "Patient Positioning",
      description: "Position the patient comfortably with proper head alignment.",
      tips: ["Ensure patient is seated comfortably", "Adjust chair height appropriately", "Good head stability is essential"]
    },
    {
      title: "Camera Setup",
      description: "Adjust camera position and focus for optimal imaging.",
      tips: ["Position camera 15-20cm from eye", "Center the optic disc", "Use auto-focus when available"]
    },
    {
      title: "Lighting & Contrast",
      description: "Optimize lighting conditions for clear visualization.",
      tips: ["Use appropriate flash intensity", "Ensure even illumination", "Avoid reflections"]
    },
    {
      title: "Image Capture",
      description: "Capture the fundus image with proper technique.",
      tips: ["Patient looks straight ahead", "Capture during blink-free moment", "Ensure macula and optic disc visible"]
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      onComplete?.()
      onClose()
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-gray-900 rounded-xl w-full max-w-2xl border border-gray-700"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Eye className="w-8 h-8 text-white" />
                  <div>
                    <h2 className="text-xl font-bold text-white">Fundus Imaging Guide</h2>
                    <p className="text-blue-100">Step {currentStep + 1} of {steps.length}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="text-white">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="mt-4 w-full bg-black/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-bold text-white">{steps[currentStep].title}</h3>
                <p className="text-lg text-gray-300">{steps[currentStep].description}</p>
                
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                    Key Tips
                  </h4>
                  <ul className="space-y-3">
                    {steps[currentStep].tips.map((tip, index) => (
                      <li key={index} className="flex items-start space-x-3 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Demo Visual */}
                <div className="flex justify-center">
                  <div className="w-48 h-48 bg-gradient-to-br from-red-900 to-orange-900 rounded-full border-4 border-gray-600 relative">
                    <div className="absolute top-1/2 left-1/3 w-12 h-12 bg-yellow-200 rounded-full opacity-80"></div>
                    <div className="absolute top-1/2 right-1/3 w-6 h-6 bg-red-800 rounded-full opacity-60"></div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="bg-gray-800 px-8 py-6 border-t border-gray-700 rounded-b-xl">
              <div className="flex justify-between">
                <Button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  variant="outline"
                  className="border-gray-600 text-black"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                  {currentStep === steps.length - 1 ? (
                    <>Complete <CheckCircle className="w-4 h-4 ml-2" /></>
                  ) : (
                    <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FundusTutorial