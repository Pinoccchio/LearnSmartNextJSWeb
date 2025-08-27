import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Module creation API called')
    
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

    // Verify user is an instructor
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

    const body = await request.json()
    const { courseId, title, description, orderIndex } = body

    // Validate required fields
    console.log('Validating module data:', { 
      courseId, 
      titleLength: title?.trim().length, 
      descriptionLength: description?.length,
      orderIndex 
    })

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Module title is required' }, { status: 400 })
    }

    if (title.trim().length > 200) {
      console.log('Title too long:', title.trim().length, 'characters')
      return NextResponse.json({ error: 'Module title must be 200 characters or less' }, { status: 400 })
    }

    if (description && description.length > 500) {
      console.log('Description too long:', description.length, 'characters')
      return NextResponse.json({ error: 'Module description must be 500 characters or less' }, { status: 400 })
    }

    console.log('All validations passed')

    // Verify instructor has access to this course
    console.log('🏫 Verifying course access for course:', courseId, 'user:', userId)
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, instructor_id')
      .eq('id', courseId)
      .eq('instructor_id', userId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 })
    }

    // Check if a module with the same title already exists in this course
    console.log('Checking for existing module with title:', title.trim())
    const { data: existingModule, error: existingError } = await supabase
      .from('modules')
      .select('id, title')
      .eq('course_id', courseId)
      .eq('title', title.trim())
      .maybeSingle()

    if (existingError) {
      console.error('Error checking existing modules:', existingError)
      return NextResponse.json({ 
        error: 'Failed to validate module uniqueness',
        details: existingError.message 
      }, { status: 500 })
    }

    if (existingModule) {
      console.log('Found existing module with same title:', existingModule)
      return NextResponse.json({ error: 'A module with this title already exists in this course' }, { status: 409 })
    }

    console.log('No existing module found, proceeding with creation')

    // Get current modules count to validate order index
    const { data: existingModules, error: modulesError } = await supabase
      .from('modules')
      .select('order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })

    if (modulesError) {
      console.error('Error fetching existing modules:', modulesError)
      return NextResponse.json({ error: 'Failed to validate module order' }, { status: 500 })
    }

    const maxOrderIndex = existingModules.length
    const validOrderIndex = Math.max(0, Math.min(orderIndex || maxOrderIndex, maxOrderIndex))

    // If inserting in the middle, we need to update order_index of subsequent modules
    if (validOrderIndex < maxOrderIndex) {
      console.log('Updating module order for insertion at index:', validOrderIndex)
      
      // Get modules that need to be reordered
      const { data: modulesToUpdate, error: fetchError } = await supabase
        .from('modules')
        .select('id, order_index')
        .eq('course_id', courseId)
        .gte('order_index', validOrderIndex)
        .order('order_index', { ascending: true })

      if (fetchError) {
        console.error('Error fetching modules to update:', fetchError)
        return NextResponse.json({ error: 'Failed to fetch modules for reordering' }, { status: 500 })
      }

      // Update each module individually
      for (const module of modulesToUpdate || []) {
        const { error: updateError } = await supabase
          .from('modules')
          .update({ order_index: module.order_index + 1 })
          .eq('id', module.id)

        if (updateError) {
          console.error('Error updating module order for module:', module.id, updateError)
          return NextResponse.json({ error: 'Failed to reorder existing modules' }, { status: 500 })
        }
      }
    }

    // Find the prerequisite module for sequential learning
    let prerequisiteModuleId = null
    if (validOrderIndex > 0) {
      // Find the module that will be before this one
      const { data: previousModule } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId)
        .eq('order_index', validOrderIndex - 1)
        .single()
      
      if (previousModule) {
        prerequisiteModuleId = previousModule.id
        console.log('Setting prerequisite module:', prerequisiteModuleId)
      }
    }

    // Create the new module with all required fields
    const moduleData = {
      course_id: courseId,
      title: title.trim(),
      description: description?.trim() || null,
      order_index: validOrderIndex,
      available_techniques: ["active_recall", "feynman_technique", "pomodoro_technique", "retrieval_practice"],
      // Sequential learning fields
      prerequisite_module_id: prerequisiteModuleId, // Set prerequisite based on order
      passing_threshold: 80, // Default 80% passing threshold
      is_locked: false, // Default unlocked - locking is handled per-user in module_progress table
      created_by: userId
    }

    console.log('Creating module with data:', moduleData)

    console.log('Attempting to insert module into database...')
    const { data: newModule, error: insertError } = await supabase
      .from('modules')
      .insert([moduleData])
      .select(`
        id,
        title,
        description,
        order_index,
        prerequisite_module_id,
        passing_threshold,
        is_locked,
        created_by,
        created_at,
        updated_at,
        course_id
      `)
      .single()

    if (insertError) {
      console.error('Error creating module:', insertError)
      console.error('Module data that failed:', moduleData)
      console.error('Insert error details:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      })
      return NextResponse.json({ 
        error: 'Failed to create module',
        details: insertError.message,
        code: insertError.code
      }, { status: 500 })
    }

    console.log('Module insertion successful')

    // Update the prerequisite for the next module if we inserted in the middle
    if (validOrderIndex < maxOrderIndex) {
      console.log('Updating prerequisite for next module at index:', validOrderIndex + 1)
      const { error: nextUpdateError } = await supabase
        .from('modules')
        .update({ prerequisite_module_id: newModule.id })
        .eq('course_id', courseId)
        .eq('order_index', validOrderIndex + 1)

      if (nextUpdateError) {
        console.error('Warning: Failed to update next module prerequisite:', nextUpdateError)
        // Don't fail the request, module was created successfully
      }
    }

    console.log('Module created successfully:', {
      id: newModule.id,
      title: newModule.title,
      course: course.title,
      orderIndex: newModule.order_index,
      prerequisite: prerequisiteModuleId,
      note: 'Module locking handled per-user in module_progress table'
    })

    return NextResponse.json({
      success: true,
      module: newModule,
      message: 'Module created successfully with sequential learning enabled'
    })

  } catch (error: any) {
    console.error('Error in add-module API:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    })
    
    // Handle specific error types
    if (error.message?.includes('violates foreign key constraint')) {
      return NextResponse.json({ 
        error: 'Invalid course ID provided',
        details: error.message 
      }, { status: 400 })
    }

    if (error.message?.includes('duplicate key value')) {
      return NextResponse.json({ 
        error: 'A module with this title already exists',
        details: error.message 
      }, { status: 409 })
    }

    if (error.code) {
      return NextResponse.json({ 
        error: `Database error: ${error.message}`,
        code: error.code,
        details: error.details || error.hint
      }, { status: 500 })
    }

    return NextResponse.json({ 
      error: error.message || 'Failed to create module',
      details: 'Check server logs for more information'
    }, { status: 500 })
  }
}

// Get modules for a course (for validation and ordering)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    // Get the authorization header from the request
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Extract the token and get user session
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Verify instructor has access to this course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .eq('instructor_id', user.id)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 })
    }

    // Get modules for this course
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title, description, order_index, created_at')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })

    if (modulesError) {
      console.error('Error fetching modules:', modulesError)
      return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      course,
      modules: modules || [],
      count: modules?.length || 0
    })

  } catch (error: any) {
    console.error('Error fetching modules:', error)
    
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch modules' 
    }, { status: 500 })
  }
}