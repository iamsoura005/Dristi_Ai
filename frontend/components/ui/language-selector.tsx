"use client"

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './button'
import { Card, CardContent } from './card'
import { Badge } from './badge'
import { languages, changeLanguage, getCurrentLanguage } from '../../lib/i18n'
import { Globe, Check, ChevronDown } from 'lucide-react'

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'grid' | 'compact'
  showNativeNames?: boolean
  className?: string
}

export function LanguageSelector({ 
  variant = 'dropdown', 
  showNativeNames = true,
  className = '' 
}: LanguageSelectorProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const currentLang = getCurrentLanguage()

  const handleLanguageChange = async (langCode: string) => {
    if (langCode === currentLang) return
    
    setIsChanging(true)
    try {
      await changeLanguage(langCode)
      setIsOpen(false)
      
      // Save to user preferences if logged in
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          await fetch('/api/user/preferences', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ preferred_language: langCode })
          })
        }
      } catch (error) {
        console.log('Could not save language preference:', error)
      }
    } catch (error) {
      console.error('Failed to change language:', error)
    } finally {
      setIsChanging(false)
    }
  }

  const currentLanguage = languages.find(lang => lang.code === currentLang)

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isChanging}
          className="flex items-center gap-2"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {showNativeNames ? currentLanguage?.nativeName : currentLanguage?.name}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
        
        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
            <div className="py-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  disabled={isChanging}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{language.nativeName}</div>
                    <div className="text-xs text-gray-500">{language.name}</div>
                  </div>
                  {language.code === currentLang && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'grid') {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{t('settings.change_language')}</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                disabled={isChanging}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  language.code === currentLang
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{language.nativeName}</div>
                    <div className="text-xs text-gray-500">{language.name}</div>
                  </div>
                  {language.code === currentLang && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {t('settings.current_language')}: {currentLanguage?.nativeName}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className="flex items-center gap-2 min-w-[200px] justify-between"
      >
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span>
            {showNativeNames ? currentLanguage?.nativeName : currentLanguage?.name}
          </span>
        </div>
        <ChevronDown className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                disabled={isChanging}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{language.nativeName}</div>
                  <div className="text-sm text-gray-500">{language.name}</div>
                </div>
                {language.code === currentLang && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Voice command integration for language switching
export function useVoiceLanguageCommands() {
  const { t } = useTranslation()
  
  const voiceCommands = {
    'switch to english': () => changeLanguage('en'),
    'switch to hindi': () => changeLanguage('hi'),
    'switch to bengali': () => changeLanguage('bn'),
    'switch to telugu': () => changeLanguage('te'),
    'switch to marathi': () => changeLanguage('mr'),
    'switch to tamil': () => changeLanguage('ta'),
    'switch to gujarati': () => changeLanguage('gu'),
    'switch to kannada': () => changeLanguage('kn'),
    'switch to malayalam': () => changeLanguage('ml'),
    'switch to odia': () => changeLanguage('or'),
    'switch to punjabi': () => changeLanguage('pa'),
    
    // Hindi voice commands
    'अंग्रेजी में बदलें': () => changeLanguage('en'),
    'हिंदी में बदलें': () => changeLanguage('hi'),
    'बंगाली में बदलें': () => changeLanguage('bn'),
    'तेलुगु में बदलें': () => changeLanguage('te'),
    'मराठी में बदलें': () => changeLanguage('mr'),
    'तमिल में बदलें': () => changeLanguage('ta'),
    'गुजराती में बदलें': () => changeLanguage('gu'),
    'कन्नड़ में बदलें': () => changeLanguage('kn'),
    'मलयालम में बदलें': () => changeLanguage('ml'),
    'ओड़िया में बदलें': () => changeLanguage('or'),
    'पंजाबी में बदलें': () => changeLanguage('pa')
  }
  
  return voiceCommands
}

// Language detection based on user's location or browser
export function useLanguageDetection() {
  const detectLanguageFromLocation = async () => {
    try {
      // Try to get user's location
      if (navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                // Use reverse geocoding to detect region
                const response = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
                )
                const data = await response.json()
                
                // Map regions to languages
                const regionLanguageMap: Record<string, string> = {
                  'West Bengal': 'bn',
                  'Odisha': 'or',
                  'Andhra Pradesh': 'te',
                  'Telangana': 'te',
                  'Tamil Nadu': 'ta',
                  'Karnataka': 'kn',
                  'Kerala': 'ml',
                  'Gujarat': 'gu',
                  'Maharashtra': 'mr',
                  'Punjab': 'pa'
                }
                
                const detectedLang = regionLanguageMap[data.principalSubdivision] || 'hi'
                resolve(detectedLang)
              } catch (error) {
                resolve('hi') // Default to Hindi for India
              }
            },
            () => resolve('hi') // Default to Hindi if location access denied
          )
        })
      }
      
      // Fallback to browser language
      const browserLang = navigator.language.split('-')[0]
      const supportedLangs = languages.map(l => l.code)
      return supportedLangs.includes(browserLang) ? browserLang : 'hi'
      
    } catch (error) {
      return 'hi' // Default to Hindi
    }
  }
  
  return { detectLanguageFromLocation }
}
