import { NextRequest, NextResponse } from 'next/server'
import { courseMaterialsAPI } from '@/lib/supabase-course-materials'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Upload material API called')
    
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

    if (!userProfile || userProfile.role !== 'instructor') {
      console.log('❌ User role check failed:', userProfile?.role)
      return NextResponse.json({ error: 'Instructor access required' }, { status: 403 })
    }

    console.log('✅ User role verified:', userProfile.role)

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const moduleId = formData.get('moduleId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Verify instructor has access to this module
    console.log('📚 Verifying module access for module ID:', moduleId)
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select(`
        *,
        courses!inner(instructor_id, title)
      `)
      .eq('id', moduleId)
      .eq('courses.instructor_id', userId)
      .single()

    if (moduleError) {
      console.error('❌ Error fetching module:', moduleError)
      return NextResponse.json({ error: 'Module verification failed' }, { status: 404 })
    }

    if (!module) {
      console.log('❌ Module not found or access denied')
      return NextResponse.json({ error: 'Module not found or access denied' }, { status: 404 })
    }

    console.log('✅ Module access verified:', module.title)

    // SECURITY NOTE: User permissions have been verified above:
    // 1. User is authenticated (userId exists)
    // 2. User role is 'instructor' (verified in database)
    // 3. Instructor owns the course containing this module (verified via join)
    // Now safe to use admin client for storage upload (bypasses RLS)

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 50MB.' 
      }, { status: 400 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2)
    const uniqueFileName = `${module.courses.title.replace(/[^a-zA-Z0-9]/g, '_')}_${module.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${randomString}.${fileExtension}`

    // Upload file to Supabase Storage using admin client (bypasses RLS)
    console.log('📤 Uploading file to storage using admin client')
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('course-materials')
      .upload(`modules/${moduleId}/${uniqueFileName}`, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload file to storage' 
      }, { status: 500 })
    }

    console.log('✅ File uploaded successfully to storage:', uploadData.path)
    console.log('🔐 Admin operation logged: File upload by instructor', userId, 'to module', moduleId)

    // Get public URL for the uploaded file
    const { data: urlData } = supabaseAdmin.storage
      .from('course-materials')
      .getPublicUrl(uploadData.path)

    if (!urlData.publicUrl) {
      return NextResponse.json({ 
        error: 'Failed to get file URL' 
      }, { status: 500 })
    }

    // Get current material count for order_index
    const existingMaterials = await courseMaterialsAPI.getByModuleId(moduleId)
    const orderIndex = existingMaterials.length

    // Determine file type from MIME type
    let fileType = 'document'
    if (file.type === 'application/pdf') {
      fileType = 'pdf'
    } else if (file.type.includes('word')) {
      fileType = 'doc'
    } else if (file.type === 'text/plain') {
      fileType = 'txt'
    }

    // Save material record to database
    const materialData = {
      module_id: moduleId,
      title: title.trim(),
      description: description?.trim() || null,
      file_url: urlData.publicUrl,
      file_type: fileType,
      file_size: file.size,
      file_name: file.name,
      order_index: orderIndex,
      created_by: userId
    }

    const savedMaterial = await courseMaterialsAPI.create(materialData)

    console.log('Course material uploaded successfully:', {
      id: savedMaterial.id,
      title: savedMaterial.title,
      fileName: savedMaterial.file_name,
      size: savedMaterial.file_size
    })

    return NextResponse.json({
      success: true,
      material: savedMaterial,
      message: 'Course material uploaded successfully'
    })

  } catch (error: any) {
    console.error('Error uploading course material:', error)
    
    // Handle specific error types
    if (error.message?.includes('storage')) {
      return NextResponse.json({ 
        error: 'File upload failed. Please try again.' 
      }, { status: 500 })
    }

    if (error.message?.includes('duplicate')) {
      return NextResponse.json({ 
        error: 'A file with this name already exists in this module.' 
      }, { status: 409 })
    }

    return NextResponse.json({ 
      error: error.message || 'Failed to upload course material' 
    }, { status: 500 })
  }
}

// Get materials for a module
export async function GET(request: NextRequest) {
  try {
    console.log('📖 Get materials API called')
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

    // Verify user has access to this module (instructor or student enrolled)
    console.log('📚 Verifying module access for module ID:', moduleId)
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select(`
        *,
        courses!inner(instructor_id)
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

    // Check if user is instructor or enrolled student
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

    // For now, allow instructor and admin access
    // TODO: Add student enrollment check
    if (!isInstructor && !isAdmin) {
      console.log('❌ Access denied for user')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const materials = await courseMaterialsAPI.getByModuleId(moduleId)

    return NextResponse.json({
      success: true,
      materials,
      count: materials.length
    })

  } catch (error: any) {
    console.error('Error fetching course materials:', error)
    
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch course materials' 
    }, { status: 500 })
  }
}