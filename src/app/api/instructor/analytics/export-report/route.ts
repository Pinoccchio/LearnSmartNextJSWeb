import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('📊 [EXPORT] Starting analytics export API call')
    
    // Get user ID from headers
    const userId = request.headers.get('X-User-ID')
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify user is an instructor
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, id, name')
      .eq('id', userId)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Access denied. Instructor role required.' },
        { status: 403 }
      )
    }

    // Parse request body
    const { exportType, timeRange, includeCharts, includeDetails } = await request.json()

    // Get time range dates
    const now = new Date()
    let startDate = new Date()
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      default:
        startDate.setMonth(now.getMonth() - 1)
    }

    // Get instructor's courses and students
    const { data: instructorCourses } = await supabase
      .from('courses')
      .select('id, title, description, status, created_at')
      .eq('instructor_id', userId)

    if (!instructorCourses || instructorCourses.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          exportData: {
            summary: 'No courses found for this instructor',
            generatedAt: new Date().toISOString(),
            instructor: userProfile.name,
            timeRange,
            courses: []
          }
        }
      })
    }

    const courseIds = instructorCourses.map(c => c.id)
    
    // Get enrolled students
    const { data: enrolledStudents } = await supabase
      .rpc('get_instructor_enrolled_students', {
        p_instructor_id: userId
      })

    const studentIds = enrolledStudents?.map(s => s.student_id) || []

    // Get comprehensive data based on export type
    let exportData = {}

    if (exportType === 'comprehensive' || exportType === 'overview') {
      // Get modules and materials
      const { data: modules } = await supabase
        .from('modules')
        .select(`
          id,
          title,
          description,
          course_id,
          order_index,
          passing_threshold,
          available_techniques,
          created_at,
          courses!inner(title)
        `)
        .in('course_id', courseIds)
        .order('order_index', { ascending: true })

      const { data: courseMaterials } = await supabase
        .from('course_materials')
        .select(`
          id,
          title,
          file_type,
          file_size,
          created_at,
          module_id,
          modules!inner(
            id,
            title,
            course_id
          )
        `)
        .in('modules.course_id', courseIds)

      // Get user progress
      const { data: userProgress } = await supabase
        .from('user_module_progress')
        .select(`
          user_id,
          module_id,
          best_score,
          latest_score,
          status,
          passed,
          attempt_count,
          needs_remedial,
          completed_at,
          last_attempt_at,
          modules!inner(
            id,
            title,
            course_id,
            passing_threshold
          )
        `)
        .in('user_id', studentIds)
        .in('modules.course_id', courseIds)

      // Get study sessions
      const [activeRecallSessions, pomodoroSessions, feynmanSessions, retrievalSessions] = await Promise.all([
        supabase.from('active_recall_sessions')
          .select('id, user_id, module_id, created_at, status, completed_at')
          .in('user_id', studentIds)
          .gte('created_at', startDate.toISOString()),
        
        supabase.from('pomodoro_sessions')
          .select('id, user_id, module_id, created_at, status, completed_at')
          .in('user_id', studentIds)  
          .gte('created_at', startDate.toISOString()),
          
        supabase.from('feynman_sessions')
          .select('id, user_id, module_id, created_at, status, completed_at')
          .in('user_id', studentIds)
          .gte('created_at', startDate.toISOString()),
          
        supabase.from('retrieval_practice_sessions')
          .select('id, user_id, module_id, created_at, status, completed_at')
          .in('user_id', studentIds)
          .gte('created_at', startDate.toISOString())
      ])

      // Combine sessions
      const allSessions = [
        ...(activeRecallSessions.data || []).map(s => ({...s, session_type: 'active_recall'})),
        ...(pomodoroSessions.data || []).map(s => ({...s, session_type: 'pomodoro'})),
        ...(feynmanSessions.data || []).map(s => ({...s, session_type: 'feynman'})),
        ...(retrievalSessions.data || []).map(s => ({...s, session_type: 'retrieval_practice'}))
      ]

      // Build comprehensive report data
      const courseAnalysis = instructorCourses.map(course => {
        const courseModules = modules?.filter(m => m.course_id === course.id) || []
        const courseMats = courseMaterials?.filter(m => 
          courseModules.some(mod => mod.id === m.module_id)
        ) || []
        const courseProgress = userProgress?.filter(p => 
          courseModules.some(m => m.id === p.module_id)
        ) || []
        const courseSessions = allSessions.filter(s => 
          courseModules.some(m => m.id === s.module_id)
        )

        const moduleAnalysis = courseModules.map(module => {
          const moduleProgress = courseProgress.filter(p => p.module_id === module.id)
          const moduleSessions = courseSessions.filter(s => s.module_id === module.id)
          const moduleMaterials = courseMats.filter(m => m.module_id === module.id)

          return {
            id: module.id,
            title: module.title,
            description: module.description,
            orderIndex: module.order_index,
            passingThreshold: module.passing_threshold,
            availableTechniques: module.available_techniques,
            totalStudents: moduleProgress.length,
            completedStudents: moduleProgress.filter(p => p.status === 'completed' || p.passed).length,
            averageScore: moduleProgress.length > 0 ?
              Math.round(moduleProgress.reduce((sum, p) => sum + (parseFloat(p.best_score || '0')), 0) / moduleProgress.length) : 0,
            totalSessions: moduleSessions.length,
            totalMaterials: moduleMaterials.length,
            needRemedial: moduleProgress.filter(p => p.needs_remedial).length,
            sessionsByType: {
              active_recall: moduleSessions.filter(s => s.session_type === 'active_recall').length,
              pomodoro: moduleSessions.filter(s => s.session_type === 'pomodoro').length,
              feynman: moduleSessions.filter(s => s.session_type === 'feynman').length,
              retrieval_practice: moduleSessions.filter(s => s.session_type === 'retrieval_practice').length
            },
            materials: moduleMaterials.map(mat => ({
              id: mat.id,
              title: mat.title,
              fileType: mat.file_type,
              fileSize: mat.file_size,
              createdAt: mat.created_at
            }))
          }
        })

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          status: course.status,
          createdAt: course.created_at,
          totalModules: courseModules.length,
          totalMaterials: courseMats.length,
          totalStudents: new Set(courseProgress.map(p => p.user_id)).size,
          totalSessions: courseSessions.length,
          averageScore: courseProgress.length > 0 ?
            Math.round(courseProgress.reduce((sum, p) => sum + (parseFloat(p.best_score || '0')), 0) / courseProgress.length) : 0,
          completionRate: courseProgress.length > 0 ?
            Math.round((courseProgress.filter(p => p.passed).length / courseProgress.length) * 100) : 0,
          modules: includeDetails ? moduleAnalysis : moduleAnalysis.length
        }
      })

      // Summary statistics
      const summary = {
        totalCourses: instructorCourses.length,
        activeCourses: instructorCourses.filter(c => c.status === 'active').length,
        totalModules: modules?.length || 0,
        totalMaterials: courseMaterials?.length || 0,
        totalStudents: studentIds.length,
        totalSessions: allSessions.length,
        completedSessions: allSessions.filter(s => s.status === 'completed').length,
        averageScoreAcrossCourses: courseAnalysis.length > 0 ?
          Math.round(courseAnalysis.reduce((sum, c) => sum + c.averageScore, 0) / courseAnalysis.length) : 0,
        averageCompletionRate: courseAnalysis.length > 0 ?
          Math.round(courseAnalysis.reduce((sum, c) => sum + c.completionRate, 0) / courseAnalysis.length) : 0,
        sessionsByType: {
          active_recall: allSessions.filter(s => s.session_type === 'active_recall').length,
          pomodoro: allSessions.filter(s => s.session_type === 'pomodoro').length,
          feynman: allSessions.filter(s => s.session_type === 'feynman').length,
          retrieval_practice: allSessions.filter(s => s.session_type === 'retrieval_practice').length
        }
      }

      exportData = {
        summary,
        courses: courseAnalysis,
        generatedAt: new Date().toISOString(),
        instructor: userProfile.name,
        instructorEmail: userProfile.id, // This would be email if available
        timeRange,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: now.toISOString()
        },
        exportType,
        includeCharts,
        includeDetails
      }
    }

    if (exportType === 'student-progress' || exportType === 'comprehensive') {
      // Get detailed student information
      const { data: studentsInfo } = await supabase
        .from('users')
        .select('id, name, email, last_login, created_at')
        .in('id', studentIds)

      // Get detailed progress for each student
      const { data: detailedProgress } = await supabase
        .from('user_module_progress')
        .select(`
          user_id,
          module_id,
          best_score,
          latest_score,
          status,
          passed,
          attempt_count,
          needs_remedial,
          completed_at,
          last_attempt_at,
          first_attempt_at,
          modules!inner(
            id,
            title,
            course_id,
            passing_threshold,
            courses!inner(title)
          )
        `)
        .in('user_id', studentIds)
        .in('modules.course_id', courseIds)

      const studentProgressReport = (studentsInfo || []).map(student => {
        const studentProgress = detailedProgress?.filter(p => p.user_id === student.id) || []
        
        const courseProgress = instructorCourses.map(course => {
          const courseModuleProgress = studentProgress.filter(p => p.modules.course_id === course.id)
          
          return {
            courseId: course.id,
            courseTitle: course.title,
            totalModules: courseModuleProgress.length,
            completedModules: courseModuleProgress.filter(p => p.status === 'completed' || p.passed).length,
            averageScore: courseModuleProgress.length > 0 ?
              Math.round(courseModuleProgress.reduce((sum, p) => sum + (parseFloat(p.best_score || '0')), 0) / courseModuleProgress.length) : 0,
            needRemedial: courseModuleProgress.filter(p => p.needs_remedial).length,
            moduleDetails: includeDetails ? courseModuleProgress.map(p => ({
              moduleId: p.module_id,
              moduleTitle: p.modules.title,
              bestScore: parseFloat(p.best_score || '0'),
              latestScore: parseFloat(p.latest_score || '0'),
              status: p.status,
              passed: p.passed,
              attemptCount: p.attempt_count,
              needsRemedial: p.needs_remedial,
              completedAt: p.completed_at,
              lastAttemptAt: p.last_attempt_at,
              firstAttemptAt: p.first_attempt_at
            })) : []
          }
        })

        return {
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          lastLogin: student.last_login,
          enrolledSince: student.created_at,
          overallProgress: {
            totalModules: studentProgress.length,
            completedModules: studentProgress.filter(p => p.status === 'completed' || p.passed).length,
            averageScore: studentProgress.length > 0 ?
              Math.round(studentProgress.reduce((sum, p) => sum + (parseFloat(p.best_score || '0')), 0) / studentProgress.length) : 0,
            needRemedial: studentProgress.filter(p => p.needs_remedial).length,
            totalAttempts: studentProgress.reduce((sum, p) => sum + (p.attempt_count || 0), 0)
          },
          courseProgress
        }
      })

      if (exportType === 'student-progress') {
        exportData = {
          students: studentProgressReport,
          generatedAt: new Date().toISOString(),
          instructor: userProfile.name,
          timeRange,
          totalStudents: studentProgressReport.length,
          exportType,
          includeDetails
        }
      } else {
        exportData.studentProgress = studentProgressReport
      }
    }

    console.log('📊 [EXPORT] Completed analytics export generation')

    return NextResponse.json({
      success: true,
      data: {
        exportData,
        downloadUrl: null, // Could implement file generation here
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Error in analytics export API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}