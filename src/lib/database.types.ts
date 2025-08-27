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
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'instructor' | 'student'
          status: 'active' | 'inactive' | 'suspended'
          profile_picture: string | null
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: 'admin' | 'instructor' | 'student'
          status?: 'active' | 'inactive' | 'suspended'
          profile_picture?: string | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'instructor' | 'student'
          status?: 'active' | 'inactive' | 'suspended'
          profile_picture?: string | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string
          image_url: string | null
          instructor_id: string | null
          created_by: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          image_url?: string | null
          instructor_id?: string | null
          created_by?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          image_url?: string | null
          instructor_id?: string | null
          created_by?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      modules: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string
          order_index: number
          available_techniques: Json
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description: string
          order_index: number
          available_techniques?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string
          order_index?: number
          available_techniques?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          course_id: string
          completion_percentage: number
          study_streak: number
          total_study_time: number
          last_activity_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          completion_percentage?: number
          study_streak?: number
          total_study_time?: number
          last_activity_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          completion_percentage?: number
          study_streak?: number
          total_study_time?: number
          last_activity_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      module_progress: {
        Row: {
          id: string
          user_id: string
          module_id: string
          is_completed: boolean
          completion_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id: string
          is_completed?: boolean
          completion_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_id?: string
          is_completed?: boolean
          completion_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          module_id: string
          technique: string
          duration_minutes: number
          completed: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id: string
          technique: string
          duration_minutes: number
          completed?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_id?: string
          technique?: string
          duration_minutes?: number
          completed?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'instructor' | 'student'
      user_status: 'active' | 'inactive' | 'suspended'
      study_technique: 'general' | 'active_recall' | 'feynman' | 'pomodoro' | 'retrieval_practice'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}