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

    // Verify user is an instructor
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userProfile?.role !== 'instructor') {
      return NextResponse.json({ error: 'Instructor access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get('moduleId')
    const cascade = searchParams.get('cascade') === 'true'

    // Validate required fields
    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })
    }

    // Verify instructor has access to this module
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select(`
        id,
        title,
        order_index,
        course_id,
        courses!inner(id, instructor_id, title)
      `)
      .eq('id', moduleId)
      .eq('courses.instructor_id', user.id)
      .single()

    if (moduleError || !module) {
      return NextResponse.json({ error: 'Module not found or access denied' }, { status: 404 })
    }

    // Check if module has materials or quizzes
    const { data: materials } = await supabase
      .from('course_materials')
      .select('id, file_url, title')
      .eq('module_id', moduleId)

    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id, title')
      .eq('module_id', moduleId)

    const hasContent = (materials && materials.length > 0) || (quizzes && quizzes.length > 0)

    if (hasContent && !cascade) {
      return NextResponse.json({ 
        error: 'Cannot delete module with existing materials or quizzes. Please delete all content first or enable cascade deletion.',
        hasContent: true,
        materialsCount: materials?.length || 0,
        quizzesCount: quizzes?.length || 0
      }, { status: 409 })
    }

    // Handle cascade deletion if requested
    if (cascade && hasContent) {
      console.log('Performing cascade deletion for module:', moduleId, {
        materials: materials?.length || 0,
        quizzes: quizzes?.length || 0
      })

      // Delete all materials first (with file cleanup)
      if (materials && materials.length > 0) {
        for (const material of materials) {
          try {
            // Extract file path from the file_url for storage deletion
            let filePath = null
            if (material.file_url) {
              try {
                const urlParts = material.file_url.split('/storage/v1/object/public/')
                if (urlParts.length > 1) {
                  const pathPart = urlParts[1]
                  const bucketAndPath = pathPart.split('/')
                  if (bucketAndPath.length > 1) {
                    filePath = bucketAndPath.slice(1).join('/')
                  }
                }
              } catch (error) {
                console.warn('Failed to parse file path from URL:', material.file_url, error)
              }
            }

            // Delete material from database
            const { error: deleteMaterialError } = await supabase
              .from('course_materials')
              .delete()
              .eq('id', material.id)

            if (deleteMaterialError) {
              console.error('Error deleting material:', material.id, deleteMaterialError)
              throw new Error(`Failed to delete material: ${material.title}`)
            }

            // Delete file from storage if path exists
            if (filePath) {
              try {
                const { error: storageError } = await supabase.storage
                  .from('course-materials')
                  .remove([filePath])

                if (storageError) {
                  console.warn('Warning: Failed to delete file from storage:', storageError)
                  // Continue - database deletion was successful
                } else {
                  console.log('File deleted from storage:', filePath)
                }
              } catch (storageError) {
                console.warn('Warning: Exception during storage deletion:', storageError)
                // Continue - database deletion was successful
              }
            }

            console.log('Material deleted successfully:', material.id, material.title)
          } catch (error) {
            console.error('Error deleting material during cascade:', material.id, error)
            return NextResponse.json({ 
              error: `Failed to delete material "${material.title}" during cascade deletion: ${error.message}`,
              materialId: material.id
            }, { status: 500 })
          }
        }
      }

      // Delete all quizzes
      if (quizzes && quizzes.length > 0) {
        for (const quiz of quizzes) {
          try {
            const { error: deleteQuizError } = await supabase
              .from('quizzes')
              .delete()
              .eq('id', quiz.id)

            if (deleteQuizError) {
              console.error('Error deleting quiz:', quiz.id, deleteQuizError)
              throw new Error(`Failed to delete quiz: ${quiz.title}`)
            }

            console.log('Quiz deleted successfully:', quiz.id, quiz.title)
          } catch (error) {
            console.error('Error deleting quiz during cascade:', quiz.id, error)
            return NextResponse.json({ 
              error: `Failed to delete quiz "${quiz.title}" during cascade deletion: ${error.message}`,
              quizId: quiz.id
            }, { status: 500 })
          }
        }
      }

      console.log('Cascade deletion completed successfully for module:', moduleId)
    }

    // Get other modules in the same course for reordering
    const { data: siblingModules, error: siblingsError } = await supabase
      .from('modules')
      .select('id, order_index')
      .eq('course_id', module.course_id)
      .gt('order_index', module.order_index)
      .order('order_index', { ascending: true })

    if (siblingsError) {
      console.error('Error fetching sibling modules:', siblingsError)
      return NextResponse.json({ error: 'Failed to prepare for module deletion' }, { status: 500 })
    }

    // Delete the module
    const { error: deleteError } = await supabase
      .from('modules')
      .delete()
      .eq('id', moduleId)

    if (deleteError) {
      console.error('Error deleting module:', deleteError)
      return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 })
    }

    // Reorder remaining modules (decrease order_index by 1 for modules that came after)
    if (siblingModules && siblingModules.length > 0) {
      for (const siblingModule of siblingModules) {
        const { error: updateError } = await supabase
          .from('modules')
          .update({ order_index: siblingModule.order_index - 1 })
          .eq('id', siblingModule.id)

        if (updateError) {
          console.warn('Warning: Failed to reorder module:', siblingModule.id, updateError)
          // Don't fail the entire operation for reordering issues
        }
      }
    }

    console.log('Module deleted successfully:', {
      id: moduleId,
      title: module.title,
      course: module.courses.title,
      cascadeDeleted: cascade && hasContent,
      materialsDeleted: cascade ? materials?.length || 0 : 0,
      quizzesDeleted: cascade ? quizzes?.length || 0 : 0
    })

    return NextResponse.json({
      success: true,
      message: cascade && hasContent 
        ? `Module and all content deleted successfully (${materials?.length || 0} materials, ${quizzes?.length || 0} quizzes)`
        : 'Module deleted successfully',
      cascadeDeleted: cascade && hasContent,
      materialsDeleted: cascade ? materials?.length || 0 : 0,
      quizzesDeleted: cascade ? quizzes?.length || 0 : 0
    })

  } catch (error: any) {
    console.error('Error in delete-module API:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    
    // Handle specific error types
    if (error.code === '23503') { // Foreign key violation
      return NextResponse.json({ 
        error: 'Cannot delete module with existing content. Please delete all materials and quizzes first.',
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
      error: error.message || 'Failed to delete module',
      details: 'Check server logs for more information'
    }, { status: 500 })
  }
}