import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { analyticsAPI } from '@/lib/supabase-api'

export async function GET(request: NextRequest) {
  try {
    console.log('🔑 Admin dashboard API called')
    
    // Authentication - use same pattern as other admin routes
    const authHeader = request.headers.get('Authorization')
    let user = null
    let userId = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log('🔐 Found Authorization header, attempting token auth')
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user: tokenUser }, error: authError } = await supabase.auth.getUser(token)
        if (!authError && tokenUser) {
          user = tokenUser
          userId = tokenUser.id
          console.log('✅ Token auth successful')
        }
      } catch (error) {
        console.log('⚠️ Token auth failed, trying alternative auth')
      }
    }
    
    // Alternative: Try to get user from custom headers
    if (!user) {
      console.log('🔐 Trying custom header auth')
      userId = request.headers.get('X-User-ID')
      const userRole = request.headers.get('X-User-Role')
      
      if (!userId) {
        console.log('❌ No user authentication found')
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      
      console.log('✅ Found user ID in headers:', userId, 'role:', userRole)
      // Create a user object for compatibility
      user = { id: userId }
    }

    // Verify user is an admin
    console.log('👤 Verifying admin role for user ID:', userId)
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('❌ Error fetching user profile:', userError)
      return NextResponse.json({ error: 'User verification failed' }, { status: 403 })
    }

    if (!userProfile || userProfile.role !== 'admin') {
      console.log('❌ User role check failed:', userProfile?.role)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('✅ Admin role verified')

    // Fetch dashboard analytics data
    console.log('📊 Fetching dashboard stats')
    
    try {
      const dashboardStats = await analyticsAPI.getDashboardStats()
      const techniqueStats = await analyticsAPI.getStudyTechniqueStats()
      
      console.log('✅ Dashboard data fetched successfully')

      return NextResponse.json({
        success: true,
        stats: dashboardStats,
        techniques: techniqueStats,
        timestamp: new Date().toISOString()
      })

    } catch (statsError: any) {
      console.error('💥 Error fetching stats:', statsError)
      
      // Return fallback data if stats fail
      return NextResponse.json({
        success: true,
        stats: {
          totalStudents: 0,
          totalCourses: 0,
          completionRate: 0,
          activeSessions: 0
        },
        techniques: {},
        timestamp: new Date().toISOString(),
        warning: 'Using fallback data due to stats error'
      })
    }

  } catch (error: any) {
    console.error('💥 Error in admin dashboard API:', error)
    
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch dashboard data',
      details: 'Check server logs for more information'
    }, { status: 500 })
  }
}