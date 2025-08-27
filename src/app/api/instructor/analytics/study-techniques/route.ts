import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get user ID from headers
    const userId = request.headers.get('X-User-ID')
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get time range
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'month'
    const courseId = searchParams.get('courseId')
    
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

    // Get instructor's students
    let studentQuery = supabase
      .from('course_enrollments')
      .select('user_id, courses!inner(instructor_id)')
      .eq('courses.instructor_id', userId)
      .eq('status', 'active')
    
    if (courseId) {
      studentQuery = studentQuery.eq('course_id', courseId)
    }

    const { data: enrollments } = await studentQuery
    const studentIds = [...new Set(enrollments?.map(e => e.user_id) || [])]
    
    if (studentIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          techniques: [],
          summary: {
            totalSessions: 0,
            totalStudents: 0,
            mostEffectiveTechnique: null,
            mostUsedTechnique: null
          }
        }
      })
    }

    // Get study sessions by technique
    const techniques = ['active_recall', 'pomodoro', 'feynman', 'retrieval_practice']
    const techniqueData = []

    for (const technique of techniques) {
      // Get session count and unique users
      const { data: sessions, count } = await supabase
        .from(`${technique}_sessions`)
        .select('user_id, created_at', { count: 'exact' })
        .in('user_id', studentIds)
        .gte('created_at', startDate.toISOString())
        .limit(100)

      const uniqueUsers = new Set(sessions?.map(s => s.user_id) || []).size
      const totalSessions = count || 0

      // Get average performance from analytics
      const { data: analytics } = await supabase
        .from('study_session_analytics')
        .select('performance_metrics')
        .in('user_id', studentIds)
        .eq('session_type', technique)
        .gte('created_at', startDate.toISOString())
        .not('performance_metrics', 'is', null)
        .limit(50)

      let effectiveness = 0
      if (analytics && analytics.length > 0) {
        const scores = analytics.map(a => {
          const metrics = a.performance_metrics || {}
          return metrics.overall_accuracy || metrics.improvement || 0
        })
        effectiveness = scores.reduce((a, b) => a + b, 0) / scores.length
      }

      techniqueData.push({
        technique: technique.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: technique,
        totalSessions,
        uniqueUsers,
        adoptionRate: Math.round((uniqueUsers / studentIds.length) * 100),
        effectiveness: Math.round(effectiveness),
        effectivenessPercentage: Math.round(effectiveness),
        averageScore: Math.round(effectiveness),
        usagePercentage: Math.round((uniqueUsers / studentIds.length) * 100),
        description: getTechniqueDescription(technique),
        icon: getTechniqueIcon(technique),
        color: getTechniqueColor(technique),
        performanceLevel: effectiveness >= 70 ? 'good' : effectiveness >= 50 ? 'needs_improvement' : 'underutilized',
        recommendation: effectiveness >= 70 ? 'Continue current approach' : 'Consider additional support'
      })
    }

    // Calculate summary
    const totalSessions = techniqueData.reduce((sum, t) => sum + t.totalSessions, 0)
    const mostUsedTechnique = techniqueData.reduce((prev, current) => 
      current.totalSessions > prev.totalSessions ? current : prev, techniqueData[0]
    )
    const mostEffectiveTechnique = techniqueData.reduce((prev, current) => 
      current.effectiveness > prev.effectiveness ? current : prev, techniqueData[0]
    )

    return NextResponse.json({
      success: true,
      data: {
        techniques: techniqueData.filter(t => t.totalSessions > 0),
        summary: {
          totalSessions,
          totalStudents: studentIds.length,
          activeStudents: new Set(techniqueData.flatMap(t => 
            Array(t.uniqueUsers).fill(0).map((_, i) => `user_${i}`)
          )).size,
          mostUsedTechnique: mostUsedTechnique?.totalSessions > 0 ? {
            name: mostUsedTechnique.technique,
            sessions: mostUsedTechnique.totalSessions,
            adoptionRate: mostUsedTechnique.adoptionRate
          } : null,
          mostEffectiveTechnique: mostEffectiveTechnique?.effectiveness > 0 ? {
            name: mostEffectiveTechnique.technique,
            effectiveness: mostEffectiveTechnique.effectiveness,
            averageScore: mostEffectiveTechnique.averageScore
          } : null,
          timeRange,
          coursesAnalyzed: courseId ? 1 : enrollments?.length || 0
        },
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error in study techniques API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function getTechniqueDescription(type: string): string {
  switch (type) {
    case 'active_recall':
      return 'AI-generated flashcards and memory retrieval'
    case 'pomodoro':
      return 'Focused study sessions with timed breaks'
    case 'feynman':
      return 'Learn by teaching concepts simply'
    case 'retrieval_practice':
      return 'Spaced repetition and practice questions'
    default:
      return 'Study technique for enhanced learning'
  }
}

function getTechniqueIcon(type: string): string {
  switch (type) {
    case 'active_recall':
      return 'brain'
    case 'pomodoro':
      return 'timer'
    case 'feynman':
      return 'message-square'
    case 'retrieval_practice':
      return 'refresh-cw'
    default:
      return 'book-open'
  }
}

function getTechniqueColor(type: string): string {
  switch (type) {
    case 'active_recall':
      return '#10B981'
    case 'pomodoro':
      return '#3B82F6'
    case 'feynman':
      return '#EF4444'
    case 'retrieval_practice':
      return '#8B5CF6'
    default:
      return '#6B7280'
  }
}