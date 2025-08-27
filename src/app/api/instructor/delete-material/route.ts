import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
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

    // Verify user is an instructor or admin
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || (userProfile?.role !== 'instructor' && userProfile?.role !== 'admin')) {
      return NextResponse.json({ error: 'Instructor or admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('materialId')

    // Validate required fields
    if (!materialId) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 })
    }

    // Verify instructor has access to this material through module/course relationship
    const { data: material, error: materialError } = await supabase
      .from('course_materials')
      .select(`
        id,
        title,
        file_url,
        file_name,
        file_type,
        module_id,
        created_by,
        modules!inner(
          id,
          title,
          course_id,
          courses!inner(
            id,
            title,
            instructor_id
          )
        )
      `)
      .eq('id', materialId)
      .single()

    if (materialError || !material) {
      console.error('Material not found:', materialError)
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // Check if user has permission to delete this material
    const isInstructor = material.modules.courses.instructor_id === user.id
    const isAdmin = userProfile?.role === 'admin'
    const isCreator = material.created_by === user.id

    if (!isInstructor && !isAdmin && !isCreator) {
      return NextResponse.json({ error: 'Access denied. You do not have permission to delete this material.' }, { status: 403 })
    }

    console.log('Deleting material:', {
      id: materialId,
      title: material.title,
      file_name: material.file_name,
      file_url: material.file_url,
      course: material.modules.courses.title
    })

    // Extract file path from the file_url for storage deletion
    let filePath = null
    if (material.file_url) {
      try {
        // Extract the file path from Supabase storage URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        const urlParts = material.file_url.split('/storage/v1/object/public/')
        if (urlParts.length > 1) {
          const pathPart = urlParts[1]
          const bucketAndPath = pathPart.split('/')
          if (bucketAndPath.length > 1) {
            filePath = bucketAndPath.slice(1).join('/') // Remove bucket name, keep path
          }
        }
      } catch (error) {
        console.warn('Failed to parse file path from URL:', material.file_url, error)
      }
    }

    // Delete the material from database first
    const { error: deleteError } = await supabase
      .from('course_materials')
      .delete()
      .eq('id', materialId)

    if (deleteError) {
      console.error('Error deleting material from database:', deleteError)
      return NextResponse.json({ error: 'Failed to delete material from database' }, { status: 500 })
    }

    console.log('Material deleted from database successfully')

    // Delete the file from Supabase storage if we have a valid path
    if (filePath) {
      try {
        const { error: storageError } = await supabase.storage
          .from('course-materials') // Assuming this is the bucket name
          .remove([filePath])

        if (storageError) {
          console.warn('Warning: Failed to delete file from storage:', storageError)
          // Don't fail the entire operation if storage deletion fails
          // The database record is already deleted
        } else {
          console.log('File deleted from storage successfully:', filePath)
        }
      } catch (storageError) {
        console.warn('Warning: Exception during storage deletion:', storageError)
        // Continue - database deletion was successful
      }
    } else {
      console.warn('Warning: Could not determine file path for storage deletion')
    }

    return NextResponse.json({
      success: true,
      message: 'Material deleted successfully',
      material: {
        id: materialId,
        title: material.title,
        file_name: material.file_name
      }
    })

  } catch (error: any) {
    console.error('Error in delete-material API:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    
    // Handle specific error types
    if (error.code === '23503') { // Foreign key violation
      return NextResponse.json({ 
        error: 'Cannot delete material. It may be referenced by other content.',
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
      error: error.message || 'Failed to delete material',
      details: 'Check server logs for more information'
    }, { status: 500 })
  }
}