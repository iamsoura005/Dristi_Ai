"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, Clock, RotateCcw, CheckCircle, AlertTriangle, XCircle, Sparkles, Download, Loader2, Printer, Lightbulb } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import EmailButton from "@/components/ui/email-button"
import LanternTest from "@/components/ui/lantern-test"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

// Ishihara Plate Component with proper color patterns
interface IshiharaPlateProps {
  plateId: number
  correctAnswer: string
  size: number
  imageUrl?: string    // New prop for actual image URL
  type?: string        // Type flag to determine rendering method
}

// Generate a random color from a palette based on type
function getRandomColor(type: string): string {
  const colorPalettes = {
    red_dots: ['#FF5252', '#FF1744', '#D50000', '#FF8A80', '#FF5252'],
    green_dots: ['#69F0AE', '#00E676', '#00C853', '#B9F6CA', '#69F0AE'],
    orange_dots: ['#FFAB40', '#FF9100', '#FF6D00', '#FFD180', '#FFAB40'],
    mixed_brown_tan: ['#A1887F', '#8D6E63', '#795548', '#6D4C41', '#5D4037'],
    orange_brown: ['#FFAB91', '#FF8A65', '#FF7043', '#FF5722', '#F4511E'],
    purple_violet: ['#B39DDB', '#9575CD', '#7E57C2', '#673AB7', '#5E35B1'],
    light_green: ['#AED581', '#9CCC65', '#8BC34A', '#7CB342', '#689F38'],
    yellow_orange: ['#FFD54F', '#FFCA28', '#FFC107', '#FFB300', '#FFA000'],
    blue_purple: ['#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5'],
    pink_rose: ['#F48FB1', '#F06292', '#EC407A', '#E91E63', '#D81B60'],
    gray_silver: ['#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161']
  };
  
  // Default to a mixed palette if type not found
  const palette = colorPalettes[type as keyof typeof colorPalettes] || 
                 [...colorPalettes.mixed_brown_tan, ...colorPalettes.green_dots];
  
  return palette[Math.floor(Math.random() * palette.length)];
}

function IshiharaPlate({ plateId, correctAnswer, size, imageUrl, type }: IshiharaPlateProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [svgContent, setSvgContent] = useState<string>("");
  const [imageError, setImageError] = useState(false);
  
  // If we have an actual image URL, use it instead of synthetic generation
  if (imageUrl && type === 'actual_image') {
    return (
      <div 
        className="w-full h-full rounded-full relative overflow-hidden border-4 border-gray-600 bg-gray-100"
        style={{ width: size, height: size }}
      >
        <div className="w-full h-full flex items-center justify-center">
          {imageError ? (
            <div className="text-gray-500 text-center p-4">
              <p>Failed to load image</p>
              <p className="text-xs">Plate {plateId}</p>
            </div>
          ) : (
            <img 
              src={`http://localhost:5000${imageUrl}`}
              alt={`Ishihara plate ${plateId}`}
              className="w-full h-full object-cover rounded-full"
              onError={() => setImageError(true)}
              onLoad={() => setIsLoading(false)}
              style={{ width: size - 8, height: size - 8 }}
            />
          )}
          
          {isLoading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          )}
        </div>
        
        {/* Instruction overlay */}
        <div className="absolute bottom-2 left-2 right-2 text-center">
          <div className="bg-black/60 text-white text-xs px-2 py-1 rounded">
            Plate {plateId}: Look for the hidden number
          </div>
        </div>
      </div>
    )
  }
  
  // Fallback to synthetic/SVG generation for non-actual images
  // Load SVG file based on plateId
  useEffect(() => {
    const loadSvgFile = async () => {
      try {
        setIsLoading(true);
        // Try to load the SVG file for this plate
        const response = await fetch(`/plates/plate${plateId}.svg`);
        
        if (response.ok) {
          const svgText = await response.text();
          setSvgContent(svgText);
          setIsRendered(true);
        } else {
          console.error(`Failed to load SVG for plate ${plateId}`);
          // Fallback to dynamic rendering if SVG file not found
          renderFallbackPlate();
        }
      } catch (error) {
        console.error(`Error loading SVG for plate ${plateId}:`, error);
        renderFallbackPlate();
      } finally {
        setIsLoading(false);
      }
    };
    
    const renderFallbackPlate = () => {
      if (!svgRef.current) return;
      
      // Clear previous content
      while (svgRef.current.firstChild) {
        svgRef.current.removeChild(svgRef.current.firstChild);
      }
      
      // Determine background and number colors based on plate number
      let bgColorType = 'mixed_brown_tan';
      let numberColorType = 'green_dots';
      
      // Vary colors based on plate ID to make them look different
      switch (plateId % 5) {
        case 0: 
          bgColorType = 'orange_brown'; 
          numberColorType = 'green_dots'; 
          break;
        case 1: 
          bgColorType = 'purple_violet'; 
          numberColorType = 'red_dots'; 
          break;
        case 2: 
          bgColorType = 'light_green'; 
          numberColorType = 'red_dots'; 
          break;
        case 3: 
          bgColorType = 'blue_purple'; 
          numberColorType = 'orange_dots'; 
          break;
        case 4: 
          bgColorType = 'gray_silver'; 
          numberColorType = 'red_dots'; 
          break;
      }
      
      // Create background dots
      const totalDots = 1000;
      const radius = (size - 8) / 2;
      const center = radius;
      
      // Create dots in a circular pattern
      for (let i = 0; i < totalDots; i++) {
        // Random angle and distance from center (with higher density toward edges)
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.pow(Math.random(), 0.5) * radius; // Square root for more uniform distribution
        
        // Convert to cartesian coordinates
        const x = center + distance * Math.cos(angle);
        const y = center + distance * Math.sin(angle);
        
        // Create circle element
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x.toString());
        circle.setAttribute('cy', y.toString());
        circle.setAttribute('r', (2 + Math.random() * 3).toString()); // Random size between 2-5px
        circle.setAttribute('fill', getRandomColor(bgColorType));
        
        svgRef.current.appendChild(circle);
      }
      
      // Draw the number
      const numberStr = correctAnswer.toString();
      const fontSize = radius * 0.8;
      const numberWidth = fontSize * 0.6 * numberStr.length;
      const startX = center - numberWidth / 2;
      const startY = center + fontSize / 3;
      
      // Create a path for each digit
      for (let i = 0; i < numberStr.length; i++) {
        const digit = numberStr[i];
        const digitX = startX + i * fontSize * 0.6;
        
        // Create dots along the digit path
        const digitDots = 200; // Number of dots per digit
        
        // Simple path definitions for digits 0-9
        let pathPoints: [number, number][] = [];
        
        switch (digit) {
          case '0':
          case 'O':
            // Circle
            for (let j = 0; j < digitDots; j++) {
              const a = j / digitDots * 2 * Math.PI;
              pathPoints.push([digitX + Math.cos(a) * fontSize * 0.3, startY + Math.sin(a) * fontSize * 0.4]);
            }
            break;
          case '1':
            // Vertical line
            for (let j = 0; j < digitDots; j++) {
              pathPoints.push([digitX, startY - fontSize * 0.5 + j / digitDots * fontSize]);
            }
            break;
          case '2':
            // Create a '2' shape
            for (let j = 0; j < digitDots; j++) {
              const t = j / digitDots;
              if (t < 0.3) {
                // Top curve
                const a = (1 - t / 0.3) * Math.PI;
                pathPoints.push([digitX + Math.cos(a) * fontSize * 0.25, startY - fontSize * 0.4 + Math.sin(a) * fontSize * 0.25]);
              } else if (t < 0.6) {
                // Diagonal line
                const nt = (t - 0.3) / 0.3;
                pathPoints.push([digitX + fontSize * 0.25 - nt * fontSize * 0.5, startY - fontSize * 0.15 + nt * fontSize * 0.5]);
              } else {
                // Bottom line
                const nt = (t - 0.6) / 0.4;
                pathPoints.push([digitX - fontSize * 0.25 + nt * fontSize * 0.5, startY + fontSize * 0.35]);
              }
            }
            break;
          case '3':
            // Create a '3' shape
            for (let j = 0; j < digitDots; j++) {
              const t = j / digitDots;
              if (t < 0.5) {
                // Top curve
                const a = (1 - t / 0.5) * Math.PI;
                pathPoints.push([digitX + Math.cos(a) * fontSize * 0.25, startY - fontSize * 0.25 + Math.sin(a) * fontSize * 0.25]);
              } else {
                // Bottom curve
                const a = (1 - (t - 0.5) / 0.5) * Math.PI;
                pathPoints.push([digitX + Math.cos(a) * fontSize * 0.25, startY + fontSize * 0.25 + Math.sin(a) * fontSize * 0.25]);
              }
            }
            break;
          case '4':
            // Create a '4' shape
            for (let j = 0; j < digitDots; j++) {
              const t = j / digitDots;
              if (t < 0.33) {
                // Vertical line
                pathPoints.push([digitX + fontSize * 0.25, startY - fontSize * 0.5 + t / 0.33 * fontSize]);
              } else if (t < 0.66) {
                // Horizontal line
                const nt = (t - 0.33) / 0.33;
                pathPoints.push([digitX + fontSize * 0.25 - nt * fontSize * 0.5, startY]);
              } else {
                // Middle vertical line
                const nt = (t - 0.66) / 0.34;
                pathPoints.push([digitX, startY - fontSize * 0.25 + nt * fontSize * 0.5]);
              }
            }
            break;
          case '5':
            // Create a '5' shape
            for (let j = 0; j < digitDots; j++) {
              const t = j / digitDots;
              if (t < 0.25) {
                // Top horizontal
                pathPoints.push([digitX + fontSize * 0.25 - t / 0.25 * fontSize * 0.5, startY - fontSize * 0.4]);
              } else if (t < 0.5) {
                // Vertical down
                const nt = (t - 0.25) / 0.25;
                pathPoints.push([digitX - fontSize * 0.25, startY - fontSize * 0.4 + nt * fontSize * 0.4]);
              } else {
                // Bottom curve
                const a = (1 - (t - 0.5) / 0.5) * Math.PI;
                pathPoints.push([digitX + Math.cos(a) * fontSize * 0.25, startY + fontSize * 0.2 + Math.sin(a) * fontSize * 0.2]);
              }
            }
            break;
          case '6':
            // Create a '6' shape
            for (let j = 0; j < digitDots; j++) {
              const t = j / digitDots;
              if (t < 0.4) {
                // Left curve
                const a = t / 0.4 * Math.PI + Math.PI;
                pathPoints.push([digitX + Math.cos(a) * fontSize * 0.25, startY - fontSize * 0.2 + Math.sin(a) * fontSize * 0.4]);
              } else {
                // Bottom circle
                const a = (t - 0.4) / 0.6 * 2 * Math.PI;
                pathPoints.push([digitX + Math.cos(a) * fontSize * 0.25, startY + fontSize * 0.2 + Math.sin(a) * fontSize * 0.2]);
              }
            }
            break;
          case '7':
            // Create a '7' shape
            for (let j = 0; j < digitDots; j++) {
              const t = j / digitDots;
              if (t < 0.3) {
                // Top horizontal
                pathPoints.push([digitX - fontSize * 0.25 + t / 0.3 * fontSize * 0.5, startY - fontSize * 0.4]);
              } else {
                // Diagonal
                const nt = (t - 0.3) / 0.7;
                pathPoints.push([digitX + fontSize * 0.25 - nt * fontSize * 0.5, startY - fontSize * 0.4 + nt * fontSize * 0.8]);
              }
            }
            break;
          case '8':
            // Create an '8' shape
            for (let j = 0; j < digitDots; j++) {
              const t = j / digitDots;
              if (t < 0.5) {
                // Top circle
                const a = t / 0.5 * 2 * Math.PI;
                pathPoints.push([digitX + Math.cos(a) * fontSize * 0.25, startY - fontSize * 0.2 + Math.sin(a) * fontSize * 0.2]);
              } else {
                // Bottom circle
                const a = (t - 0.5) / 0.5 * 2 * Math.PI;
                pathPoints.push([digitX + Math.cos(a) * fontSize * 0.25, startY + fontSize * 0.2 + Math.sin(a) * fontSize * 0.2]);
              }
            }
            break;
          case '9':
            // Create a '9' shape
            for (let j = 0; j < digitDots; j++) {
              const t = j / digitDots;
              if (t < 0.6) {
                // Top circle
                const a = t / 0.6 * 2 * Math.PI;
                pathPoints.push([digitX + Math.cos(a) * fontSize * 0.25, startY - fontSize * 0.2 + Math.sin(a) * fontSize * 0.2]);
              } else {
                // Right curve
                const a = (t - 0.6) / 0.4 * Math.PI;
                pathPoints.push([digitX + Math.cos(a) * fontSize * 0.25, startY + fontSize * 0.2 + Math.sin(a) * fontSize * 0.4]);
              }
            }
            break;
          default:
            // For any other character, just make a dot
            for (let j = 0; j < digitDots; j++) {
              const a = j / digitDots * 2 * Math.PI;
              pathPoints.push([digitX + Math.cos(a) * fontSize * 0.3, startY + Math.sin(a) * fontSize * 0.3]);
            }
        }
        
        // Draw dots along the path
        for (const [x, y] of pathPoints) {
          // Skip some dots randomly for a more natural look
          if (Math.random() < 0.7) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x.toString());
            circle.setAttribute('cy', y.toString());
            circle.setAttribute('r', (1.5 + Math.random() * 2).toString()); // Random size
            circle.setAttribute('fill', getRandomColor(numberColorType));
            
            svgRef.current.appendChild(circle);
          }
        }
      }
      
      setIsRendered(true);
    };
    
    loadSvgFile();
  }, [plateId, correctAnswer, size]);
  
  return (
    <div 
      className="w-full h-full rounded-full relative overflow-hidden border-4 border-gray-600 bg-gray-100"
      style={{ width: size, height: size }}
    >
      <div className="w-full h-full flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        )}
        
        {!isLoading && svgContent ? (
          <div 
            className="rounded-full overflow-hidden"
            style={{ width: size - 8, height: size - 8 }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <svg 
            ref={svgRef}
            width={size - 8} 
            height={size - 8}
            viewBox={`0 0 ${size - 8} ${size - 8}`}
            className="rounded-full"
          />
        )}
      </div>
      
      {/* Instruction overlay */}
      <div className="absolute bottom-2 left-2 right-2 text-center">
        <div className="bg-black/60 text-white text-xs px-2 py-1 rounded">
          Plate {plateId}: Look for the hidden number
        </div>
      </div>
    </div>
  )
}

interface PlateData {
  id: number
  correctAnswer: string
  difficulty: "easy" | "medium" | "hard"
  description?: string
  imageUrl?: string    // New field for actual image URL
  filename?: string    // New field for image filename
  type?: string        // Type flag: 'actual_image' or 'synthetic'
}

interface UserAnswer {
  plateId: number
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  responseTime: number
}

interface TestResults {
  accuracy: number
  correct_answers: number
  total_answers: number
  color_vision_status: string
  error_pattern: any[]
  diagnosis: {
    type: string
    description: string
    severity: string
    prevalence: string
  }
  recommendations: string[]
}

export default function ColorBlindnessTest() {
  // State for test flow
  const [gameState, setGameState] = useState<"intro" | "playing" | "finished">("intro")
  const [plates, setPlates] = useState<PlateData[]>([])
  const [selectedPlates, setSelectedPlates] = useState<PlateData[]>([])
  const [currentPlateIndex, setCurrentPlateIndex] = useState(0)
  const [userInput, setUserInput] = useState("")
  const [answers, setAnswers] = useState<UserAnswer[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [startTime, setStartTime] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [backendResults, setBackendResults] = useState<TestResults | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState("ishihara")
  const [lanternResults, setLanternResults] = useState<any>(null)
  const [showLanternResults, setShowLanternResults] = useState(false)

  const resultsRef = useRef<HTMLDivElement>(null)

  // Load plate data from backend API first, then fallback to local files
  useEffect(() => {
    const loadPlateData = async () => {
      try {
        // First try to load from backend API with actual images
        console.log('Attempting to load plates from backend API...');
        const backendResponse = await fetch('http://localhost:5000/ishihara/plates');
        
        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          if (backendData.plates && backendData.plates.length > 0) {
            // Convert backend plate format to our format
            const backendPlates = backendData.plates.map((plate: any) => ({
              id: plate.id,
              correctAnswer: plate.correctAnswer,
              difficulty: plate.difficulty || 'medium',
              description: plate.description,
              imageUrl: plate.image_url,
              filename: plate.filename,
              type: plate.type || 'actual_image'
            }));
            setPlates(backendPlates);
            console.log(`✅ Loaded ${backendPlates.length} actual Ishihara plates from backend!`);
            console.log('Source:', backendData.source);
            return; // Exit early if backend loading succeeds
          }
        } else {
          console.warn('Backend API not available, falling back to local files');
        }
      } catch (error) {
        console.warn('Error loading from backend API:', error);
        console.log('Falling back to local plate files...');
      }
      
      // Fallback to local file loading
      try {
        // Load from local plates data file
        const response = await fetch('/plates/plates-data.json')
        if (response.ok) {
          const data = await response.json()
          setPlates(data.plates)
          console.log('Loaded plates from local file:', data.plates.length)
        } else {
          // Fallback to comprehensive JSON file if available
          const fallbackResponse = await fetch('/plates/Ishiharas-Test-for-Color-Deficiency.json')
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            // Convert the comprehensive format to our plate format
            const convertedPlates = fallbackData.testPlates?.map((plate: any) => ({
              id: plate.plateNumber,
              correctAnswer: plate.correctAnswer,
              difficulty: plate.difficulty === 'demonstration' ? 'easy' : plate.difficulty,
              description: plate.description
            })) || []
            setPlates(convertedPlates)
            console.log('Loaded plates from comprehensive JSON:', convertedPlates.length)
          } else {
            console.error('Failed to load plate data from both sources')
          }
        }
      } catch (error) {
        console.error('Error loading plate data:', error)
        // Create fallback plates if all else fails
        const fallbackPlates = [
          { id: 1, correctAnswer: '12', difficulty: 'easy' as const },
          { id: 2, correctAnswer: '8', difficulty: 'medium' as const },
          { id: 3, correctAnswer: '6', difficulty: 'easy' as const },
          { id: 4, correctAnswer: '29', difficulty: 'hard' as const },
          { id: 5, correctAnswer: '74', difficulty: 'medium' as const },
          { id: 6, correctAnswer: '3', difficulty: 'easy' as const },
          { id: 7, correctAnswer: '15', difficulty: 'medium' as const },
          { id: 8, correctAnswer: '97', difficulty: 'hard' as const },
          { id: 9, correctAnswer: '45', difficulty: 'medium' as const },
          { id: 10, correctAnswer: '16', difficulty: 'easy' as const },
        ]
        setPlates(fallbackPlates)
        console.log('Using fallback plates:', fallbackPlates.length)
      }
    }
    
    loadPlateData()
  }, [])

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (gameState === "playing" && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    } else if (timeLeft === 0 && gameState === "playing") {
      handleNextPlate("")
    }
    return () => clearTimeout(timer)
  }, [timeLeft, gameState])

  // Start the test
  const startTest = () => {
    // Select 5 random plates
    const shuffled = [...plates].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, 5)
    
    setSelectedPlates(selected)
    setCurrentPlateIndex(0)
    setAnswers([])
    setScore(0)
    setTimeLeft(30)
    setStartTime(Date.now())
    setGameState("playing")
  }

  // Handle user input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value)
  }

  // Handle next plate
  const handleNextPlate = (answer: string) => {
    const currentPlate = selectedPlates[currentPlateIndex]
    const responseTime = (Date.now() - startTime) / 1000
    const isCorrect = answer === currentPlate.correctAnswer
    
    // Save answer
    const newAnswer: UserAnswer = {
      plateId: currentPlate.id,
      userAnswer: answer || "No answer",
      correctAnswer: currentPlate.correctAnswer,
      isCorrect,
      responseTime
    }
    
    setAnswers(prev => [...prev, newAnswer])
    
    if (isCorrect) {
      setScore(prev => prev + 1)
    }
    
    // Move to next plate or finish
    if (currentPlateIndex < selectedPlates.length - 1) {
      setCurrentPlateIndex(prev => prev + 1)
      setUserInput("")
      setTimeLeft(30)
      setStartTime(Date.now())
    } else {
      // Test finished
      setGameState("finished")
      
      // Analyze results with backend AI
      analyzeWithBackend([...answers, newAnswer])
      
      // Show confetti for good results
      if (score >= 4) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 5000)
      }
      
      // Save to localStorage
      const testResult = {
        date: new Date().toISOString(),
        score,
        answers: [...answers, newAnswer],
        avgResponseTime: [...answers, newAnswer].reduce((acc, ans) => acc + ans.responseTime, 0) / selectedPlates.length
      }
      
      localStorage.setItem('colorBlindnessTestResult', JSON.stringify(testResult))
    }
  }

  // Analyze results with backend AI
  const analyzeWithBackend = async (allAnswers: UserAnswer[]) => {
    setIsAnalyzing(true)
    
    // Set a timeout to prevent hanging indefinitely
    const timeoutId = setTimeout(() => {
      console.log('Backend analysis timeout, falling back to local analysis')
      setBackendResults({
        color_vision_status: 'timeout',
        accuracy: 0,
        correct_answers: 0,
        total_answers: 0,
        error_pattern: [],
        diagnosis: {
          type: 'Analysis Timeout',
          description: 'Backend analysis timed out. Using local assessment.',
          severity: 'Unknown',
          prevalence: 'N/A'
        },
        recommendations: ['Analysis service is temporarily unavailable. Results based on local assessment.']
      })
      setIsAnalyzing(false)
    }, 5000) // 5 second timeout
    
    try {
      // Prepare answers in the format expected by the backend
      const answersForBackend: { [key: string]: string } = {}
      allAnswers.forEach(answer => {
        answersForBackend[answer.plateId.toString()] = answer.userAnswer
      })

      console.log('Sending answers to backend:', answersForBackend)
      console.log('Backend URL:', 'http://localhost:5000/ishihara/test')

      const response = await fetch('http://localhost:5000/ishihara/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: answersForBackend
        })
      })

      // Clear timeout if request succeeds
      clearTimeout(timeoutId)
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Backend analysis result:', result)
        setBackendResults(result.test_results)
      } else {
        const errorText = await response.text()
        console.error('Backend analysis failed:', response.statusText, errorText)
        // Set a fallback result to prevent pending state
        setBackendResults({
          color_vision_status: 'error',
          accuracy: 0,
          correct_answers: 0,
          total_answers: 0,
          error_pattern: [],
          diagnosis: {
            type: 'Analysis Error',
            description: 'Unable to analyze results. Using basic assessment.',
            severity: 'Unknown',
            prevalence: 'N/A'
          },
          recommendations: ['Please try the test again or consult an eye care professional.']
        })
      }
    } catch (error) {
      // Clear timeout on error
      clearTimeout(timeoutId)
      console.error('Error analyzing with backend:', error)
      // Set a fallback result to prevent pending state
      setBackendResults({
        color_vision_status: 'error',
        accuracy: 0,
        correct_answers: 0,
        total_answers: 0,
        error_pattern: [],
        diagnosis: {
          type: 'Connection Error',
          description: 'Unable to connect to analysis service. Using basic assessment.',
          severity: 'Unknown',
          prevalence: 'N/A'
        },
        recommendations: ['Please check your internet connection and try again.']
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleLanternTestComplete = (results: any) => {
    console.log('Lantern test completed:', results)
    setLanternResults(results)
    setShowLanternResults(true)
  }

  const resetLanternTest = () => {
    setLanternResults(null)
    setShowLanternResults(false)
  }

  // Get vision level with backend integration
  const getVisionLevel = () => {
    // If we have backend results, use those
    if (backendResults) {
      const status = backendResults.color_vision_status
      
      switch (status) {
        case 'normal':
          return { level: "Normal", color: "from-green-400 to-emerald-500", icon: CheckCircle }
        case 'protanopia':
        case 'deuteranopia':
        case 'tritanopia':
          return { level: "Color Blindness", color: "from-red-400 to-pink-500", icon: XCircle }
        case 'protanomaly':
        case 'deuteranomaly':
        case 'tritanomaly':
          return { level: "Color Deficiency", color: "from-yellow-400 to-orange-500", icon: AlertTriangle }
        case 'error':
          // Fall through to manual analysis
          break
        default:
          return { level: "Analysis Pending", color: "from-blue-400 to-purple-500", icon: CheckCircle }
      }
    }
    
    // Manual/fallback analysis when backend is unavailable or returns error
    const correctAnswers = answers.filter(a => a.isCorrect).length
    const avgResponseTime = answers.reduce((acc, ans) => acc + ans.responseTime, 0) / answers.length
    
    if (correctAnswers >= 4 && avgResponseTime < 8) {
      return { level: "Normal", color: "from-green-400 to-emerald-500", icon: CheckCircle }
    } else if (correctAnswers >= 2 && correctAnswers <= 3 && avgResponseTime >= 8 && avgResponseTime <= 12) {
      return { level: "Mild Deficiency", color: "from-yellow-400 to-orange-500", icon: AlertTriangle }
    } else {
      return { level: "Strong Deficiency", color: "from-red-400 to-pink-500", icon: XCircle }
    }
  }

  // Confetti component
  const Confetti = ({ show }: { show: boolean }) => {
    if (!show) return null

    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
              left: `${Math.random() * 100}%`,
              top: "-10px",
            }}
            initial={{ y: -10, rotate: 0 }}
            animate={{
              y: window.innerHeight + 10,
              rotate: 360,
              x: Math.random() * 200 - 100,
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              ease: "easeOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    )
  }
  // Print functionality
  const handlePrint = () => {
    window.print()
  }

  // Download PDF report
  const downloadPdf = async () => {
    if (!resultsRef.current) return
    
    setDownloadingPdf(true)
    try {
      console.log('Starting PDF generation...')
      
      // Create a comprehensive PDF report with structured content
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      // Set background
      doc.setFillColor(17, 24, 39) // Dark background
      doc.rect(0, 0, 210, 297, 'F')
      
      // Add header
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.text('Ishihara Color Vision Test Report', 105, 25, { align: 'center' })
      
      // Add test date
      doc.setFontSize(12)
      doc.setTextColor(200, 200, 200)
      doc.text(`Test Date: ${new Date().toLocaleDateString()}`, 105, 35, { align: 'center' })
      
      // Add results title
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.text('Test Results', 20, 55)
      
      // Add score information
      doc.setFontSize(14)
      doc.text(`Score: ${score}/${selectedPlates.length} (${Math.round((score / selectedPlates.length) * 100)}%)`, 20, 70)
      
      // Add vision level
      const visionResult = getVisionLevel()
      doc.setTextColor(100, 200, 255) // Blue color for result
      doc.setFontSize(16)
      doc.text(`Vision Assessment: ${visionResult.level}`, 20, 85)
      
      // Add AI analysis if available
      let yPosition = 100
      if (backendResults) {
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(16)
        doc.text('AI Analysis Results', 20, yPosition)
        yPosition += 15
        
        doc.setFontSize(12)
        doc.text(`Diagnosis: ${backendResults.diagnosis.type}`, 20, yPosition)
        yPosition += 10
        doc.text(`Accuracy: ${backendResults.accuracy}%`, 20, yPosition)
        yPosition += 10
        doc.text(`Severity: ${backendResults.diagnosis.severity}`, 20, yPosition)
        yPosition += 10
        doc.text(`Prevalence: ${backendResults.diagnosis.prevalence}`, 20, yPosition)
        yPosition += 20
        
        // Add recommendations
        if (backendResults.recommendations.length > 0) {
          doc.setFontSize(14)
          doc.text('Recommendations:', 20, yPosition)
          yPosition += 10
          
          doc.setFontSize(11)
          backendResults.recommendations.forEach((rec, index) => {
            const lines = doc.splitTextToSize(`• ${rec}`, 170)
            doc.text(lines, 25, yPosition)
            yPosition += lines.length * 5
          })
          yPosition += 10
        }
      }
      
      // Add detailed answers
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.text('Detailed Results', 20, yPosition)
      yPosition += 15
      
      doc.setFontSize(11)
      answers.forEach((answer, index) => {
        const plateInfo = selectedPlates.find(p => p.id === answer.plateId)
        const status = answer.isCorrect ? '✓ Correct' : '✗ Incorrect'
        const color = answer.isCorrect ? [100, 255, 100] : [255, 100, 100]
        
        doc.setTextColor(255, 255, 255)
        doc.text(`Plate ${answer.plateId}:`, 20, yPosition)
        doc.text(`Your Answer: ${answer.userAnswer}`, 70, yPosition)
        doc.text(`Correct: ${answer.correctAnswer}`, 120, yPosition)
        
        doc.setTextColor(color[0], color[1], color[2])
        doc.text(status, 160, yPosition)
        
        yPosition += 8
        
        // Add new page if needed
        if (yPosition > 270) {
          doc.addPage()
          doc.setFillColor(17, 24, 39)
          doc.rect(0, 0, 210, 297, 'F')
          yPosition = 20
        }
      })
      
      // Add disclaimer
      yPosition += 20
      if (yPosition > 250) {
        doc.addPage()
        doc.setFillColor(17, 24, 39)
        doc.rect(0, 0, 210, 297, 'F')
        yPosition = 20
      }
      
      doc.setTextColor(200, 200, 200)
      doc.setFontSize(10)
      const disclaimer = 'Disclaimer: This test is for screening purposes only. For definitive diagnosis, please consult with an eye care professional.'
      const disclaimerLines = doc.splitTextToSize(disclaimer, 170)
      doc.text(disclaimerLines, 20, yPosition)
      
      // Add footer
      doc.setTextColor(150, 150, 150)
      doc.setFontSize(9)
      doc.text('Generated by Medical AI - Hackloop Project', 105, 285, { align: 'center' })
      
      // Save the PDF
      const filename = `ishihara-color-test-${new Date().toISOString().split('T')[0]}.pdf`
      console.log('Saving PDF:', filename)
      
      // Use the correct jsPDF save method
      doc.save(filename)
      
      console.log('PDF generated successfully!')
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const currentPlate = selectedPlates[currentPlateIndex]
  const result = gameState === "finished" ? getVisionLevel() : { level: "", color: "", icon: CheckCircle }
  const ResultIcon = result.icon

  return (
    <div className="min-h-screen">
      <Navigation />
      <Confetti show={showConfetti} />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {gameState === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="text-center space-y-8"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400 uppercase tracking-wider">Vision Test</span>
                  </div>

                  <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                    <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
                      Color Blindness
                    </span>
                    <br />
                    <span className="text-white">Screening Test</span>
                  </h1>

                  <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                    Choose between two comprehensive color vision tests: Ishihara plates for detecting red-green color blindness,
                    or the Lantern test for evaluating color discrimination in various lighting conditions.
                  </p>
                </div>

                <div className="glass rounded-2xl p-8 max-w-4xl mx-auto">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-700/50">
                      <TabsTrigger value="ishihara" className="flex items-center space-x-2">
                        <Eye className="w-4 h-4" />
                        <span>Ishihara Test</span>
                      </TabsTrigger>
                      <TabsTrigger value="lantern" className="flex items-center space-x-2">
                        <Lightbulb className="w-4 h-4" />
                        <span>Lantern Test</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="ishihara" className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text- mb-4">Ishihara Color Vision Test</h2>
                        <p className="text-white-700 mb-6">
                          Identify numbers hidden in colored dot patterns. This test is designed to detect red-green color blindness.
                        </p>

                        <div className="space-y-3 text-left mb-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                            <span className="text-purple-400">Look at each colored dot pattern carefully</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-purple-400" />
                            <span className="text-purple-400">Identify the number you see in the pattern</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-teal-400" />
                            <span className="text-purple-400">You have 30 seconds per plate</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-green-400" />
                            <span className="text-purple-400">Complete all plates to get your results</span>
                          </div>
                        </div>

                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              console.log("Start Ishihara test clicked");
                              startTest();
                            }}
                            size="lg"
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xl px-12 py-6 rounded-xl shadow-2xl shadow-blue-500/25"
                          >
                            <Eye className="w-6 h-6 mr-3" />
                            Start Ishihara Test
                          </Button>
                        </motion.div>
                      </div>
                    </TabsContent>

                    <TabsContent value="lantern" className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">Lantern Color Vision Test</h2>
                        <p className="text-white -700 mb-6">
                          Identify sequences of colored lights. This test evaluates color discrimination ability in various conditions.
                        </p>

                        {!showLanternResults ? (
                          <div className="space-y-6">
                            <div className="space-y-3 text-left mb-6">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 rounded-full bg-red-400" />
                                <span className="text-purple-400">Observe the sequence of colored lights</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 rounded-full bg-green-400" />
                                <span className="text-purple-400">Select colors in the order you see them</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 rounded-full bg-blue-400" />
                                <span className="text-purple-400">You have 15 seconds per question</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                <span className="text-purple-400">Complete 8 questions for full assessment</span>
                              </div>
                            </div>

                            <LanternTest
                              onComplete={handleLanternTestComplete}
                              onTimeUp={() => console.log('Lantern test time up')}
                            />
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="p-6 bg-gray-100 rounded-lg">
                              <h3 className="text-xl font-bold text-gray-800 mb-4">Lantern Test Results</h3>
                              <div className="grid grid-cols-2 gap-4 text-left">
                                <div>
                                  <span className="text-gray-600">Accuracy:</span>
                                  <span className="font-bold text-gray-800 ml-2">{lanternResults?.accuracy.toFixed(1)}%</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Correct Answers:</span>
                                  <span className="font-bold text-gray-800 ml-2">{lanternResults?.correctAnswers}/{lanternResults?.totalQuestions}</span>
                                </div>
                              </div>
                              <div className="mt-4">
                                <span className="text-gray-600">Diagnosis:</span>
                                <p className="font-bold text-gray-800">{lanternResults?.diagnosis}</p>
                              </div>
                              <div className="mt-4">
                                <span className="text-gray-600">Recommendations:</span>
                                <ul className="list-disc list-inside text-gray-700 mt-2">
                                  {lanternResults?.recommendations.map((rec: string, index: number) => (
                                    <li key={index}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <Button
                              onClick={resetLanternTest}
                              variant="outline"
                              className="border-blue-500 text-blue-600 hover:bg-blue-50"
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Take Test Again
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </motion.div>
            )}

            {gameState === "playing" && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-8"
              >
                {/* Progress and Timer */}
                <div className="flex items-center justify-between glass rounded-xl p-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-white font-semibold">
                      Plate {currentPlateIndex + 1} of {selectedPlates.length}
                    </span>
                    <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentPlateIndex + 1) / selectedPlates.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <span className={`font-bold text-xl ${timeLeft <= 10 ? "text-red-400" : "text-white"}`}>
                      {timeLeft}s
                    </span>
                  </div>
                </div>

                {/* Test Plate */}
                <div className="glass rounded-2xl p-8">
                  <div className="flex flex-col items-center space-y-6">
                    <div className="w-64 h-64 md:w-80 md:h-80 relative">
                      {/* Authentic Ishihara Test Pattern */}
                      <IshiharaPlate 
                        plateId={currentPlate.id}
                        correctAnswer={currentPlate.correctAnswer}
                        size={320}
                        imageUrl={currentPlate.imageUrl}
                        type={currentPlate.type}
                      />
                    </div>
                    
                    <div className="w-full max-w-md">
                      <div className="mb-4">
                        <label htmlFor="answer" className="block text-sm font-medium text-gray-300 mb-1">
                          What number do you see in the image?
                        </label>
                        <Input
                          id="answer"
                          type="text"
                          value={userInput}
                          onChange={handleInputChange}
                          placeholder="Enter the number you see"
                          className="bg-gray-800 border-gray-700 text-white"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleNextPlate(userInput);
                            }
                          }}
                        />
                      </div>
                      
                      <Button 
                        onClick={() => handleNextPlate(userInput)}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        Next Plate
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {gameState === "finished" && (
              <motion.div
                key="finished"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="text-center space-y-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <div
                    className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-r ${result.color} flex items-center justify-center`}
                  >
                    <ResultIcon className="w-12 h-12 text-white" />
                  </div>

                  <h1 className="text-4xl md:text-5xl font-bold text-white">Test Complete!</h1>

                  <div ref={resultsRef} className="glass rounded-2xl p-8 max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold mb-4">
                      <span className={`bg-gradient-to-r ${result.color} bg-clip-text text-transparent`}>
                        {result.level} Color Vision
                      </span>
                    </h2>

                    {isAnalyzing && (
                      <div className="mb-6 p-4 bg-blue-900/30 rounded-lg border border-blue-400/30">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                          <span className="text-blue-400">Analyzing with AI...</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">{score}</div>
                        <div className="text-gray-400">Correct Answers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">
                          {backendResults ? `${backendResults.accuracy}%` : `${Math.round((score / selectedPlates.length) * 100)}%`}
                        </div>
                        <div className="text-gray-400">Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">
                          {Math.round(answers.reduce((acc, ans) => acc + ans.responseTime, 0) / answers.length)}s
                        </div>
                        <div className="text-gray-400">Avg. Time</div>
                      </div>
                    </div>

                    {backendResults && (
                      <div className="space-y-4 mb-6">
                        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                          <h3 className="text-lg font-semibold text-white mb-2">AI Diagnosis</h3>
                          <div className="space-y-2">
                            <p className="text-blue-400 font-medium">{backendResults.diagnosis.type}</p>
                            <p className="text-gray-300 text-sm">{backendResults.diagnosis.description}</p>
                            <div className="flex space-x-4 text-sm">
                              <span className="text-gray-400">Severity: <span className="text-white">{backendResults.diagnosis.severity}</span></span>
                              <span className="text-gray-400">Prevalence: <span className="text-white">{backendResults.diagnosis.prevalence}</span></span>
                            </div>
                          </div>
                        </div>

                        {backendResults.recommendations.length > 0 && (
                          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                            <h3 className="text-lg font-semibold text-white mb-2">Recommendations</h3>
                            <ul className="space-y-1">
                              {backendResults.recommendations.map((rec, index) => (
                                <li key={index} className="text-gray-300 text-sm flex items-start space-x-2">
                                  <span className="text-blue-400 mt-1">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-gray-300 leading-relaxed">
                      {backendResults ? (
                        backendResults.diagnosis.description
                      ) : (
                        <>
                          {result.level === "Normal" &&
                            "Excellent! Your color vision appears to be normal. You successfully identified most or all of the test patterns."}
                          {result.level === "Mild" &&
                            "You may have mild color vision deficiency. Consider consulting with an eye care professional for a comprehensive evaluation."}
                          {result.level === "Strong" &&
                            "You may have significant color vision deficiency. We recommend consulting with an eye care professional for proper diagnosis and guidance."}
                        </>
                      )}
                    </p>
                  </div>
                </motion.div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={startTest}
                      size="lg"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg px-8 py-6 rounded-xl group"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Take Test Again
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <EmailButton 
                      type="comprehensive" 
                      variant="outline" 
                      size="lg"
                      className="glass border-2 border-purple-400/30 hover:border-purple-400/60 hover:bg-purple-400/10 text-white text-lg px-8 py-6 rounded-xl bg-black"
                    >
                      Email Report
                    </EmailButton>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handlePrint}
                      size="lg"
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-lg px-8 py-6 rounded-xl screen-only"
                    >
                      <Printer className="w-5 h-5 mr-2" />
                      Print Report
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={downloadPdf}
                      disabled={downloadingPdf}
                      variant="outline"
                      size="lg"
                      className="glass border-2 border-blue-400/30 hover:border-blue-400/60 hover:bg-blue-400/10 text-white text-lg px-8 py-6 rounded-xl bg-black"
                    >
                      {downloadingPdf ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5 mr-2" />
                          Download Report
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
