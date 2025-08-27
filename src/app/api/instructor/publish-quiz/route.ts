import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
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
    const quizId = searchParams.get('quizId')
    const status = searchParams.get('status')

    // Validate required fields
    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 })
    }

    if (!status || !['draft', 'published', 'archived'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required (draft, published, archived)' }, { status: 400 })
    }

    // Verify instructor has access to this quiz through module/course relationship
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select(`
        id,
        title,
        status,
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
      .eq('id', quizId)
      .single()

    if (quizError || !quiz) {
      console.error('Quiz not found:', quizError)
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Check if user has permission to update this quiz
    const isInstructor = quiz.modules.courses.instructor_id === user.id
    const isAdmin = userProfile?.role === 'admin'
    const isCreator = quiz.created_by === user.id

    if (!isInstructor && !isAdmin && !isCreator) {
      return NextResponse.json({ error: 'Access denied. You do not have permission to modify this quiz.' }, { status: 403 })
    }

    // Prevent unnecessary updates
    if (quiz.status === status) {
      return NextResponse.json({ 
        success: true,
        message: `Quiz is already ${status}`,
        quiz: {
          id: quizId,
          title: quiz.title,
          status: quiz.status
        }
      })
    }

    console.log('Updating quiz status:', {
      id: quizId,
      title: quiz.title,
      currentStatus: quiz.status,
      newStatus: status,
      course: quiz.modules.courses.title,
      updatedBy: user.id
    })

    // Update the quiz status
    const { data: updatedQuiz, error: updateError } = await supabase
      .from('quizzes')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', quizId)
      .select('id, title, status, updated_at')
      .single()

    if (updateError) {
      console.error('Error updating quiz status:', updateError)
      return NextResponse.json({ error: 'Failed to update quiz status' }, { status: 500 })
    }

    console.log('Quiz status updated successfully:', {
      id: quizId,
      title: updatedQuiz.title,
      newStatus: updatedQuiz.status,
      updatedAt: updatedQuiz.updated_at
    })

    // Create appropriate response message
    let message = ''
    switch (status) {
      case 'published':
        message = 'Quiz published successfully. It is now visible to enrolled students.'
        break
      case 'draft':
        message = 'Quiz moved to draft. It is no longer visible to students.'
        break
      case 'archived':
        message = 'Quiz archived successfully. It is hidden from both instructors and students.'
        break
      default:
        message = 'Quiz status updated successfully.'
    }

    return NextResponse.json({
      success: true,
      message: message,
      quiz: {
        id: quizId,
        title: updatedQuiz.title,
        status: updatedQuiz.status,
        previousStatus: quiz.status,
        updated_at: updatedQuiz.updated_at
      }
    })

  } catch (error: any) {
    console.error('Error in publish-quiz API:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    
    // Handle specific error types
    if (error.code === '23503') { // Foreign key violation
      return NextResponse.json({ 
        error: 'Cannot update quiz status. Quiz may be referenced by other records.',
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
      error: error.message || 'Failed to update quiz status',
      details: 'Check server logs for more information'
    }, { status: 500 })
  }
}