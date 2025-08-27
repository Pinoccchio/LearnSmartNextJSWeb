import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔑 Admin users API called')
    
    // Try to get user from Authorization header first (fallback for existing auth)
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

    // Fetch all users
    console.log('👥 Fetching all users for admin')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('💥 Error fetching users:', usersError)
      return NextResponse.json({ 
        error: 'Failed to fetch users',
        details: usersError.message 
      }, { status: 500 })
    }

    console.log('✅ Users fetched successfully:', users?.length || 0, 'users')

    return NextResponse.json({
      success: true,
      users: users || [],
      count: users?.length || 0
    })

  } catch (error: any) {
    console.error('💥 Error in admin users API:', error)
    console.error('💥 Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    })
    
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch users',
      details: 'Check server logs for more information'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Admin create user API called')
    
    // Authentication (same pattern as GET)
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
      const userRole = request.headers.get('X-User-Role')
      
      if (!userId) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      
      user = { id: userId }
    }

    // Verify admin role
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, role, status } = body

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json({ 
        error: 'Name, email, password, and role are required' 
      }, { status: 400 })
    }

    console.log('👤 Creating new user:', { email, role, status })

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          role: role
        },
        emailRedirectTo: undefined // Disable email confirmation for admin-created users
      }
    })

    if (authError) {
      console.error('Auth creation failed:', authError)
      throw new Error(`Authentication error: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user data returned')
    }

    // Step 2: Create user profile
    const timestamp = new Date().toISOString()
    const profileData = {
      id: authData.user.id,
      email: email,
      name: name,
      role: role,
      status: status || 'active',
      profile_picture: null,
      created_at: timestamp,
      updated_at: timestamp
    }

    const { data: profileResult, error: profileError } = await supabase
      .from('users')
      .insert(profileData)
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation failed:', profileError)
      throw new Error(`Database error: ${profileError.message}`)
    }

    console.log('✅ User created successfully:', profileResult.id)

    return NextResponse.json({
      success: true,
      user: profileResult,
      message: 'User created successfully'
    })

  } catch (error: any) {
    console.error('💥 Error creating user:', error)
    
    let errorMessage = 'Failed to create user'
    if (error.message?.includes('User already registered')) {
      errorMessage = 'A user with this email address already exists'
    } else if (error.message?.includes('Password should be at least 6 characters')) {
      errorMessage = 'Password must be at least 6 characters long'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error.message
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔑 Admin update user API called')
    
    // Authentication (same pattern)
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

    // Verify admin role
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { targetUserId, updates } = body

    if (!targetUserId || !updates) {
      return NextResponse.json({ 
        error: 'Target user ID and updates are required' 
      }, { status: 400 })
    }

    console.log('📝 Updating user:', targetUserId, 'with updates:', updates)

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId)
      .select()
      .single()

    if (updateError) {
      console.error('Update failed:', updateError)
      throw new Error(`Update failed: ${updateError.message}`)
    }

    console.log('✅ User updated successfully')

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully'
    })

  } catch (error: any) {
    console.error('💥 Error updating user:', error)
    
    return NextResponse.json({ 
      error: error.message || 'Failed to update user',
      details: error.message
    }, { status: 500 })
  }
}