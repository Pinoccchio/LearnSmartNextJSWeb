import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🏫 Instructor courses API called')
    
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

    // Verify user is an instructor or admin
    console.log('👤 Verifying user role for user ID:', userId)
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('❌ Error fetching user profile:', userError)
      return NextResponse.json({ error: 'User verification failed' }, { status: 403 })
    }

    if (!userProfile || (userProfile.role !== 'instructor' && userProfile.role !== 'admin')) {
      console.log('❌ User role check failed:', userProfile?.role)
      return NextResponse.json({ error: 'Instructor or admin access required' }, { status: 403 })
    }

    console.log('✅ User role verified:', userProfile.role)

    // Fetch instructor's courses with modules and materials only
    // Note: Quizzes are now student-generated, so instructors don't manage them
    console.log('📚 Fetching courses for instructor:', userId)
    const { data: courses, error: coursesError } = await supabase
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
      .eq('instructor_id', userId)
      .order('created_at', { ascending: false })

    if (coursesError) {
      console.error('💥 Error fetching courses:', coursesError)
      return NextResponse.json({ 
        error: 'Failed to fetch courses',
        details: coursesError.message 
      }, { status: 500 })
    }

    console.log('✅ Courses fetched successfully:', courses?.length || 0, 'courses')

    return NextResponse.json({
      success: true,
      courses: courses || [],
      count: courses?.length || 0
    })

  } catch (error: any) {
    console.error('💥 Error in instructor courses API:', error)
    console.error('💥 Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    })
    
    // Handle specific error types
    if (error.message?.includes('violates foreign key constraint')) {
      return NextResponse.json({ 
        error: 'Data integrity error',
        details: error.message 
      }, { status: 400 })
    }

    if (error.code) {
      return NextResponse.json({ 
        error: `Database error: ${error.message}`,
        code: error.code,
        details: error.details || error.hint
      }, { status: 500 })
    }

    return NextResponse.json({ 
      error: error.message || 'Failed to fetch courses',
      details: 'Check server logs for more information'
    }, { status: 500 })
  }
}