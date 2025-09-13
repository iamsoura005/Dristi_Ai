"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EyeBlinkingLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  message?: string;
  showMessage?: boolean;
  className?: string;
}

export default function EyeBlinkingLoader({ 
  size = "md", 
  message = "Analyzing...", 
  showMessage = true,
  className = ""
}: EyeBlinkingLoaderProps) {
  const [isBlinking, setIsBlinking] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: { width: 60, height: 40, pupilSize: 12 },
    md: { width: 80, height: 50, pupilSize: 16 },
    lg: { width: 120, height: 75, pupilSize: 24 },
    xl: { width: 160, height: 100, pupilSize: 32 }
  };

  const { width, height, pupilSize } = sizeConfig[size];

  // Blinking animation effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 2000 + Math.random() * 1000); // Random blink interval between 2-3 seconds

    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* 3D Eye Container */}
      <div 
        className="relative"
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          perspective: "1000px"
        }}
      >
        {/* Eye Socket/Background */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-100 to-red-200 shadow-inner"
          style={{
            background: "radial-gradient(ellipse at center, #fef7f7 0%, #fde2e2 50%, #fca5a5 100%)",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.15)"
          }}
          animate={{
            rotateX: isBlinking ? 85 : 0,
            scaleY: isBlinking ? 0.1 : 1,
          }}
          transition={{
            duration: 0.15,
            ease: "easeInOut"
          }}
        />

        {/* Iris */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: `${pupilSize * 2}px`,
            height: `${pupilSize * 2}px`,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle at 30% 30%, #60a5fa 0%, #3b82f6 30%, #1e40af  70%, #1e3a8a 100%)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
          }}
          animate={{
            scale: isBlinking ? 0.1 : 1,
            opacity: isBlinking ? 0.3 : 1,
          }}
          transition={{
            duration: 0.15,
            ease: "easeInOut"
          }}
        >
          {/* Pupil */}
          <motion.div
            className="absolute rounded-full bg-black"
            style={{
              width: `${pupilSize}px`,
              height: `${pupilSize}px`,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
            animate={{
              scale: isBlinking ? 0 : 1,
            }}
            transition={{
              duration: 0.15,
              ease: "easeInOut"
            }}
          />

          {/* Light Reflection */}
          <motion.div
            className="absolute rounded-full bg-white"
            style={{
              width: `${pupilSize * 0.3}px`,
              height: `${pupilSize * 0.3}px`,
              left: "30%",
              top: "25%",
              opacity: 0.8
            }}
            animate={{
              scale: isBlinking ? 0 : 1,
              opacity: isBlinking ? 0 : 0.8,
            }}
            transition={{
              duration: 0.15,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Upper Eyelid */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(to bottom, #f3f4f6 0%, #e5e7eb 50%, transparent 50%)",
            clipPath: "ellipse(100% 50% at 50% 0%)",
          }}
          animate={{
            scaleY: isBlinking ? 2 : 0.1,
            y: isBlinking ? 0 : -height * 0.4,
          }}
          transition={{
            duration: 0.15,
            ease: "easeInOut"
          }}
        />

        {/* Lower Eyelid */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(to top, #f3f4f6 0%, #e5e7eb 50%, transparent 50%)",
            clipPath: "ellipse(100% 50% at 50% 100%)",
          }}
          animate={{
            scaleY: isBlinking ? 2 : 0.1,
            y: isBlinking ? 0 : height * 0.4,
          }}
          transition={{
            duration: 0.15,
            ease: "easeInOut"
          }}
        />

        {/* Eyelashes */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-gray-800"
              style={{
                width: "1px",
                height: `${height * 0.15}px`,
                left: `${20 + (i * 60 / 7)}%`,
                top: "-8%",
                transformOrigin: "bottom center",
                transform: `rotate(${-30 + (i * 60 / 7)}deg)`,
              }}
              animate={{
                scaleY: isBlinking ? 0.5 : 1,
                rotate: isBlinking ? 0 : -30 + (i * 60 / 7),
              }}
              transition={{
                duration: 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>

      {/* Loading Message */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <motion.p
              className="text-white font-medium"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {message}
            </motion.p>
            
            {/* Loading Dots */}
            <div className="flex justify-center space-x-1 mt-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-blue-400 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Export different size variants for convenience
export const SmallEyeLoader = (props: Omit<EyeBlinkingLoaderProps, 'size'>) => (
  <EyeBlinkingLoader {...props} size="sm" />
);

export const MediumEyeLoader = (props: Omit<EyeBlinkingLoaderProps, 'size'>) => (
  <EyeBlinkingLoader {...props} size="md" />
);

export const LargeEyeLoader = (props: Omit<EyeBlinkingLoaderProps, 'size'>) => (
  <EyeBlinkingLoader {...props} size="lg" />
);

export const ExtraLargeEyeLoader = (props: Omit<EyeBlinkingLoaderProps, 'size'>) => (
  <EyeBlinkingLoader {...props} size="xl" />
);
