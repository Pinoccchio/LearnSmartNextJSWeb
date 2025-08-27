import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { teachingAnalyticsAI } from '@/lib/teaching-analytics-ai'
import type { CourseAnalyticsData, StudentPerformanceData } from '@/lib/teaching-analytics-ai'

export async function GET(request: NextRequest) {
  try {
    console.log('🤖 [AI INSIGHTS] AI-powered teaching insights API called')
    
    // Authentication
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'month'
    const courseId = searchParams.get('courseId') // Optional: specific course analysis
    
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

    console.log('🔍 [AI INSIGHTS] Collecting data for AI analysis...')

    // Get instructor's courses (or specific course)
    let coursesQuery = supabase
      .from('courses')
      .select('id, title, description, created_at')
      .eq('instructor_id', userProfile.id)

    if (courseId) {
      coursesQuery = coursesQuery.eq('id', courseId)
    }

    const { data: courses, error: coursesError } = await coursesQuery
    
    if (coursesError || !courses || courses.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          insights: [],
          recommendations: [],
          aiStatus: 'no_data',
          message: 'No course data available for analysis'
        }
      })
    }

    const courseIds = courses.map(c => c.id)

    // Get comprehensive student performance data
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select(`
        user_id,
        course_id,
        enrolled_at,
        status,
        users(id, name, email),
        courses(id, title)
      `)
      .in('course_id', courseIds)
      .eq('status', 'active')

    if (enrollmentsError) {
      console.error('❌ Error fetching enrollments:', enrollmentsError)
      return NextResponse.json({ error: 'Failed to fetch student data' }, { status: 500 })
    }

    const studentIds = enrollments.map(e => e.user_id)

    // Gather all analytics data for AI processing
    const [studyAnalytics, moduleProgress, studySessions] = await Promise.all([
      // Study session analytics
      supabase
        .from('study_session_analytics')
        .select('*')
        .in('user_id', studentIds)
        .gte('created_at', startDate.toISOString()),
      
      // Module progress
      supabase
        .from('user_module_progress')
        .select(`
          *,
          modules(id, title, course_id, difficulty_level),
          users(id, name)
        `)
        .in('user_id', studentIds),
      
      // Recent study sessions from all technique tables
      Promise.all([
        supabase.from('active_recall_sessions').select('*').in('user_id', studentIds).gte('created_at', startDate.toISOString()),
        supabase.from('pomodoro_sessions').select('*').in('user_id', studentIds).gte('created_at', startDate.toISOString()),
        supabase.from('feynman_sessions').select('*').in('user_id', studentIds).gte('created_at', startDate.toISOString()),
        supabase.from('retrieval_practice_sessions').select('*').in('user_id', studentIds).gte('created_at', startDate.toISOString())
      ]).then(results => {
        const allSessions = []
        const types = ['active_recall', 'pomodoro', 'feynman', 'retrieval_practice']
        
        results.forEach((result, index) => {
          if (result.data) {
            allSessions.push(...result.data.map(session => ({
              ...session,
              session_type: types[index]
            })))
          }
        })
        
        return { data: allSessions }
      })
    ])

    console.log('📊 [AI INSIGHTS] Processing data for AI analysis...')

    // Process data for AI analysis
    const courseAnalyticsData: CourseAnalyticsData[] = courses.map(course => {
      const courseEnrollments = enrollments.filter(e => e.course_id === course.id)
      const courseStudentIds = courseEnrollments.map(e => e.user_id)
      
      // Filter data for this course
      const courseSessions = studySessions.data?.filter(s => courseStudentIds.includes(s.user_id)) || []
      const courseAnalytics = studyAnalytics.data?.filter(a => courseStudentIds.includes(a.user_id)) || []
      const courseModuleProgress = moduleProgress.data?.filter(mp => 
        mp.modules?.course_id === course.id
      ) || []

      // Calculate study technique performance
      const techniqueStats = {
        active_recall: courseSessions.filter(s => s.session_type === 'active_recall'),
        pomodoro: courseSessions.filter(s => s.session_type === 'pomodoro'),
        feynman: courseSessions.filter(s => s.session_type === 'feynman'),
        retrieval_practice: courseSessions.filter(s => s.session_type === 'retrieval_practice')
      }

      const studySessionsData = Object.entries(techniqueStats).map(([technique, sessions]) => {
        const techniqueAnalytics = courseAnalytics.filter(a => a.session_type === technique)
        const effectiveness = techniqueAnalytics.length > 0 ? 
          techniqueAnalytics.reduce((sum, a) => {
            const performance = a.performance_metrics || {}
            return sum + (performance.post_study_accuracy || performance.improvement_percentage || 
                         performance.overall_accuracy || performance.improvement || 0)
          }, 0) / techniqueAnalytics.length : 0

        const adoptionRate = courseStudentIds.length > 0 ? 
          (new Set(sessions.map(s => s.user_id)).size / courseStudentIds.length) * 100 : 0

        return {
          technique: technique.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          totalSessions: sessions.length,
          averageEffectiveness: Math.round(effectiveness),
          adoptionRate: Math.round(adoptionRate)
        }
      })

      // Calculate module performance
      const moduleMap = new Map()
      courseModuleProgress.forEach(mp => {
        const moduleId = mp.module_id
        const moduleName = mp.modules?.title || 'Unknown Module'
        const difficulty = mp.modules?.difficulty_level || 'medium'
        
        if (!moduleMap.has(moduleId)) {
          moduleMap.set(moduleId, {
            moduleId,
            moduleName,
            difficulty,
            students: [],
            totalProgress: 0,
            totalScore: 0
          })
        }
        
        const moduleData = moduleMap.get(moduleId)
        moduleData.students.push(mp)
        moduleData.totalProgress += mp.completion_percentage || 0
      })

      const modulePerformance = Array.from(moduleMap.values()).map(module => {
        const studentCount = module.students.length
        
        // Calculate completion rate from actual completion status
        const completedCount = module.students.filter(s => 
          s.status === 'completed' || s.passed === true
        ).length
        const completionRate = studentCount > 0 ? (completedCount / studentCount) * 100 : 0
        
        // Calculate average score from best_score/latest_score
        const scoresWithValues = module.students
          .map(s => parseFloat(s.best_score || s.latest_score || '0'))
          .filter(score => score > 0)
        const averageScore = scoresWithValues.length > 0 ?
          scoresWithValues.reduce((sum, score) => sum + score, 0) / scoresWithValues.length : 0
        
        // Count struggling students (score < 60 or needs_remedial)
        const strugglingCount = module.students.filter(s => 
          parseFloat(s.best_score || s.latest_score || '0') < 60 || s.needs_remedial
        ).length

        return {
          moduleId: module.moduleId,
          moduleName: module.moduleName,
          difficulty: module.difficulty,
          completionRate: Math.round(completionRate),
          averageScore: Math.round(averageScore),
          strugglingStudents: strugglingCount
        }
      })

      // Calculate peak study hours
      const hourlyActivity = new Array(24).fill(0)
      courseSessions.forEach(session => {
        const hour = new Date(session.created_at).getHours()
        hourlyActivity[hour]++
      })

      const peakStudyHours = hourlyActivity.map((activity, hour) => ({ hour, activity }))
        .filter(h => h.activity > 0)
        .sort((a, b) => b.activity - a.activity)
        .slice(0, 3)

      // Calculate overall metrics
      const activeStudents = new Set(courseSessions.map(s => s.user_id)).size
      
      // Calculate average progress from module completion rates
      const averageProgress = modulePerformance.length > 0 ?
        modulePerformance.reduce((sum, m) => sum + m.completionRate, 0) / modulePerformance.length : 0
      
      // Calculate average score from module scores
      const moduleScores = modulePerformance
        .map(m => m.averageScore)
        .filter(score => score > 0)
      const averageScore = moduleScores.length > 0 ?
        moduleScores.reduce((sum, score) => sum + score, 0) / moduleScores.length : 0

      return {
        courseId: course.id,
        courseName: course.title,
        instructorId: userProfile.id,
        totalStudents: courseEnrollments.length,
        activeStudents,
        averageProgress: Math.round(averageProgress),
        averageScore: Math.round(averageScore),
        studySessionsData,
        modulePerformance,
        timeRange,
        peakStudyHours
      }
    })

    // Prepare student performance data for interventions
    const studentPerformanceData: StudentPerformanceData[] = enrollments.map(enrollment => {
      const userId = enrollment.user_id
      const userName = enrollment.users?.name || 'Unknown Student'
      const courseId = enrollment.course_id
      const courseName = enrollment.courses?.title || 'Unknown Course'

      // Get student's module progress
      const studentModuleProgress = moduleProgress.data?.filter(mp => 
        mp.user_id === userId && mp.modules?.course_id === courseId
      ) || []

      const moduleProgressData = studentModuleProgress.map(mp => ({
        moduleId: mp.module_id,
        moduleName: mp.modules?.title || 'Unknown Module',
        completionPercentage: mp.status === 'completed' ? 100 : 
                             mp.status === 'in_progress' ? 
                             (parseFloat(mp.latest_score || '0') > 70 ? 80 : 50) : 0,
        averageScore: parseFloat(mp.best_score || mp.latest_score || '0'),
        lastActivity: mp.updated_at || mp.created_at
      }))

      // Get student's study technique usage
      const studentSessions = studySessions.data?.filter(s => s.user_id === userId) || []
      const techniqueGroups = studentSessions.reduce((acc, session) => {
        const technique = session.session_type
        if (!acc[technique]) {
          acc[technique] = []
        }
        acc[technique].push(session)
        return acc
      }, {} as Record<string, any[]>)

      const studyTechniquesData = Object.entries(techniqueGroups).map(([technique, sessions]) => {
        const studentTechniqueAnalytics = studyAnalytics.data?.filter(a => 
          a.user_id === userId && a.session_type === technique
        ) || []
        
        const effectiveness = studentTechniqueAnalytics.length > 0 ?
          studentTechniqueAnalytics.reduce((sum, a) => {
            const performance = a.performance_metrics || {}
            return sum + (performance.post_study_accuracy || performance.improvement_percentage || 
                         performance.overall_accuracy || 0)
          }, 0) / studentTechniqueAnalytics.length : 0

        return {
          technique: technique.replace('_', ' '),
          sessionsCount: sessions.length,
          effectiveness: Math.round(effectiveness),
          averageScore: Math.round(effectiveness)
        }
      })

      // Calculate overall metrics
      const overallProgress = moduleProgressData.length > 0 ?
        moduleProgressData.reduce((sum, m) => sum + m.completionPercentage, 0) / moduleProgressData.length : 0

      // Calculate average score from module scores
      const moduleScores = moduleProgressData
        .map(m => m.averageScore)
        .filter(score => score > 0)
      const avgModuleScore = moduleScores.length > 0 ?
        moduleScores.reduce((sum, score) => sum + score, 0) / moduleScores.length : 0

      // Determine risk level based on progress, scores, and activity
      const daysSinceLastActivity = studentSessions.length > 0 ?
        Math.floor((Date.now() - new Date(Math.max(...studentSessions.map(s => new Date(s.created_at).getTime()))).getTime()) / (1000 * 60 * 60 * 24)) : 999

      let riskLevel: 'low' | 'medium' | 'high' = 'low'
      if (overallProgress < 30 || avgModuleScore < 50 || daysSinceLastActivity > 14) {
        riskLevel = 'high'
      } else if (overallProgress < 60 || avgModuleScore < 70 || daysSinceLastActivity > 7) {
        riskLevel = 'medium'
      }

      const engagementLevel = Math.max(0, 100 - (daysSinceLastActivity * 5))
      const lastActiveDate = studentSessions.length > 0 ?
        new Date(Math.max(...studentSessions.map(s => new Date(s.created_at).getTime()))).toISOString() :
        enrollment.enrolled_at

      return {
        userId,
        userName,
        courseId,
        courseName,
        moduleProgress: moduleProgressData,
        studyTechniques: studyTechniquesData,
        overallProgress: Math.round(overallProgress),
        riskLevel,
        engagementLevel: Math.round(engagementLevel),
        lastActiveDate
      }
    })

    console.log('🤖 [AI INSIGHTS] Generating AI-powered insights...')

    // Check if we have sufficient data for meaningful AI analysis
    const totalStudentsAnalyzed = studentPerformanceData.length
    const totalSessionsAnalyzed = courseAnalyticsData.reduce((sum, course) => 
      sum + course.studySessionsData.reduce((courseSum, technique) => courseSum + technique.totalSessions, 0), 0
    )

    console.log('📊 [AI INSIGHTS] Data summary:', {
      courses: courseAnalyticsData.length,
      students: totalStudentsAnalyzed,
      sessions: totalSessionsAnalyzed
    })

    if (totalStudentsAnalyzed === 0 || totalSessionsAnalyzed === 0) {
      console.log('⚠️ [AI INSIGHTS] Insufficient data for AI analysis')
      return NextResponse.json({
        success: true,
        data: {
          insights: [],
          recommendations: [],
          aiStatus: 'insufficient_data',
          message: 'Not enough student activity data available for AI analysis',
          coursesAnalyzed: courses.length,
          studentsAnalyzed: totalStudentsAnalyzed,
          atRiskStudents: 0,
          timeRange,
          generatedAt: new Date().toISOString()
        }
      })
    }

    // Generate AI insights for each course
    const allInsights = []
    const allRecommendations = []
    let aiAnalysisSuccessful = false

    for (const courseData of courseAnalyticsData) {
      try {
        // Only generate insights for courses with actual data
        const hasStudentData = courseData.totalStudents > 0
        const hasSessionData = courseData.studySessionsData.some(technique => technique.totalSessions > 0)
        
        if (!hasStudentData || !hasSessionData) {
          console.log(`⚠️ [AI INSIGHTS] Skipping course ${courseData.courseName} - insufficient data`)
          continue
        }

        console.log(`🤖 [AI INSIGHTS] Generating insights for course: ${courseData.courseName}`)

        // Generate teaching insights
        const teachingInsights = await teachingAnalyticsAI.generateTeachingInsights(courseData)
        if (teachingInsights && teachingInsights.length > 0) {
          allInsights.push(...teachingInsights)
          aiAnalysisSuccessful = true
        }

        // Generate technique analysis
        const techniqueAnalysis = await teachingAnalyticsAI.analyzeTechniqueEffectiveness(courseData)
        if (techniqueAnalysis.insights && techniqueAnalysis.insights.length > 0) {
          allInsights.push(...techniqueAnalysis.insights)
        }
        if (techniqueAnalysis.recommendations && techniqueAnalysis.recommendations.length > 0) {
          allRecommendations.push(...techniqueAnalysis.recommendations)
        }

      } catch (error) {
        console.error('❌ [AI INSIGHTS] Error generating insights for course:', courseData.courseName, error)
        // Continue processing other courses instead of failing completely
      }
    }

    // Generate student interventions for at-risk students
    try {
      const atRiskStudents = studentPerformanceData.filter(s => s.riskLevel === 'high' || s.riskLevel === 'medium')
      
      if (atRiskStudents.length > 0) {
        console.log(`🚨 [AI INSIGHTS] Generating interventions for ${atRiskStudents.length} at-risk students`)
        const interventions = await teachingAnalyticsAI.generateStudentInterventions(atRiskStudents)
        if (interventions && interventions.length > 0) {
          allRecommendations.push(...interventions)
          aiAnalysisSuccessful = true
        }
      }
    } catch (error) {
      console.error('❌ [AI INSIGHTS] Error generating interventions:', error)
    }

    // Sort insights and recommendations by priority
    allInsights.sort((a, b) => a.priority - b.priority)
    allRecommendations.sort((a, b) => a.priority - b.priority)

    console.log('✅ [AI INSIGHTS] Generated', allInsights.length, 'insights and', allRecommendations.length, 'recommendations')

    // Determine AI status based on results
    let aiStatus = 'success'
    let message = ''
    
    if (!aiAnalysisSuccessful && allInsights.length === 0 && allRecommendations.length === 0) {
      aiStatus = 'limited_data'
      message = 'AI analysis generated limited results due to sparse data. More student activity needed for comprehensive insights.'
    } else if (allInsights.length === 0 && allRecommendations.length === 0) {
      aiStatus = 'no_insights'
      message = 'No specific insights generated at this time. Continue monitoring student progress.'
    }

    return NextResponse.json({
      success: true,
      data: {
        insights: allInsights.slice(0, 10), // Limit to top 10 insights
        recommendations: allRecommendations.slice(0, 8), // Limit to top 8 recommendations
        aiStatus,
        message,
        coursesAnalyzed: courses.length,
        studentsAnalyzed: studentPerformanceData.length,
        atRiskStudents: studentPerformanceData.filter(s => s.riskLevel === 'high').length,
        timeRange,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ [AI INSIGHTS] Error in AI insights API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        data: {
          insights: [],
          recommendations: [],
          aiStatus: 'error',
          message: 'AI analysis failed, but basic analytics are still available'
        }
      },
      { status: 500 }
    )
  }
}