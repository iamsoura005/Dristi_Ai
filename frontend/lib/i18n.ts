/**
 * Internationalization (i18n) Configuration
 * Supports 10 Indian languages plus English
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import en from '../locales/en/common.json'
import hi from '../locales/hi/common.json'
import bn from '../locales/bn/common.json'
import te from '../locales/te/common.json'
import mr from '../locales/mr/common.json'
import ta from '../locales/ta/common.json'
import gu from '../locales/gu/common.json'
import kn from '../locales/kn/common.json'
import ml from '../locales/ml/common.json'
import or from '../locales/or/common.json'
import pa from '../locales/pa/common.json'

// Language configuration
export const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' }
]

// Resources object
const resources = {
  en: { common: en },
  hi: { common: hi },
  bn: { common: bn },
  te: { common: te },
  mr: { common: mr },
  ta: { common: ta },
  gu: { common: gu },
  kn: { common: kn },
  ml: { common: ml },
  or: { common: or },
  pa: { common: pa }
}

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // React options
    react: {
      useSuspense: false,
    },
    
    // Debug mode (disable in production)
    debug: process.env.NODE_ENV === 'development',
  })

export default i18n

// Helper functions
export const getCurrentLanguage = () => i18n.language || 'en'

export const changeLanguage = (lng: string) => {
  return i18n.changeLanguage(lng)
}

export const isRTL = (lng?: string) => {
  const language = lng || getCurrentLanguage()
  // Add RTL languages if needed (none of the Indian languages are RTL)
  return false
}

export const getLanguageName = (code: string) => {
  const language = languages.find(lang => lang.code === code)
  return language ? language.nativeName : code
}

// Medical terminology helper
export const getMedicalTerm = (term: string, language?: string) => {
  const lng = language || getCurrentLanguage()
  
  // Medical terminology mapping for different languages
  const medicalTerms: Record<string, Record<string, string>> = {
    en: {
      'diabetic_retinopathy': 'Diabetic Retinopathy',
      'glaucoma': 'Glaucoma',
      'cataract': 'Cataract',
      'normal': 'Normal/Healthy',
      'age_related_macular_degeneration': 'Age-Related Macular Degeneration',
      'hypertensive_retinopathy': 'Hypertensive Retinopathy'
    },
    hi: {
      'diabetic_retinopathy': 'मधुमेह संबंधी रेटिनोपैथी',
      'glaucoma': 'ग्लूकोमा',
      'cataract': 'मोतियाबिंद',
      'normal': 'सामान्य/स्वस्थ',
      'age_related_macular_degeneration': 'उम्र संबंधी मैक्यूलर डिजेनेरेशन',
      'hypertensive_retinopathy': 'उच्च रक्तचाप संबंधी रेटिनोपैथी'
    },
    bn: {
      'diabetic_retinopathy': 'ডায়াবেটিক রেটিনোপ্যাথি',
      'glaucoma': 'গ্লুকোমা',
      'cataract': 'ছানি',
      'normal': 'স্বাভাবিক/সুস্থ',
      'age_related_macular_degeneration': 'বয়স সম্পর্কিত ম্যাকুলার ডিজেনারেশন',
      'hypertensive_retinopathy': 'উচ্চ রক্তচাপ সম্পর্কিত রেটিনোপ্যাথি'
    },
    te: {
      'diabetic_retinopathy': 'డయాబెటిక్ రెటినోపతి',
      'glaucoma': 'గ్లాకోమా',
      'cataract': 'కంటిశుక్లం',
      'normal': 'సాధారణ/ఆరోగ్యకరమైన',
      'age_related_macular_degeneration': 'వయస్సు సంబంధిత మాక్యులర్ డిజెనరేషన్',
      'hypertensive_retinopathy': 'హైపర్టెన్సివ్ రెటినోపతి'
    },
    mr: {
      'diabetic_retinopathy': 'मधुमेहजन्य रेटिनोपॅथी',
      'glaucoma': 'काळा पाणी',
      'cataract': 'मोतीबिंदू',
      'normal': 'सामान्य/निरोगी',
      'age_related_macular_degeneration': 'वयोसंबंधी मॅक्युलर डिजेनेरेशन',
      'hypertensive_retinopathy': 'उच्च रक्तदाब संबंधी रेटिनोपॅथी'
    },
    ta: {
      'diabetic_retinopathy': 'நீரிழிவு விழித்திரை நோய்',
      'glaucoma': 'கண்புரை',
      'cataract': 'கண்ணில் படலம்',
      'normal': 'சாதாரண/ஆரோக்கியமான',
      'age_related_macular_degeneration': 'வயது தொடர்பான மாக்குலர் சிதைவு',
      'hypertensive_retinopathy': 'உயர் இரத்த அழுத்த விழித்திரை நோய்'
    }
  }
  
  return medicalTerms[lng]?.[term] || medicalTerms['en'][term] || term
}

// Number formatting for different locales
export const formatNumber = (number: number, language?: string) => {
  const lng = language || getCurrentLanguage()
  
  // Locale mapping for number formatting
  const localeMap: Record<string, string> = {
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
  
  const locale = localeMap[lng] || 'en-US'
  return new Intl.NumberFormat(locale).format(number)
}

// Date formatting for different locales
export const formatDate = (date: Date | string, language?: string) => {
  const lng = language || getCurrentLanguage()
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const localeMap: Record<string, string> = {
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
  
  const locale = localeMap[lng] || 'en-US'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj)
}

// Currency formatting (Indian Rupees)
export const formatCurrency = (amount: number, language?: string) => {
  const lng = language || getCurrentLanguage()
  
  const localeMap: Record<string, string> = {
    'en': 'en-IN',
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
  
  const locale = localeMap[lng] || 'en-IN'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR'
  }).format(amount)
}
