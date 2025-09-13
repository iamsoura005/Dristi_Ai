"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './button'
import { Card, CardContent } from './card'
import { Badge } from './badge'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  MessageCircle,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { getCurrentLanguage, changeLanguage } from '../../lib/i18n'

interface VoiceCommand {
  command: string
  action: () => void | Promise<void>
  description: string
  category: string
}

interface VoiceAssistantProps {
  onNavigate?: (path: string) => void
  onAction?: (action: string, data?: any) => void
  className?: string
}

export function VoiceAssistant({ 
  onNavigate, 
  onAction,
  className = '' 
}: VoiceAssistantProps) {
  const { t } = useTranslation()
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lastCommand, setLastCommand] = useState('')
  const [feedback, setFeedback] = useState('')
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info'>('info')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showCommands, setShowCommands] = useState(false)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Voice commands in multiple languages
  const voiceCommands: VoiceCommand[] = [
    // Navigation commands
    {
      command: 'go to dashboard|dashboard|home',
      action: () => onNavigate?.('/dashboard'),
      description: 'Navigate to dashboard',
      category: 'navigation'
    },
    {
      command: 'find doctors|search doctors|doctors near me',
      action: () => onNavigate?.('/doctors'),
      description: 'Find nearby doctors',
      category: 'navigation'
    },
    {
      command: 'analyze eye|eye analysis|upload image',
      action: () => onNavigate?.('/analyze'),
      description: 'Go to eye analysis page',
      category: 'navigation'
    },
    {
      command: 'family members|family|add family',
      action: () => onNavigate?.('/family'),
      description: 'Manage family members',
      category: 'navigation'
    },
    {
      command: 'appointments|my appointments|book appointment',
      action: () => onNavigate?.('/appointments'),
      description: 'View or book appointments',
      category: 'navigation'
    },

    // Language commands
    {
      command: 'switch to english|english language',
      action: () => changeLanguage('en'),
      description: 'Switch to English',
      category: 'language'
    },
    {
      command: 'switch to hindi|hindi language|हिंदी में बदलें',
      action: () => changeLanguage('hi'),
      description: 'Switch to Hindi',
      category: 'language'
    },
    {
      command: 'switch to bengali|bengali language',
      action: () => changeLanguage('bn'),
      description: 'Switch to Bengali',
      category: 'language'
    },
    {
      command: 'switch to tamil|tamil language',
      action: () => changeLanguage('ta'),
      description: 'Switch to Tamil',
      category: 'language'
    },

    // Action commands
    {
      command: 'take photo|capture image|camera',
      action: () => onAction?.('camera'),
      description: 'Open camera for image capture',
      category: 'action'
    },
    {
      command: 'call emergency|emergency|help',
      action: () => onAction?.('emergency'),
      description: 'Emergency assistance',
      category: 'action'
    },
    {
      command: 'read results|last results|test results',
      action: () => onAction?.('read_results'),
      description: 'Read latest test results',
      category: 'action'
    }
  ]

  useEffect(() => {
    // Check if speech recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true)
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = getLanguageCode()
        
        recognitionRef.current.onstart = () => {
          setIsListening(true)
          setTranscript('')
          setFeedback(t('voice.listening'))
          setFeedbackType('info')
        }
        
        recognitionRef.current.onresult = (event) => {
          const current = event.resultIndex
          const transcript = event.results[current][0].transcript
          setTranscript(transcript)
          
          if (event.results[current].isFinal) {
            processCommand(transcript.toLowerCase().trim())
          }
        }
        
        recognitionRef.current.onerror = (event) => {
          setIsListening(false)
          setFeedback(`Error: ${event.error}`)
          setFeedbackType('error')
        }
        
        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }

    // Check if speech synthesis is supported
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Update recognition language when app language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = getLanguageCode()
    }
  }, [getCurrentLanguage()])

  const getLanguageCode = () => {
    const currentLang = getCurrentLanguage()
    const langMap: Record<string, string> = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'bn': 'bn-IN',
      'te': 'te-IN',
      'mr': 'mr-IN',
      'ta': 'ta-IN',
      'gu': 'gu-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
      'or': 'or-IN',
      'pa': 'pa-IN'
    }
    return langMap[currentLang] || 'en-US'
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const processCommand = (command: string) => {
    setLastCommand(command)
    
    // Find matching command
    const matchedCommand = voiceCommands.find(cmd => {
      const patterns = cmd.command.split('|')
      return patterns.some(pattern => 
        command.includes(pattern.toLowerCase()) ||
        pattern.toLowerCase().includes(command)
      )
    })

    if (matchedCommand) {
      setFeedback(`Executing: ${matchedCommand.description}`)
      setFeedbackType('success')
      
      try {
        matchedCommand.action()
        speak(`${matchedCommand.description} executed`)
      } catch (error) {
        setFeedback('Failed to execute command')
        setFeedbackType('error')
        speak('Sorry, I could not execute that command')
      }
    } else {
      setFeedback('Command not recognized. Try saying "help" for available commands.')
      setFeedbackType('error')
      speak('Sorry, I did not understand that command')
    }
  }

  const speak = (text: string) => {
    if (synthRef.current && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      synthRef.current.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = getLanguageCode()
      utterance.rate = 0.9
      utterance.pitch = 1
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      
      synthRef.current.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  const getCommandsByCategory = () => {
    const categories = voiceCommands.reduce((acc, cmd) => {
      if (!acc[cmd.category]) {
        acc[cmd.category] = []
      }
      acc[cmd.category].push(cmd)
      return acc
    }, {} as Record<string, VoiceCommand[]>)
    
    return categories
  }

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardContent className="p-4 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
          <p className="text-sm text-gray-600">
            {t('voice.not_supported')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Voice Control Panel */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-medium">Voice Assistant</span>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCommands(!showCommands)}
              >
                Commands
              </Button>
              
              {isSpeaking && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopSpeaking}
                >
                  <VolumeX className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isSpeaking}
              className={`${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  {t('voice.speak_now')}
                </>
              )}
            </Button>

            {isSpeaking && (
              <div className="flex items-center gap-2 text-blue-600">
                <Volume2 className="h-4 w-4" />
                <span className="text-sm">Speaking...</span>
              </div>
            )}
          </div>

          {/* Live Transcript */}
          {transcript && (
            <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
              <span className="text-gray-600">You said: </span>
              <span className="font-medium">{transcript}</span>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div className={`mt-3 p-2 rounded text-sm flex items-center gap-2 ${
              feedbackType === 'success' ? 'bg-green-50 text-green-700' :
              feedbackType === 'error' ? 'bg-red-50 text-red-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {feedbackType === 'success' && <CheckCircle className="h-4 w-4" />}
              {feedbackType === 'error' && <AlertCircle className="h-4 w-4" />}
              {feedbackType === 'info' && <Loader2 className="h-4 w-4 animate-spin" />}
              {feedback}
            </div>
          )}

          {/* Last Command */}
          {lastCommand && (
            <div className="mt-2 text-xs text-gray-500">
              Last command: "{lastCommand}"
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Commands */}
      {showCommands && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Available Voice Commands</h4>
            
            {Object.entries(getCommandsByCategory()).map(([category, commands]) => (
              <div key={category} className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                  {category}
                </h5>
                <div className="space-y-1">
                  {commands.map((cmd, index) => (
                    <div key={index} className="text-sm">
                      <Badge variant="outline" className="text-xs mr-2">
                        {cmd.command.split('|')[0]}
                      </Badge>
                      <span className="text-gray-600">{cmd.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="mt-4 text-xs text-gray-500">
              <p>• Speak clearly and wait for the microphone to activate</p>
              <p>• Commands work in multiple languages</p>
              <p>• Say "help" for assistance</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Hook for integrating voice commands in other components
export function useVoiceCommands(commands: VoiceCommand[]) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        
        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript.toLowerCase().trim()
          
          const matchedCommand = commands.find(cmd => {
            const patterns = cmd.command.split('|')
            return patterns.some(pattern => 
              transcript.includes(pattern.toLowerCase())
            )
          })

          if (matchedCommand) {
            matchedCommand.action()
          }
        }
        
        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [commands])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  return { isListening, startListening, stopListening }
}
