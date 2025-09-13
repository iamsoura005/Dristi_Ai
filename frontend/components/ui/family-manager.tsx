"use client"

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Input } from './input'
import { Textarea } from './textarea'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Calendar,
  Phone,
  Heart,
  Activity,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface FamilyMember {
  id: number
  name: string
  relationship: string
  date_of_birth?: string
  gender?: string
  phone?: string
  medical_conditions?: string
  created_at: string
}

interface FamilyManagerProps {
  onMemberSelect?: (member: FamilyMember) => void
  showHealthSummary?: boolean
  className?: string
}

export function FamilyManager({ 
  onMemberSelect, 
  showHealthSummary = true,
  className = '' 
}: FamilyManagerProps) {
  const { t } = useTranslation()
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    medical_conditions: ''
  })

  const relationships = [
    'self', 'spouse', 'child', 'parent', 'sibling', 
    'grandparent', 'grandchild', 'other'
  ]

  const genders = ['male', 'female', 'other']

  useEffect(() => {
    fetchFamilyMembers()
  }, [])

  const fetchFamilyMembers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/family/members', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFamilyMembers(data.family_members || [])
      }
    } catch (error) {
      console.error('Error fetching family members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('auth_token')
      const url = editingMember 
        ? `/api/family/members/${editingMember.id}`
        : '/api/family/members'
      
      const method = editingMember ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchFamilyMembers()
        resetForm()
        setShowAddForm(false)
        setEditingMember(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save family member')
      }
    } catch (error) {
      console.error('Error saving family member:', error)
      alert('Failed to save family member')
    }
  }

  const handleDelete = async (memberId: number) => {
    if (!confirm('Are you sure you want to delete this family member?')) {
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/family/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchFamilyMembers()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete family member')
      }
    } catch (error) {
      console.error('Error deleting family member:', error)
      alert('Failed to delete family member')
    }
  }

  const handleEdit = (member: FamilyMember) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      relationship: member.relationship,
      date_of_birth: member.date_of_birth || '',
      gender: member.gender || '',
      phone: member.phone || '',
      medical_conditions: member.medical_conditions || ''
    })
    setShowAddForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      relationship: '',
      date_of_birth: '',
      gender: '',
      phone: '',
      medical_conditions: ''
    })
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const getRelationshipIcon = (relationship: string) => {
    switch (relationship) {
      case 'child':
        return '👶'
      case 'parent':
        return '👨‍👩‍👧‍👦'
      case 'spouse':
        return '💑'
      case 'sibling':
        return '👫'
      case 'grandparent':
        return '👴👵'
      case 'grandchild':
        return '👶'
      default:
        return '👤'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('family.title')}
            </CardTitle>
            <Button
              onClick={() => {
                resetForm()
                setEditingMember(null)
                setShowAddForm(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('family.add_member')}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingMember ? 'Edit Family Member' : t('family.add_member')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('family.add_form.name')} *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('family.add_form.relationship')} *
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select relationship</option>
                    {relationships.map(rel => (
                      <option key={rel} value={rel}>
                        {t(`family.relationships.${rel}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('family.add_form.date_of_birth')}
                  </label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('family.add_form.gender')}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select gender</option>
                    {genders.map(gender => (
                      <option key={gender} value={gender}>
                        {t(`common.${gender}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('family.add_form.phone')}
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('family.add_form.medical_conditions')}
                </label>
                <Textarea
                  value={formData.medical_conditions}
                  onChange={(e) => setFormData({...formData, medical_conditions: e.target.value})}
                  placeholder="Any existing medical conditions or allergies"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingMember ? t('common.save') : t('family.add_form.submit')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingMember(null)
                    resetForm()
                  }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Family Members List */}
      {loading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p>{t('common.loading')}</p>
          </CardContent>
        </Card>
      ) : familyMembers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No family members added yet</p>
            <Button
              onClick={() => {
                resetForm()
                setShowAddForm(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Family Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {familyMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">
                      {getRelationshipIcon(member.relationship)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-semibold">{member.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {t(`family.relationships.${member.relationship}`)}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        {member.date_of_birth && (
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {calculateAge(member.date_of_birth)} years old
                          </p>
                        )}

                        {member.phone && (
                          <p className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </p>
                        )}

                        {member.medical_conditions && (
                          <p className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {member.medical_conditions}
                          </p>
                        )}
                      </div>

                      {showHealthSummary && (
                        <div className="mt-3 flex gap-2">
                          <Badge variant="secondary" className="text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            3 Eye Tests
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Activity className="h-3 w-3 mr-1" />
                            Last: 2 weeks ago
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(member)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {onMemberSelect && (
                      <Button
                        size="sm"
                        onClick={() => onMemberSelect(member)}
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
