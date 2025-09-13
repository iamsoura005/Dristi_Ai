"use client"

import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Input } from './input'
import { Textarea } from './textarea'
import { 
  Upload, 
  Camera, 
  Eye, 
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Scan,
  Edit,
  Save,
  Calendar,
  User,
  Glasses
} from 'lucide-react'

interface PrescriptionData {
  prescription_date: string
  right_eye: {
    sphere?: number
    cylinder?: number
    axis?: number
    add?: number
  }
  left_eye: {
    sphere?: number
    cylinder?: number
    axis?: number
    add?: number
  }
  measurements: {
    pupillary_distance?: number
    near_pd?: number
  }
  details: {
    prescription_type: string
    lens_type?: string
    lens_material?: string
    coating?: string
  }
  metadata: {
    notes?: string
    doctor_name?: string
    clinic_name?: string
  }
}

interface PrescriptionFormProps {
  onSubmit?: (data: PrescriptionData) => void
  onCancel?: () => void
  initialData?: Partial<PrescriptionData>
  familyMemberId?: number
  className?: string
}

export function PrescriptionForm({ 
  onSubmit, 
  onCancel,
  initialData,
  familyMemberId,
  className = '' 
}: PrescriptionFormProps) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(1)
  const [inputMethod, setInputMethod] = useState<'manual' | 'ocr'>('manual')
  const [loading, setLoading] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrResult, setOcrResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<PrescriptionData>({
    prescription_date: new Date().toISOString().split('T')[0],
    right_eye: {},
    left_eye: {},
    measurements: {},
    details: {
      prescription_type: 'glasses'
    },
    metadata: {},
    ...initialData
  })

  const prescriptionTypes = [
    { value: 'glasses', label: 'Eyeglasses', icon: <Glasses className="h-4 w-4" /> },
    { value: 'contacts', label: 'Contact Lenses', icon: <Eye className="h-4 w-4" /> },
    { value: 'both', label: 'Both', icon: <Eye className="h-4 w-4" /> }
  ]

  const lensTypes = [
    { value: 'single_vision', label: 'Single Vision' },
    { value: 'bifocal', label: 'Bifocal' },
    { value: 'progressive', label: 'Progressive' },
    { value: 'reading', label: 'Reading Only' }
  ]

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setOcrLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/prescription/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setOcrResult(data)
        
        // Pre-fill form with OCR results
        if (data.prescription_data) {
          setFormData(prev => ({
            ...prev,
            right_eye: {
              ...prev.right_eye,
              ...data.prescription_data.right_eye
            },
            left_eye: {
              ...prev.left_eye,
              ...data.prescription_data.left_eye
            },
            measurements: {
              ...prev.measurements,
              pupillary_distance: data.prescription_data.pupillary_distance
            },
            metadata: {
              ...prev.metadata,
              prescription_source: 'ocr',
              image_url: data.image_url,
              ocr_confidence: data.confidence
            }
          }))
        }
        
        setCurrentStep(2) // Move to review step
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to process image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setOcrLoading(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const submitData = {
        ...formData,
        family_member_id: familyMemberId
      }
      
      await onSubmit?.(submitData)
    } catch (error) {
      console.error('Error submitting prescription:', error)
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
              <h3 className="text-lg font-semibold mb-4">How would you like to add your prescription?</h3>
              
              <div className="grid gap-4">
                <button
                  onClick={() => setInputMethod('ocr')}
                  className={`p-6 border-2 rounded-lg text-left transition-all ${
                    inputMethod === 'ocr'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Scan className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="font-medium text-lg">Scan Prescription</div>
                      <div className="text-sm text-gray-600">
                        Upload a photo of your prescription and we'll extract the values automatically
                      </div>
                      <Badge variant="secondary" className="mt-2">Recommended</Badge>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setInputMethod('manual')}
                  className={`p-6 border-2 rounded-lg text-left transition-all ${
                    inputMethod === 'manual'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Edit className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="font-medium text-lg">Manual Entry</div>
                      <div className="text-sm text-gray-600">
                        Enter prescription values manually from your prescription paper
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {inputMethod === 'ocr' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <div className="text-center space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-blue-600" />
                  <div>
                    <h4 className="font-medium">Upload Prescription Image</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Take a clear photo of your prescription or upload an existing image
                    </p>
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={ocrLoading}
                    >
                      {ocrLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  <div className="text-xs text-gray-500">
                    <p>• Ensure good lighting and clear text</p>
                    <p>• Supported formats: JPG, PNG, PDF</p>
                    <p>• Maximum file size: 10MB</p>
                  </div>
                </div>
              </div>
            )}

            {ocrResult && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Prescription Extracted Successfully!
                  </span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Confidence: {Math.round(ocrResult.confidence * 100)}%
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Please review the extracted values in the next step.
                </p>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Prescription Details</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Prescription Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.prescription_date}
                    onChange={(e) => setFormData({...formData, prescription_date: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Prescription Type *
                  </label>
                  <select
                    value={formData.details.prescription_type}
                    onChange={(e) => setFormData({
                      ...formData,
                      details: {...formData.details, prescription_type: e.target.value}
                    })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    {prescriptionTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Right Eye */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Right Eye (OD)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sphere (SPH)</label>
                  <Input
                    type="number"
                    step="0.25"
                    value={formData.right_eye.sphere || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      right_eye: {...formData.right_eye, sphere: parseFloat(e.target.value) || undefined}
                    })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cylinder (CYL)</label>
                  <Input
                    type="number"
                    step="0.25"
                    value={formData.right_eye.cylinder || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      right_eye: {...formData.right_eye, cylinder: parseFloat(e.target.value) || undefined}
                    })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Axis</label>
                  <Input
                    type="number"
                    min="0"
                    max="180"
                    value={formData.right_eye.axis || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      right_eye: {...formData.right_eye, axis: parseInt(e.target.value) || undefined}
                    })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Add</label>
                  <Input
                    type="number"
                    step="0.25"
                    value={formData.right_eye.add || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      right_eye: {...formData.right_eye, add: parseFloat(e.target.value) || undefined}
                    })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Left Eye */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Left Eye (OS)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sphere (SPH)</label>
                  <Input
                    type="number"
                    step="0.25"
                    value={formData.left_eye.sphere || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      left_eye: {...formData.left_eye, sphere: parseFloat(e.target.value) || undefined}
                    })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cylinder (CYL)</label>
                  <Input
                    type="number"
                    step="0.25"
                    value={formData.left_eye.cylinder || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      left_eye: {...formData.left_eye, cylinder: parseFloat(e.target.value) || undefined}
                    })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Axis</label>
                  <Input
                    type="number"
                    min="0"
                    max="180"
                    value={formData.left_eye.axis || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      left_eye: {...formData.left_eye, axis: parseInt(e.target.value) || undefined}
                    })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Add</label>
                  <Input
                    type="number"
                    step="0.25"
                    value={formData.left_eye.add || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      left_eye: {...formData.left_eye, add: parseFloat(e.target.value) || undefined}
                    })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Measurements */}
            <div>
              <h4 className="font-medium mb-3">Measurements</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Pupillary Distance (PD) - mm
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.measurements.pupillary_distance || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      measurements: {...formData.measurements, pupillary_distance: parseFloat(e.target.value) || undefined}
                    })}
                    placeholder="62.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Near PD - mm (Optional)
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.measurements.near_pd || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      measurements: {...formData.measurements, near_pd: parseFloat(e.target.value) || undefined}
                    })}
                    placeholder="58.0"
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <h4 className="font-medium mb-3">Additional Information</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Doctor/Clinic Name
                  </label>
                  <Input
                    value={formData.metadata.doctor_name || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: {...formData.metadata, doctor_name: e.target.value}
                    })}
                    placeholder="Dr. Smith / Eye Care Clinic"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Notes
                  </label>
                  <Textarea
                    value={formData.metadata.notes || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: {...formData.metadata, notes: e.target.value}
                    })}
                    placeholder="Any additional notes about your prescription..."
                    rows={3}
                  />
                </div>
              </div>
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
          <FileText className="h-5 w-5" />
          Add New Prescription
        </CardTitle>
        
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mt-4">
          {[1, 2].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
              </div>
              {step < 2 && (
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
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => {
              if (currentStep === 1) {
                onCancel?.()
              } else {
                setCurrentStep(currentStep - 1)
              }
            }}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          <Button
            onClick={() => {
              if (currentStep === 2) {
                handleSubmit()
              } else {
                setCurrentStep(currentStep + 1)
              }
            }}
            disabled={
              loading ||
              (currentStep === 1 && inputMethod === 'manual') ||
              (currentStep === 2 && !formData.prescription_date)
            }
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : currentStep === 2 ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Prescription
              </>
            ) : (
              'Next'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
