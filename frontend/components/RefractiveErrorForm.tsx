'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Eye, 
  Calculator, 
  Save, 
  AlertCircle, 
  Info,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { database } from '@/lib/supabase'
import { Patient, Eye as EyeType, RefractiveError } from '@/lib/database.types'

interface RefractiveFormData {
  eye_id: string
  sphere: number
  cylinder: number
  axis: number
  measurement_method: 'subjective' | 'objective' | 'autorefractor'
  notes?: string
}

interface RefractiveErrorFormProps {
  patients: Patient[]
  onMeasurementAdded?: (measurement: RefractiveError) => void
}

export default function RefractiveErrorForm({ patients, onMeasurementAdded }: RefractiveErrorFormProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientEyes, setPatientEyes] = useState<EyeType[]>([])
  const [existingMeasurements, setExistingMeasurements] = useState<RefractiveError[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState<RefractiveFormData>({
    eye_id: '',
    sphere: 0,
    cylinder: 0,
    axis: 0,
    measurement_method: 'subjective',
    notes: ''
  })

  // Calculate spherical equivalent in real-time
  const sphericalEquivalent = formData.sphere + (formData.cylinder / 2)

  // Load patient eyes when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      loadPatientEyes(selectedPatient.patient_id)
      loadExistingMeasurements(selectedPatient.patient_id)
    } else {
      setPatientEyes([])
      setExistingMeasurements([])
      setFormData(prev => ({ ...prev, eye_id: '' }))
    }
  }, [selectedPatient])

  const loadPatientEyes = async (patientId: string) => {
    try {
      const eyes = await database.eyes.getByPatientId(patientId)
      setPatientEyes(eyes || [])
    } catch (err) {
      console.error('Error loading patient eyes:', err)
    }
  }

  const loadExistingMeasurements = async (patientId: string) => {
    try {
      const measurements = await database.refractiveErrors.getByPatientId(patientId)
      setExistingMeasurements(measurements || [])
    } catch (err) {
      console.error('Error loading existing measurements:', err)
    }
  }

  const validateForm = (): boolean => {
    if (!selectedPatient) {
      setError('Please select a patient')
      return false
    }
    if (!formData.eye_id) {
      setError('Please select an eye')
      return false
    }
    if (formData.sphere < -30 || formData.sphere > 30) {
      setError('Sphere must be between -30D and +30D')
      return false
    }
    if (formData.cylinder > 0 || formData.cylinder < -10) {
      setError('Cylinder must be between 0D and -10D')
      return false
    }
    if (formData.axis < 0 || formData.axis > 180) {
      setError('Axis must be between 0° and 180°')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const measurement = await database.refractiveErrors.create(formData)
      
      setSuccess('Refractive measurement saved successfully!')
      onMeasurementAdded?.(measurement)
      
      // Reload existing measurements
      if (selectedPatient) {
        loadExistingMeasurements(selectedPatient.patient_id)
      }
      
      // Reset form
      setFormData({
        eye_id: '',
        sphere: 0,
        cylinder: 0,
        axis: 0,
        measurement_method: 'subjective',
        notes: ''
      })

    } catch (err) {
      setError('Failed to save refractive measurement')
      console.error('Error saving measurement:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRefractiveCategory = (se: number): { category: string; color: string; icon: React.ReactNode } => {
    if (se < -0.5) {
      return { 
        category: 'Myopia', 
        color: 'text-blue-600', 
        icon: <TrendingDown className="h-4 w-4" /> 
      }
    } else if (se > 0.5) {
      return { 
        category: 'Hyperopia', 
        color: 'text-red-600', 
        icon: <TrendingUp className="h-4 w-4" /> 
      }
    } else {
      return { 
        category: 'Emmetropia', 
        color: 'text-green-600', 
        icon: <Minus className="h-4 w-4" /> 
      }
    }
  }

  const getMyopiaSeverity = (se: number): string => {
    if (se >= -0.5) return 'No Myopia'
    if (se >= -3.0) return 'Low Myopia'
    if (se >= -6.0) return 'Moderate Myopia'
    return 'High Myopia'
  }

  const formatDiopter = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}D`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Refractive Error Measurement</h2>
        <p className="text-muted-foreground">
          Record refractive error measurements for ML training data
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="measurement" className="space-y-4">
        <TabsList>
          <TabsTrigger value="measurement">New Measurement</TabsTrigger>
          <TabsTrigger value="history" disabled={!selectedPatient}>
            Measurement History
          </TabsTrigger>
          <TabsTrigger value="reference">Reference Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="measurement" className="space-y-4">
          {/* Patient Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Patient & Eye Selection</span>
              </CardTitle>
              <CardDescription>
                Select the patient and eye for the refractive measurement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient">Patient</Label>
                  <Select 
                    value={selectedPatient?.patient_id || ''} 
                    onValueChange={(value) => {
                      const patient = patients.find(p => p.patient_id === value)
                      setSelectedPatient(patient || null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.patient_id} value={patient.patient_id}>
                          {patient.patient_id.slice(0, 8)}... - {patient.age}y {patient.gender} ({patient.region})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="eye">Eye</Label>
                  <Select 
                    value={formData.eye_id} 
                    onValueChange={(value) => setFormData({...formData, eye_id: value})}
                    disabled={!selectedPatient}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an eye" />
                    </SelectTrigger>
                    <SelectContent>
                      {patientEyes.map((eye) => (
                        <SelectItem key={eye.eye_id} value={eye.eye_id}>
                          {eye.side === 'left' ? '👁️ Left' : '👁️ Right'} Eye (AL: {eye.axial_length}mm)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedPatient && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <Info className="h-4 w-4 text-blue-500" />
                    <span>
                      Selected: {selectedPatient.age}y {selectedPatient.gender} from {selectedPatient.region}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Refractive Measurement Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Refractive Measurement</span>
              </CardTitle>
              <CardDescription>
                Enter the refractive error values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Refractive Values */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="sphere">Sphere (D)</Label>
                    <Input
                      id="sphere"
                      type="number"
                      step="0.25"
                      min="-30"
                      max="30"
                      value={formData.sphere}
                      onChange={(e) => setFormData({...formData, sphere: parseFloat(e.target.value) || 0})}
                      placeholder="e.g., -2.50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: -30D to +30D (0.25D steps)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="cylinder">Cylinder (D)</Label>
                    <Input
                      id="cylinder"
                      type="number"
                      step="0.25"
                      min="-10"
                      max="0"
                      value={formData.cylinder}
                      onChange={(e) => setFormData({...formData, cylinder: parseFloat(e.target.value) || 0})}
                      placeholder="e.g., -0.50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: 0D to -10D (0.25D steps)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="axis">Axis (°)</Label>
                    <Input
                      id="axis"
                      type="number"
                      min="0"
                      max="180"
                      value={formData.axis}
                      onChange={(e) => setFormData({...formData, axis: parseInt(e.target.value) || 0})}
                      placeholder="e.g., 90"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: 0° to 180°
                    </p>
                  </div>
                </div>

                {/* Calculated Values */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3">Calculated Values</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Spherical Equivalent</Label>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatDiopter(sphericalEquivalent)}
                      </div>
                    </div>
                    <div>
                      <Label>Refractive Category</Label>
                      <div className="flex items-center space-x-2">
                        {getRefractiveCategory(sphericalEquivalent).icon}
                        <span className={`font-semibold ${getRefractiveCategory(sphericalEquivalent).color}`}>
                          {getRefractiveCategory(sphericalEquivalent).category}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label>Myopia Severity</Label>
                      <Badge variant="outline">
                        {getMyopiaSeverity(sphericalEquivalent)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Measurement Method */}
                <div>
                  <Label htmlFor="measurement_method">Measurement Method</Label>
                  <Select 
                    value={formData.measurement_method} 
                    onValueChange={(value: 'subjective' | 'objective' | 'autorefractor') => 
                      setFormData({...formData, measurement_method: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subjective">Subjective Refraction</SelectItem>
                      <SelectItem value="objective">Objective Refraction</SelectItem>
                      <SelectItem value="autorefractor">Autorefractor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes about this measurement"
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={loading || !formData.eye_id}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Save className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Measurement
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {selectedPatient && (
            <Card>
              <CardHeader>
                <CardTitle>Measurement History</CardTitle>
                <CardDescription>
                  Previous refractive measurements for {selectedPatient.patient_id.slice(0, 8)}...
                </CardDescription>
              </CardHeader>
              <CardContent>
                {existingMeasurements.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Eye</TableHead>
                        <TableHead>Sphere</TableHead>
                        <TableHead>Cylinder</TableHead>
                        <TableHead>Axis</TableHead>
                        <TableHead>SE</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {existingMeasurements.map((measurement) => {
                        const eye = patientEyes.find(e => e.eye_id === measurement.eye_id)
                        const category = getRefractiveCategory(measurement.spherical_equivalent)
                        
                        return (
                          <TableRow key={measurement.measurement_id}>
                            <TableCell>
                              <Badge variant={eye?.side === 'left' ? 'secondary' : 'default'}>
                                {eye?.side === 'left' ? '👁️ Left' : '👁️ Right'}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDiopter(measurement.sphere)}</TableCell>
                            <TableCell>{formatDiopter(measurement.cylinder)}</TableCell>
                            <TableCell>{measurement.axis}°</TableCell>
                            <TableCell className="font-semibold">
                              {formatDiopter(measurement.spherical_equivalent)}
                            </TableCell>
                            <TableCell>
                              <div className={`flex items-center space-x-1 ${category.color}`}>
                                {category.icon}
                                <span className="text-sm">{category.category}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {measurement.measurement_method}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(measurement.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No measurements found for this patient
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reference" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Refractive Error Reference Guide</CardTitle>
              <CardDescription>
                Guidelines for accurate refractive error measurement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-blue-700">📏 Measurement Ranges</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                    <li><strong>Sphere:</strong> -30D to +30D (0.25D increments)</li>
                    <li><strong>Cylinder:</strong> 0D to -10D (0.25D increments)</li>
                    <li><strong>Axis:</strong> 0° to 180° (1° increments)</li>
                    <li><strong>Spherical Equivalent:</strong> Sphere + (Cylinder ÷ 2)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-green-700">👁️ Refractive Categories</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                    <li><strong>Myopia:</strong> SE &lt; -0.5D (nearsightedness)</li>
                    <li><strong>Hyperopia:</strong> SE &gt; +0.5D (farsightedness)</li>
                    <li><strong>Emmetropia:</strong> SE between -0.5D and +0.5D (normal vision)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-purple-700">📊 Myopia Severity</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                    <li><strong>Low Myopia:</strong> -0.5D to -3.0D</li>
                    <li><strong>Moderate Myopia:</strong> -3.0D to -6.0D</li>
                    <li><strong>High Myopia:</strong> &lt; -6.0D</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-red-700">⚠️ Measurement Methods</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                    <li><strong>Subjective:</strong> Patient feedback-based refraction (most accurate)</li>
                    <li><strong>Objective:</strong> Retinoscopy or other objective methods</li>
                    <li><strong>Autorefractor:</strong> Automated instrument measurement</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
