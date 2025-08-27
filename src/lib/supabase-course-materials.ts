/**
 * Supabase API functions for Course Materials Management
 * Handles course materials, quizzes, and quiz attempts
 */

import { supabase } from './supabase'
import type { Database } from './database.types'

// Type definitions for new tables
type CourseMaterial = {
  id: string
  module_id: string
  title: string
  description?: string
  file_url: string
  file_type: string
  file_size?: number
  file_name: string
  order_index: number
  created_by?: string
  created_at: string
  updated_at: string
}

type Quiz = {
  id: string
  module_id: string
  title: string
  description?: string
  questions: any // JSONB
  time_limit?: number
  passing_score: number
  ai_generated: boolean
  study_techniques?: string[] | any // JSONB array of study techniques
  source_material_id?: string
  status: string
  created_by?: string
  created_at: string
  updated_at: string
}

type QuizAttempt = {
  id: string
  quiz_id: string
  user_id: string
  answers: any // JSONB
  score: number
  passed: boolean
  completed_at: string
  time_taken?: number
  attempt_number: number
}

// Course Materials API
export const courseMaterialsAPI = {
  // Get all materials for a specific module
  async getByModuleId(moduleId: string): Promise<CourseMaterial[]> {
    const { data, error } = await supabase
      .from('course_materials')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get materials for all modules in a course (for instructor overview)
  async getByCourseId(courseId: string): Promise<CourseMaterial[]> {
    const { data, error } = await supabase
      .from('course_materials')
      .select(`
        *,
        modules!inner(course_id)
      `)
      .eq('modules.course_id', courseId)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Upload new course material
  async create(material: Omit<CourseMaterial, 'id' | 'created_at' | 'updated_at'>): Promise<CourseMaterial> {
    const { data, error } = await supabase
      .from('course_materials')
      .insert([material])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update course material
  async update(id: string, updates: Partial<CourseMaterial>): Promise<CourseMaterial> {
    const { data, error } = await supabase
      .from('course_materials')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete course material
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('course_materials')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Reorder materials within a module
  async reorder(materialIds: string[], moduleId: string): Promise<void> {
    const updates = materialIds.map((id, index) => ({
      id,
      order_index: index
    }))

    const { error } = await supabase
      .from('course_materials')
      .upsert(updates, { onConflict: 'id' })

    if (error) throw error
  }
}

// Quizzes API
export const quizzesAPI = {
  // Get all quizzes for a module
  async getByModuleId(moduleId: string): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get quizzes for all modules in a course (instructor overview)
  async getByCourseId(courseId: string): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        modules!inner(course_id)
      `)
      .eq('modules.course_id', courseId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get specific quiz by ID
  async getById(id: string): Promise<Quiz> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create new quiz
  async create(quiz: Omit<Quiz, 'id' | 'created_at' | 'updated_at'>): Promise<Quiz> {
    const { data, error } = await supabase
      .from('quizzes')
      .insert([quiz])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update quiz
  async update(id: string, updates: Partial<Quiz>): Promise<Quiz> {
    const { data, error } = await supabase
      .from('quizzes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete quiz
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Publish quiz (change status from draft to published)
  async publish(id: string): Promise<Quiz> {
    return this.update(id, { status: 'published' })
  },

  // Archive quiz
  async archive(id: string): Promise<Quiz> {
    return this.update(id, { status: 'archived' })
  }
}

// Quiz Attempts API
export const quizAttemptsAPI = {
  // Get all attempts for a quiz
  async getByQuizId(quizId: string): Promise<QuizAttempt[]> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        users(name, email)
      `)
      .eq('quiz_id', quizId)
      .order('completed_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get attempts by user - DEPRECATED: Now using student_quizzes table
  async getByUserId(userId: string): Promise<QuizAttempt[]> {
    // This function is deprecated in favor of student-generated quizzes
    // Return empty array to maintain compatibility
    console.warn('⚠️ getByUserId is deprecated - quiz attempts now use student_quizzes table')
    return []
  },

  // Get specific user's attempts for a quiz
  async getUserQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .order('attempt_number', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Submit quiz attempt
  async create(attempt: Omit<QuizAttempt, 'id' | 'completed_at'>): Promise<QuizAttempt> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert([attempt])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get quiz statistics for instructor
  async getQuizStats(quizId: string) {
    const { data: attempts, error } = await supabase
      .from('quiz_attempts')
      .select('score, passed, time_taken, user_id')
      .eq('quiz_id', quizId)

    if (error) throw error

    const stats = {
      totalAttempts: attempts?.length || 0,
      uniqueStudents: new Set(attempts?.map(a => a.user_id)).size,
      averageScore: attempts?.length ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length : 0,
      passRate: attempts?.length ? (attempts.filter(a => a.passed).length / attempts.length) * 100 : 0,
      averageTime: attempts?.filter(a => a.time_taken).length ? 
        attempts.filter(a => a.time_taken).reduce((sum, a) => sum + (a.time_taken || 0), 0) / attempts.filter(a => a.time_taken).length : 0
    }

    return stats
  }
}

// Instructor Course Overview API
export const instructorCourseAPI = {
  // Get instructor's assigned courses with materials and quiz counts
  async getInstructorCourses(instructorId: string) {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        modules(
          id,
          title,
          description,
          order_index,
          created_at,
          updated_at,
          course_materials(
            id,
            title,
            file_type,
            file_name,
            file_size,
            created_at
          )
        )
      `)
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get detailed course overview for instructor
  async getCourseOverview(courseId: string, instructorId: string) {
    // Verify instructor has access to this course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('instructor_id', instructorId)
      .single()

    if (courseError) throw courseError

    // Get modules with materials and quizzes
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select(`
        *,
        course_materials(*)
      `)
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })

    if (modulesError) throw modulesError

    // Get student progress statistics
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select(`
        *,
        users(name, email)
      `)
      .eq('course_id', courseId)

    if (progressError) throw progressError

    return {
      course,
      modules: modules || [],
      studentProgress: progress || []
    }
  }
}