"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Send, X, Bot, Maximize2, Minimize2, User, Plus, ArrowRight } from "lucide-react"
import { Button } from "./button"

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  model?: string
}

interface MedicalChatbotProps {
  className?: string
}

export function MedicalChatbot({ className = "" }: MedicalChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-message",
      content: "Hello! I'm your RetinalAI assistant powered by DeepSeek AI via OpenRouter. I can answer questions about eye conditions, diagnosis results, and provide information about our fundus analysis technology. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
      model: "deepseek"
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Sample quick questions
  const quickQuestions = [
    "What is diabetic retinopathy?",
    "How to interpret my results?",
    "What is a fundus image?",
    "Can RetinalAI detect glaucoma?"
  ]
  
  useEffect(() => {
    // Auto-open the chatbot after a delay
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Scroll to bottom of messages with improved behavior
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      })
    }
  }, [messages, isTyping])
  
  const toggleChatbot = () => {
    setIsOpen(!isOpen)
    setIsMinimized(false)
  }
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
  }
  
  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  const generateResponse = async (query: string): Promise<string> => {
    // Indicate that we're generating a response
    setIsTyping(true)
    
    try {
      // Call the backend API with improved error handling
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query,
          context: "RetinalAI medical assistant for eye disease analysis" 
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Add a small random delay for natural feeling (100-300ms)
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
        
        setIsTyping(false)
        return data.response || "I received your question but couldn't generate a proper response. Please try rephrasing your question."
      } else {
        console.warn("API call failed with status:", response.status)
        setIsTyping(false)
        return await fallbackResponseGeneration(query)
      }
    } catch (error) {
      console.error("Error with AI service:", error)
      // Fallback to pattern matching if API call fails
      setIsTyping(false)
      return await fallbackResponseGeneration(query)
    }
  }
  
  // Fallback to use when AI service is unavailable
  const fallbackResponseGeneration = async (query: string): Promise<string> => {
    // Simulate network delay
    // This simulates the delay that would normally come from an API call
    
    const responses: Record<string, string> = {
      // App-specific responses
      "retinal": "RetinalAI is an advanced medical AI application designed to detect eye diseases from fundus images. It can analyze retinal photographs and identify 8 different eye conditions with clinical-grade accuracy.",
      "fundus": "A fundus image is a photograph of the back of the eye (retina) taken with specialized medical equipment. These images show the retina, optic disc, and blood vessels, and are used by RetinalAI to detect potential eye conditions.",
      "analysis": "Our AI analysis process involves several steps: 1) Image quality validation to ensure proper diagnosis 2) Advanced neural network processing of the image 3) Detection and classification of potential abnormalities 4) Confidence scoring to assist medical professionals.",
      "results": "Your RetinalAI results provide a prediction of potential eye conditions based on the uploaded fundus image. The results include the detected condition, confidence score, and detailed analysis of different possible conditions. Remember that all results should be confirmed by a healthcare professional.",
      "accuracy": "RetinalAI has been validated against expert diagnoses with over 99% accuracy for the conditions it's trained to detect. However, it's important to understand that AI analysis is a screening tool and not a replacement for comprehensive examination by an eye care professional.",
      
      // Diabetic retinopathy related
      "diabetic retinopathy": "Diabetic retinopathy is an eye condition that can cause vision loss and blindness in people who have diabetes. It affects blood vessels in the retina (the light-sensitive layer at the back of the eye). In early stages, there might be no symptoms. As it progresses, symptoms may include floating spots, blurred vision, or vision loss. Regular eye exams are crucial for early detection.",
      "diabetes eye": "Diabetes can affect the eyes in several ways, with diabetic retinopathy being the most common condition. This happens when high blood sugar levels damage the blood vessels in the retina. Other eye problems associated with diabetes include cataracts and glaucoma. Regular eye examinations are essential for early detection and treatment.",
      
      // Common eye conditions
      "glaucoma": "Glaucoma is a group of eye conditions that damage the optic nerve, essential for good vision. This damage is often caused by abnormally high pressure in your eye. Glaucoma is one of the leading causes of blindness for people over 60. RetinalAI can detect signs of glaucoma in fundus images, though early-stage detection may be more challenging.",
      "cataract": "A cataract is a clouding of the normally clear lens of your eye. For people with cataracts, seeing through cloudy lenses is like looking through a frosty or fogged-up window. Cataracts commonly develop with age and can occur in either or both eyes. While RetinalAI is primarily focused on retinal conditions, severe cataracts may be visible in fundus images.",
      "macular degeneration": "Age-related macular degeneration (AMD) is a common eye condition and a leading cause of vision loss among people 50 and older. It causes damage to the macula, a small spot near the center of the retina needed for sharp, central vision. RetinalAI can detect signs of AMD in fundus images with high accuracy.",
      
      // Prevention and care
      "eye exam": "Regular eye exams are important for maintaining good vision health. For adults, the frequency depends on age, risk factors, and whether you currently wear eyeglasses. Generally, if you're under 40 and have no vision issues, every 5-10 years is recommended. Between 40-54, every 2-4 years; 55-64, every 1-3 years; and 65+, every 1-2 years.",
      "eye strain": "Digital eye strain (Computer Vision Syndrome) can be reduced by following the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds. Also, ensure proper lighting, position your screen properly (arm's length away, slightly below eye level), and consider using artificial tears if your eyes feel dry.",
      "protect eyes": "To protect your eyes: wear sunglasses that block UV rays, use protective eyewear during hazardous activities, eat a balanced diet rich in fruits and vegetables, maintain a healthy weight, quit smoking, give your eyes a rest from screens using the 20-20-20 rule, and get regular eye exams.",
      
      // Symptoms and signs
      "blurry vision": "Blurry vision can be caused by many conditions including refractive errors (nearsightedness, farsightedness, astigmatism), cataracts, eye infections, or serious conditions like macular degeneration or detached retina. If you're experiencing sudden or persistent blurry vision, it's important to see an eye doctor promptly.",
      "red eyes": "Red eyes can be caused by many factors including allergies, dry eye syndrome, conjunctivitis (pink eye), subconjunctival hemorrhage, or even more serious conditions. If redness persists, is painful, affects vision, or is accompanied by discharge, you should consult an eye care professional.",
      "floaters": "Eye floaters are spots in your vision that appear like black or gray specks, strings, or cobwebs that drift about when you move your eyes. They're usually caused by age-related changes in the vitreous inside your eye. While usually harmless, a sudden increase in floaters, especially with flashes of light or vision loss, requires immediate medical attention.",
      
      // Treatments
      "treatment": "Treatment options for eye conditions vary widely depending on the specific condition and its severity. While RetinalAI can help detect potential conditions, treatment decisions should always be made by healthcare professionals. Common treatments include medication, laser therapy, surgery, or lifestyle modifications.",
      "medication": "Various medications can be used to treat eye conditions. These include eye drops for glaucoma to reduce eye pressure, anti-VEGF injections for wet AMD, antibiotics for infections, and anti-inflammatory drugs for conditions like uveitis. Your doctor will determine the appropriate medication based on your specific condition.",
      
      // Fallback responses
      "default": "That's an interesting question about eye health. While I don't have specific information on that exact topic, I'd recommend discussing it with an ophthalmologist or optometrist who can provide personalized advice based on your medical history."
    }
    
    // Simple pattern matching for response selection
    let bestResponse = responses["default"]
    let bestMatch = 0
    
    const queryLower = query.toLowerCase()
    
    // First, check for exact matches or substring matches
    for (const [key, response] of Object.entries(responses)) {
      if (queryLower.includes(key) && key.length > bestMatch) {
        bestResponse = response
        bestMatch = key.length
      }
    }
    
    // If no good match was found, try to find keywords
    if (bestMatch === 0) {
      const keywords = [
        { term: "retinai", key: "retinal" },
        { term: "app", key: "retinal" },
        { term: "application", key: "retinal" },
        { term: "image", key: "fundus" },
        { term: "photo", key: "fundus" },
        { term: "picture", key: "fundus" },
        { term: "scan", key: "fundus" },
        { term: "interpret", key: "results" },
        { term: "read", key: "results" },
        { term: "accuracy", key: "accuracy" },
        { term: "reliable", key: "accuracy" },
        { term: "precision", key: "accuracy" },
        { term: "process", key: "analysis" },
        { term: "analyze", key: "analysis" },
        { term: "detect", key: "analysis" },
        { term: "diabetes", key: "diabetic retinopathy" },
        { term: "diabetic", key: "diabetic retinopathy" },
        { term: "treatment", key: "treatment" },
        { term: "medicine", key: "medication" },
        { term: "drug", key: "medication" },
        { term: "prescription", key: "medication" }
      ]
      
      for (const { term, key } of keywords) {
        if (queryLower.includes(term)) {
          bestResponse = responses[key]
          break
        }
      }
    }
    
    // Add a small random delay to simulate thinking (250-750ms)
    await new Promise(resolve => setTimeout(resolve, 250 + Math.random() * 500))
    
    return bestResponse
  }
  
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    
    try {
      // Get AI response
      const responseText = await generateResponse(inputValue)
      
      // Add AI message with better model detection
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        role: "assistant",
        timestamp: new Date(),
        model: responseText.includes("DeepSeek") || responseText.includes("deepseek") ? "deepseek" : "fallback"
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error getting response:", error)
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error processing your request. Please try again later.",
        role: "assistant",
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleQuickQuestion = (question: string) => {
    setInputValue(question)
    // Focus the input field
    inputRef.current?.focus()
  }
  
  if (!isOpen) {
    return (
      <motion.button
        onClick={toggleChatbot}
        className={`fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-blue-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-50 ${className}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1
      }}
      className={`fixed bottom-8 right-8 w-80 md:w-96 bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-xl overflow-hidden z-50 border border-gray-700 flex flex-col ${isMinimized ? 'h-auto' : 'h-[500px]'} ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-white" />
          <h3 className="text-white font-medium">RetinalAI Assistant</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={toggleMinimize} 
            className="p-1 text-white/80 hover:text-white rounded-full"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={toggleChatbot} 
            className="p-1 text-white/80 hover:text-white rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="flex flex-col flex-1 min-h-0"
          >
            {/* Messages Container */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 chatbot-scroll min-h-0">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white/20 border border-white/30 text-white'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      {message.role === 'assistant' ? (
                        <Bot className="w-4 h-4 text-purple-300" />
                      ) : (
                        <User className="w-4 h-4 text-blue-300" />
                      )}
                      <span className="text-xs opacity-75">
                        {message.role === 'assistant' ? 'RetinalAI Assistant' : 'You'}
                      </span>
                      {message.model && (
                        <span className="text-xs bg-purple-500/30 px-1 rounded text-purple-200">
                          {message.model === 'deepseek' ? 'DeepSeek AI' : message.model === 'deepseek-chat' ? 'DeepSeek Chat' : 'AI'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/20 border border-white/30 text-white rounded-lg p-3 max-w-[85%]">
                    <div className="flex items-center space-x-2 mb-1">
                      <Bot className="w-4 h-4 text-purple-300" />
                      <span className="text-xs opacity-75">RetinalAI Assistant</span>
                    </div>
                    <div className="flex space-x-1">
                      <motion.div 
                        className="w-2 h-2 bg-purple-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                      />
                      <motion.div 
                        className="w-2 h-2 bg-blue-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                      />
                      <motion.div 
                        className="w-2 h-2 bg-purple-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Quick Questions */}
            <div className="px-4 py-2 border-t border-gray-700/50 flex-shrink-0">
              <p className="text-xs text-gray-300 mb-2">Try asking about:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs bg-white/20 hover:bg-white/30 text-white py-1 px-2 rounded-full flex items-center border border-white/30"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {question.length > 20 ? `${question.substring(0, 20)}...` : question}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Input Area */}
            <div className="p-3 border-t border-gray-700/50 bg-gray-800/50 flex-shrink-0">
              <div className="flex items-end space-x-2">
                <div className="flex-1 bg-white/10 border border-white/20 rounded-lg overflow-hidden">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyPress={handleInputKeyPress}
                    placeholder="Ask about eye conditions or analysis..."
                    className="w-full bg-transparent text-white p-2 outline-none resize-none text-sm"
                    rows={1}
                    style={{ maxHeight: '120px', minHeight: '40px' }}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className={`p-2 ${inputValue.trim() && !isTyping ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90' : 'bg-gray-600'} text-white rounded-lg`}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-300 mt-2 flex justify-between items-center">
                <span>Press Enter to send</span>
                <span className="text-purple-300">RetinalAI Assistant</span>
              </div>
              <div className="text-xs text-gray-400 mt-1 text-center border-t border-gray-700/30 pt-2">
                <span>For informational purposes only. Consult a healthcare professional for medical advice.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default MedicalChatbot