/**
 * TypeScript type definitions for Supabase Medical Research Database
 * Auto-generated types for type-safe database operations
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      patients: {
        Row: {
          patient_id: string
          age: number
          gender: 'male' | 'female' | 'other'
          region: string
          created_at: string
        }
        Insert: {
          patient_id?: string
          age: number
          gender: 'male' | 'female' | 'other'
          region: string
          created_at?: string
        }
        Update: {
          patient_id?: string
          age?: number
          gender?: 'male' | 'female' | 'other'
          region?: string
          created_at?: string
        }
        Relationships: []
      }
      eyes: {
        Row: {
          eye_id: string
          patient_id: string
          side: 'left' | 'right'
          axial_length: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          eye_id?: string
          patient_id: string
          side: 'left' | 'right'
          axial_length?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          eye_id?: string
          patient_id?: string
          side?: 'left' | 'right'
          axial_length?: number | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'eyes_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'patients'
            referencedColumns: ['patient_id']
          }
        ]
      }
      fundus_images: {
        Row: {
          image_id: string
          eye_id: string
          image_url: string
          capture_device: string | null
          resolution: string | null
          captured_at: string | null
          created_at: string
        }
        Insert: {
          image_id?: string
          eye_id: string
          image_url: string
          capture_device?: string | null
          resolution?: string | null
          captured_at?: string | null
          created_at?: string
        }
        Update: {
          image_id?: string
          eye_id?: string
          image_url?: string
          capture_device?: string | null
          resolution?: string | null
          captured_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'fundus_images_eye_id_fkey'
            columns: ['eye_id']
            isOneToOne: false
            referencedRelation: 'eyes'
            referencedColumns: ['eye_id']
          }
        ]
      }
      refractive_measurements: {
        Row: {
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
        Insert: {
          measurement_id?: string
          eye_id: string
          sphere: number
          cylinder: number
          axis: number
          measurement_method: 'autorefraction' | 'subjective'
          measured_at: string
          created_at?: string
        }
        Update: {
          measurement_id?: string
          eye_id?: string
          sphere?: number
          cylinder?: number
          axis?: number
          measurement_method?: 'autorefraction' | 'subjective'
          measured_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'refractive_measurements_eye_id_fkey'
            columns: ['eye_id']
            isOneToOne: false
            referencedRelation: 'eyes'
            referencedColumns: ['eye_id']
          }
        ]
      }
      model_training_logs: {
        Row: {
          run_id: string
          model_name: string
          dataset_version: string
          mae: number
          rmse: number
          r2_score: number | null
          training_samples: number | null
          validation_samples: number | null
          test_samples: number | null
          hyperparameters: Json | null
          training_duration_minutes: number | null
          trained_at: string
        }
        Insert: {
          run_id?: string
          model_name: string
          dataset_version: string
          mae: number
          rmse: number
          r2_score?: number | null
          training_samples?: number | null
          validation_samples?: number | null
          test_samples?: number | null
          hyperparameters?: Json | null
          training_duration_minutes?: number | null
          trained_at?: string
        }
        Update: {
          run_id?: string
          model_name?: string
          dataset_version?: string
          mae?: number
          rmse?: number
          r2_score?: number | null
          training_samples?: number | null
          validation_samples?: number | null
          test_samples?: number | null
          hyperparameters?: Json | null
          training_duration_minutes?: number | null
          trained_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          log_id: string
          user_id: string | null
          table_name: string
          operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
          record_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          log_id?: string
          user_id?: string | null
          table_name: string
          operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          log_id?: string
          user_id?: string | null
          table_name?: string
          operation?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
      storage_audit_logs: {
        Row: {
          log_id: string
          user_id: string | null
          bucket_id: string
          object_name: string
          operation: 'UPLOAD' | 'DOWNLOAD' | 'DELETE' | 'UPDATE'
          file_size: number | null
          content_type: string | null
          ip_address: string | null
          user_agent: string | null
          success: boolean
          error_message: string | null
          created_at: string
        }
        Insert: {
          log_id?: string
          user_id?: string | null
          bucket_id: string
          object_name: string
          operation: 'UPLOAD' | 'DOWNLOAD' | 'DELETE' | 'UPDATE'
          file_size?: number | null
          content_type?: string | null
          ip_address?: string | null
          user_agent?: string | null
          success?: boolean
          error_message?: string | null
          created_at?: string
        }
        Update: {
          log_id?: string
          user_id?: string | null
          bucket_id?: string
          object_name?: string
          operation?: 'UPLOAD' | 'DOWNLOAD' | 'DELETE' | 'UPDATE'
          file_size?: number | null
          content_type?: string | null
          ip_address?: string | null
          user_agent?: string | null
          success?: boolean
          error_message?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      ml_training_dataset: {
        Row: {
          image_id: string
          image_url: string
          capture_device: string | null
          resolution: string | null
          captured_at: string | null
          sphere: number
          cylinder: number
          axis: number
          spherical_equivalent: number
          measurement_method: string
          measured_at: string
          eye_side: 'left' | 'right'
          axial_length: number | null
          age: number
          gender: string
          region: string
          patient_id: string
          eye_id: string
          measurement_id: string
        }
        Relationships: []
      }
      patient_summary: {
        Row: {
          patient_id: string
          age: number
          gender: string
          region: string
          total_eyes: number
          total_images: number
          total_measurements: number
          first_measurement: string | null
          latest_measurement: string | null
          created_at: string
        }
        Relationships: []
      }
      storage_usage_stats: {
        Row: {
          bucket_id: string
          total_files: number
          total_size_bytes: number
          avg_file_size_bytes: number
          first_upload: string
          latest_upload: string
        }
        Relationships: []
      }
      file_type_distribution: {
        Row: {
          bucket_id: string
          file_type: string
          file_count: number
          total_size_bytes: number
        }
        Relationships: []
      }
      upload_activity_by_date: {
        Row: {
          upload_date: string
          files_uploaded: number
          total_bytes_uploaded: number
        }
        Relationships: []
      }
    }
    Functions: {
      is_researcher: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_ml_pipeline: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      has_read_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      has_write_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      generate_fundus_image_path: {
        Args: {
          patient_uuid: string
          eye_uuid: string
          file_extension?: string
        }
        Returns: string
      }
      validate_fundus_image_upload: {
        Args: {
          file_name: string
          file_size: number
          content_type: string
        }
        Returns: boolean
      }
      log_storage_operation: {
        Args: {
          p_bucket_id: string
          p_object_name: string
          p_operation: string
          p_file_size?: number
          p_content_type?: string
          p_success?: boolean
          p_error_message?: string
        }
        Returns: string
      }
      cleanup_orphaned_images: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      validate_storage_integrity: {
        Args: Record<PropertyKey, never>
        Returns: Array<{
          issue_type: string
          issue_count: number
          details: string
        }>
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
