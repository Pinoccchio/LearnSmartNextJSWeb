import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔑 Admin courses API called')
    
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

    // Verify user is an admin
    console.log('👤 Verifying admin role for user ID:', userId)
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('❌ Error fetching user profile:', userError)
      return NextResponse.json({ error: 'User verification failed' }, { status: 403 })
    }

    if (!userProfile || userProfile.role !== 'admin') {
      console.log('❌ User role check failed:', userProfile?.role)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('✅ Admin role verified')

    // Check query parameters for specific data requests
    const { searchParams } = new URL(request.url)
    const dataType = searchParams.get('type') // 'courses', 'instructors', or 'all'

    if (dataType === 'instructors') {
      // Fetch only instructors
      console.log('👥 Fetching instructors for admin')
      const { data: instructors, error: instructorsError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'instructor')
        .order('name', { ascending: true })

      if (instructorsError) {
        console.error('💥 Error fetching instructors:', instructorsError)
        return NextResponse.json({ 
          error: 'Failed to fetch instructors',
          details: instructorsError.message 
        }, { status: 500 })
      }

      console.log('✅ Instructors fetched successfully:', instructors?.length || 0)

      return NextResponse.json({
        success: true,
        instructors: instructors || [],
        count: instructors?.length || 0
      })
    }

    // Fetch courses with modules and related data
    console.log('📚 Fetching courses with modules for admin')
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
      .order('created_at', { ascending: false })

    if (coursesError) {
      console.error('💥 Error fetching courses:', coursesError)
      
      // Handle specific relationship errors with fallback
      if (coursesError.message?.includes('relationship between') || 
          coursesError.code === 'PGRST200' || 
          coursesError.code === 'PGRST201') {
        console.log('⚠️ Relationship error detected, using fallback query')
        
        // Fallback: fetch courses without modules first
        const { data: basicCourses, error: basicError } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (basicError) {
          throw new Error(`Fallback query also failed: ${basicError.message}`)
        }
        
        console.log('✅ Courses fetched successfully (fallback mode):', basicCourses?.length || 0)
        
        return NextResponse.json({
          success: true,
          courses: basicCourses || [],
          count: basicCourses?.length || 0,
          fallbackMode: true,
          message: 'Courses fetched using fallback query (modules not included)'
        })
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch courses',
        details: coursesError.message 
      }, { status: 500 })
    }

    console.log('✅ Courses fetched successfully:', courses?.length || 0, 'courses')

    // If we also need instructors, fetch them separately
    if (dataType === 'all') {
      console.log('👥 Also fetching instructors')
      const { data: instructors, error: instructorsError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'instructor')
        .order('name', { ascending: true })

      return NextResponse.json({
        success: true,
        courses: courses || [],
        instructors: instructors || [],
        coursesCount: courses?.length || 0,
        instructorsCount: instructors?.length || 0
      })
    }

    return NextResponse.json({
      success: true,
      courses: courses || [],
      count: courses?.length || 0
    })

  } catch (error: any) {
    console.error('💥 Error in admin courses API:', error)
    console.error('💥 Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    })
    
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch courses',
      details: 'Check server logs for more information'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Admin create course API called')
    
    // Authentication (same pattern as GET)
    const authHeader = request.headers.get('Authorization')
    let user = null
    let userId = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user: tokenUser }, error: authError } = await supabase.auth.getUser(token)
        if (!authError && tokenUser) {
          user = tokenUser
          userId = tokenUser.id
        }
      } catch (error) {
        console.log('⚠️ Token auth failed, trying alternative auth')
      }
    }
    
    if (!user) {
      userId = request.headers.get('X-User-ID')
      if (!userId) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      user = { id: userId }
    }

    // Verify admin role
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, instructor_id, status, image_url } = body

    // Validate required fields
    if (!title || !instructor_id) {
      return NextResponse.json({ 
        error: 'Title and instructor are required' 
      }, { status: 400 })
    }

    console.log('📚 Creating new course:', { title, instructor_id, status })

    const { data: newCourse, error: createError } = await supabase
      .from('courses')
      .insert({
        title,
        description: description || null,
        instructor_id,
        created_by: userId,
        status: status || 'active',
        image_url: image_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Course creation failed:', createError)
      throw new Error(`Course creation failed: ${createError.message}`)
    }

    console.log('✅ Course created successfully:', newCourse.id)

    return NextResponse.json({
      success: true,
      course: newCourse,
      message: 'Course created successfully'
    })

  } catch (error: any) {
    console.error('💥 Error creating course:', error)
    
    return NextResponse.json({ 
      error: error.message || 'Failed to create course',
      details: error.message
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔑 Admin update course API called')
    
    // Authentication (same pattern)
    const authHeader = request.headers.get('Authorization')
    let user = null
    let userId = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user: tokenUser }, error: authError } = await supabase.auth.getUser(token)
        if (!authError && tokenUser) {
          user = tokenUser
          userId = tokenUser.id
        }
      } catch (error) {
        console.log('⚠️ Token auth failed, trying alternative auth')
      }
    }
    
    if (!user) {
      userId = request.headers.get('X-User-ID')
      if (!userId) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      user = { id: userId }
    }

    // Verify admin role
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { courseId, updates } = body

    if (!courseId || !updates) {
      return NextResponse.json({ 
        error: 'Course ID and updates are required' 
      }, { status: 400 })
    }

    console.log('📝 Updating course:', courseId, 'with updates:', updates)

    const { data: updatedCourse, error: updateError } = await supabase
      .from('courses')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .select()
      .single()

    if (updateError) {
      console.error('Update failed:', updateError)
      throw new Error(`Update failed: ${updateError.message}`)
    }

    console.log('✅ Course updated successfully')

    return NextResponse.json({
      success: true,
      course: updatedCourse,
      message: 'Course updated successfully'
    })

  } catch (error: any) {
    console.error('💥 Error updating course:', error)
    
    return NextResponse.json({ 
      error: error.message || 'Failed to update course',
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🔑 Admin delete course API called')
    
    // Authentication (same pattern)
    const authHeader = request.headers.get('Authorization')
    let user = null
    let userId = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user: tokenUser }, error: authError } = await supabase.auth.getUser(token)
        if (!authError && tokenUser) {
          user = tokenUser
          userId = tokenUser.id
        }
      } catch (error) {
        console.log('⚠️ Token auth failed, trying alternative auth')
      }
    }
    
    if (!user) {
      userId = request.headers.get('X-User-ID')
      if (!userId) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      user = { id: userId }
    }

    // Verify admin role
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('id')

    if (!courseId) {
      return NextResponse.json({ 
        error: 'Course ID is required' 
      }, { status: 400 })
    }

    console.log('🗑️ Deleting course:', courseId)

    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (deleteError) {
      console.error('Delete failed:', deleteError)
      throw new Error(`Delete failed: ${deleteError.message}`)
    }

    console.log('✅ Course deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    })

  } catch (error: any) {
    console.error('💥 Error deleting course:', error)
    
    return NextResponse.json({ 
      error: error.message || 'Failed to delete course',
      details: error.message
    }, { status: 500 })
  }
}