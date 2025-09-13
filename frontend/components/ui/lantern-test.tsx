"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, XCircle } from "lucide-react"

interface LanternTestProps {
  onComplete: (results: LanternTestResults) => void
  onTimeUp?: () => void
}

interface LanternTestResults {
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  responses: Array<{
    questionId: number
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
    responseTime: number
  }>
  testType: 'lantern'
  diagnosis: string
  recommendations: string[]
}

interface LanternQuestion {
  id: number
  colors: string[]
  correctSequence: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
}

const lanternQuestions: LanternQuestion[] = [
  {
    id: 1,
    colors: ['#FF0000', '#00FF00'],
    correctSequence: 'red-green',
    description: 'Identify the sequence of colors from left to right',
    difficulty: 'easy'
  },
  {
    id: 2,
    colors: ['#00FF00', '#FF0000'],
    correctSequence: 'green-red',
    description: 'Identify the sequence of colors from left to right',
    difficulty: 'easy'
  },
  {
    id: 3,
    colors: ['#FF0000', '#FFFF00'],
    correctSequence: 'red-yellow',
    description: 'Identify the sequence of colors from left to right',
    difficulty: 'medium'
  },
  {
    id: 4,
    colors: ['#FFFF00', '#00FF00'],
    correctSequence: 'yellow-green',
    description: 'Identify the sequence of colors from left to right',
    difficulty: 'medium'
  },
  {
    id: 5,
    colors: ['#0000FF', '#FF0000'],
    correctSequence: 'blue-red',
    description: 'Identify the sequence of colors from left to right',
    difficulty: 'medium'
  },
  {
    id: 6,
    colors: ['#FF0000', '#00FF00', '#0000FF'],
    correctSequence: 'red-green-blue',
    description: 'Identify the sequence of colors from left to right',
    difficulty: 'hard'
  },
  {
    id: 7,
    colors: ['#FFFF00', '#FF0000', '#00FF00'],
    correctSequence: 'yellow-red-green',
    description: 'Identify the sequence of colors from left to right',
    difficulty: 'hard'
  },
  {
    id: 8,
    colors: ['#00FF00', '#0000FF', '#FFFF00'],
    correctSequence: 'green-blue-yellow',
    description: 'Identify the sequence of colors from left to right',
    difficulty: 'hard'
  }
]

const colorOptions = [
  { value: 'red', label: 'Red', color: '#FF0000' },
  { value: 'green', label: 'Green', color: '#00FF00' },
  { value: 'blue', label: 'Blue', color: '#0000FF' },
  { value: 'yellow', label: 'Yellow', color: '#FFFF00' },
  { value: 'orange', label: 'Orange', color: '#FFA500' },
  { value: 'purple', label: 'Purple', color: '#800080' }
]

export default function LanternTest({ onComplete, onTimeUp }: LanternTestProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(15) // 15 seconds per question
  const [responses, setResponses] = useState<LanternTestResults['responses']>([])
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [isComplete, setIsComplete] = useState(false)

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !isComplete) {
      handleTimeUp()
    }
  }, [timeLeft, isComplete])

  // Reset timer when question changes
  useEffect(() => {
    setTimeLeft(15)
    setQuestionStartTime(Date.now())
    setSelectedColors([])
  }, [currentQuestion])

  const handleTimeUp = () => {
    const responseTime = Date.now() - questionStartTime
    const currentQ = lanternQuestions[currentQuestion]
    
    const response = {
      questionId: currentQ.id,
      userAnswer: selectedColors.join('-') || 'no-answer',
      correctAnswer: currentQ.correctSequence,
      isCorrect: false,
      responseTime
    }

    const newResponses = [...responses, response]
    setResponses(newResponses)

    if (currentQuestion < lanternQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      completeTest(newResponses)
    }
  }

  const handleColorSelect = (colorValue: string) => {
    const newSelection = [...selectedColors, colorValue]
    setSelectedColors(newSelection)
  }

  const handleRemoveColor = (index: number) => {
    const newSelection = selectedColors.filter((_, i) => i !== index)
    setSelectedColors(newSelection)
  }

  const handleSubmitAnswer = () => {
    const responseTime = Date.now() - questionStartTime
    const currentQ = lanternQuestions[currentQuestion]
    const userAnswer = selectedColors.join('-')
    
    const response = {
      questionId: currentQ.id,
      userAnswer,
      correctAnswer: currentQ.correctSequence,
      isCorrect: userAnswer === currentQ.correctSequence,
      responseTime
    }

    const newResponses = [...responses, response]
    setResponses(newResponses)

    if (currentQuestion < lanternQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      completeTest(newResponses)
    }
  }

  const completeTest = (finalResponses: LanternTestResults['responses']) => {
    setIsComplete(true)
    
    const correctAnswers = finalResponses.filter(r => r.isCorrect).length
    const accuracy = (correctAnswers / finalResponses.length) * 100
    
    let diagnosis = 'Normal Color Vision'
    let recommendations = ['Your color vision appears normal for the Lantern test.']
    
    if (accuracy < 50) {
      diagnosis = 'Significant Color Vision Deficiency'
      recommendations = [
        'Consider consulting an eye care professional for comprehensive evaluation.',
        'You may have difficulty distinguishing certain colors in low-light conditions.',
        'Consider using color vision aids when needed.'
      ]
    } else if (accuracy < 75) {
      diagnosis = 'Mild Color Vision Deficiency'
      recommendations = [
        'You may have some difficulty with color discrimination.',
        'Consider additional testing with an eye care professional.',
        'Be aware of potential challenges in color-critical tasks.'
      ]
    }

    const results: LanternTestResults = {
      totalQuestions: finalResponses.length,
      correctAnswers,
      accuracy,
      responses: finalResponses,
      testType: 'lantern',
      diagnosis,
      recommendations
    }

    onComplete(results)
  }

  const currentQ = lanternQuestions[currentQuestion]

  if (isComplete) {
    return (
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Test Complete!</h3>
        <p className="text-gray-300">Processing your results...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress and Timer */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-300">
          Question {currentQuestion + 1} of {lanternQuestions.length}
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className={`text-lg font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-blue-400'}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / lanternQuestions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">
          {currentQ.description}
        </h3>
        <p className="text-gray-300 text-sm mb-6">
          Select the colors in the order you see them from left to right
        </p>

        {/* Color Display */}
        <div className="flex justify-center space-x-4 mb-8">
          {currentQ.colors.map((color, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.2 }}
              className="w-20 h-20 rounded-full border-4 border-gray-600 shadow-lg"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Selected Colors Display */}
        {selectedColors.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2">Your selection:</p>
            <div className="flex justify-center space-x-2">
              {selectedColors.map((color, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1 bg-gray-700 rounded-full text-sm text-white flex items-center space-x-2"
                >
                  <span>{color}</span>
                  <button
                    onClick={() => handleRemoveColor(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Color Selection Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {colorOptions.map((option) => (
            <Button
              key={option.value}
              onClick={() => handleColorSelect(option.value)}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-700 flex items-center space-x-2"
              disabled={selectedColors.includes(option.value)}
            >
              <div 
                className="w-4 h-4 rounded-full border border-gray-400"
                style={{ backgroundColor: option.color }}
              />
              <span>{option.label}</span>
            </Button>
          ))}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmitAnswer}
          disabled={selectedColors.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
        >
          Submit Answer
        </Button>
      </div>
    </div>
  )
}
