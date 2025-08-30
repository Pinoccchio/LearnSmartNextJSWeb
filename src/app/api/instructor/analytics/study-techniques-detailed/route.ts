import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 [STUDY TECHNIQUES] Starting detailed study techniques API call')
    
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
          activeRecallAnalytics: {},
          pomodoroAnalytics: {},
          feynmanAnalytics: {},
          retrievalPracticeAnalytics: {},
          techniqueComparison: [],
          timeBasedAnalysis: [],
          effectivenessMetrics: {}
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
          activeRecallAnalytics: {},
          pomodoroAnalytics: {},
          feynmanAnalytics: {},
          retrievalPracticeAnalytics: {},
          techniqueComparison: [],
          timeBasedAnalysis: [],
          effectivenessMetrics: {}
        }
      })
    }

    // Fetch detailed data for each study technique
    const [
      activeRecallData,
      activeRecallAttempts,
      pomodoroData,
      pomodoroCycles,
      feynmanData, 
      feynmanExplanations,
      retrievalData,
      retrievalAttempts,
      analyticsData
    ] = await Promise.all([
      // Active Recall
      supabase.from('active_recall_sessions')
        .select('*')
        .in('user_id', studentIds)
        .gte('created_at', startDate.toISOString()),
      
      supabase.from('active_recall_attempts')
        .select(`
          *,
          active_recall_sessions!inner(user_id, created_at)
        `)
        .gte('active_recall_sessions.created_at', startDate.toISOString()),
      
      // Pomodoro
      supabase.from('pomodoro_sessions')
        .select('*')
        .in('user_id', studentIds)
        .gte('created_at', startDate.toISOString()),
        
      supabase.from('pomodoro_cycles')
        .select(`
          *,
          pomodoro_sessions!inner(user_id, created_at)
        `)
        .gte('pomodoro_sessions.created_at', startDate.toISOString()),
        
      // Feynman
      supabase.from('feynman_sessions')
        .select('*')
        .in('user_id', studentIds)
        .gte('created_at', startDate.toISOString()),
        
      supabase.from('feynman_explanations')
        .select(`
          *,
          feynman_sessions!inner(user_id, created_at)
        `)
        .gte('feynman_sessions.created_at', startDate.toISOString()),
        
      // Retrieval Practice
      supabase.from('retrieval_practice_sessions')
        .select('*')
        .in('user_id', studentIds)
        .gte('created_at', startDate.toISOString()),
        
      supabase.from('retrieval_practice_attempts')
        .select(`
          *,
          retrieval_practice_sessions!inner(user_id, created_at)
        `)
        .gte('retrieval_practice_sessions.created_at', startDate.toISOString()),
        
      // Analytics data
      supabase.from('study_session_analytics')
        .select('*')
        .in('user_id', studentIds)
        .gte('created_at', startDate.toISOString())
    ])

    // Build Active Recall Analytics
    const activeRecallSessions = activeRecallData.data || []
    const activeRecallAnalytics = {
      totalSessions: activeRecallSessions.length,
      completedSessions: activeRecallSessions.filter(s => s.status === 'completed').length,
      averageSessionDuration: 0,
      totalAttempts: activeRecallAttempts.data?.length || 0,
      averageAccuracy: 0,
      flashcardsGenerated: 0,
      improvementRate: 0,
      userEngagement: new Set(activeRecallSessions.map(s => s.user_id)).size,
      sessionStatusBreakdown: {
        completed: activeRecallSessions.filter(s => s.status === 'completed').length,
        preparing: activeRecallSessions.filter(s => s.status === 'preparing').length,
        studying: activeRecallSessions.filter(s => s.status === 'studying').length,
        paused: activeRecallSessions.filter(s => s.status === 'paused').length
      }
    }

    // Calculate Active Recall metrics
    if (activeRecallAttempts.data && activeRecallAttempts.data.length > 0) {
      const attempts = activeRecallAttempts.data
      const correctAttempts = attempts.filter(a => a.is_correct).length
      activeRecallAnalytics.averageAccuracy = Math.round((correctAttempts / attempts.length) * 100)
      
      const avgResponseTime = attempts.reduce((sum, a) => sum + (a.response_time_seconds || 0), 0) / attempts.length
      activeRecallAnalytics.averageSessionDuration = Math.round(avgResponseTime)
    }

    // Build Pomodoro Analytics  
    const pomodoroSessions = pomodoroData.data || []
    const pomodoroAnalytics = {
      totalSessions: pomodoroSessions.length,
      completedSessions: pomodoroSessions.filter(s => s.status === 'completed').length,
      totalCycles: pomodoroCycles.data?.length || 0,
      completedCycles: pomodoroCycles.data?.filter(c => c.completed_at).length || 0,
      averageFocusScore: 0,
      averageCyclesPerSession: 0,
      totalStudyTime: 0,
      breakAdherence: 0,
      userEngagement: new Set(pomodoroSessions.map(s => s.user_id)).size,
      cycleTypeBreakdown: {
        work: pomodoroCycles.data?.filter(c => c.type === 'work').length || 0,
        short_break: pomodoroCycles.data?.filter(c => c.type === 'short_break').length || 0,
        long_break: pomodoroCycles.data?.filter(c => c.type === 'long_break').length || 0
      }
    }

    // Calculate Pomodoro metrics
    if (pomodoroCycles.data && pomodoroCycles.data.length > 0) {
      const cycles = pomodoroCycles.data
      const focusScores = cycles.filter(c => c.focus_score).map(c => c.focus_score)
      if (focusScores.length > 0) {
        pomodoroAnalytics.averageFocusScore = Math.round(focusScores.reduce((a, b) => a + b, 0) / focusScores.length)
      }
      
      if (pomodoroSessions.length > 0) {
        pomodoroAnalytics.averageCyclesPerSession = Math.round(cycles.length / pomodoroSessions.length)
      }
      
      const studyTime = cycles
        .filter(c => c.type === 'work')
        .reduce((sum, c) => sum + (c.duration_minutes || 25), 0)
      pomodoroAnalytics.totalStudyTime = studyTime
      
      const completedBreaks = cycles.filter(c => c.type !== 'work' && c.completed_at).length
      const totalBreaks = cycles.filter(c => c.type !== 'work').length
      pomodoroAnalytics.breakAdherence = totalBreaks > 0 ? Math.round((completedBreaks / totalBreaks) * 100) : 0
    }

    // Build Feynman Analytics
    const feynmanSessions = feynmanData.data || []
    const feynmanAnalytics = {
      totalSessions: feynmanSessions.length,
      completedSessions: feynmanSessions.filter(s => s.status === 'completed').length,
      totalExplanations: feynmanExplanations.data?.length || 0,
      averageExplanationScore: 0,
      averageWordCount: 0,
      improvementTrend: 0,
      conceptMastery: 0,
      userEngagement: new Set(feynmanSessions.map(s => s.user_id)).size,
      sessionStatusBreakdown: {
        completed: feynmanSessions.filter(s => s.status === 'completed').length,
        explaining: feynmanSessions.filter(s => s.status === 'explaining').length,
        reviewing: feynmanSessions.filter(s => s.status === 'reviewing').length,
        preparing: feynmanSessions.filter(s => s.status === 'preparing').length
      }
    }

    // Calculate Feynman metrics
    if (feynmanExplanations.data && feynmanExplanations.data.length > 0) {
      const explanations = feynmanExplanations.data
      const scores = explanations.filter(e => e.overall_score).map(e => parseFloat(e.overall_score))
      if (scores.length > 0) {
        feynmanAnalytics.averageExplanationScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      }
      
      const wordCounts = explanations.filter(e => e.word_count).map(e => e.word_count)
      if (wordCounts.length > 0) {
        feynmanAnalytics.averageWordCount = Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
      }
    }

    // Build Retrieval Practice Analytics
    const retrievalSessions = retrievalData.data || []
    const retrievalPracticeAnalytics = {
      totalSessions: retrievalSessions.length,
      completedSessions: retrievalSessions.filter(s => s.status === 'completed').length,
      totalQuestions: retrievalAttempts.data?.length || 0,
      averageAccuracy: 0,
      averageConfidence: 0,
      averageResponseTime: 0,
      questionsPerSession: 0,
      userEngagement: new Set(retrievalSessions.map(s => s.user_id)).size,
      difficultyBreakdown: {
        easy: 0,
        medium: 0,
        hard: 0
      }
    }

    // Calculate Retrieval Practice metrics
    if (retrievalAttempts.data && retrievalAttempts.data.length > 0) {
      const attempts = retrievalAttempts.data
      const correctAttempts = attempts.filter(a => a.is_correct).length
      retrievalPracticeAnalytics.averageAccuracy = Math.round((correctAttempts / attempts.length) * 100)
      
      const confidenceScores = attempts.filter(a => a.confidence_level).map(a => a.confidence_level)
      if (confidenceScores.length > 0) {
        retrievalPracticeAnalytics.averageConfidence = Math.round(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length)
      }
      
      const responseTimes = attempts.filter(a => a.response_time_seconds).map(a => a.response_time_seconds)
      if (responseTimes.length > 0) {
        retrievalPracticeAnalytics.averageResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      }
      
      if (retrievalSessions.length > 0) {
        retrievalPracticeAnalytics.questionsPerSession = Math.round(attempts.length / retrievalSessions.length)
      }
    }

    // Build technique comparison
    const techniques = [
      { name: 'Active Recall', sessions: activeRecallSessions.length, users: activeRecallAnalytics.userEngagement },
      { name: 'Pomodoro', sessions: pomodoroSessions.length, users: pomodoroAnalytics.userEngagement },
      { name: 'Feynman', sessions: feynmanSessions.length, users: feynmanAnalytics.userEngagement },
      { name: 'Retrieval Practice', sessions: retrievalSessions.length, users: retrievalPracticeAnalytics.userEngagement }
    ]

    const techniqueComparison = techniques.map(t => ({
      technique: t.name,
      sessions: t.sessions,
      users: t.users,
      adoptionRate: Math.round((t.users / Math.max(studentIds.length, 1)) * 100),
      sessionsPerUser: t.users > 0 ? Math.round(t.sessions / t.users) : 0,
      color: t.name === 'Active Recall' ? '#10B981' :
             t.name === 'Pomodoro' ? '#3B82F6' :
             t.name === 'Feynman' ? '#EF4444' : '#8B5CF6'
    })).sort((a, b) => b.sessions - a.sessions)

    // Build time-based analysis
    const timeBasedAnalysis = []
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayActiveRecall = activeRecallSessions.filter(s => s.created_at.startsWith(dateStr)).length
      const dayPomodoro = pomodoroSessions.filter(s => s.created_at.startsWith(dateStr)).length
      const dayFeynman = feynmanSessions.filter(s => s.created_at.startsWith(dateStr)).length
      const dayRetrieval = retrievalSessions.filter(s => s.created_at.startsWith(dateStr)).length
      
      timeBasedAnalysis.push({
        date: dateStr,
        activeRecall: dayActiveRecall,
        pomodoro: dayPomodoro,
        feynman: dayFeynman,
        retrievalPractice: dayRetrieval,
        total: dayActiveRecall + dayPomodoro + dayFeynman + dayRetrieval
      })
    }

    // Build effectiveness metrics from analytics data
    const effectivenessMetrics = {}
    if (analyticsData.data) {
      const analyticsByTechnique = analyticsData.data.reduce((acc, item) => {
        if (!acc[item.session_type]) {
          acc[item.session_type] = []
        }
        acc[item.session_type].push(item)
        return acc
      }, {})

      Object.keys(analyticsByTechnique).forEach(technique => {
        const sessions = analyticsByTechnique[technique]
        const performances = sessions
          .map(s => s.performance_metrics?.improvement_percentage || 
                   s.performance_metrics?.post_study_accuracy ||
                   s.performance_metrics?.overall_accuracy || 0)
          .filter(p => p !== null && p !== undefined && p > 0)
        
        effectivenessMetrics[technique] = {
          averageImprovement: performances.length > 0 
            ? Math.round(performances.reduce((a, b) => a + b, 0) / performances.length)
            : 0,
          sessionCount: sessions.length,
          effectivenessRating: performances.length > 0 && (performances.reduce((a, b) => a + b, 0) / performances.length) >= 70 
            ? 'High' : performances.length > 0 && (performances.reduce((a, b) => a + b, 0) / performances.length) >= 50 
            ? 'Medium' : 'Low'
        }
      })
    }

    console.log('📊 [STUDY TECHNIQUES] Completed detailed study techniques analysis')

    return NextResponse.json({
      success: true,
      data: {
        activeRecallAnalytics,
        pomodoroAnalytics,
        feynmanAnalytics,
        retrievalPracticeAnalytics,
        techniqueComparison,
        timeBasedAnalysis,
        effectivenessMetrics
      }
    })

  } catch (error) {
    console.error('❌ Error in study techniques API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}