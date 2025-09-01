"use client"

import { createContext, useContext, useEffect, useState } from "react"

type AccessibilitySettings = {
  highContrast: boolean
  largeText: boolean
  reduceMotion: boolean
  screenReader: boolean
}

type AccessibilityContextType = {
  settings: AccessibilitySettings
  toggleHighContrast: () => void
  toggleLargeText: () => void
  toggleReduceMotion: () => void
  announceToScreenReader: (message: string) => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    screenReader: false,
  })

  useEffect(() => {
    // Load saved accessibility preferences
    const saved = localStorage.getItem('hackloop-accessibility')
    if (saved) {
      setSettings(JSON.parse(saved))
    }

    // Detect screen reader
    const hasScreenReader = window.navigator.userAgent.includes('NVDA') || 
                           window.navigator.userAgent.includes('JAWS') || 
                           !!window.speechSynthesis
    
    setSettings(prev => ({ ...prev, screenReader: hasScreenReader }))
  }, [])

  useEffect(() => {
    // Apply accessibility settings to document
    const root = document.documentElement
    
    if (settings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    if (settings.largeText) {
      root.classList.add('large-text')
    } else {
      root.classList.remove('large-text')
    }

    // Save settings
    localStorage.setItem('hackloop-accessibility', JSON.stringify(settings))
  }, [settings])

  const toggleHighContrast = () => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }))
  }

  const toggleLargeText = () => {
    setSettings(prev => ({ ...prev, largeText: !prev.largeText }))
  }

  const toggleReduceMotion = () => {
    setSettings(prev => ({ ...prev, reduceMotion: !prev.reduceMotion }))
  }

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  return (
    <AccessibilityContext.Provider value={{
      settings,
      toggleHighContrast,
      toggleLargeText,
      toggleReduceMotion,
      announceToScreenReader
    }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}