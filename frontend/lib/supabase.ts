/**
 * Supabase Client Configuration for Medical Research Frontend
 * Handles database connections, authentication, and storage operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client
export const supabase: SupabaseClient<Database> = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'medical-research-frontend',
      },
    },
  }
)

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface Patient {
  patient_id: string
  age: number
  gender: 'male' | 'female' | 'other'
  region: string
  created_at: string
}

export interface Eye {
  eye_id: string
  patient_id: string
  side: 'left' | 'right'
  axial_length?: number
  notes?: string
  created_at: string
}

export interface FundusImage {
  image_id: string
  eye_id: string
  image_url: string
  capture_device?: string
  resolution?: string
  captured_at?: string
  created_at: string
}

export interface RefractiveMeasurement {
  measurement_id: string
  eye_id: string
  sphere: number
  cylinder: number
  axis: number
  spherical_equivalent: number
  measurement_method: 'autorefraction' | 'subjective'
  measured_at: string
  created_at: string
}

export interface ModelTrainingLog {
  run_id: string
  model_name: string
  dataset_version: string
  mae: number
  rmse: number
  r2_score?: number
  training_samples?: number
  validation_samples?: number
  test_samples?: number
  hyperparameters?: Record<string, any>
  training_duration_minutes?: number
  trained_at: string
}

export interface MLTrainingDataset {
  image_id: string
  image_url: string
  capture_device?: string
  resolution?: string
  captured_at?: string
  sphere: number
  cylinder: number
  axis: number
  spherical_equivalent: number
  measurement_method: string
  measured_at: string
  eye_side: 'left' | 'right'
  axial_length?: number
  age: number
  gender: string
  region: string
  patient_id: string
  eye_id: string
  measurement_id: string
}

// =====================================================
// AUTHENTICATION FUNCTIONS
// =====================================================

export const auth = {
  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  /**
   * Sign up with email and password and role
   */
  signUp: async (email: string, password: string, role: 'researcher' | 'ml_pipeline', metadata?: Record<string, any>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          ...metadata,
        },
      },
    })
    return { data, error }
  },

  /**
   * Sign out current user
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  /**
   * Get current user
   */
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser()
    return { data, error }
  },

  /**
   * Get current session
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession()
    return { data, error }
  },
}

// =====================================================
// DATABASE OPERATIONS
// =====================================================

export const database = {
  // PATIENT OPERATIONS
  patients: {
    /**
     * Create a new patient
     */
    create: async (patient: Omit<Patient, 'patient_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('patients')
        .insert(patient)
        .select()
        .single()
      return { data, error }
    },

    /**
     * Get patient by ID
     */
    getById: async (patientId: string) => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('patient_id', patientId)
        .single()
      return { data, error }
    },

    /**
     * List all patients with pagination
     */
    list: async (page = 0, limit = 50) => {
      const from = page * limit
      const to = from + limit - 1

      const { data, error, count } = await supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false })
      
      return { data, error, count }
    },

    /**
     * Update patient
     */
    update: async (patientId: string, updates: Partial<Omit<Patient, 'patient_id' | 'created_at'>>) => {
      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('patient_id', patientId)
        .select()
        .single()
      return { data, error }
    },
  },

  // EYE OPERATIONS
  eyes: {
    /**
     * Create an eye record
     */
    create: async (eye: Omit<Eye, 'eye_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('eyes')
        .insert(eye)
        .select()
        .single()
      return { data, error }
    },

    /**
     * Get eyes for a patient
     */
    getByPatientId: async (patientId: string) => {
      const { data, error } = await supabase
        .from('eyes')
        .select('*')
        .eq('patient_id', patientId)
        .order('side')
      return { data, error }
    },

    /**
     * Get eye by ID
     */
    getById: async (eyeId: string) => {
      const { data, error } = await supabase
        .from('eyes')
        .select('*')
        .eq('eye_id', eyeId)
        .single()
      return { data, error }
    },
  },

  // FUNDUS IMAGE OPERATIONS
  fundusImages: {
    /**
     * Create fundus image record (after upload)
     */
    create: async (image: Omit<FundusImage, 'image_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('fundus_images')
        .insert(image)
        .select()
        .single()
      return { data, error }
    },

    /**
     * Get images for an eye
     */
    getByEyeId: async (eyeId: string) => {
      const { data, error } = await supabase
        .from('fundus_images')
        .select('*')
        .eq('eye_id', eyeId)
        .order('captured_at', { ascending: false })
      return { data, error }
    },

    /**
     * Get signed URL for image
     */
    getSignedUrl: async (imagePath: string, expiresIn = 3600) => {
      const { data, error } = await supabase.storage
        .from('fundus-images')
        .createSignedUrl(imagePath, expiresIn)
      return { data, error }
    },
  },

  // REFRACTIVE MEASUREMENT OPERATIONS
  refractiveMeasurements: {
    /**
     * Create refractive measurement
     */
    create: async (measurement: Omit<RefractiveMeasurement, 'measurement_id' | 'spherical_equivalent' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('refractive_measurements')
        .insert(measurement)
        .select()
        .single()
      return { data, error }
    },

    /**
     * Get measurements for an eye
     */
    getByEyeId: async (eyeId: string) => {
      const { data, error } = await supabase
        .from('refractive_measurements')
        .select('*')
        .eq('eye_id', eyeId)
        .order('measured_at', { ascending: false })
      return { data, error }
    },
  },

  // ML TRAINING OPERATIONS
  mlTraining: {
    /**
     * Get ML training dataset
     */
    getDataset: async (limit?: number) => {
      let query = supabase
        .from('ml_training_dataset')
        .select('*')
        .order('captured_at', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query
      return { data, error }
    },

    /**
     * Log model training results
     */
    logTraining: async (log: Omit<ModelTrainingLog, 'run_id' | 'trained_at'>) => {
      const { data, error } = await supabase
        .from('model_training_logs')
        .insert(log)
        .select()
        .single()
      return { data, error }
    },

    /**
     * Get model performance history
     */
    getPerformanceHistory: async (modelName?: string) => {
      let query = supabase
        .from('model_training_logs')
        .select('*')
        .order('trained_at', { ascending: false })

      if (modelName) {
        query = query.eq('model_name', modelName)
      }

      const { data, error } = await query
      return { data, error }
    },
  },

  // UTILITY OPERATIONS
  utils: {
    /**
     * Get database statistics
     */
    getStats: async () => {
      const tables = ['patients', 'eyes', 'fundus_images', 'refractive_measurements', 'model_training_logs']
      const stats: Record<string, number> = {}

      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (!error && count !== null) {
          stats[table] = count
        }
      }

      return stats
    },

    /**
     * Health check
     */
    healthCheck: async () => {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('patient_id')
          .limit(1)
        
        return !error
      } catch {
        return false
      }
    },
  },
}

// =====================================================
// STORAGE OPERATIONS
// =====================================================

export const storage = {
  /**
   * Upload fundus image
   */
  uploadFundusImage: async (
    file: File,
    patientId: string,
    eyeId: string
  ) => {
    // Generate file path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const filePath = `${patientId}/${eyeId}/${timestamp}.${fileExtension}`

    // Upload file
    const { data, error } = await supabase.storage
      .from('fundus-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    return { data, error, filePath }
  },

  /**
   * Delete fundus image
   */
  deleteFundusImage: async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('fundus-images')
      .remove([filePath])

    return { data, error }
  },

  /**
   * Get public URL for image
   */
  getPublicUrl: (filePath: string) => {
    const { data } = supabase.storage
      .from('fundus-images')
      .getPublicUrl(filePath)

    return data.publicUrl
  },
}

export default supabase
