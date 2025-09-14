'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Check, 
  AlertCircle, 
  Camera,
  FileImage,
  Eye,
  Info
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { database, storage } from '@/lib/supabase'
import { Patient, Eye as EyeType, FundusImage } from '@/lib/database.types'

interface UploadFormData {
  eye_id: string
  capture_device: string
  resolution: string
  notes?: string
}

interface UploadedFile {
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  result?: FundusImage
}

interface FundusImageUploadProps {
  patients: Patient[]
  onUploadComplete?: (images: FundusImage[]) => void
}

export default function FundusImageUpload({ patients, onUploadComplete }: FundusImageUploadProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientEyes, setPatientEyes] = useState<EyeType[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [uploadForm, setUploadForm] = useState<UploadFormData>({
    eye_id: '',
    capture_device: 'Topcon TRC-50DX',
    resolution: '2048x1536',
    notes: ''
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load patient eyes when patient is selected
  React.useEffect(() => {
    if (selectedPatient) {
      loadPatientEyes(selectedPatient.patient_id)
    } else {
      setPatientEyes([])
      setUploadForm(prev => ({ ...prev, eye_id: '' }))
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
    setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff', '.tif']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  })

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const validateForm = (): boolean => {
    if (!selectedPatient) {
      setError('Please select a patient')
      return false
    }
    if (!uploadForm.eye_id) {
      setError('Please select an eye')
      return false
    }
    if (uploadedFiles.length === 0) {
      setError('Please select at least one image to upload')
      return false
    }
    if (!uploadForm.capture_device) {
      setError('Please specify the capture device')
      return false
    }
    return true
  }

  const uploadSingleFile = async (fileData: UploadedFile, index: number): Promise<FundusImage | null> => {
    try {
      // Update status to uploading
      setUploadedFiles(prev => {
        const newFiles = [...prev]
        newFiles[index] = { ...newFiles[index], status: 'uploading', progress: 0 }
        return newFiles
      })

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => {
          const newFiles = [...prev]
          if (newFiles[index] && newFiles[index].status === 'uploading') {
            newFiles[index] = { 
              ...newFiles[index], 
              progress: Math.min(newFiles[index].progress + 10, 90) 
            }
          }
          return newFiles
        })
      }, 200)

      // Upload to storage
      const { data: uploadData, filePath } = await storage.uploadFundusImage(
        fileData.file,
        selectedPatient!.patient_id,
        uploadForm.eye_id
      )

      clearInterval(progressInterval)

      if (!uploadData) {
        throw new Error('Failed to upload file to storage')
      }

      // Create database record
      const imageRecord = await database.fundusImages.create({
        eye_id: uploadForm.eye_id,
        image_url: filePath,
        capture_device: uploadForm.capture_device,
        resolution: uploadForm.resolution,
        file_size: fileData.file.size,
        notes: uploadForm.notes
      })

      // Update status to success
      setUploadedFiles(prev => {
        const newFiles = [...prev]
        newFiles[index] = { 
          ...newFiles[index], 
          status: 'success', 
          progress: 100,
          result: imageRecord
        }
        return newFiles
      })

      return imageRecord

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      
      setUploadedFiles(prev => {
        const newFiles = [...prev]
        newFiles[index] = { 
          ...newFiles[index], 
          status: 'error', 
          progress: 0,
          error: errorMessage
        }
        return newFiles
      })

      console.error('Upload error:', err)
      return null
    }
  }

  const handleUpload = async () => {
    if (!validateForm()) return

    setIsUploading(true)
    setError(null)

    try {
      const uploadPromises = uploadedFiles.map((fileData, index) => 
        uploadSingleFile(fileData, index)
      )

      const results = await Promise.all(uploadPromises)
      const successfulUploads = results.filter(result => result !== null) as FundusImage[]

      if (successfulUploads.length > 0) {
        onUploadComplete?.(successfulUploads)
        
        // Reset form after successful upload
        setUploadedFiles([])
        setUploadForm(prev => ({ ...prev, notes: '' }))
      }

      if (successfulUploads.length < uploadedFiles.length) {
        setError(`${uploadedFiles.length - successfulUploads.length} files failed to upload`)
      }

    } catch (err) {
      setError('Upload failed. Please try again.')
      console.error('Batch upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const getFileStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending':
        return <FileImage className="h-4 w-4 text-blue-500" />
      case 'uploading':
        return <Upload className="h-4 w-4 text-yellow-500 animate-pulse" />
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getFileStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-50 border-blue-200'
      case 'uploading':
        return 'bg-yellow-50 border-yellow-200'
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Fundus Image Upload</h2>
        <p className="text-muted-foreground">
          Upload fundus images for refractive error analysis
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload Images</TabsTrigger>
          <TabsTrigger value="guidelines">Upload Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          {/* Patient and Eye Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Patient & Eye Selection</span>
              </CardTitle>
              <CardDescription>
                Select the patient and eye for the fundus images
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
                    value={uploadForm.eye_id} 
                    onValueChange={(value) => setUploadForm({...uploadForm, eye_id: value})}
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

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>Image Upload</span>
              </CardTitle>
              <CardDescription>
                Drag and drop fundus images or click to select files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                `}
              >
                <input {...getInputProps()} ref={fileInputRef} />
                <div className="space-y-2">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                  {isDragActive ? (
                    <p className="text-blue-600">Drop the images here...</p>
                  ) : (
                    <>
                      <p className="text-gray-600">Drag & drop fundus images here, or click to select</p>
                      <p className="text-sm text-gray-500">
                        Supports JPEG, PNG, TIFF (max 50MB each)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Device and Resolution Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capture_device">Capture Device</Label>
                  <Select 
                    value={uploadForm.capture_device} 
                    onValueChange={(value) => setUploadForm({...uploadForm, capture_device: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Topcon TRC-50DX">Topcon TRC-50DX</SelectItem>
                      <SelectItem value="Canon CR-2">Canon CR-2</SelectItem>
                      <SelectItem value="Zeiss FF 450plus">Zeiss FF 450plus</SelectItem>
                      <SelectItem value="Nikon D850">Nikon D850</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="resolution">Resolution</Label>
                  <Select 
                    value={uploadForm.resolution} 
                    onValueChange={(value) => setUploadForm({...uploadForm, resolution: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2048x1536">2048x1536</SelectItem>
                      <SelectItem value="3008x2000">3008x2000</SelectItem>
                      <SelectItem value="4288x2848">4288x2848</SelectItem>
                      <SelectItem value="5472x3648">5472x3648</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({...uploadForm, notes: e.target.value})}
                  placeholder="Additional notes about these images"
                />
              </div>
            </CardContent>
          </Card>

          {/* File List */}
          {uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Files ({uploadedFiles.length})</CardTitle>
                <CardDescription>
                  Review and upload your fundus images
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {uploadedFiles.map((fileData, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getFileStatusColor(fileData.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getFileStatusIcon(fileData.status)}
                          <div>
                            <p className="font-medium">{fileData.file.name}</p>
                            <p className="text-sm text-gray-500">
                              {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            fileData.status === 'success' ? 'default' :
                            fileData.status === 'error' ? 'destructive' :
                            fileData.status === 'uploading' ? 'secondary' : 'outline'
                          }>
                            {fileData.status}
                          </Badge>
                          
                          {fileData.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {fileData.status === 'uploading' && (
                        <div className="mt-2">
                          <Progress value={fileData.progress} className="h-2" />
                        </div>
                      )}
                      
                      {fileData.status === 'error' && fileData.error && (
                        <div className="mt-2 text-sm text-red-600">
                          Error: {fileData.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={() => setUploadedFiles([])}
                    disabled={isUploading}
                  >
                    Clear All
                  </Button>
                  
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || uploadedFiles.length === 0 || !uploadForm.eye_id}
                  >
                    {isUploading ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload {uploadedFiles.length} Image{uploadedFiles.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fundus Image Upload Guidelines</CardTitle>
              <CardDescription>
                Best practices for high-quality fundus image uploads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-green-700">✅ Image Quality Requirements</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                    <li>High resolution (minimum 2048x1536 pixels)</li>
                    <li>Clear optic disc and macula visibility</li>
                    <li>Minimal artifacts or reflections</li>
                    <li>Proper illumination and contrast</li>
                    <li>Centered on the posterior pole</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-700">📋 Supported Formats</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                    <li>JPEG (.jpg, .jpeg) - Most common</li>
                    <li>PNG (.png) - Lossless compression</li>
                    <li>TIFF (.tiff, .tif) - Highest quality</li>
                    <li>Maximum file size: 50MB per image</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-red-700">❌ Avoid These Issues</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                    <li>Blurry or out-of-focus images</li>
                    <li>Overexposed or underexposed images</li>
                    <li>Images with significant artifacts</li>
                    <li>Duplicate images of the same eye</li>
                    <li>Images without proper patient/eye association</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-purple-700">🔒 Privacy & Security</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                    <li>All images are stored securely in encrypted storage</li>
                    <li>Patient data is anonymized using UUIDs</li>
                    <li>Access is restricted to authorized researchers</li>
                    <li>Images are automatically backed up</li>
                    <li>Audit logs track all access and modifications</li>
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
