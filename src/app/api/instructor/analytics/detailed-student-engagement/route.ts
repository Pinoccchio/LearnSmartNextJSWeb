import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 [DETAILED ENGAGEMENT] Starting detailed student engagement API call')
    
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
          studentsList: [],
          engagementTrends: [],
          studyHeatmap: [],
          techniquePreferences: [],
          progressOverview: []
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
          studentsList: [],
          engagementTrends: [],
          studyHeatmap: [],
          techniquePreferences: [],
          progressOverview: []
        }
      })
    }

    // Get detailed student information
    const { data: studentsInfo } = await supabase
      .from('users')
      .select('id, name, email, last_login, created_at')
      .in('id', studentIds)

    // Get all study sessions for these students
    const [activeRecallSessions, pomodoroSessions, feynmanSessions, retrievalSessions] = await Promise.all([
      supabase.from('active_recall_sessions')
        .select('id, user_id, created_at, status, completed_at, started_at')
        .in('user_id', studentIds)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false }),
      
      supabase.from('pomodoro_sessions')
        .select('id, user_id, created_at, status, completed_at, started_at')
        .in('user_id', studentIds)  
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false }),
        
      supabase.from('feynman_sessions')
        .select('id, user_id, created_at, status, completed_at, started_at')
        .in('user_id', studentIds)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false }),
        
      supabase.from('retrieval_practice_sessions')
        .select('id, user_id, created_at, status, completed_at, started_at')
        .in('user_id', studentIds)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
    ])

    // Get study analytics data
    const { data: analyticsData } = await supabase
      .from('study_session_analytics')
      .select('user_id, session_type, performance_metrics, analyzed_at, created_at')
      .in('user_id', studentIds)
      .gte('created_at', startDate.toISOString())
      .order('analyzed_at', { ascending: false })

    // Get module progress
    const { data: moduleProgressData } = await supabase
      .from('user_module_progress')
      .select(`
        user_id,
        module_id,
        best_score,
        latest_score,
        status,
        passed,
        last_attempt_at,
        modules!inner (
          id,
          title,
          course_id
        )
      `)
      .in('user_id', studentIds)
      .in('modules.course_id', courseIds)

    // Combine all sessions with type
    const allSessions = [
      ...(activeRecallSessions.data || []).map(s => ({...s, session_type: 'active_recall'})),
      ...(pomodoroSessions.data || []).map(s => ({...s, session_type: 'pomodoro'})),
      ...(feynmanSessions.data || []).map(s => ({...s, session_type: 'feynman'})),
      ...(retrievalSessions.data || []).map(s => ({...s, session_type: 'retrieval_practice'}))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Build detailed student engagement data
    const studentsList = (studentsInfo || []).map(student => {
      const studentSessions = allSessions.filter(s => s.user_id === student.id)
      const studentAnalytics = analyticsData?.filter(a => a.user_id === student.id) || []
      const studentProgress = moduleProgressData?.filter(mp => mp.user_id === student.id) || []

      // Calculate engagement metrics
      const totalSessions = studentSessions.length
      const completedSessions = studentSessions.filter(s => s.status === 'completed').length
      const recentSessions = studentSessions.filter(s => 
        new Date(s.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length

      // Calculate average performance
      let averagePerformance = 0
      if (studentAnalytics.length > 0) {
        const performances = studentAnalytics
          .map(a => a.performance_metrics?.post_study_accuracy || 
                   a.performance_metrics?.improvement_percentage || 
                   a.performance_metrics?.overall_accuracy || 0)
          .filter(p => p > 0)
        
        if (performances.length > 0) {
          averagePerformance = Math.round(performances.reduce((a, b) => a + b, 0) / performances.length)
        }
      }

      // Calculate module completion rate
      const completedModules = studentProgress.filter(mp => mp.status === 'completed' || mp.passed).length
      const moduleCompletionRate = studentProgress.length > 0 
        ? Math.round((completedModules / studentProgress.length) * 100)
        : 0

      // Calculate engagement level
      let engagementLevel: 'high' | 'medium' | 'low' = 'low'
      const engagementScore = (recentSessions * 0.4) + (moduleCompletionRate * 0.004) + (averagePerformance * 0.006)
      
      if (engagementScore >= 3) engagementLevel = 'high'
      else if (engagementScore >= 1.5) engagementLevel = 'medium'

      // Get preferred study technique
      const techniqueCount = {}
      studentSessions.forEach(s => {
        techniqueCount[s.session_type] = (techniqueCount[s.session_type] || 0) + 1
      })
      const preferredTechnique = Object.entries(techniqueCount)
        .sort((a, b) => b[1] - a[1])
        .map(([technique]) => technique.replace(/_/g, ' '))
        .join(', ') || 'None'

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        lastLogin: student.last_login,
        engagementLevel,
        totalSessions,
        recentSessions,
        completedSessions,
        completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
        averagePerformance,
        moduleCompletionRate,
        preferredTechnique,
        lastActivity: studentSessions.length > 0 ? studentSessions[0].created_at : null
      }
    }).sort((a, b) => b.totalSessions - a.totalSessions)

    // Build engagement trends (daily data for the selected period)
    const engagementTrends = []
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const daySessions = allSessions.filter(s => 
        s.created_at.startsWith(dateStr)
      )
      
      engagementTrends.push({
        date: dateStr,
        sessions: daySessions.length,
        activeStudents: new Set(daySessions.map(s => s.user_id)).size,
        completedSessions: daySessions.filter(s => s.status === 'completed').length
      })
    }

    // Build study heatmap (hour by day)
    const studyHeatmap = []
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const sessionsAtTime = allSessions.filter(s => {
          const sessionDate = new Date(s.created_at)
          return sessionDate.getDay() === day && sessionDate.getHours() === hour
        }).length
        
        if (sessionsAtTime > 0) {
          studyHeatmap.push({
            day: daysOfWeek[day],
            hour,
            sessions: sessionsAtTime,
            intensity: Math.min(sessionsAtTime / Math.max(allSessions.length * 0.01, 1), 1)
          })
        }
      }
    }

    // Build technique preferences
    const techniquePreferences = [
      'active_recall', 'pomodoro', 'feynman', 'retrieval_practice'
    ].map(technique => {
      const sessions = allSessions.filter(s => s.session_type === technique)
      const users = new Set(sessions.map(s => s.user_id)).size
      
      return {
        technique: technique.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        sessions: sessions.length,
        users,
        adoptionRate: Math.round((users / Math.max(studentIds.length, 1)) * 100),
        completionRate: sessions.length > 0 
          ? Math.round((sessions.filter(s => s.status === 'completed').length / sessions.length) * 100)
          : 0
      }
    }).filter(t => t.sessions > 0)
    .sort((a, b) => b.sessions - a.sessions)

    // Build progress overview
    const progressOverview = []
    const moduleMap = new Map()
    
    moduleProgressData?.forEach(mp => {
      const key = `${mp.modules.course_id}-${mp.module_id}`
      if (!moduleMap.has(key)) {
        moduleMap.set(key, {
          moduleId: mp.module_id,
          moduleTitle: mp.modules.title,
          students: [],
          totalStudents: 0,
          completedStudents: 0,
          averageScore: 0
        })
      }
      
      const moduleData = moduleMap.get(key)
      moduleData.totalStudents++
      
      const score = parseFloat(mp.best_score || mp.latest_score || '0')
      moduleData.students.push({
        userId: mp.user_id,
        score,
        status: mp.status,
        passed: mp.passed
      })
      
      if (mp.status === 'completed' || mp.passed) {
        moduleData.completedStudents++
      }
    })
    
    moduleMap.forEach((moduleData, key) => {
      const validScores = moduleData.students.map(s => s.score).filter(s => s > 0)
      const avgScore = validScores.length > 0 
        ? validScores.reduce((a, b) => a + b, 0) / validScores.length 
        : 0
      
      progressOverview.push({
        moduleId: moduleData.moduleId,
        moduleTitle: moduleData.moduleTitle,
        totalStudents: moduleData.totalStudents,
        completedStudents: moduleData.completedStudents,
        completionRate: Math.round((moduleData.completedStudents / moduleData.totalStudents) * 100),
        averageScore: Math.round(avgScore),
        status: avgScore >= 80 ? 'excellent' : 
                avgScore >= 70 ? 'good' : 
                avgScore >= 60 ? 'needs_improvement' : 'critical'
      })
    })

    console.log('📊 [DETAILED ENGAGEMENT] Completed detailed engagement analysis')

    return NextResponse.json({
      success: true,
      data: {
        studentsList: studentsList.slice(0, 50), // Limit for performance
        engagementTrends,
        studyHeatmap,
        techniquePreferences,
        progressOverview: progressOverview.slice(0, 20)
      }
    })

  } catch (error) {
    console.error('❌ Error in detailed engagement API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}