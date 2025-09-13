"use client"

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { LanguageSelector } from '../../components/ui/language-selector'
import { VoiceAssistant } from '../../components/ui/voice-assistant'
import { DoctorFinder } from '../../components/ui/doctor-finder'
import { FamilyManager } from '../../components/ui/family-manager'
import { 
  Eye, 
  Users, 
  MapPin, 
  Mic, 
  Globe, 
  Brain,
  Stethoscope,
  Heart,
  Activity,
  Shield,
  Smartphone,
  CheckCircle,
  Star,
  TrendingUp,
  Calendar,
  MessageCircle,
  Camera,
  BarChart3
} from 'lucide-react'

export default function FeaturesShowcase() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('ai-detection')

  const features = [
    {
      id: 'ai-detection',
      title: 'AI Eye Disease Detection',
      icon: <Eye className="h-6 w-6" />,
      description: 'Advanced AI-powered analysis for early detection of eye diseases',
      highlights: [
        'TensorFlow-based deep learning models',
        'Detects 6+ common eye conditions',
        'Confidence scoring and recommendations',
        'Analysis history tracking',
        'Detailed medical explanations'
      ]
    },
    {
      id: 'doctor-finder',
      title: 'Nearby Doctor & Hospital Finder',
      icon: <MapPin className="h-6 w-6" />,
      description: 'Find qualified eye specialists and hospitals in your area',
      highlights: [
        'Location-based search with Google Maps',
        'Filter by specialty and distance',
        'Doctor profiles with ratings',
        'Real-time availability',
        'Driving directions integration'
      ]
    },
    {
      id: 'family-tracking',
      title: 'Family Eye Health Tracking',
      icon: <Users className="h-6 w-6" />,
      description: 'Manage eye health for your entire family',
      highlights: [
        'Add unlimited family members',
        'Individual health profiles',
        'Shared family dashboard',
        'Age-appropriate interfaces',
        'Collective appointment scheduling'
      ]
    },
    {
      id: 'voice-assistant',
      title: 'Voice Assistant Integration',
      icon: <Mic className="h-6 w-6" />,
      description: 'Hands-free navigation and voice commands',
      highlights: [
        'Multilingual voice recognition',
        'Natural language commands',
        'Accessibility features',
        'Voice-guided tests',
        'Audio result narration'
      ]
    },
    {
      id: 'multi-language',
      title: 'Native Indian Language Support',
      icon: <Globe className="h-6 w-6" />,
      description: 'Complete interface in 10+ Indian languages',
      highlights: [
        'Hindi, Bengali, Telugu, Tamil, Marathi',
        'Gujarati, Kannada, Malayalam, Odia, Punjabi',
        'Medical terminology translation',
        'Cultural adaptation',
        'RTL support where applicable'
      ]
    },
    {
      id: 'consultations',
      title: 'Direct Doctor Consultation',
      icon: <Stethoscope className="h-6 w-6" />,
      description: 'Book and manage appointments with eye specialists',
      highlights: [
        'Online video consultations',
        'In-person appointment booking',
        'Secure messaging with doctors',
        'Prescription management',
        'Consultation history'
      ]
    }
  ]

  const statistics = [
    { label: 'Accuracy Rate', value: '94.5%', icon: <TrendingUp className="h-5 w-5" /> },
    { label: 'Languages Supported', value: '11', icon: <Globe className="h-5 w-5" /> },
    { label: 'Eye Conditions Detected', value: '6+', icon: <Eye className="h-5 w-5" /> },
    { label: 'Voice Commands', value: '20+', icon: <Mic className="h-5 w-5" /> }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Eye className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Dristi AI Features
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Comprehensive eye health management with cutting-edge AI technology, 
            multi-language support, and family-centered care.
          </p>
          
          <div className="flex justify-center mt-6">
            <LanguageSelector variant="dropdown" />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {statistics.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-2">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-12">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            {features.map((feature) => (
              <TabsTrigger key={feature.id} value={feature.id} className="text-xs">
                <div className="flex items-center gap-1">
                  {feature.icon}
                  <span className="hidden sm:inline">{feature.title.split(' ')[0]}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {features.map((feature) => (
            <TabsContent key={feature.id} value={feature.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {feature.icon}
                    {feature.title}
                  </CardTitle>
                  <p className="text-gray-600">{feature.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Key Features:</h4>
                      <ul className="space-y-2">
                        {feature.highlights.map((highlight, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      {feature.id === 'ai-detection' && (
                        <div className="text-center">
                          <Brain className="h-16 w-16 mx-auto text-blue-600 mb-4" />
                          <p className="text-sm text-gray-600">
                            Upload an eye image to experience our AI analysis
                          </p>
                          <Button className="mt-3">
                            <Camera className="h-4 w-4 mr-2" />
                            Try AI Analysis
                          </Button>
                        </div>
                      )}
                      
                      {feature.id === 'doctor-finder' && (
                        <div className="text-center">
                          <MapPin className="h-16 w-16 mx-auto text-green-600 mb-4" />
                          <p className="text-sm text-gray-600">
                            Find qualified eye specialists near you
                          </p>
                          <Button className="mt-3">
                            <MapPin className="h-4 w-4 mr-2" />
                            Find Doctors
                          </Button>
                        </div>
                      )}
                      
                      {feature.id === 'family-tracking' && (
                        <div className="text-center">
                          <Users className="h-16 w-16 mx-auto text-purple-600 mb-4" />
                          <p className="text-sm text-gray-600">
                            Manage health for your entire family
                          </p>
                          <Button className="mt-3">
                            <Users className="h-4 w-4 mr-2" />
                            Add Family
                          </Button>
                        </div>
                      )}
                      
                      {feature.id === 'voice-assistant' && (
                        <div className="text-center">
                          <Mic className="h-16 w-16 mx-auto text-red-600 mb-4" />
                          <p className="text-sm text-gray-600">
                            Try voice commands in your language
                          </p>
                          <Button className="mt-3">
                            <Mic className="h-4 w-4 mr-2" />
                            Start Voice
                          </Button>
                        </div>
                      )}
                      
                      {feature.id === 'multi-language' && (
                        <div className="text-center">
                          <Globe className="h-16 w-16 mx-auto text-indigo-600 mb-4" />
                          <p className="text-sm text-gray-600">
                            Switch between 11 supported languages
                          </p>
                          <LanguageSelector variant="grid" className="mt-3" />
                        </div>
                      )}
                      
                      {feature.id === 'consultations' && (
                        <div className="text-center">
                          <Calendar className="h-16 w-16 mx-auto text-orange-600 mb-4" />
                          <p className="text-sm text-gray-600">
                            Book appointments with verified doctors
                          </p>
                          <Button className="mt-3">
                            <Calendar className="h-4 w-4 mr-2" />
                            Book Now
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Live Demos */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Doctor Finder Demo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Live Doctor Finder Demo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DoctorFinder showBookingButton={false} />
            </CardContent>
          </Card>

          {/* Family Manager Demo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Family Management Demo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FamilyManager showHealthSummary={false} />
            </CardContent>
          </Card>
        </div>

        {/* Voice Assistant Demo */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Assistant Demo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VoiceAssistant />
          </CardContent>
        </Card>

        {/* Technology Stack */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Technology Stack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Frontend</h4>
                <div className="space-y-2">
                  <Badge variant="outline">Next.js 14</Badge>
                  <Badge variant="outline">React 19</Badge>
                  <Badge variant="outline">TypeScript</Badge>
                  <Badge variant="outline">Tailwind CSS</Badge>
                  <Badge variant="outline">i18next</Badge>
                  <Badge variant="outline">Framer Motion</Badge>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Backend</h4>
                <div className="space-y-2">
                  <Badge variant="outline">Python Flask</Badge>
                  <Badge variant="outline">TensorFlow 2.20</Badge>
                  <Badge variant="outline">SQLAlchemy</Badge>
                  <Badge variant="outline">JWT Auth</Badge>
                  <Badge variant="outline">Google Maps API</Badge>
                  <Badge variant="outline">OpenCV</Badge>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">AI & Services</h4>
                <div className="space-y-2">
                  <Badge variant="outline">Deep Learning</Badge>
                  <Badge variant="outline">Computer Vision</Badge>
                  <Badge variant="outline">Web Speech API</Badge>
                  <Badge variant="outline">Geolocation</Badge>
                  <Badge variant="outline">Real-time Analysis</Badge>
                  <Badge variant="outline">Multi-language NLP</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
