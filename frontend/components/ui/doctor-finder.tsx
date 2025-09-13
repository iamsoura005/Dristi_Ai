"use client"

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Input } from './input'
import { 
  MapPin, 
  Search, 
  Filter, 
  Star, 
  Phone, 
  Navigation, 
  Clock,
  User,
  Stethoscope,
  Building,
  Calendar,
  Video,
  MessageCircle
} from 'lucide-react'

interface Doctor {
  id: string
  name: string
  type: 'doctor' | 'hospital'
  specialization: string
  experience_years?: number
  clinic_name?: string
  address: string
  phone?: string
  consultation_fee?: number
  rating: number
  total_reviews: number
  distance: number
  latitude: number
  longitude: number
  is_verified?: boolean
  services_offered?: string[]
  available_slots?: any
  source: string
}

interface DoctorFinderProps {
  onDoctorSelect?: (doctor: Doctor) => void
  showBookingButton?: boolean
  className?: string
}

export function DoctorFinder({ 
  onDoctorSelect, 
  showBookingButton = true,
  className = '' 
}: DoctorFinderProps) {
  const { t } = useTranslation()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(false)
  const [searchLocation, setSearchLocation] = useState('')
  const [searchRadius, setSearchRadius] = useState(10)
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [sortBy, setSortBy] = useState('distance')
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const specialties = [
    'General Ophthalmology',
    'Retinal Specialist',
    'Glaucoma Specialist',
    'Corneal Specialist',
    'Pediatric Ophthalmology',
    'Cataract Surgery',
    'Refractive Surgery'
  ]

  const radiusOptions = [5, 10, 25, 50]

  useEffect(() => {
    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.log('Location access denied:', error)
        }
      )
    }
  }, [])

  const searchDoctors = async () => {
    setLoading(true)
    try {
      const searchData: any = {
        radius: searchRadius,
        limit: 20
      }

      if (selectedSpecialty) {
        searchData.specialty = selectedSpecialty
      }

      // Use current location or search by address
      if (userLocation && !searchLocation) {
        searchData.latitude = userLocation.lat
        searchData.longitude = userLocation.lng
      } else if (searchLocation) {
        searchData.address = searchLocation
      } else {
        throw new Error('Please provide a location or enable location access')
      }

      const response = await fetch('/api/location/doctors/nearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchData)
      })

      if (!response.ok) {
        throw new Error('Failed to search doctors')
      }

      const data = await response.json()
      let doctorsList = data.doctors || []

      // Sort results
      doctorsList = sortDoctors(doctorsList, sortBy)
      
      setDoctors(doctorsList)
    } catch (error) {
      console.error('Error searching doctors:', error)
      // Show error message to user
    } finally {
      setLoading(false)
    }
  }

  const sortDoctors = (doctorsList: Doctor[], sortCriteria: string) => {
    return [...doctorsList].sort((a, b) => {
      switch (sortCriteria) {
        case 'distance':
          return a.distance - b.distance
        case 'rating':
          return b.rating - a.rating
        case 'experience':
          return (b.experience_years || 0) - (a.experience_years || 0)
        case 'consultation_fee':
          return (a.consultation_fee || 0) - (b.consultation_fee || 0)
        default:
          return 0
      }
    })
  }

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy)
    if (doctors.length > 0) {
      setDoctors(sortDoctors(doctors, newSortBy))
    }
  }

  const getDirections = async (doctor: Doctor) => {
    if (!userLocation) {
      alert('Location access required for directions')
      return
    }

    try {
      const response = await fetch('/api/location/directions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin: {
            latitude: userLocation.lat,
            longitude: userLocation.lng
          },
          destination: {
            latitude: doctor.latitude,
            longitude: doctor.longitude
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Open directions in Google Maps
        const mapsUrl = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${doctor.latitude},${doctor.longitude}`
        window.open(mapsUrl, '_blank')
      }
    } catch (error) {
      console.error('Error getting directions:', error)
    }
  }

  const callDoctor = (phone: string) => {
    window.open(`tel:${phone}`, '_self')
  }

  const bookAppointment = (doctor: Doctor) => {
    if (onDoctorSelect) {
      onDoctorSelect(doctor)
    }
    // Navigate to booking page or open booking modal
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            {t('doctors.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Search */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder={t('doctors.search.location')}
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (userLocation) {
                  setSearchLocation('')
                  searchDoctors()
                }
              }}
              disabled={!userLocation}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {t('doctors.search.use_current_location')}
            </Button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-2">
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="px-3 py-2 border rounded-md"
            >
              {radiusOptions.map(radius => (
                <option key={radius} value={radius}>
                  {radius} km
                </option>
              ))}
            </select>

            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">{t('doctors.search.specialty')}</option>
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="distance">{t('doctors.filters.distance')}</option>
              <option value="rating">{t('doctors.filters.rating')}</option>
              <option value="experience">{t('doctors.filters.experience')}</option>
              <option value="consultation_fee">{t('doctors.filters.consultation_fee')}</option>
            </select>

            <Button onClick={searchDoctors} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? t('common.loading') : t('doctors.search.search_button')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {doctors.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {doctors.length} {t('doctors.results.found')}
            </h3>
          </div>

          <div className="grid gap-4">
            {doctors.map((doctor) => (
              <Card key={doctor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold">{doctor.name}</h4>
                        {doctor.is_verified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {doctor.type === 'doctor' ? 'Doctor' : 'Hospital'}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-1">{doctor.specialization}</p>
                      
                      {doctor.experience_years && (
                        <p className="text-sm text-gray-600 mb-1">
                          {doctor.experience_years} {t('doctors.results.experience')}
                        </p>
                      )}

                      {doctor.clinic_name && (
                        <p className="text-sm text-gray-600 mb-1">
                          <Building className="h-3 w-3 inline mr-1" />
                          {doctor.clinic_name}
                        </p>
                      )}

                      <p className="text-sm text-gray-600 mb-2">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {doctor.address} • {doctor.distance} km {t('doctors.results.distance_away')}
                      </p>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{doctor.rating}</span>
                          <span className="text-gray-500">({doctor.total_reviews})</span>
                        </div>

                        {doctor.consultation_fee && (
                          <div className="text-green-600 font-medium">
                            ₹{doctor.consultation_fee}
                          </div>
                        )}
                      </div>

                      {doctor.services_offered && doctor.services_offered.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {doctor.services_offered.slice(0, 3).map((service, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {doctor.services_offered.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{doctor.services_offered.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {doctor.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => callDoctor(doctor.phone!)}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          {t('doctors.results.call_now')}
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => getDirections(doctor)}
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        {t('doctors.results.get_directions')}
                      </Button>

                      {showBookingButton && (
                        <Button
                          size="sm"
                          onClick={() => bookAppointment(doctor)}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          {t('doctors.results.book_appointment')}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && doctors.length === 0 && searchLocation && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">
              No doctors found in your area. Try expanding your search radius or changing the specialty filter.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
