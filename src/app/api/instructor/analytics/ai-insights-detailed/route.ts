import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    // Get instructor's courses and enrolled students
    const { data: instructorCourses } = await supabase
      .from('courses')
      .select('id, title')
      .eq('instructor_id', userId)

    if (!instructorCourses || instructorCourses.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          teachingRecommendations: [],
          studentInterventions: [],
          learningPatternInsights: [],
          performanceAlerts: [],
          contentOptimizationSuggestions: [],
          studyPlanRecommendations: [],
          classPerformanceInsights: []
        }
      })
    }

    const courseIds = instructorCourses.map(c => c.id)
    
    // Get enrolled students
    const { data: enrolledStudents, error: enrollmentError } = await supabase
      .rpc('get_instructor_enrolled_students', {
        p_instructor_id: userId
      })

    if (enrollmentError) {
      console.error('❌ Error getting enrolled students:', enrollmentError)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    const studentIds = enrolledStudents?.map(s => s.student_id) || []

    if (studentIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          teachingRecommendations: [],
          studentInterventions: [],
          learningPatternInsights: [],
          performanceAlerts: [],
          contentOptimizationSuggestions: [],
          studyPlanRecommendations: [],
          classPerformanceInsights: []
        }
      })
    }

    // Get comprehensive AI analytics data
    const { data: analyticsData } = await supabase
      .from('study_session_analytics')
      .select(`
        user_id,
        session_type,
        analyzed_at,
        performance_metrics,
        learning_patterns,
        behavior_analysis,
        cognitive_analysis,
        recommendations,
        insights,
        suggested_study_plan,
        confidence_score,
        data_completeness_score
      `)
      .in('user_id', studentIds)
      .gte('created_at', startDate.toISOString())
      .order('analyzed_at', { ascending: false })

    // Get student information for context
    const { data: studentsInfo } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', studentIds)

    // Get module progress for additional context
    const { data: moduleProgressData } = await supabase
      .from('user_module_progress')
      .select(`
        user_id,
        module_id,
        best_score,
        status,
        needs_remedial,
        modules!inner (
          title,
          course_id
        )
      `)
      .in('user_id', studentIds)
      .in('modules.course_id', courseIds)

    // Get Feynman feedback for detailed insights
    const { data: feynmanFeedback } = await supabase
      .from('feynman_feedback')
      .select(`
        feedback_type,
        feedback_text,
        suggested_improvement,
        severity,
        priority,
        feynman_explanations!inner(
          feynman_sessions!inner(
            user_id,
            created_at
          )
        )
      `)
      .gte('feynman_explanations.feynman_sessions.created_at', startDate.toISOString())

    // Create student lookup map
    const studentMap = (studentsInfo || []).reduce((acc, student) => {
      acc[student.id] = student
      return acc
    }, {})

    // Process AI analytics data
    if (!analyticsData || analyticsData.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          teachingRecommendations: [],
          studentInterventions: [],
          learningPatternInsights: [],
          performanceAlerts: [],
          contentOptimizationSuggestions: [],
          studyPlanRecommendations: [],
          classPerformanceInsights: []
        }
      })
    }

    // Build Teaching Recommendations
    const teachingRecommendations = []
    const recommendationCounts = {}
    
    analyticsData.forEach(session => {
      if (session.recommendations && Array.isArray(session.recommendations)) {
        session.recommendations.forEach(rec => {
          const key = `${rec.type}-${rec.title}`
          if (!recommendationCounts[key]) {
            recommendationCounts[key] = {
              type: rec.type,
              title: rec.title,
              description: rec.description,
              actionableAdvice: rec.actionable_advice || rec.actionableAdvice,
              priority: rec.priority || 1,
              affectedStudents: new Set(),
              frequency: 0,
              avgConfidence: 0,
              totalConfidence: 0
            }
          }
          
          recommendationCounts[key].affectedStudents.add(session.user_id)
          recommendationCounts[key].frequency++
          recommendationCounts[key].totalConfidence += (rec.confidence_score || 0.7)
        })
      }
    })

    Object.values(recommendationCounts).forEach((rec: any) => {
      rec.avgConfidence = rec.frequency > 0 ? rec.totalConfidence / rec.frequency : 0
      rec.affectedStudentsCount = rec.affectedStudents.size
      rec.affectedStudents = Array.from(rec.affectedStudents).map(id => studentMap[id]?.name).filter(Boolean)
      
      teachingRecommendations.push({
        id: `rec_${teachingRecommendations.length + 1}`,
        type: rec.type,
        title: rec.title,
        description: rec.description,
        actionableAdvice: rec.actionableAdvice,
        priority: rec.priority,
        frequency: rec.frequency,
        affectedStudentsCount: rec.affectedStudentsCount,
        affectedStudents: rec.affectedStudents.slice(0, 3), // Top 3 for display
        confidence: Math.round(rec.avgConfidence * 100),
        impact: rec.affectedStudentsCount >= 3 ? 'high' : 
                rec.affectedStudentsCount === 2 ? 'medium' : 'low'
      })
    })

    // Sort by priority and frequency
    teachingRecommendations.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      return b.frequency - a.frequency
    })

    // Build Student Interventions
    const studentInterventions = []
    const studentAnalytics = {}
    
    analyticsData.forEach(session => {
      if (!studentAnalytics[session.user_id]) {
        studentAnalytics[session.user_id] = {
          sessions: [],
          totalRecommendations: 0,
          highPriorityIssues: 0,
          criticalIssues: 0,
          improvementTrend: 0
        }
      }
      studentAnalytics[session.user_id].sessions.push(session)
      
      if (session.recommendations) {
        studentAnalytics[session.user_id].totalRecommendations += session.recommendations.length
        session.recommendations.forEach(rec => {
          if (rec.priority <= 2) studentAnalytics[session.user_id].highPriorityIssues++
          if (rec.priority === 1) studentAnalytics[session.user_id].criticalIssues++
        })
      }
    })

    Object.entries(studentAnalytics).forEach(([userId, data]: [string, any]) => {
      const student = studentMap[userId]
      if (!student) return

      // Calculate improvement trend from performance metrics
      const performances = data.sessions
        .map(s => s.performance_metrics?.improvement_percentage || 0)
        .filter(p => p !== 0)
      
      if (performances.length >= 2) {
        data.improvementTrend = performances[performances.length - 1] - performances[0]
      }

      // Determine intervention level
      let interventionLevel = 'none'
      let interventionReason = []
      
      if (data.criticalIssues > 0) {
        interventionLevel = 'urgent'
        interventionReason.push(`${data.criticalIssues} critical issues identified`)
      } else if (data.highPriorityIssues >= 3) {
        interventionLevel = 'high'
        interventionReason.push(`${data.highPriorityIssues} high priority issues`)
      } else if (data.improvementTrend < -20) {
        interventionLevel = 'medium'
        interventionReason.push('declining performance trend')
      }

      if (interventionLevel !== 'none') {
        // Get latest recommendations for this student
        const latestSession = data.sessions
          .sort((a, b) => new Date(b.analyzed_at).getTime() - new Date(a.analyzed_at).getTime())[0]

        studentInterventions.push({
          studentId: userId,
          studentName: student.name,
          studentEmail: student.email,
          interventionLevel,
          reasons: interventionReason,
          recommendedActions: (latestSession.recommendations || [])
            .filter(r => r.priority <= 2)
            .slice(0, 3)
            .map(r => r.actionable_advice || r.actionableAdvice),
          lastAnalyzed: latestSession.analyzed_at,
          sessionsAnalyzed: data.sessions.length,
          improvementTrend: Math.round(data.improvementTrend)
        })
      }
    })

    // Sort by intervention level priority
    const levelPriority = { urgent: 0, high: 1, medium: 2 }
    studentInterventions.sort((a, b) => levelPriority[a.interventionLevel] - levelPriority[b.interventionLevel])

    // Build Learning Pattern Insights
    const learningPatternInsights = []
    const patternCounts = {}
    
    analyticsData.forEach(session => {
      if (session.learning_patterns?.pattern_type) {
        const pattern = session.learning_patterns.pattern_type
        if (!patternCounts[pattern]) {
          patternCounts[pattern] = {
            count: 0,
            students: new Set(),
            avgVelocity: 0,
            totalVelocity: 0,
            sessions: []
          }
        }
        
        patternCounts[pattern].count++
        patternCounts[pattern].students.add(session.user_id)
        patternCounts[pattern].sessions.push(session)
        
        if (session.learning_patterns.learning_velocity) {
          patternCounts[pattern].totalVelocity += session.learning_patterns.learning_velocity
        }
      }
    })

    Object.entries(patternCounts).forEach(([pattern, data]: [string, any]) => {
      data.avgVelocity = data.count > 0 ? data.totalVelocity / data.count : 0
      
      learningPatternInsights.push({
        pattern,
        frequency: data.count,
        studentsAffected: data.students.size,
        averageVelocity: Math.round(data.avgVelocity * 100) / 100,
        description: getPatternDescription(pattern),
        teachingSuggestion: getTeachingSuggestionForPattern(pattern, data.avgVelocity),
        impact: data.students.size >= 3 ? 'high' : data.students.size === 2 ? 'medium' : 'low'
      })
    })

    // Build Performance Alerts
    const performanceAlerts = []
    
    // Analyze module performance for alerts
    const modulePerformanceMap = {}
    moduleProgressData?.forEach(mp => {
      const moduleId = mp.module_id
      if (!modulePerformanceMap[moduleId]) {
        modulePerformanceMap[moduleId] = {
          title: mp.modules.title,
          scores: [],
          needsRemedial: 0,
          failing: 0,
          totalStudents: 0
        }
      }
      
      const moduleData = modulePerformanceMap[moduleId]
      moduleData.totalStudents++
      
      const score = parseFloat(mp.best_score || '0')
      if (score > 0) {
        moduleData.scores.push(score)
        if (score < 60) moduleData.failing++
        else if (score < 70) moduleData.needsRemedial++
      }
      
      if (mp.needs_remedial) moduleData.needsRemedial++
    })

    Object.entries(modulePerformanceMap).forEach(([moduleId, data]: [string, any]) => {
      const avgScore = data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0
      const failureRate = (data.failing / data.totalStudents) * 100
      const remedialRate = (data.needsRemedial / data.totalStudents) * 100
      
      if (failureRate >= 30) {
        performanceAlerts.push({
          type: 'critical',
          title: `High Failure Rate in ${data.title}`,
          description: `${Math.round(failureRate)}% of students are failing this module`,
          moduleId,
          moduleTitle: data.title,
          metric: 'failure_rate',
          value: Math.round(failureRate),
          affectedStudents: data.failing,
          totalStudents: data.totalStudents,
          severity: 'high'
        })
      } else if (remedialRate >= 40) {
        performanceAlerts.push({
          type: 'warning',
          title: `Many Students Need Remedial Help in ${data.title}`,
          description: `${Math.round(remedialRate)}% of students need additional support`,
          moduleId,
          moduleTitle: data.title,
          metric: 'remedial_rate',
          value: Math.round(remedialRate),
          affectedStudents: data.needsRemedial,
          totalStudents: data.totalStudents,
          severity: 'medium'
        })
      } else if (avgScore < 70) {
        performanceAlerts.push({
          type: 'info',
          title: `Below Average Performance in ${data.title}`,
          description: `Average score of ${Math.round(avgScore)}% indicates room for improvement`,
          moduleId,
          moduleTitle: data.title,
          metric: 'average_score',
          value: Math.round(avgScore),
          affectedStudents: data.totalStudents,
          totalStudents: data.totalStudents,
          severity: 'low'
        })
      }
    })

    // Build Content Optimization Suggestions from Feynman feedback
    const contentOptimizationSuggestions = []
    const feedbackAnalysis = {}
    
    feynmanFeedback?.forEach(feedback => {
      const type = feedback.feedback_type
      if (!feedbackAnalysis[type]) {
        feedbackAnalysis[type] = {
          count: 0,
          highPriority: 0,
          suggestions: new Set(),
          severityBreakdown: { low: 0, medium: 0, high: 0, critical: 0 }
        }
      }
      
      feedbackAnalysis[type].count++
      if (feedback.priority <= 2) feedbackAnalysis[type].highPriority++
      if (feedback.suggested_improvement) {
        feedbackAnalysis[type].suggestions.add(feedback.suggested_improvement)
      }
      feedbackAnalysis[type].severityBreakdown[feedback.severity || 'medium']++
    })

    Object.entries(feedbackAnalysis).forEach(([type, data]: [string, any]) => {
      if (data.count >= 2) { // Only include if seen in multiple instances
        contentOptimizationSuggestions.push({
          area: type,
          frequency: data.count,
          priority: data.highPriority >= data.count * 0.5 ? 'high' : 'medium',
          suggestions: Array.from(data.suggestions).slice(0, 3),
          description: getFeedbackDescription(type),
          impact: data.count >= 5 ? 'high' : data.count >= 3 ? 'medium' : 'low',
          severityBreakdown: data.severityBreakdown
        })
      }
    })

    // Build Class Performance Insights
    const classPerformanceInsights = []
    
    // Overall class performance insight
    const overallPerformances = analyticsData
      .map(s => s.performance_metrics?.improvement_percentage || 0)
      .filter(p => p !== 0)
    
    if (overallPerformances.length > 0) {
      const avgImprovement = overallPerformances.reduce((a, b) => a + b, 0) / overallPerformances.length
      const positiveImprovements = overallPerformances.filter(p => p > 0).length
      const improvementRate = (positiveImprovements / overallPerformances.length) * 100
      
      classPerformanceInsights.push({
        type: 'overall_performance',
        title: 'Class Learning Progress',
        insight: `${Math.round(improvementRate)}% of students show positive learning improvements with an average improvement of ${Math.round(avgImprovement)}%`,
        metrics: {
          averageImprovement: Math.round(avgImprovement),
          improvementRate: Math.round(improvementRate),
          studentsAnalyzed: analyticsData.filter((v, i, a) => a.findIndex(t => t.user_id === v.user_id) === i).length
        },
        trend: avgImprovement > 10 ? 'positive' : avgImprovement < -10 ? 'concerning' : 'stable'
      })
    }

    console.log('📊 [AI INSIGHTS] Completed AI insights analysis')

    return NextResponse.json({
      success: true,
      data: {
        teachingRecommendations: teachingRecommendations.slice(0, 10),
        studentInterventions: studentInterventions.slice(0, 15),
        learningPatternInsights: learningPatternInsights.slice(0, 8),
        performanceAlerts: performanceAlerts.slice(0, 10),
        contentOptimizationSuggestions: contentOptimizationSuggestions.slice(0, 8),
        studyPlanRecommendations: [], // Can be expanded with more specific logic
        classPerformanceInsights
      }
    })

  } catch (error) {
    console.error('❌ Error in AI insights API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// Helper functions
function getPatternDescription(pattern: string): string {
  const descriptions = {
    'strugglingConcepts': 'Students are having difficulty with specific concepts and may need additional support',
    'steadyProgression': 'Students are making consistent progress through the material',
    'rapidLearning': 'Students are learning quickly and may benefit from advanced content',
    'inconsistentPerformance': 'Student performance varies significantly between sessions'
  }
  return descriptions[pattern] || 'Specific learning pattern identified requiring attention'
}

function getTeachingSuggestionForPattern(pattern: string, velocity: number): string {
  const suggestions = {
    'strugglingConcepts': 'Consider providing additional scaffolding, breaking down complex concepts, or implementing peer tutoring',
    'steadyProgression': 'Continue current teaching methods while monitoring for any changes in pace',
    'rapidLearning': 'Provide enrichment activities or accelerated content to maintain engagement',
    'inconsistentPerformance': 'Investigate external factors and consider more frequent check-ins with affected students'
  }
  return suggestions[pattern] || 'Monitor closely and adjust teaching strategies as needed'
}

function getFeedbackDescription(type: string): string {
  const descriptions = {
    'clarity': 'Students need clearer explanations and simpler language in their learning materials',
    'completeness': 'Learning materials may need more comprehensive coverage of topics',
    'accuracy': 'Focus on fact-checking and ensuring accurate information in explanations',
    'simplification': 'Content should be presented in more digestible, simplified formats',
    'examples': 'More practical examples and real-world applications needed'
  }
  return descriptions[type] || 'Improvement needed in this area of content delivery'
}