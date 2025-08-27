import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('📚 Get quizzes API called')
    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get('moduleId')

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })
    }

    // Try to get user from Authorization header first (fallback for existing auth)
    const authHeader = request.headers.get('Authorization')
    let user = null
    let userId = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log('🔐 Found Authorization header, attempting token auth')
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user: tokenUser }, error: authError } = await supabase.auth.getUser(token)
        if (!authError && tokenUser) {
          user = tokenUser
          userId = tokenUser.id
          console.log('✅ Token auth successful')
        }
      } catch (error) {
        console.log('⚠️ Token auth failed, trying alternative auth')
      }
    }
    
    // Alternative: Try to get user from custom headers
    if (!user) {
      console.log('🔐 Trying custom header auth')
      userId = request.headers.get('X-User-ID')
      const userRole = request.headers.get('X-User-Role')
      
      if (!userId) {
        console.log('❌ No user authentication found')
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      
      console.log('✅ Found user ID in headers:', userId, 'role:', userRole)
      // Create a user object for compatibility
      user = { id: userId }
    }

    // Verify user has access to this module (instructor or admin)
    console.log('📚 Verifying module access for module ID:', moduleId)
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select(`
        *,
        courses!inner(instructor_id, title)
      `)
      .eq('id', moduleId)
      .single()

    if (moduleError) {
      console.error('❌ Error fetching module:', moduleError)
      return NextResponse.json({ error: 'Module verification failed' }, { status: 404 })
    }

    if (!module) {
      console.log('❌ Module not found')
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Check if user is instructor or admin
    console.log('👤 Verifying user role for user ID:', userId)
    const { data: userRole, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (roleError) {
      console.error('❌ Error fetching user role:', roleError)
      return NextResponse.json({ error: 'User verification failed' }, { status: 404 })
    }

    const isInstructor = userRole.role === 'instructor' && module.courses.instructor_id === userId
    const isAdmin = userRole.role === 'admin'

    console.log('✅ Access check:', { role: userRole.role, isInstructor, isAdmin })

    if (!isInstructor && !isAdmin) {
      console.log('❌ Access denied for user')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    console.log('✅ Module access verified:', module.courses.title)

    // Fetch quizzes for this module with proper relationship handling
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select(`
        id,
        title,
        description,
        questions,
        time_limit,
        passing_score,
        ai_generated,
        study_techniques,
        source_material_id,
        status,
        created_by,
        created_at,
        updated_at,
        course_materials!left(title, file_name)
      `)
      .eq('module_id', moduleId)
      .order('created_at', { ascending: false })

    if (quizzesError) {
      console.error('❌ Error fetching quizzes:', quizzesError)
      return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 })
    }

    console.log('✅ Quizzes fetched successfully:', quizzes.length, 'quizzes found')

    // Process and validate quiz data for frontend compatibility
    const processedQuizzes = quizzes.map((quiz, index) => {
      try {
        // Ensure questions field is properly structured
        let questions = quiz.questions
        if (questions && typeof questions === 'object') {
          // If questions is a JSONB object, extract the questions array
          if (questions.questions && Array.isArray(questions.questions)) {
            questions = questions.questions
          }
        }

        // Process study_techniques JSONB array for frontend compatibility
        let studyTechniques = ['general'] // Default fallback
        let singleTechnique = 'general' // For backward compatibility
        
        if (quiz.study_techniques) {
          try {
            // Handle JSONB array format
            if (Array.isArray(quiz.study_techniques)) {
              studyTechniques = quiz.study_techniques
            } else if (typeof quiz.study_techniques === 'string') {
              // Parse JSON string if needed
              studyTechniques = JSON.parse(quiz.study_techniques)
            }
            
            // Set primary technique for backward compatibility
            singleTechnique = studyTechniques[0] || 'general'
          } catch (parseError) {
            console.warn(`⚠️ Error parsing study_techniques for quiz ${quiz.id}:`, parseError)
            studyTechniques = ['general']
            singleTechnique = 'general'
          }
        }

        // Validate essential fields
        if (!quiz.id || !quiz.title) {
          console.warn(`⚠️ Quiz at index ${index} missing essential fields:`, {
            id: quiz.id,
            title: quiz.title
          })
        }

        return {
          ...quiz,
          questions: Array.isArray(questions) ? questions : [],
          time_limit: quiz.time_limit || 0,
          passing_score: quiz.passing_score || 70,
          ai_generated: quiz.ai_generated || false,
          study_techniques: studyTechniques, // New multi-technique array
          study_technique: singleTechnique, // Keep for backward compatibility
          status: quiz.status || 'draft'
        }
      } catch (error) {
        console.error(`❌ Error processing quiz at index ${index}:`, error)
        // Return a minimal valid quiz object to prevent frontend crashes
        return {
          id: quiz.id || `invalid-${index}`,
          title: quiz.title || 'Invalid Quiz',
          description: quiz.description || '',
          questions: [],
          time_limit: 0,
          passing_score: 70,
          ai_generated: false,
          study_techniques: ['general'],
          study_technique: 'general',
          status: 'draft',
          created_at: quiz.created_at || new Date().toISOString(),
          course_materials: quiz.course_materials || null
        }
      }
    })

    return NextResponse.json({
      success: true,
      quizzes: processedQuizzes,
      count: processedQuizzes.length,
      module: {
        id: module.id,
        title: module.title,
        course_title: module.courses.title
      }
    })

  } catch (error: any) {
    console.error('❌ Error in get quizzes API:', error)
    
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch quizzes' 
    }, { status: 500 })
  }
}