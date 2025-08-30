import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 [COURSE INSIGHTS] Starting course insights API call')
    
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

    // Get time range
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'month'
    
    // Calculate date filter
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

    // Get instructor's courses with detailed information
    const { data: instructorCourses } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        updated_at
      `)
      .eq('instructor_id', userId)

    if (!instructorCourses || instructorCourses.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          courseOverview: [],
          moduleInsights: [],
          contentEngagement: [],
          materialEffectiveness: [],
          studentProgressByModule: [],
          courseCompletion: {
            totalCourses: 0,
            activeCourses: 0,
            totalModules: 0,
            totalMaterials: 0
          }
        }
      })
    }

    const courseIds = instructorCourses.map(c => c.id)

    // Get modules for these courses
    const { data: modules } = await supabase
      .from('modules')
      .select(`
        id,
        title,
        description,
        course_id,
        order_index,
        passing_threshold,
        is_locked,
        available_techniques,
        created_at,
        courses!inner(title)
      `)
      .in('course_id', courseIds)
      .order('order_index', { ascending: true })

    // Get course materials
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

    // Get enrolled students
    const { data: enrolledStudents, error: enrollmentError } = await supabase
      .rpc('get_instructor_enrolled_students', {
        p_instructor_id: userId
      })

    if (enrollmentError) {
      console.error('❌ Error getting enrolled students:', enrollmentError)
    }

    const studentIds = enrolledStudents?.map(s => s.student_id) || []

    // Get user progress data
    const { data: userModuleProgress } = await supabase
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

    // Get study sessions for content engagement analysis
    const [activeRecallSessions, pomodoroSessions, feynmanSessions, retrievalSessions] = await Promise.all([
      supabase.from('active_recall_sessions')
        .select('id, user_id, module_id, created_at, status')
        .in('user_id', studentIds)
        .gte('created_at', startDate.toISOString()),
      
      supabase.from('pomodoro_sessions')
        .select('id, user_id, module_id, created_at, status')
        .in('user_id', studentIds)  
        .gte('created_at', startDate.toISOString()),
        
      supabase.from('feynman_sessions')
        .select('id, user_id, module_id, created_at, status')
        .in('user_id', studentIds)
        .gte('created_at', startDate.toISOString()),
        
      supabase.from('retrieval_practice_sessions')
        .select('id, user_id, module_id, created_at, status')
        .in('user_id', studentIds)
        .gte('created_at', startDate.toISOString())
    ])

    // Combine all sessions
    const allSessions = [
      ...(activeRecallSessions.data || []).map(s => ({...s, session_type: 'active_recall'})),
      ...(pomodoroSessions.data || []).map(s => ({...s, session_type: 'pomodoro'})),
      ...(feynmanSessions.data || []).map(s => ({...s, session_type: 'feynman'})),
      ...(retrievalSessions.data || []).map(s => ({...s, session_type: 'retrieval_practice'}))
    ]

    // Build course overview
    const courseOverview = instructorCourses.map(course => {
      const courseModules = modules?.filter(m => m.course_id === course.id) || []
      const courseEnrollments = enrolledStudents?.filter(e => 
        courseModules.some(m => userModuleProgress?.some(p => p.module_id === m.id && p.user_id === e.student_id))
      ) || []
      
      const courseProgress = userModuleProgress?.filter(p => 
        courseModules.some(m => m.id === p.module_id)
      ) || []

      const completedModules = courseProgress.filter(p => p.status === 'completed' || p.passed).length
      const totalModuleAttempts = courseProgress.reduce((sum, p) => sum + (p.attempt_count || 0), 0)
      
      const courseSessions = allSessions.filter(s => 
        courseModules.some(m => m.id === s.module_id)
      )

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        status: course.status,
        totalModules: courseModules.length,
        totalStudents: courseEnrollments.length,
        averageProgress: courseProgress.length > 0 ? 
          Math.round((completedModules / courseProgress.length) * 100) : 0,
        totalSessions: courseSessions.length,
        completionRate: courseProgress.length > 0 ?
          Math.round((courseProgress.filter(p => p.passed).length / courseProgress.length) * 100) : 0,
        averageScore: courseProgress.length > 0 ?
          Math.round(courseProgress.reduce((sum, p) => sum + (parseFloat(p.best_score || '0')), 0) / courseProgress.length) : 0,
        totalAttempts: totalModuleAttempts,
        createdAt: course.created_at,
        lastUpdated: course.updated_at
      }
    })

    // Build module insights
    const moduleInsights = (modules || []).map(module => {
      const moduleProgress = userModuleProgress?.filter(p => p.module_id === module.id) || []
      const moduleSessions = allSessions.filter(s => s.module_id === module.id)
      const moduleMaterials = courseMaterials?.filter(m => m.module_id === module.id) || []

      const completedStudents = moduleProgress.filter(p => p.status === 'completed' || p.passed).length
      const needRemedial = moduleProgress.filter(p => p.needs_remedial).length
      const averageScore = moduleProgress.length > 0 ?
        Math.round(moduleProgress.reduce((sum, p) => sum + (parseFloat(p.best_score || '0')), 0) / moduleProgress.length) : 0

      const techniqueUsage = {}
      moduleSessions.forEach(session => {
        techniqueUsage[session.session_type] = (techniqueUsage[session.session_type] || 0) + 1
      })

      return {
        id: module.id,
        title: module.title,
        courseTitle: module.courses.title,
        description: module.description,
        orderIndex: module.order_index,
        passingThreshold: module.passing_threshold,
        isLocked: module.is_locked,
        availableTechniques: module.available_techniques,
        totalStudents: moduleProgress.length,
        completedStudents,
        completionRate: moduleProgress.length > 0 ? 
          Math.round((completedStudents / moduleProgress.length) * 100) : 0,
        averageScore,
        needRemedial,
        remedialRate: moduleProgress.length > 0 ?
          Math.round((needRemedial / moduleProgress.length) * 100) : 0,
        totalSessions: moduleSessions.length,
        totalMaterials: moduleMaterials.length,
        techniqueUsage,
        avgAttempts: moduleProgress.length > 0 ?
          Math.round(moduleProgress.reduce((sum, p) => sum + (p.attempt_count || 0), 0) / moduleProgress.length) : 0,
        difficulty: averageScore < 60 ? 'high' : 
                   averageScore < 75 ? 'medium' : 'low',
        engagement: moduleSessions.length > 0 ? 
          (moduleSessions.length >= moduleProgress.length * 2 ? 'high' : 
           moduleSessions.length >= moduleProgress.length ? 'medium' : 'low') : 'low'
      }
    }).sort((a, b) => b.totalSessions - a.totalSessions)

    // Build content engagement analysis
    const contentEngagement = (courseMaterials || []).map(material => {
      // Get sessions that might have used this material (same module)
      const relatedSessions = allSessions.filter(s => s.module_id === material.module_id)
      const moduleProgress = userModuleProgress?.filter(p => p.module_id === material.module_id) || []
      
      return {
        id: material.id,
        title: material.title,
        moduleTitle: material.modules.title,
        fileType: material.file_type,
        fileSize: material.file_size,
        createdAt: material.created_at,
        relatedSessions: relatedSessions.length,
        studentsAccessed: moduleProgress.length,
        engagementScore: relatedSessions.length > 0 ? 
          Math.min(Math.round((relatedSessions.length / Math.max(moduleProgress.length, 1)) * 20), 100) : 0,
        effectiveness: moduleProgress.length > 0 ?
          Math.round(moduleProgress.filter(p => parseFloat(p.best_score || '0') >= 70).length / moduleProgress.length * 100) : 0
      }
    }).sort((a, b) => b.engagementScore - a.engagementScore)

    // Build material effectiveness
    const materialEffectiveness = {}
    courseMaterials?.forEach(material => {
      const type = material.file_type
      if (!materialEffectiveness[type]) {
        materialEffectiveness[type] = {
          count: 0,
          totalSessions: 0,
          totalStudents: 0,
          avgEffectiveness: 0
        }
      }
      
      const relatedSessions = allSessions.filter(s => s.module_id === material.module_id)
      const moduleProgress = userModuleProgress?.filter(p => p.module_id === material.module_id) || []
      const effectiveness = moduleProgress.length > 0 ?
        moduleProgress.filter(p => parseFloat(p.best_score || '0') >= 70).length / moduleProgress.length * 100 : 0

      materialEffectiveness[type].count++
      materialEffectiveness[type].totalSessions += relatedSessions.length
      materialEffectiveness[type].totalStudents += moduleProgress.length
      materialEffectiveness[type].avgEffectiveness += effectiveness
    })

    // Average effectiveness for each material type
    Object.keys(materialEffectiveness).forEach(type => {
      const data = materialEffectiveness[type]
      data.avgEffectiveness = data.count > 0 ? Math.round(data.avgEffectiveness / data.count) : 0
    })

    // Build student progress by module (for visualization)
    const studentProgressByModule = moduleInsights.map(module => ({
      moduleTitle: module.title,
      excellent: userModuleProgress?.filter(p => 
        p.module_id === module.id && parseFloat(p.best_score || '0') >= 90
      ).length || 0,
      good: userModuleProgress?.filter(p => 
        p.module_id === module.id && 
        parseFloat(p.best_score || '0') >= 80 && 
        parseFloat(p.best_score || '0') < 90
      ).length || 0,
      satisfactory: userModuleProgress?.filter(p => 
        p.module_id === module.id && 
        parseFloat(p.best_score || '0') >= 70 && 
        parseFloat(p.best_score || '0') < 80
      ).length || 0,
      needsImprovement: userModuleProgress?.filter(p => 
        p.module_id === module.id && 
        parseFloat(p.best_score || '0') >= 60 && 
        parseFloat(p.best_score || '0') < 70
      ).length || 0,
      failing: userModuleProgress?.filter(p => 
        p.module_id === module.id && parseFloat(p.best_score || '0') < 60
      ).length || 0
    }))

    // Course completion summary
    const courseCompletion = {
      totalCourses: instructorCourses.length,
      activeCourses: instructorCourses.filter(c => c.status === 'active').length,
      totalModules: modules?.length || 0,
      totalMaterials: courseMaterials?.length || 0,
      totalEnrollments: studentIds.length,
      averageCourseCompletion: courseOverview.length > 0 ?
        Math.round(courseOverview.reduce((sum, c) => sum + c.completionRate, 0) / courseOverview.length) : 0,
      totalSessions: allSessions.length,
      sessionsPerStudent: studentIds.length > 0 ? 
        Math.round(allSessions.length / studentIds.length) : 0
    }

    console.log('📊 [COURSE INSIGHTS] Completed course insights analysis')

    return NextResponse.json({
      success: true,
      data: {
        courseOverview,
        moduleInsights: moduleInsights.slice(0, 20), // Limit for performance
        contentEngagement: contentEngagement.slice(0, 15),
        materialEffectiveness,
        studentProgressByModule,
        courseCompletion
      }
    })

  } catch (error) {
    console.error('❌ Error in course insights API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}