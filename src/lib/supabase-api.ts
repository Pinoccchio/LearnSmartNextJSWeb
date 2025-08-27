import { supabase } from './supabase'
import type { Database } from './database.types'

type Tables = Database['public']['Tables']
type User = Tables['users']['Row']
type Course = Tables['courses']['Row']
type Module = Tables['modules']['Row']
type UserProgress = Tables['user_progress']['Row']
type StudySession = Tables['study_sessions']['Row']

// Schema field definitions - centralized for easier schema change management
const SCHEMA_FIELDS = {
  courses: [
    'id',
    'title', 
    'description',
    'image_url',
    'instructor_id',
    'created_by', // Added field from schema update
    'status',     // Critical field for course management
    'created_at',
    'updated_at'
  ],
  modules: [
    'id',
    'course_id',
    'title',
    'description', 
    'order_index',
    'available_techniques',
    'created_at',
    'updated_at'
  ],
  users: [
    'id',
    'email',
    'name',
    'role',
    'status',
    'profile_picture',
    'last_login',
    'created_at',
    'updated_at'
  ]
} as const

// Utility function to get safe field selections
const getFieldSelection = (table: keyof typeof SCHEMA_FIELDS): string => {
  return SCHEMA_FIELDS[table].join(', ')
}

// Utility function to log database errors with context
const logDatabaseError = (context: string, error: any, additionalData?: any) => {
  console.error(`Database Error [${context}]:`, {
    error_code: error.code,
    error_message: error.message,
    error_details: error.details,
    error_hint: error.hint,
    timestamp: new Date().toISOString(),
    context,
    ...additionalData
  })
}

// User API functions
export const userAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(user: Tables['users']['Insert']) {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string, userContext?: { id: string; role: string }) {
    // Ensure we have user context for admin operations
    if (!userContext?.id || !userContext?.role) {
      throw new Error('User context required for deletion')
    }

    // Call our secure API route for user deletion using consistent header authentication
    const response = await fetch(`/api/admin/delete-user?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userContext.id,
        'X-User-Role': userContext.role
      },
      credentials: 'include'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }))
      console.error('❌ API response not OK:', response.status, response.statusText)
      console.error('💥 Server error details:', errorData)
      throw new Error(`Server error (${response.status}): ${errorData.error || 'Failed to delete user'}`)
    }

    const result = await response.json()
    console.log('✅ User deletion successful:', result.message)
  }
}

// Course API functions
export const courseAPI = {
  async getAll() {
    console.log('CourseAPI.getAll: Starting course retrieval', { timestamp: new Date().toISOString() })
    
    try {
      // Use centralized field definitions for consistency
      const courseFields = getFieldSelection('courses')
      const moduleFields = getFieldSelection('modules')

      // Primary query with explicit field selection and timeout protection
      const queryPromise = supabase
        .from('courses')
        .select(`
          ${courseFields},
          modules (${moduleFields})
        `)
        .order('created_at', { ascending: false })

      // Add timeout protection to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout - falling back to separate queries')), 10000)
      )

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any
      
      if (error) {
        // Enhanced error logging with context
        logDatabaseError('CourseAPI.getAll', error, {
          query_context: 'courses with modules join'
        })
        
        // Handle specific relationship/schema errors
        if (error.message?.includes('relationship between') && 
            error.message?.includes('courses') && 
            error.message?.includes('modules')) {
          console.warn('CourseAPI.getAll: Relationship error detected, using fallback query')
          return await this.getAllWithFallback()
        }
        
        if (error.code === '42703') { // Column does not exist
          console.warn('CourseAPI.getAll: Column not found, attempting fallback query')
          return await this.getAllWithFallback()
        }
        
        if (error.code === '42P01') { // Table does not exist  
          console.error('CourseAPI.getAll: Table does not exist - possible schema migration in progress')
          throw new Error('Database schema error: courses table not found. Please contact support.')
        }
        
        // Handle PostgREST errors that might indicate relationship issues
        if (error.code === 'PGRST200' || error.code === 'PGRST201') {
          console.warn('CourseAPI.getAll: PostgREST relationship error, using fallback query')
          return await this.getAllWithFallback()
        }
        
        // Handle schema cache errors
        if (error.message?.includes('schema cache') || error.message?.includes('Could not find')) {
          console.warn('CourseAPI.getAll: Schema cache error detected, using fallback query')
          return await this.getAllWithFallback()
        }
        
        throw new Error(`Failed to retrieve courses: ${error.message}`)
      }

      // Validate returned data structure
      if (!Array.isArray(data)) {
        console.error('CourseAPI.getAll: Unexpected data structure returned', { data })
        throw new Error('Invalid data structure returned from database')
      }

      // Log successful retrieval
      console.log('CourseAPI.getAll: Successfully retrieved courses', {
        count: data.length,
        timestamp: new Date().toISOString(),
        has_modules: data.some(course => course.modules && course.modules.length > 0)
      })

      // Validate each course has required fields
      const validatedData = data.map((course, index) => {
        if (!course.id || !course.title) {
          console.warn(`CourseAPI.getAll: Course at index ${index} missing required fields`, { course })
        }
        
        // Ensure created_by field exists with fallback
        return {
          ...course,
          created_by: course.created_by || null, // Graceful fallback for missing field
          modules: Array.isArray(course.modules) ? course.modules : []
        }
      })

      return validatedData
      
    } catch (err) {
      console.error('CourseAPI.getAll: Unexpected error', {
        error: err,
        stack: err instanceof Error ? err.stack : undefined,
        timestamp: new Date().toISOString()
      })
      
      // Re-throw with more context
      if (err instanceof Error) {
        throw new Error(`Course retrieval failed: ${err.message}`)
      }
      
      throw new Error('Course retrieval failed due to unexpected error')
    }
  },

  // Fallback method for schema compatibility issues
  async getAllWithFallback() {
    console.log('CourseAPI.getAllWithFallback: Attempting fallback query')
    
    try {
      // Try basic course query without joins first
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (coursesError) {
        console.error('CourseAPI.getAllWithFallback: Basic course query failed', coursesError)
        throw coursesError
      }

      // If no courses found, return empty array
      if (!courses || courses.length === 0) {
        console.log('CourseAPI.getAllWithFallback: No courses found')
        return []
      }

      // Fetch all modules in a single query for better performance
      const { data: allModules, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .in('course_id', courses.map(course => course.id))
        .order('course_id, order_index', { ascending: true })

      if (modulesError) {
        console.warn('CourseAPI.getAllWithFallback: Failed to fetch modules in batch', modulesError)
        // Continue without modules rather than failing completely
      }

      // Group modules by course_id for efficient mapping
      const modulesByCourseId = (allModules || []).reduce((acc, module) => {
        if (!acc[module.course_id]) {
          acc[module.course_id] = []
        }
        acc[module.course_id].push(module)
        return acc
      }, {} as Record<string, any[]>)

      // Map courses with their modules
      const coursesWithModules = courses.map(course => ({
        ...course,
        modules: modulesByCourseId[course.id] || []
      }))

      console.log('CourseAPI.getAllWithFallback: Fallback query successful', {
        count: coursesWithModules.length,
        total_modules: allModules?.length || 0,
        courses_with_modules: coursesWithModules.filter(c => c.modules.length > 0).length
      })

      return coursesWithModules

    } catch (err) {
      console.error('CourseAPI.getAllWithFallback: Fallback strategy failed', err)
      throw new Error('All course retrieval strategies failed')
    }
  },

  async getById(id: string) {
    console.log('CourseAPI.getById: Retrieving course', { course_id: id })
    
    if (!id) {
      console.error('CourseAPI.getById: No course ID provided')
      throw new Error('Course ID is required')
    }

    try {
      // Use centralized field definitions for consistency
      const courseFields = getFieldSelection('courses')
      const moduleFields = getFieldSelection('modules')

      const { data, error } = await supabase
        .from('courses')
        .select(`
          ${courseFields},
          modules (${moduleFields})
        `)
        .eq('id', id)
        .single()
      
      if (error) {
        logDatabaseError('CourseAPI.getById', error, { course_id: id })

        // Handle specific error cases
        if (error.code === 'PGRST116') { // No rows returned
          console.warn('CourseAPI.getById: Course not found', { course_id: id })
          throw new Error(`Course with ID ${id} not found`)
        }
        
        // Handle relationship errors
        if (error.message?.includes('relationship between') && 
            error.message?.includes('courses') && 
            error.message?.includes('modules')) {
          console.warn('CourseAPI.getById: Relationship error detected, using fallback query')
          return await this.getByIdWithFallback(id)
        }
        
        if (error.code === '42703') { // Column does not exist
          console.warn('CourseAPI.getById: Column not found, attempting fallback')
          return await this.getByIdWithFallback(id)
        }

        // Handle PostgREST errors that might indicate relationship issues
        if (error.code === 'PGRST200' || error.code === 'PGRST201') {
          console.warn('CourseAPI.getById: PostgREST relationship error, using fallback query')
          return await this.getByIdWithFallback(id)
        }
        
        // Handle schema cache errors
        if (error.message?.includes('schema cache') || error.message?.includes('Could not find')) {
          console.warn('CourseAPI.getById: Schema cache error detected, using fallback query')
          return await this.getByIdWithFallback(id)
        }

        throw new Error(`Failed to retrieve course: ${error.message}`)
      }

      // Validate returned data
      if (!data || !data.id) {
        console.error('CourseAPI.getById: Invalid data structure returned', { data, course_id: id })
        throw new Error('Invalid course data returned from database')
      }

      console.log('CourseAPI.getById: Successfully retrieved course', {
        course_id: id,
        title: data.title,
        modules_count: data.modules ? data.modules.length : 0,
        timestamp: new Date().toISOString()
      })

      // Ensure created_by field exists with fallback
      return {
        ...data,
        created_by: data.created_by || null,
        modules: Array.isArray(data.modules) ? data.modules : []
      }
      
    } catch (err) {
      console.error('CourseAPI.getById: Unexpected error', {
        course_id: id,
        error: err,
        stack: err instanceof Error ? err.stack : undefined,
        timestamp: new Date().toISOString()
      })
      
      if (err instanceof Error) {
        throw new Error(`Course retrieval failed: ${err.message}`)
      }
      
      throw new Error('Course retrieval failed due to unexpected error')
    }
  },

  // Fallback method for getById
  async getByIdWithFallback(id: string) {
    console.log('CourseAPI.getByIdWithFallback: Attempting fallback query', { course_id: id })
    
    try {
      // Try basic course query first
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()

      if (courseError) {
        console.error('CourseAPI.getByIdWithFallback: Basic course query failed', {
          course_id: id,
          error: courseError
        })
        throw courseError
      }

      // Try to fetch modules separately with better error handling
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', id)
        .order('order_index', { ascending: true })

      if (modulesError) {
        console.warn('CourseAPI.getByIdWithFallback: Failed to fetch modules', {
          course_id: id,
          error: modulesError
        })
        // Continue without modules rather than failing
        return { 
          ...course, 
          modules: [],
          _fallback_note: 'Modules could not be loaded due to database relationship issue'
        }
      }

      console.log('CourseAPI.getByIdWithFallback: Successfully retrieved course with fallback', {
        course_id: id,
        modules_count: modules?.length || 0
      })

      return { 
        ...course, 
        modules: modules || [],
        created_by: course.created_by || null
      }

    } catch (err) {
      console.error('CourseAPI.getByIdWithFallback: Fallback strategy failed', {
        course_id: id,
        error: err
      })
      throw new Error(`Course retrieval failed for ID ${id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  },

  async create(course: Tables['courses']['Insert']) {
    console.log('API: Creating course with data:', course)
    
    // Validate required fields on the API side as well
    if (!course.title) {
      console.error('API: Course title is missing')
      throw new Error('Course title is required')
    }
    
    if (!course.description) {
      console.error('API: Course description is missing')
      throw new Error('Course description is required')
    }
    
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert([course])
        .select()
        .single()
      
      if (error) {
        console.error('API: Supabase error creating course:', error)
        console.error('API: Error code:', error.code)
        console.error('API: Error message:', error.message)
        console.error('API: Error details:', error.details)
        throw error
      }
      
      console.log('API: Course created successfully:', data)
      return data
    } catch (err) {
      console.error('API: Exception creating course:', err)
      throw err
    }
  },

  async update(id: string, updates: Partial<Course>) {
    console.log('CourseAPI.update: Updating course', { id, updates })
    
    try {
      // Validate required fields if they're being updated
      if (updates.title !== undefined && !updates.title) {
        throw new Error('Course title cannot be empty')
      }
      
      if (updates.description !== undefined && !updates.description) {
        throw new Error('Course description cannot be empty')
      }
      
      // Log status update specifically for debugging
      if (updates.status !== undefined) {
        console.log('CourseAPI.update: Updating course status', { 
          course_id: id, 
          new_status: updates.status 
        })
      }
      
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('CourseAPI.update: Error updating course:', error)
        throw error
      }
      
      console.log('CourseAPI.update: Course updated successfully:', data)
      return data
    } catch (err) {
      console.error('CourseAPI.update: Exception updating course:', err)
      throw err
    }
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Module API functions
export const moduleAPI = {
  async getByCourseId(courseId: string) {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })
    
    if (error) throw error
    return data
  },

  async create(module: Tables['modules']['Insert']) {
    const { data, error } = await supabase
      .from('modules')
      .insert([module])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Module>) {
    const { data, error } = await supabase
      .from('modules')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Progress API functions
export const progressAPI = {
  async getUserProgress(userId: string) {
    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        *,
        courses (title, description)
      `)
      .eq('user_id', userId)
    
    if (error) throw error
    return data
  },

  async updateProgress(userId: string, courseId: string, updates: Partial<UserProgress>) {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        course_id: courseId,
        ...updates,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getModuleProgress(userId: string, moduleId: string) {
    const { data, error } = await supabase
      .from('module_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async updateModuleProgress(userId: string, moduleId: string, isCompleted: boolean) {
    const { data, error } = await supabase
      .from('module_progress')
      .upsert({
        user_id: userId,
        module_id: moduleId,
        is_completed: isCompleted,
        completion_date: isCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Study Session API functions
export const studySessionAPI = {
  async create(session: Tables['study_sessions']['Insert']) {
    const { data, error } = await supabase
      .from('study_sessions')
      .insert([session])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getUserSessions(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('study_sessions')
      .select(`
        *,
        modules (
          title,
          courses (title)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  async getRecentActivity(limit = 20) {
    const { data, error } = await supabase
      .from('study_sessions')
      .select(`
        *,
        users (name),
        modules (
          title,
          courses (title)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }
}

// Analytics API functions
export const analyticsAPI = {
  async getDashboardStats() {
    try {
      const [usersResult, coursesResult, sessionsResult] = await Promise.all([
        supabase.from('users').select('id, role').eq('role', 'student'),
        supabase.from('courses').select('id'),
        supabase.from('study_sessions').select('id, completed').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ])

      const totalStudents = usersResult.data?.length || 0
      const totalCourses = coursesResult.data?.length || 0
      const completedSessions = sessionsResult.data?.filter(s => s.completed).length || 0
      const totalSessions = sessionsResult.data?.length || 0
      const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

      return {
        totalStudents,
        totalCourses,
        completionRate,
        activeSessions: totalSessions
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }
  },

  async getStudyTechniqueStats() {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('technique')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    if (error) throw error

    const techniqueCount = data.reduce((acc, session) => {
      acc[session.technique] = (acc[session.technique] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return techniqueCount
  }
}

// Initialize sample data (for development)
export const initializeData = async () => {
  try {
    // Check if data already exists
    const { data: existingCourses } = await supabase
      .from('courses')
      .select('id')
      .limit(1)

    if (existingCourses && existingCourses.length > 0) {
      console.log('Sample data already exists')
      return
    }

    // Create sample courses
    const coursesData = [
      {
        title: 'Criminal Jurisprudence and Procedure',
        description: 'Comprehensive course on crime scene investigation and legal procedures',
        instructor_id: null
      },
      {
        title: 'Criminalistics',
        description: 'Scientific methods in criminal investigation and evidence analysis',
        instructor_id: null
      },
      {
        title: 'Correctional Administration',
        description: 'Management and administration of correctional facilities',
        instructor_id: null
      }
    ]

    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .insert(coursesData)
      .select()

    if (coursesError) throw coursesError

    // Create sample modules for the first course
    if (courses && courses.length > 0) {
      const modulesData = [
        {
          course_id: courses[0].id,
          title: 'Introduction to Criminal Law',
          description: 'Basic principles and concepts of criminal law',
          order_index: 1,
          available_techniques: ['active_recall', 'feynman_technique']
        },
        {
          course_id: courses[0].id,
          title: 'Elements of Crime',
          description: 'Understanding the fundamental elements that constitute a crime',
          order_index: 2,
          available_techniques: ['pomodoro_technique', 'retrieval_practice']
        },
        {
          course_id: courses[0].id,
          title: 'Criminal Procedure',
          description: 'Legal procedures in criminal cases',
          order_index: 3,
          available_techniques: ['active_recall', 'feynman_technique', 'retrieval_practice']
        }
      ]

      const { error: modulesError } = await supabase
        .from('modules')
        .insert(modulesData)

      if (modulesError) throw modulesError
    }

    console.log('Sample data initialized successfully')
  } catch (error) {
    console.error('Error initializing sample data:', error)
  }
}