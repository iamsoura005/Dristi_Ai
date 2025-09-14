'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, Eye, Edit, Trash2, User, Calendar, MapPin } from 'lucide-react'
import { database } from '@/lib/supabase'
import { Patient, Eye } from '@/lib/database.types'

interface PatientFormData {
  age: number
  gender: 'male' | 'female' | 'other'
  region: string
}

interface EyeFormData {
  side: 'left' | 'right'
  axial_length: number
  notes?: string
}

export default function PatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientEyes, setPatientEyes] = useState<Eye[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEyeDialogOpen, setIsEyeDialogOpen] = useState(false)

  // Form states
  const [patientForm, setPatientForm] = useState<PatientFormData>({
    age: 25,
    gender: 'female',
    region: 'India'
  })
  
  const [eyeForm, setEyeForm] = useState<EyeFormData>({
    side: 'right',
    axial_length: 24.0,
    notes: ''
  })

  useEffect(() => {
    loadPatients()
  }, [])

  useEffect(() => {
    if (selectedPatient) {
      loadPatientEyes(selectedPatient.patient_id)
    }
  }, [selectedPatient])

  const loadPatients = async () => {
    try {
      setLoading(true)
      const data = await database.patients.list()
      setPatients(data || [])
    } catch (err) {
      setError('Failed to load patients')
      console.error('Error loading patients:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPatientEyes = async (patientId: string) => {
    try {
      const eyes = await database.eyes.getByPatientId(patientId)
      setPatientEyes(eyes || [])
    } catch (err) {
      console.error('Error loading patient eyes:', err)
    }
  }

  const handleCreatePatient = async () => {
    try {
      const newPatient = await database.patients.create(patientForm)
      setPatients([...patients, newPatient])
      setIsCreateDialogOpen(false)
      setPatientForm({ age: 25, gender: 'female', region: 'India' })
    } catch (err) {
      setError('Failed to create patient')
      console.error('Error creating patient:', err)
    }
  }

  const handleCreateEye = async () => {
    if (!selectedPatient) return

    try {
      const newEye = await database.eyes.create({
        ...eyeForm,
        patient_id: selectedPatient.patient_id
      })
      setPatientEyes([...patientEyes, newEye])
      setIsEyeDialogOpen(false)
      setEyeForm({ side: 'right', axial_length: 24.0, notes: '' })
    } catch (err) {
      setError('Failed to create eye record')
      console.error('Error creating eye:', err)
    }
  }

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('Are you sure you want to delete this patient? This will also delete all associated eye records and images.')) {
      return
    }

    try {
      await database.patients.delete(patientId)
      setPatients(patients.filter(p => p.patient_id !== patientId))
      if (selectedPatient?.patient_id === patientId) {
        setSelectedPatient(null)
        setPatientEyes([])
      }
    } catch (err) {
      setError('Failed to delete patient')
      console.error('Error deleting patient:', err)
    }
  }

  const getAgeGroup = (age: number): string => {
    if (age < 20) return 'Under 20'
    if (age <= 40) return '20-40'
    if (age <= 60) return '41-60'
    return 'Over 60'
  }

  const getGenderIcon = (gender: string) => {
    return gender === 'male' ? '♂' : gender === 'female' ? '♀' : '⚧'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading patients...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Patient Management</h2>
          <p className="text-muted-foreground">
            Manage patient records and eye data for refractive error research
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Patient</DialogTitle>
              <DialogDescription>
                Add a new patient to the research database. All data is anonymized.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  value={patientForm.age}
                  onChange={(e) => setPatientForm({...patientForm, age: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={patientForm.gender} onValueChange={(value: 'male' | 'female' | 'other') => 
                  setPatientForm({...patientForm, gender: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="region">Region</Label>
                <Select value={patientForm.region} onValueChange={(value) => 
                  setPatientForm({...patientForm, region: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="USA">USA</SelectItem>
                    <SelectItem value="Europe">Europe</SelectItem>
                    <SelectItem value="Asia">Asia</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreatePatient} className="w-full">
                Create Patient
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Patient List</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedPatient}>
            Patient Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patients ({patients.length})</CardTitle>
              <CardDescription>
                All patients in the research database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient ID</TableHead>
                    <TableHead>Demographics</TableHead>
                    <TableHead>Age Group</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Eyes</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.patient_id}>
                      <TableCell className="font-mono text-sm">
                        {patient.patient_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getGenderIcon(patient.gender)}</span>
                          <span>{patient.age} years</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getAgeGroup(patient.age)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{patient.region}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {patientEyes.filter(e => e.patient_id === patient.patient_id).length} eyes
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(patient.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPatient(patient)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePatient(patient.patient_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedPatient && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Patient Details</span>
                  </CardTitle>
                  <CardDescription>
                    Patient ID: {selectedPatient.patient_id}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Age</Label>
                      <p className="text-2xl font-bold">{selectedPatient.age}</p>
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <p className="text-2xl">{getGenderIcon(selectedPatient.gender)} {selectedPatient.gender}</p>
                    </div>
                    <div>
                      <Label>Region</Label>
                      <p className="text-lg">{selectedPatient.region}</p>
                    </div>
                    <div>
                      <Label>Age Group</Label>
                      <Badge>{getAgeGroup(selectedPatient.age)}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Eye Records</CardTitle>
                      <CardDescription>
                        Eye data for this patient
                      </CardDescription>
                    </div>
                    <Dialog open={isEyeDialogOpen} onOpenChange={setIsEyeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Eye
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Eye Record</DialogTitle>
                          <DialogDescription>
                            Add a new eye record for this patient
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="side">Eye Side</Label>
                            <Select value={eyeForm.side} onValueChange={(value: 'left' | 'right') => 
                              setEyeForm({...eyeForm, side: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Left Eye</SelectItem>
                                <SelectItem value="right">Right Eye</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="axial_length">Axial Length (mm)</Label>
                            <Input
                              id="axial_length"
                              type="number"
                              step="0.1"
                              min="20"
                              max="30"
                              value={eyeForm.axial_length}
                              onChange={(e) => setEyeForm({...eyeForm, axial_length: parseFloat(e.target.value)})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Input
                              id="notes"
                              value={eyeForm.notes}
                              onChange={(e) => setEyeForm({...eyeForm, notes: e.target.value})}
                              placeholder="Additional notes about this eye"
                            />
                          </div>
                          <Button onClick={handleCreateEye} className="w-full">
                            Add Eye Record
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {patientEyes.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Eye ID</TableHead>
                          <TableHead>Side</TableHead>
                          <TableHead>Axial Length</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patientEyes.map((eye) => (
                          <TableRow key={eye.eye_id}>
                            <TableCell className="font-mono text-sm">
                              {eye.eye_id.slice(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <Badge variant={eye.side === 'left' ? 'secondary' : 'default'}>
                                {eye.side === 'left' ? '👁️ Left' : '👁️ Right'}
                              </Badge>
                            </TableCell>
                            <TableCell>{eye.axial_length} mm</TableCell>
                            <TableCell>{eye.notes || '-'}</TableCell>
                            <TableCell>
                              {new Date(eye.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No eye records found for this patient
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
