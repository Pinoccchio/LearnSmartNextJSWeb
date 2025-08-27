import { NextRequest, NextResponse } from 'next/server'
import { adminAPI } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    console.log('🔑 Admin delete user API called')
    
    // Get the user ID from the request
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Authentication - use same pattern as other admin routes
    const authHeader = request.headers.get('Authorization')
    let user = null
    let currentUserId = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log('🔐 Found Authorization header, attempting token auth')
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user: tokenUser }, error: authError } = await supabase.auth.getUser(token)
        if (!authError && tokenUser) {
          user = tokenUser
          currentUserId = tokenUser.id
          console.log('✅ Token auth successful')
        }
      } catch (error) {
        console.log('⚠️ Token auth failed, trying alternative auth')
      }
    }
    
    // Alternative: Try to get user from custom headers
    if (!user) {
      console.log('🔐 Trying custom header auth')
      currentUserId = request.headers.get('X-User-ID')
      const userRole = request.headers.get('X-User-Role')
      
      if (!currentUserId) {
        console.log('❌ No user authentication found')
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      
      console.log('✅ Found user ID in headers:', currentUserId, 'role:', userRole)
      // Create a user object for compatibility
      user = { id: currentUserId }
    }

    // Verify user is an admin
    console.log('👤 Verifying admin role for user ID:', currentUserId)
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUserId)
      .single()

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'User verification failed' }, { status: 403 })
    }

    if (!userProfile || userProfile?.role !== 'admin') {
      console.log('❌ User role check failed:', userProfile?.role)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('✅ Admin role verified')

    // Prevent self-deletion
    if (userId === currentUserId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Perform the deletion
    await adminAPI.deleteUser(userId)
    
    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('API: User deletion failed:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    )
  }
}