import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    console.log('🔧 Module edit API called')
    
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

    // Get module ID from URL params
    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get('moduleId')

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })
    }

    // Get request body
    const body = await request.json()
    const { title, description, orderIndex } = body

    console.log('📝 Edit request data:', { 
      moduleId,
      title: title?.trim(), 
      titleLength: title?.trim().length,
      descriptionLength: description?.length,
      orderIndex
    })

    // Validate required fields
    if (!title || !title.trim()) {
      console.log('❌ Validation failed: Empty title')
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

    // Fetch the existing module and verify access
    console.log('🔍 Fetching existing module:', moduleId)
    const { data: existingModule, error: moduleError } = await supabase
      .from('modules')
      .select(`
        id,
        title,
        description,
        order_index,
        course_id,
        courses!inner(id, title, instructor_id)
      `)
      .eq('id', moduleId)
      .single()

    if (moduleError || !existingModule) {
      console.error('❌ Error fetching module:', moduleError)
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Verify instructor has access to this module's course
    const isInstructor = userProfile.role === 'instructor' && existingModule.courses.instructor_id === userId
    const isAdmin = userProfile.role === 'admin'

    if (!isInstructor && !isAdmin) {
      console.log('❌ Access denied: User does not own this module\'s course')
      return NextResponse.json({ error: 'Access denied. You can only edit modules in your own courses.' }, { status: 403 })
    }

    console.log('✅ Module access verified:', existingModule.courses.title)

    // Check if a module with the same title already exists in this course (excluding current module)
    console.log('Checking for existing module with title:', title.trim())
    const { data: duplicateModule, error: duplicateError } = await supabase
      .from('modules')
      .select('id, title')
      .eq('course_id', existingModule.course_id)
      .eq('title', title.trim())
      .neq('id', moduleId) // Exclude current module
      .maybeSingle()

    if (duplicateError) {
      console.error('Error checking duplicate modules:', duplicateError)
      return NextResponse.json({ 
        error: 'Database error while checking for duplicate titles',
        details: duplicateError.message 
      }, { status: 500 })
    }

    if (duplicateModule) {
      console.log('❌ Duplicate module title found:', duplicateModule.title)
      return NextResponse.json({ 
        error: `A module with the title "${title.trim()}" already exists in this course. Please choose a different title.`,
        conflict: true
      }, { status: 409 })
    }

    // Handle order index changes if needed
    let needsReordering = false
    const newOrderIndex = orderIndex !== undefined ? orderIndex : existingModule.order_index
    
    if (newOrderIndex !== existingModule.order_index) {
      needsReordering = true
      console.log('🔄 Order index change detected:', existingModule.order_index, '→', newOrderIndex)
    }

    // If reordering is needed, update other modules first
    if (needsReordering) {
      console.log('Updating module order for reordering')
      
      // Get all modules in the course to handle reordering
      const { data: allModules, error: fetchError } = await supabase
        .from('modules')
        .select('id, order_index')
        .eq('course_id', existingModule.course_id)
        .order('order_index', { ascending: true })

      if (fetchError) {
        console.error('Error fetching modules for reordering:', fetchError)
        return NextResponse.json({ 
          error: 'Failed to reorder modules',
          details: fetchError.message 
        }, { status: 500 })
      }

      // Reorder logic: Remove current module, then insert at new position
      const otherModules = allModules.filter(m => m.id !== moduleId)
      const maxIndex = otherModules.length
      const validNewIndex = Math.max(0, Math.min(newOrderIndex, maxIndex))
      
      // Update order indices for affected modules
      for (let i = 0; i < otherModules.length; i++) {
        const targetModule = otherModules[i]
        let newIndex = i
        
        // If inserting before this position, shift everything after up by 1
        if (i >= validNewIndex) {
          newIndex = i + 1
        }
        
        if (newIndex !== targetModule.order_index) {
          const { error: updateError } = await supabase
            .from('modules')
            .update({ order_index: newIndex })
            .eq('id', targetModule.id)
          
          if (updateError) {
            console.warn('Warning: Failed to reorder module:', targetModule.id, updateError)
            // Don't fail the entire operation for reordering issues
          }
        }
      }
    }

    // Update the module
    console.log('💾 Updating module:', moduleId)
    const { data: updatedModule, error: updateError } = await supabase
      .from('modules')
      .update({
        title: title.trim(),
        description: description?.trim() || null,
        order_index: newOrderIndex,
        updated_at: new Date().toISOString()
      })
      .eq('id', moduleId)
      .select('id, title, description, order_index, updated_at')
      .single()

    if (updateError) {
      console.error('💥 Error updating module:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update module',
        details: updateError.message 
      }, { status: 500 })
    }

    // If we reordered, fix prerequisites for sequential learning
    if (needsReordering) {
      console.log('🔗 Updating prerequisites for sequential learning after reordering')
      
      // Get all modules in the course ordered by new order_index
      const { data: orderedModules, error: fetchOrderedError } = await supabase
        .from('modules')
        .select('id, order_index')
        .eq('course_id', existingModule.course_id)
        .order('order_index', { ascending: true })

      if (!fetchOrderedError && orderedModules) {
        // Update prerequisites based on new order
        for (let i = 0; i < orderedModules.length; i++) {
          const currentModule = orderedModules[i]
          const previousModule = i > 0 ? orderedModules[i - 1] : null
          
          const { error: prereqError } = await supabase
            .from('modules')
            .update({
              prerequisite_module_id: previousModule ? previousModule.id : null
              // Note: is_locked removed - locking is handled per-user in module_progress table
            })
            .eq('id', currentModule.id)
          
          if (prereqError) {
            console.warn('Warning: Failed to update prerequisites for module:', currentModule.id, prereqError)
            // Don't fail the request, the main update succeeded
          }
        }
        console.log('✅ Prerequisites updated for sequential learning')
      }
    }

    console.log('✅ Module updated successfully:', {
      id: moduleId,
      title: updatedModule.title,
      course: existingModule.courses.title,
      orderIndex: newOrderIndex,
      updatedBy: userId
    })

    return NextResponse.json({
      success: true,
      message: 'Module updated successfully',
      module: updatedModule
    })

  } catch (error: any) {
    console.error('💥 Error in edit-module API:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    
    // Handle specific error types
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({ 
        error: 'A module with this title already exists in the course',
        code: error.code
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
      error: error.message || 'Failed to update module',
      details: 'Check server logs for more information'
    }, { status: 500 })
  }
}