"use client"

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Input } from './input'
import { Textarea } from './textarea'
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  MessageCircle
} from 'lucide-react'

interface Doctor {
  id: number
  name: string
  specialization: string
  experience_years: number
  consultation_fee: number
  rating: number
  image_url?: string
}

interface TimeSlot {
  time: string
  datetime: string
  available: boolean
}

interface AppointmentBookingProps {
  doctor: Doctor
  onBookingComplete?: (appointment: any) => void
  onCancel?: () => void
  className?: string
}

export function AppointmentBooking({ 
  doctor, 
  onBookingComplete, 
  onCancel,
  className = '' 
}: AppointmentBookingProps) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  const [appointmentData, setAppointmentData] = useState({
    appointment_type: 'video_call',
    reason: '',
    symptoms: '',
    family_member_id: null,
    duration: 30
  })

  const appointmentTypes = [
    { value: 'video_call', label: 'Video Consultation', icon: <Video className="h-4 w-4" />, description: 'Online video call' },
    { value: 'in_person', label: 'In-Person Visit', icon: <MapPin className="h-4 w-4" />, description: 'Visit clinic' },
    { value: 'phone_call', label: 'Phone Call', icon: <Phone className="h-4 w-4" />, description: 'Voice call only' }
  ]

  // Generate next 14 days for date selection
  const getAvailableDates = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      // Skip Sundays (assuming doctors don't work on Sundays)
      if (date.getDay() !== 0) {
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }),
          fullDate: date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        })
      }
    }
    
    return dates
  }

  const fetchAvailableSlots = async (date: string) => {
    setLoadingSlots(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/consultation/doctors/${doctor.id}/availability?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.available_slots || [])
      } else {
        setAvailableSlots([])
      }
    } catch (error) {
      console.error('Error fetching available slots:', error)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedTime('')
    fetchAvailableSlots(date)
  }

  const handleTimeSelect = (timeSlot: TimeSlot) => {
    if (timeSlot.available) {
      setSelectedTime(timeSlot.datetime)
    }
  }

  const handleBookAppointment = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const bookingData = {
        doctor_id: doctor.id,
        appointment_date: selectedTime,
        appointment_type: appointmentData.appointment_type,
        reason: appointmentData.reason,
        symptoms: appointmentData.symptoms,
        consultation_fee: doctor.consultation_fee,
        duration: appointmentData.duration,
        family_member_id: appointmentData.family_member_id
      }

      const response = await fetch('/api/consultation/appointments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentStep(4) // Success step
        onBookingComplete?.(data.appointment)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to book appointment')
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
      alert('Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Appointment Type</h3>
              <div className="grid gap-3">
                {appointmentTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setAppointmentData({...appointmentData, appointment_type: type.value})}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      appointmentData.appointment_type === type.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {type.icon}
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-gray-600">{type.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Reason for Consultation
              </label>
              <Input
                value={appointmentData.reason}
                onChange={(e) => setAppointmentData({...appointmentData, reason: e.target.value})}
                placeholder="Brief description of your concern"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Symptoms (Optional)
              </label>
              <Textarea
                value={appointmentData.symptoms}
                onChange={(e) => setAppointmentData({...appointmentData, symptoms: e.target.value})}
                placeholder="Describe your symptoms in detail"
                rows={3}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Date</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {getAvailableDates().map((date) => (
                  <button
                    key={date.value}
                    onClick={() => handleDateSelect(date.value)}
                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                      selectedDate === date.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{date.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Time</h3>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading available slots...</span>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    No available slots for this date
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.datetime}
                        onClick={() => handleTimeSelect(slot)}
                        disabled={!slot.available}
                        className={`p-3 border-2 rounded-lg text-center transition-all ${
                          selectedTime === slot.datetime
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : slot.available
                            ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <div className="font-medium">{slot.time}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 3:
        const selectedDateObj = selectedDate ? getAvailableDates().find(d => d.value === selectedDate) : null
        const selectedTimeObj = availableSlots.find(s => s.datetime === selectedTime)
        
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Confirm Appointment</h3>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Dr. {doctor.name}</span>
                  <Badge variant="outline">{doctor.specialization}</Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{selectedDateObj?.fullDate}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{selectedTimeObj?.time}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {appointmentTypes.find(t => t.value === appointmentData.appointment_type)?.icon}
                  <span>{appointmentTypes.find(t => t.value === appointmentData.appointment_type)?.label}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="font-medium">₹{doctor.consultation_fee}</span>
                </div>
                
                {appointmentData.reason && (
                  <div>
                    <div className="font-medium text-sm">Reason:</div>
                    <div className="text-sm text-gray-600">{appointmentData.reason}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-blue-800 dark:text-blue-200">Important Notes:</div>
                  <ul className="mt-1 space-y-1 text-blue-700 dark:text-blue-300">
                    <li>• Please join the consultation 5 minutes early</li>
                    <li>• Ensure you have a stable internet connection</li>
                    <li>• Keep your medical history and current medications ready</li>
                    <li>• You can reschedule up to 2 hours before the appointment</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
                Appointment Booked Successfully!
              </h3>
              <p className="text-gray-600">
                Your appointment has been confirmed. You will receive a confirmation email shortly.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-sm space-y-2">
                <div><strong>Appointment ID:</strong> #APT{Date.now()}</div>
                <div><strong>Date & Time:</strong> {selectedDateObj?.fullDate} at {selectedTimeObj?.time}</div>
                <div><strong>Doctor:</strong> Dr. {doctor.name}</div>
                <div><strong>Type:</strong> {appointmentTypes.find(t => t.value === appointmentData.appointment_type)?.label}</div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.location.href = '/appointments'}>
                View Appointments
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Close
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Book Appointment with Dr. {doctor.name}
        </CardTitle>
        
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
              </div>
              {step < 4 && (
                <div className={`w-8 h-0.5 ${
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {renderStepContent()}
        
        {/* Navigation Buttons */}
        {currentStep < 4 && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => currentStep === 1 ? onCancel?.() : setCurrentStep(currentStep - 1)}
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            
            <Button
              onClick={() => {
                if (currentStep === 3) {
                  handleBookAppointment()
                } else {
                  setCurrentStep(currentStep + 1)
                }
              }}
              disabled={
                loading ||
                (currentStep === 1 && !appointmentData.reason) ||
                (currentStep === 2 && (!selectedDate || !selectedTime))
              }
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Booking...
                </>
              ) : currentStep === 3 ? (
                'Confirm Booking'
              ) : (
                'Next'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
