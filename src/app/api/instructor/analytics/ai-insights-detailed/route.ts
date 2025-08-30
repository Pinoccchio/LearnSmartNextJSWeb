import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { teachingAnalyticsAI } from '@/lib/teaching-analytics-ai'
import type { CourseAnalyticsData, StudentPerformanceData } from '@/lib/teaching-analytics-ai'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 [AI INSIGHTS] Starting AI insights detailed API call')
    
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

    // Get instructor's courses
    const { data: instructorCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, description, created_at')
      .eq('instructor_id', userId)

    if (coursesError || !instructorCourses || instructorCourses.length === 0) {
      console.log('⚠️ [AI INSIGHTS] No courses found for instructor')
      return NextResponse.json({
        success: true,
        data: {
          teachingRecommendations: [],
          studentInterventions: [],
          performanceAlerts: [],
          classPerformanceInsights: [],
          aiStatus: 'no_courses',
          message: 'No courses found for analysis'
        }
      })
    }

    const courseIds = instructorCourses.map(c => c.id)
    console.log('🔍 [AI INSIGHTS] Analyzing', courseIds.length, 'courses')

    // Get enrolled students with simplified query
    const { data: enrolledStudents, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select(`
        user_id,
        course_id,
        enrolled_at,
        status,
        users!inner(id, name, email, role)
      `)
      .in('course_id', courseIds)
      .eq('status', 'active')
      .eq('users.role', 'student')

    if (enrollmentError) {
      console.error('❌ Error getting enrolled students:', enrollmentError)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    const studentIds = enrolledStudents?.map(e => e.user_id) || []
    
    if (studentIds.length === 0) {
      console.log('⚠️ [AI INSIGHTS] No enrolled students found')
      return NextResponse.json({
        success: true,
        data: {
          teachingRecommendations: [],
          studentInterventions: [],
          performanceAlerts: [],
          classPerformanceInsights: [],
          aiStatus: 'no_students',
          message: 'No enrolled students found for analysis'
        }
      })
    }

    console.log('📊 [AI INSIGHTS] Found', studentIds.length, 'enrolled students')

    // Collect essential data for AI analysis in parallel
    console.log('📊 [AI INSIGHTS] Collecting analytics data...')
    
    const [
      studyAnalyticsResult,
      moduleProgressResult, 
      studySessionsResults
    ] = await Promise.all([
      // Study session analytics
      supabase
        .from('study_session_analytics')
        .select('user_id, session_type, performance_metrics, learning_patterns, recommendations, insights')
        .in('user_id', studentIds)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false }),
      
      // Module progress
      supabase
        .from('user_module_progress')
        .select(`
          user_id,
          module_id,
          best_score,
          latest_score,
          status,
          needs_remedial,
          passed,
          modules!inner(id, title, course_id)
        `)
        .in('user_id', studentIds)
        .in('modules.course_id', courseIds),
        
      // Recent study sessions from all techniques
      Promise.all([
        supabase.from('active_recall_sessions').select('user_id, status, created_at').in('user_id', studentIds).gte('created_at', startDate.toISOString()),
        supabase.from('pomodoro_sessions').select('user_id, status, created_at').in('user_id', studentIds).gte('created_at', startDate.toISOString()),
        supabase.from('feynman_sessions').select('user_id, status, created_at').in('user_id', studentIds).gte('created_at', startDate.toISOString()),
        supabase.from('retrieval_practice_sessions').select('user_id, status, created_at').in('user_id', studentIds).gte('created_at', startDate.toISOString())
      ])
    ])

    console.log('📊 [AI INSIGHTS] Data collection complete')
    
    // Check for data availability
    const hasAnalytics = studyAnalyticsResult.data && studyAnalyticsResult.data.length > 0
    const hasModuleProgress = moduleProgressResult.data && moduleProgressResult.data.length > 0
    const hasSessions = studySessionsResults.some(result => result.data && result.data.length > 0)
    
    if (!hasAnalytics && !hasModuleProgress && !hasSessions) {
      console.log('⚠️ [AI INSIGHTS] Insufficient data for analysis')
      return NextResponse.json({
        success: true,
        data: {
          teachingRecommendations: [],
          studentInterventions: [],
          performanceAlerts: [],
          classPerformanceInsights: [],
          aiStatus: 'no_data',
          message: 'No student activity data available yet. Students need to start using study techniques.'
        }
      })
    }

    // Prepare data for AI analysis
    console.log('🤖 [AI INSIGHTS] Preparing data for AI analysis...')
    
    // Process course analytics data
    const courseAnalyticsData: CourseAnalyticsData[] = instructorCourses.map(course => {
      const courseEnrollments = enrolledStudents?.filter(e => e.course_id === course.id) || []
      const courseStudentIds = courseEnrollments.map(e => e.user_id)
      
      // Calculate study technique data
      const allSessions = studySessionsResults.flatMap((result, index) => {
        const techniqueNames = ['active_recall', 'pomodoro', 'feynman', 'retrieval_practice']
        return (result.data || []).map(session => ({
          ...session,
          session_type: techniqueNames[index]
        }))
      })
      
      const courseSessions = allSessions.filter(s => courseStudentIds.includes(s.user_id))
      const courseAnalytics = studyAnalyticsResult.data?.filter(a => courseStudentIds.includes(a.user_id)) || []
      const courseModuleProgress = moduleProgressResult.data?.filter(mp => 
        courseStudentIds.includes(mp.user_id) && mp.modules?.course_id === course.id
      ) || []
      
      // Calculate technique performance
      const techniqueStats = ['active_recall', 'pomodoro', 'feynman', 'retrieval_practice'].map(technique => {
        const sessions = courseSessions.filter(s => s.session_type === technique)
        const analytics = courseAnalytics.filter(a => a.session_type === technique)
        
        const effectiveness = analytics.length > 0 ? 
          analytics.reduce((sum, a) => {
            const performance = a.performance_metrics || {}
            return sum + (performance.improvement_percentage || performance.overall_accuracy || 50)
          }, 0) / analytics.length : 0
          
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
        
        if (!moduleMap.has(moduleId)) {
          moduleMap.set(moduleId, {
            moduleId,
            moduleName,
            difficulty: 'medium',
            students: [],
            scores: []
          })
        }
        
        const moduleData = moduleMap.get(moduleId)
        moduleData.students.push(mp)
        const score = parseFloat(mp.best_score || mp.latest_score || '0')
        if (score > 0) moduleData.scores.push(score)
      })

      const modulePerformance = Array.from(moduleMap.values()).map(module => {
        const completedCount = module.students.filter(s => 
          s.status === 'completed' || s.passed === true
        ).length
        const completionRate = module.students.length > 0 ? (completedCount / module.students.length) * 100 : 0
        const averageScore = module.scores.length > 0 ?
          module.scores.reduce((sum, score) => sum + score, 0) / module.scores.length : 0
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

      // Calculate overall metrics
      const activeStudents = new Set(courseSessions.map(s => s.user_id)).size
      const averageProgress = modulePerformance.length > 0 ?
        modulePerformance.reduce((sum, m) => sum + m.completionRate, 0) / modulePerformance.length : 0
      const moduleScores = modulePerformance.map(m => m.averageScore).filter(score => score > 0)
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
        studySessionsData: techniqueStats,
        modulePerformance,
        timeRange,
        peakStudyHours: [] // Simplified for now
      }
    })

    // Prepare student performance data for interventions
    const studentPerformanceData: StudentPerformanceData[] = (enrolledStudents || []).map(enrollment => {
      const userId = enrollment.user_id
      const userName = enrollment.users?.name || 'Unknown Student'
      const courseId = enrollment.course_id
      const course = instructorCourses.find(c => c.id === courseId)
      const courseName = course?.title || 'Unknown Course'

      const studentModuleProgress = moduleProgressResult.data?.filter(mp => 
        mp.user_id === userId && mp.modules?.course_id === courseId
      ) || []

      const moduleProgressData = studentModuleProgress.map(mp => ({
        moduleId: mp.module_id,
        moduleName: mp.modules?.title || 'Unknown Module',
        completionPercentage: mp.status === 'completed' ? 100 : 
                             mp.passed ? 90 : 
                             parseFloat(mp.best_score || '0') > 70 ? 80 : 50,
        averageScore: parseFloat(mp.best_score || mp.latest_score || '0'),
        lastActivity: mp.updated_at || mp.created_at || new Date().toISOString()
      }))

      const overallProgress = moduleProgressData.length > 0 ?
        moduleProgressData.reduce((sum, m) => sum + m.completionPercentage, 0) / moduleProgressData.length : 0

      const moduleScores = moduleProgressData.map(m => m.averageScore).filter(score => score > 0)
      const avgModuleScore = moduleScores.length > 0 ?
        moduleScores.reduce((sum, score) => sum + score, 0) / moduleScores.length : 0

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low'
      if (overallProgress < 30 || avgModuleScore < 50) {
        riskLevel = 'high'
      } else if (overallProgress < 60 || avgModuleScore < 70) {
        riskLevel = 'medium'
      }

      return {
        userId,
        userName,
        courseId,
        courseName,
        moduleProgress: moduleProgressData,
        studyTechniques: [], // Simplified for now
        overallProgress: Math.round(overallProgress),
        riskLevel,
        engagementLevel: Math.max(0, 100 - (overallProgress < 50 ? 30 : 0)),
        lastActiveDate: enrollment.enrolled_at
      }
    })

    // Generate AI insights using the AI service
    console.log('🤖 [AI INSIGHTS] Generating AI-powered insights...')
    
    const allInsights = []
    const allRecommendations = []
    const performanceAlerts = []
    let aiAnalysisSuccessful = false

    try {
      // Generate insights for each course with data
      for (const courseData of courseAnalyticsData) {
        const hasStudentData = courseData.totalStudents > 0
        const hasSessionData = courseData.studySessionsData.some(technique => technique.totalSessions > 0)
        
        if (!hasStudentData) continue
        
        console.log(`🤖 [AI INSIGHTS] Analyzing course: ${courseData.courseName}`)
        
        try {
          // Generate teaching insights using AI
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
          // Continue with other courses
        }

        // Generate performance alerts based on module data
        courseData.modulePerformance.forEach(module => {
          if (module.averageScore > 0 && module.averageScore < 60) {
            performanceAlerts.push({
              type: 'warning',
              title: `Low Performance in ${module.moduleName}`,
              description: `Average score of ${module.averageScore}% indicates students are struggling`,
              moduleId: module.moduleId,
              moduleTitle: module.moduleName,
              metric: 'average_score',
              value: module.averageScore,
              affectedStudents: module.strugglingStudents,
              severity: module.averageScore < 40 ? 'high' : 'medium'
            })
          }

          if (module.strugglingStudents >= Math.ceil(courseData.totalStudents * 0.3)) {
            performanceAlerts.push({
              type: 'critical',
              title: `Many Students Struggling with ${module.moduleName}`,
              description: `${module.strugglingStudents} out of ${courseData.totalStudents} students need help`,
              moduleId: module.moduleId,
              moduleTitle: module.moduleName,
              metric: 'struggling_students',
              value: module.strugglingStudents,
              affectedStudents: module.strugglingStudents,
              severity: 'high'
            })
          }
        })
      }

      // Generate student interventions for at-risk students
      const atRiskStudents = studentPerformanceData.filter(s => s.riskLevel === 'high' || s.riskLevel === 'medium')
      
      if (atRiskStudents.length > 0) {
        console.log(`🚨 [AI INSIGHTS] Generating interventions for ${atRiskStudents.length} at-risk students`)
        try {
          const interventions = await teachingAnalyticsAI.generateStudentInterventions(atRiskStudents)
          if (interventions && interventions.length > 0) {
            allRecommendations.push(...interventions)
            aiAnalysisSuccessful = true
          }
        } catch (error) {
          console.error('❌ [AI INSIGHTS] Error generating interventions:', error)
        }
      }

    } catch (error) {
      console.error('❌ [AI INSIGHTS] Error in AI analysis:', error)
    }

    // Sort results by priority
    allInsights.sort((a, b) => (a.priority || 3) - (b.priority || 3))
    allRecommendations.sort((a, b) => (a.priority || 3) - (b.priority || 3))
    performanceAlerts.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    })

    // Build class performance insights from the collected data
    const classPerformanceInsights = []
    
    // Overall class engagement insight
    const totalStudents = studentPerformanceData.length
    const activeStudentsCount = courseAnalyticsData.reduce((sum, course) => sum + course.activeStudents, 0)
    
    if (totalStudents > 0) {
      const overallEngagement = Math.round((activeStudentsCount / totalStudents) * 100)
      const atRiskCount = studentPerformanceData.filter(s => s.riskLevel === 'high').length
      const mediumRiskCount = studentPerformanceData.filter(s => s.riskLevel === 'medium').length
      
      classPerformanceInsights.push({
        type: 'engagement_overview',
        title: 'Class Engagement Overview',
        insight: `${overallEngagement}% of students are actively engaged. ${atRiskCount} students need immediate attention, ${mediumRiskCount} need monitoring.`,
        metrics: {
          totalStudents,
          activeStudents: activeStudentsCount,
          engagementRate: overallEngagement,
          atRiskStudents: atRiskCount,
          mediumRiskStudents: mediumRiskCount
        },
        trend: overallEngagement >= 70 ? 'positive' : overallEngagement >= 50 ? 'stable' : 'concerning'
      })
    }

    // Course performance insight
    if (courseAnalyticsData.length > 0) {
      const avgCourseScore = Math.round(
        courseAnalyticsData.reduce((sum, course) => sum + course.averageScore, 0) / courseAnalyticsData.length
      )
      
      classPerformanceInsights.push({
        type: 'academic_performance',
        title: 'Academic Performance Summary',
        insight: `Average performance across all courses is ${avgCourseScore}%. ${performanceAlerts.length} modules require attention.`,
        metrics: {
          averageScore: avgCourseScore,
          coursesAnalyzed: courseAnalyticsData.length,
          alertsGenerated: performanceAlerts.length
        },
        trend: avgCourseScore >= 75 ? 'positive' : avgCourseScore >= 60 ? 'stable' : 'concerning'
      })
    }

    // Determine AI status and message
    let aiStatus = 'success'
    let message = ''
    
    if (!aiAnalysisSuccessful && allInsights.length === 0 && allRecommendations.length === 0) {
      aiStatus = 'fallback'
      message = 'AI analysis unavailable, showing basic insights. More student activity data needed for comprehensive AI recommendations.'
    } else if (allInsights.length === 0 && allRecommendations.length === 0) {
      aiStatus = 'limited'
      message = 'Limited insights available. Encourage more student activity for better AI analysis.'
    } else {
      message = `Generated ${allInsights.length} insights and ${allRecommendations.length} recommendations`
    }

    console.log(`✅ [AI INSIGHTS] Analysis complete: ${allInsights.length} insights, ${allRecommendations.length} recommendations, ${performanceAlerts.length} alerts`)

    return NextResponse.json({
      success: true,
      data: {
        teachingRecommendations: allInsights.slice(0, 10), // Map insights to recommendations format
        studentInterventions: allRecommendations.filter(r => r.type === 'intervention').slice(0, 8),
        performanceAlerts: performanceAlerts.slice(0, 10),
        classPerformanceInsights,
        // Additional AI-specific data
        aiInsights: allInsights.slice(0, 15),
        aiRecommendations: allRecommendations.slice(0, 12),
        learningPatternInsights: [], // Can be expanded later
        contentOptimizationSuggestions: [], // Can be expanded later
        studyPlanRecommendations: allRecommendations.filter(r => r.type === 'content_creation' || r.type === 'technique_recommendation').slice(0, 5),
        // Metadata
        aiStatus,
        message,
        coursesAnalyzed: courseAnalyticsData.length,
        studentsAnalyzed: studentPerformanceData.length,
        atRiskStudents: studentPerformanceData.filter(s => s.riskLevel === 'high').length,
        timeRange,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Error in AI insights API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        data: {
          teachingRecommendations: [],
          studentInterventions: [],
          performanceAlerts: [],
          classPerformanceInsights: [],
          aiStatus: 'error',
          message: 'AI insights service encountered an error. Please try again later.',
          coursesAnalyzed: 0,
          studentsAnalyzed: 0,
          atRiskStudents: 0
        }
      },
      { status: 500 }
    )
  }
}