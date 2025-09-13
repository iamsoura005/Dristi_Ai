import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Lightbulb, Clock, CheckCircle, AlertTriangle, Download, Printer, RotateCcw } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Color mapping for lantern lights
const colorMap = {
  red: '#FF0000',
  green: '#00FF00',
  white: '#FFFFFF'
};

// Test sequence as specified in requirements
const testSequence = [
  { left: 'red', right: 'green' },
  { left: 'white', right: 'red' },
  { left: 'green', right: 'white' },
  { left: 'red', right: 'white' },
  { left: 'green', right: 'red' },
  { left: 'white', right: 'green' },
  { left: 'red', right: 'red' },
  { left: 'green', right: 'green' },
  { left: 'white', right: 'white' },
  { left: 'green', right: 'red' },
  { left: 'red', right: 'green' },
];

// Types for test answers and results
interface LanternAnswer {
  pairIndex: number;
  correctLeft: string;
  correctRight: string;
  userLeft: string;
  userRight: string;
  isCorrect: boolean;
  responseTime: number;
}

interface LanternTestResults {
  totalCorrect: number;
  totalQuestions: number;
  accuracy: number;
  redGreenAccuracy: number;
  passedTest: boolean;
  occupationalFitness: 'FIT' | 'UNFIT';
  answers: LanternAnswer[];
  avgResponseTime: number;
}

// Test Instructions Component
function TestInstructions({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 max-w-3xl mx-auto"
    >
      <h2 className="text-3xl font-bold text-white text-center">Farnsworth Lantern Test (FALANT)</h2>
      
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="text-xl font-semibold text-white">Test Instructions</h3>
        
        <div className="space-y-3 text-gray-300">
          <p>
            This test simulates the professional FALANT color vision test used for occupational qualification.
          </p>
          
          <ol className="list-decimal pl-5 space-y-2">
            <li>You will be shown 11 pairs of colored lights (red, green, or white).</li>
            <li>Each pair will appear for only <strong>2 seconds</strong>, then disappear.</li>
            <li>Identify the color of <strong>both</strong> the left and right lights.</li>
            <li>Select your answers from the color buttons that appear.</li>
            <li>You must answer all questions to complete the test.</li>
          </ol>
          
          <p className="pt-2">
            <strong>Passing criteria:</strong> At least 9 correct answers (82%) AND 100% accuracy on red-green pairs.
          </p>
        </div>
        
        <div className="pt-4 flex justify-center">
          <Button
            onClick={onStart}
            size="lg"
            className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white px-8 py-6"
          >
            <Lightbulb className="w-5 h-5 mr-2" />
            Begin Test
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Light Pair Component
function LightPair({ leftColor, rightColor }: { leftColor: string; rightColor: string }) {
  return (
    <div className="flex items-center justify-center space-x-20">
      <div 
        className="w-[40px] h-[40px] rounded-full" 
        style={{ 
          backgroundColor: colorMap[leftColor as keyof typeof colorMap],
          boxShadow: `0 0 20px ${colorMap[leftColor as keyof typeof colorMap]}, 0 0 40px ${colorMap[leftColor as keyof typeof colorMap]}, 0 0 60px ${colorMap[leftColor as keyof typeof colorMap]}`
        }}
      />
      <div 
        className="w-[40px] h-[40px] rounded-full" 
        style={{ 
          backgroundColor: colorMap[rightColor as keyof typeof colorMap],
          boxShadow: `0 0 20px ${colorMap[rightColor as keyof typeof colorMap]}, 0 0 40px ${colorMap[rightColor as keyof typeof colorMap]}, 0 0 60px ${colorMap[rightColor as keyof typeof colorMap]}`
        }}
      />
    </div>
  );
}

// Color Buttons Component
function ColorButtons({ 
  onSelectLeft, 
  onSelectRight,
  selectedLeft,
  selectedRight
}: { 
  onSelectLeft: (color: string) => void; 
  onSelectRight: (color: string) => void;
  selectedLeft: string | null;
  selectedRight: string | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-8 mt-12">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white text-center">Left Light</h3>
        <div className="flex flex-col space-y-3">
          {Object.entries(colorMap).map(([color, hex]) => (
            <Button
              key={`left-${color}`}
              onClick={() => onSelectLeft(color)}
              className={`h-12 ${selectedLeft === color ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}
              style={{ 
                backgroundColor: hex,
                color: color === 'white' ? 'black' : 'white'
              }}
            >
              {color.charAt(0).toUpperCase() + color.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white text-center">Right Light</h3>
        <div className="flex flex-col space-y-3">
          {Object.entries(colorMap).map(([color, hex]) => (
            <Button
              key={`right-${color}`}
              onClick={() => onSelectRight(color)}
              className={`h-12 ${selectedRight === color ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}
              style={{ 
                backgroundColor: hex,
                color: color === 'white' ? 'black' : 'white'
              }}
            >
              {color.charAt(0).toUpperCase() + color.slice(1)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Progress Indicator Component
function ProgressIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-between glass rounded-xl p-4 mt-6">
      <div className="flex items-center space-x-4">
        <span className="text-white font-semibold">
          Pair {current + 1} of {total}
        </span>
        <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-600"
            style={{ width: `${((current + 1) / total) * 100}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${((current + 1) / total) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}

// Test Results Component
function TestResults({ 
  results, 
  onRetake,
  onDownloadPdf 
}: { 
  results: LanternTestResults; 
  onRetake: () => void;
  onDownloadPdf: () => void;
}) {
  const ResultIcon = results.passedTest ? CheckCircle : AlertTriangle;
  const resultColor = results.passedTest ? 'from-green-500 to-emerald-600' : 'from-yellow-500 to-orange-600';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="space-y-8 max-w-3xl mx-auto"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="space-y-6"
      >
        <div
          className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-r ${resultColor} flex items-center justify-center`}
        >
          <ResultIcon className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white text-center">Test Complete!</h1>

        <div className="glass rounded-2xl p-8 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">
            <span className={`bg-gradient-to-r ${resultColor} bg-clip-text text-transparent`}>
              {results.passedTest ? 'PASSED' : 'NOT PASSED'}
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{results.totalCorrect}/{results.totalQuestions}</div>
              <div className="text-sm text-gray-400">Total Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{Math.round(results.accuracy)}%</div>
              <div className="text-sm text-gray-400">Accuracy</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{Math.round(results.redGreenAccuracy)}%</div>
              <div className="text-sm text-gray-400">Red-Green Accuracy</div>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-lg border glass">
            <h3 className="text-xl font-semibold text-white mb-2">Occupational Fitness</h3>
            <div className={`text-2xl font-bold ${results.occupationalFitness === 'FIT' ? 'text-green-400' : 'text-orange-400'}`}>
              {results.occupationalFitness}
            </div>
            <p className="text-gray-300 text-sm mt-2">
              {results.occupationalFitness === 'FIT' 
                ? 'You meet the color vision requirements for occupations requiring normal color discrimination.'
                : 'You may have limitations for occupations requiring precise color discrimination. Professional evaluation is recommended.'}
            </p>
          </div>

          <div className="text-gray-300 space-y-4">
            <h3 className="text-xl font-semibold text-white">Assessment</h3>
            <p>
              {results.passedTest
                ? 'You have successfully passed the Farnsworth Lantern Test (FALANT) with sufficient accuracy, particularly in red-green color discrimination.'
                : results.redGreenAccuracy < 100
                  ? 'You did not pass the test due to insufficient red-green color discrimination, which is critical for certain occupations.'
                  : 'You did not achieve the minimum required overall score of 82% (9/11 correct answers).'
              }
            </p>
            
            <div className="pt-4">
              <h3 className="text-xl font-semibold text-white mb-2">Important Notice</h3>
              <p className="text-sm italic">
                This is a screening test only. For a definitive diagnosis of color vision deficiency, please consult with an eye care professional.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onRetake}
            size="lg"
            className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-lg px-8 py-6 rounded-xl group"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Take Test Again
          </Button>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onDownloadPdf}
            size="lg"
            className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6 rounded-xl group"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Report
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Main Lantern Test Component
export function LanternTest({ onFinish }: { onFinish: () => void }) {
  // Test state
  const [testState, setTestState] = useState<'instructions' | 'testing' | 'results'>('instructions');
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [showLights, setShowLights] = useState(false);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [answers, setAnswers] = useState<LanternAnswer[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [results, setResults] = useState<LanternTestResults | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  
  const resultsRef = useRef<HTMLDivElement>(null);

  // Start the test
  const startTest = () => {
    setTestState('testing');
    setCurrentPairIndex(0);
    setAnswers([]);
    showNextPair();
  };

  // Show the next pair of lights
  const showNextPair = () => {
    setSelectedLeft(null);
    setSelectedRight(null);
    setShowLights(true);
    setStartTime(Date.now());
    
    // Hide the lights after 2 seconds
    setTimeout(() => {
      setShowLights(false);
    }, 2000);
  };

  // Handle answer submission
  const handleSubmitAnswer = () => {
    if (!selectedLeft || !selectedRight) return;
    
    const currentPair = testSequence[currentPairIndex];
    const responseTime = (Date.now() - startTime) / 1000;
    
    // Record the answer
    const answer: LanternAnswer = {
      pairIndex: currentPairIndex,
      correctLeft: currentPair.left,
      correctRight: currentPair.right,
      userLeft: selectedLeft,
      userRight: selectedRight,
      isCorrect: selectedLeft === currentPair.left && selectedRight === currentPair.right,
      responseTime
    };
    
    setAnswers(prev => [...prev, answer]);
    
    // Move to next pair or finish test
    if (currentPairIndex < testSequence.length - 1) {
      setCurrentPairIndex(prev => prev + 1);
      showNextPair();
    } else {
      // Calculate results
      const allAnswers = [...answers, answer];
      calculateResults(allAnswers);
    }
  };

  // Calculate test results
  const calculateResults = (allAnswers: LanternAnswer[]) => {
    const totalCorrect = allAnswers.filter(a => a.isCorrect).length;
    const accuracy = (totalCorrect / testSequence.length) * 100;
    
    // Calculate red-green accuracy specifically
    const redGreenPairs = allAnswers.filter(a => 
      (a.correctLeft === 'red' && a.correctRight === 'green') ||
      (a.correctLeft === 'green' && a.correctRight === 'red') ||
      (a.correctLeft === 'red' && a.correctRight === 'red') ||
      (a.correctLeft === 'green' && a.correctRight === 'green')
    );
    
    const correctRedGreenPairs = redGreenPairs.filter(a => a.isCorrect);
    const redGreenAccuracy = redGreenPairs.length > 0 
      ? (correctRedGreenPairs.length / redGreenPairs.length) * 100 
      : 0;
    
    // Determine if passed (≥82% overall AND 100% red-green accuracy)
    const passedTest = accuracy >= 82 && redGreenAccuracy === 100;
    
    const testResults: LanternTestResults = {
      totalCorrect,
      totalQuestions: testSequence.length,
      accuracy,
      redGreenAccuracy,
      passedTest,
      occupationalFitness: passedTest ? 'FIT' : 'UNFIT',
      answers: allAnswers,
      avgResponseTime: allAnswers.reduce((acc, a) => acc + a.responseTime, 0) / allAnswers.length
    };
    
    setResults(testResults);
    setTestState('results');
  };

  // Generate and download PDF report
  const downloadPdf = async () => {
    if (!results || !resultsRef.current) return;
    
    setDownloadingPdf(true);
    
    try {
      const canvas = await html2canvas(resultsRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#111827'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Farnsworth Lantern Test (FALANT) Results', 105, 20, { align: 'center' });
      
      // Add date
      pdf.setFontSize(12);
      pdf.text(`Test Date: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
      
      // Add results image
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 40, imgWidth, imgHeight);
      
      // Add disclaimer
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Disclaimer: This is a screening test only. Professional evaluation by an eye care specialist is recommended.', 
        105, 40 + imgHeight + 10, { align: 'center' });
      
      // Save the PDF
      pdf.save('lantern-test-results.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 bg-black">
      <AnimatePresence mode="wait">
        {testState === 'instructions' && (
          <TestInstructions onStart={startTest} key="instructions" />
        )}
        
        {testState === 'testing' && (
          <motion.div
            key="testing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto space-y-8"
          >
            <h2 className="text-2xl font-bold text-white text-center">
              {showLights ? 'Observe the lights' : 'Select the colors you saw'}
            </h2>
            
            <div className="glass rounded-2xl p-8 h-[300px] flex items-center justify-center">
              {showLights ? (
                <LightPair 
                  leftColor={testSequence[currentPairIndex].left} 
                  rightColor={testSequence[currentPairIndex].right} 
                />
              ) : (
                <div className="text-center text-gray-400">
                  <p>The lights were shown for 2 seconds.</p>
                  <p>Please select the colors you observed below.</p>
                </div>
              )}
            </div>
            
            {!showLights && (
              <>
                <ColorButtons 
                  onSelectLeft={setSelectedLeft}
                  onSelectRight={setSelectedRight}
                  selectedLeft={selectedLeft}
                  selectedRight={selectedRight}
                />
                
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedLeft || !selectedRight}
                    size="lg"
                    className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white px-8 py-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Answer & Continue
                  </Button>
                </div>
              </>
            )}
            
            <ProgressIndicator current={currentPairIndex} total={testSequence.length} />
          </motion.div>
        )}
        
        {testState === 'results' && results && (
          <div ref={resultsRef}>
            <TestResults 
              results={results} 
              onRetake={startTest}
              onDownloadPdf={downloadPdf}
            />
          </div>
        )}
      </AnimatePresence>
      
      {/* Back button */}
      <div className="mt-8 text-center">
        <Button
          onClick={onFinish}
          variant="outline"
          className="border-gray-600 text-gray-400 hover:text-white"
        >
          Return to Test Selection
        </Button>
      </div>
      
      {/* PDF download overlay */}
      {downloadingPdf && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
            <p className="text-white">Generating PDF report...</p>
          </div>
        </div>
      )}
    </div>
  );
}