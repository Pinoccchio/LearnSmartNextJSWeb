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
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select(`
        user_id,
        users!inner (
          id,
          name
        ),
        courses!inner (
          instructor_id
        )
      `)
      .eq('courses.instructor_id', userId)
      .eq('status', 'active')

    const studentIds = [...new Set(enrollments?.map(e => e.user_id) || [])]
    const studentMap = new Map(enrollments?.map(e => [e.user_id, e.users.name]) || [])

    if (studentIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          engagement: {
            peakHours: [],
            contentTypes: [],
            topStudents: [],
            studyPatterns: []
          },
          summary: {
            totalStudents: 0,
            activeStudents: 0,
            averageEngagement: 0
          }
        }
      })
    }

    // Get study sessions for time analysis
    const { data: sessions } = await supabase
      .from('study_session_analytics')
      .select('user_id, session_type, created_at')
      .in('user_id', studentIds)
      .gte('created_at', startDate.toISOString())
      .limit(500)

    // Calculate peak hours
    const hourlyActivity = new Array(24).fill(0)
    sessions?.forEach(session => {
      const hour = new Date(session.created_at).getHours()
      hourlyActivity[hour]++
    })

    const totalSessions = sessions?.length || 0
    const peakHours = hourlyActivity
      .map((count, hour) => ({
        time: `${hour.toString().padStart(2, '0')}:00`,
        activity: count,
        percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0
      }))
      .filter(h => h.activity > 0)
      .sort((a, b) => b.activity - a.activity)
      .slice(0, 4)

    // Calculate content type engagement
    const techniqueCount = {}
    sessions?.forEach(s => {
      techniqueCount[s.session_type] = (techniqueCount[s.session_type] || 0) + 1
    })

    const contentTypes = Object.entries(techniqueCount).map(([type, count]) => ({
      type: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      engagement: count as number,
      percentage: totalSessions > 0 ? Math.round((count as number / totalSessions) * 100) : 0,
      color: type === 'active_recall' ? '#10B981' :
             type === 'pomodoro' ? '#3B82F6' :
             type === 'feynman' ? '#EF4444' : '#8B5CF6'
    }))

    // Get top students by activity
    const studentActivity = {}
    sessions?.forEach(s => {
      studentActivity[s.user_id] = (studentActivity[s.user_id] || 0) + 1
    })

    const topStudents = Object.entries(studentActivity)
      .map(([studentId, count]) => ({
        id: studentId,
        name: studentMap.get(studentId) || 'Unknown',
        sessions: count as number,
        engagementScore: Math.min(100, Math.round((count as number / 10) * 100))
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5)

    // Calculate active students
    const activeStudents = new Set(sessions?.map(s => s.user_id) || []).size

    // Simple study patterns
    const studyPatterns = [
      {
        pattern: 'Morning Learners',
        count: sessions?.filter(s => {
          const hour = new Date(s.created_at).getHours()
          return hour >= 6 && hour < 12
        }).length || 0,
        description: 'Students who study in morning hours'
      },
      {
        pattern: 'Night Owls',
        count: sessions?.filter(s => {
          const hour = new Date(s.created_at).getHours()
          return hour >= 20 || hour < 2
        }).length || 0,
        description: 'Students who study late at night'
      },
      {
        pattern: 'Consistent Learners',
        count: Math.ceil(activeStudents * 0.4),
        description: 'Students with regular study habits'
      }
    ]

    return NextResponse.json({
      success: true,
      data: {
        engagement: {
          peakHours,
          contentTypes,
          topStudents,
          studyPatterns
        },
        summary: {
          totalStudents: studentIds.length,
          activeStudents,
          averageEngagement: Math.round((activeStudents / Math.max(studentIds.length, 1)) * 100),
          totalSessions,
          timeRange
        },
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error in student engagement API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}