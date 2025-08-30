/**
 * Authentication utilities for API calls
 * Handles session management and authenticated requests
 */

import { createClient } from '@/lib/supabase/client'

/**
 * Get authenticated headers for API calls
 */
export async function getAuthenticatedHeaders(): Promise<Record<string, string>> {
  const supabase = createClient()
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      throw new Error('Failed to get authentication session')
    }
    
    if (!session?.access_token || !session?.user?.id) {
      throw new Error('No active authentication session')
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'X-User-ID': session.user.id
    }
  } catch (error) {
    console.error('Auth headers error:', error)
    throw error
  }
}

/**
 * Make an authenticated API request
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const headers = await getAuthenticatedHeaders()
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    })
    
    return response
  } catch (error) {
    console.error('Authenticated fetch error:', error)
    throw error
  }
}

/**
 * Check if user is authenticated and has required role
 */
export async function checkAuthAndRole(requiredRole?: string): Promise<{
  isAuthenticated: boolean
  user: any | null
  hasRequiredRole: boolean
}> {
  const supabase = createClient()
  
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return {
        isAuthenticated: false,
        user: null,
        hasRequiredRole: false
      }
    }
    
    // Get user profile for role checking
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (profileError || !userProfile) {
      return {
        isAuthenticated: true,
        user: session.user,
        hasRequiredRole: false
      }
    }
    
    const hasRequiredRole = !requiredRole || userProfile.role === requiredRole
    
    return {
      isAuthenticated: true,
      user: userProfile,
      hasRequiredRole
    }
  } catch (error) {
    console.error('Auth check error:', error)
    return {
      isAuthenticated: false,
      user: null,
      hasRequiredRole: false
    }
  }
}

/**
 * Authentication error handler
 */
export function handleAuthError(error: any): string {
  if (error.message?.includes('No active authentication session')) {
    return 'Please log in to access this feature'
  }
  
  if (error.message?.includes('Failed to get authentication session')) {
    return 'Authentication session expired. Please log in again'
  }
  
  if (error.message?.includes('timeout')) {
    return 'Connection timeout. Please check your network and try again'
  }
  
  return error.message || 'Authentication error occurred'
}