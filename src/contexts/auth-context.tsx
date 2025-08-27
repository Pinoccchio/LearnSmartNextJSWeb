"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'instructor' | 'student'
  status: 'active' | 'inactive' | 'suspended'
  profile_picture: string | null
  last_login: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, role?: 'admin' | 'instructor' | 'student') => Promise<void>
  logout: () => void
  isLoading: boolean
  connectionError: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Start with true to check session
  const [connectionError, setConnectionError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()


  // Robust authentication check with session-first approach to avoid getUser hangs
  const checkAuth = async (isRetry = false) => {
    try {
      console.log(`🔄 Checking authentication state... ${isRetry ? '(retry)' : ''}`)
      if (!isRetry) {
        setConnectionError(false)
        setRetryCount(0)
      }
      
      // Start with getSession first - it's more reliable and doesn't hang
      console.log('📋 Checking session first...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('❌ Session check failed:', sessionError)
        setUser(null)
        return
      }
      
      if (!session?.user) {
        console.log('👤 No active session found')
        setUser(null)
        return
      }
      
      console.log('✅ Session found, verifying with getUser...')
      
      // Only use getUser for verification if we have a session, with short timeout
      try {
        const getUserPromise = supabase.auth.getUser()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getUser timeout')), 3000) // Shorter timeout
        )
        
        const { data: { user: authUser }, error: getUserError } = await Promise.race([
          getUserPromise, 
          timeoutPromise
        ]) as any
        
        if (getUserError) {
          if (getUserError.message === 'getUser timeout') {
            console.warn('⚠️ getUser() timed out, using session data instead')
            setRetryCount(prev => prev + 1)
            if (retryCount >= 1) { // Show connection error after first timeout
              setConnectionError(true)
            }
            
            // Use session user data instead of failing
            await fetchUserProfile(session.user.id, false)
            
            // Auto-retry after a delay if we haven't exceeded retry limit
            if (retryCount < 3 && !isRetry) {
              setTimeout(() => {
                console.log('🔄 Auto-retrying authentication...')
                checkAuth(true)
              }, 5000) // Retry after 5 seconds
            }
            return
          } else {
            console.error('❌ getUser verification failed:', getUserError)
            // If getUser fails but we have a session, still try to use session data
            if (session.user) {
              console.log('🔄 getUser failed, falling back to session data')
              await fetchUserProfile(session.user.id, false)
              return
            }
          }
        } else if (authUser) {
          console.log('✅ User verified via getUser()')
          await fetchUserProfile(authUser.id, false)
          setConnectionError(false)
          setRetryCount(0) // Reset retry count on success
          return
        }
      } catch (verificationError: any) {
        console.warn('⚠️ getUser verification failed, using session data:', verificationError.message)
        setRetryCount(prev => prev + 1)
        if (retryCount < 2) { // Only show connection error after multiple failures
          setConnectionError(true)
        }
        // Fall back to session data
        await fetchUserProfile(session.user.id, false)
        return
      }
      
      // If we reach here, something went wrong
      console.log('👤 Authentication verification failed')
      setUser(null)
      
    } catch (error: any) {
      console.error('❌ Auth check error:', error)
      if (error.message?.includes('timeout') || error.message?.includes('fetch')) {
        setConnectionError(true)
      }
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Check authentication on mount
    checkAuth()

    // Listen for auth state changes with proper error handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state change:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in, fetching profile')
        try {
          await fetchUserProfile(session.user.id, false)
          setConnectionError(false) // Clear any connection errors on successful sign in
        } catch (error) {
          console.error('❌ Failed to fetch profile on auth change:', error)
          // Set connection error if profile fetch fails
          if (error.message?.includes('timeout') || error.message?.includes('fetch')) {
            setConnectionError(true)
          }
        }
      } else if (event === 'SIGNED_OUT' || !session) {
        console.log('👋 User signed out')
        setUser(null)
        setConnectionError(false) // Clear connection errors on sign out
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 Token refreshed for user:', session.user.id)
        // Token refresh is handled by middleware, no need to refetch profile
      } else {
        console.log('🔔 Other auth event:', event)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string, updateLastLogin = false): Promise<void> => {
    try {
      console.log('🔄 Fetching user profile for:', userId)
      
      // Add timeout to profile fetch with shorter timeout for better UX
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
      )
      
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any

      if (error) {
        if (error.message === 'Profile fetch timeout') {
          console.error('⚠️ Profile fetch timed out for user:', userId)
          throw new Error('Profile fetch timeout')
        }
        console.error('❌ Supabase error fetching profile:', error.message || error)
        throw new Error(`Profile fetch failed: ${error.message || 'Unknown error'}`)
      }

      if (data) {
        const userData = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          status: data.status,
          profile_picture: data.profile_picture,
          last_login: data.last_login,
          created_at: data.created_at,
          updated_at: data.updated_at
        }
        
        console.log('✅ User profile loaded:', userData.email, userData.role)
        setUser(userData)
        
        // Update last_login time if requested (usually on login) - non-blocking
        if (updateLastLogin) {
          supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', userId)
            .then(() => console.log('✅ Last login timestamp updated'))
            .catch((err: any) => console.warn('⚠️ Failed to update last_login:', err))
        }
      } else {
        console.warn('⚠️ No user profile found for ID:', userId)
        throw new Error('User profile not found')
      }
    } catch (error: any) {
      console.error('❌ Error fetching user profile:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, name: string, role: 'admin' | 'instructor' | 'student' = 'student') => {
    setIsLoading(true)
    
    try {
      // Step 1: Sign up with Supabase Auth with user metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            role: role
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      // Step 2: If signup succeeds, manually create user profile (since trigger is disabled)
      if (data.user) {
        const timestamp = new Date().toISOString()
        
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            name: name,
            role: role,
            status: 'active',
            profile_picture: null,
            created_at: timestamp,
            updated_at: timestamp
          })
        
        // If profile creation fails, we should handle it more carefully
        if (profileError) {
          console.error('Profile creation failed:', profileError)
          
          // Try to clean up the auth user if profile creation fails
          try {
            // We can't easily delete the auth user here, but we'll log the issue
            console.warn('Auth user created but profile creation failed. User ID:', data.user.id)
          } catch (cleanupError) {
            console.error('Failed to clean up after profile creation error:', cleanupError)
          }
          
          // Now throw the error to be handled by the caller
          throw new Error(`Account created but profile setup failed: ${profileError.message}`)
        }
      } else {
        // This shouldn't happen, but handle it just in case
        throw new Error('User registration returned no user data')
      }
      
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    
    try {
      console.log('🔐 Attempting login for:', email)
      setConnectionError(false)
      
      // Add timeout to login request
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 10000)
      )
      
      const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any

      if (error) {
        if (error.message === 'Login timeout') {
          console.error('⚠️ Login request timed out')
          setConnectionError(true)
          throw new Error('Login request timed out. Please check your connection and try again.')
        }
        console.error('❌ Login error:', error.message)
        throw error
      }

      if (data.user) {
        console.log('✅ Login successful, fetching profile')
        // Fetch user profile and update last login
        await fetchUserProfile(data.user.id, true)
      }
    } catch (error: any) {
      console.error('❌ Login error:', error)
      if (error.message?.includes('timeout') || error.message?.includes('fetch')) {
        setConnectionError(true)
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }


  const logout = async () => {
    setIsLoading(true)
    
    try {
      console.log('🔄 Starting logout process...')
      
      setUser(null)
      
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) {
        console.error('Supabase signOut error:', error)
      }
      
      try {
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.clear()
        
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key)
          }
        })
      } catch (storageError) {
        console.warn('Error clearing storage:', storageError)
      }
      
      console.log('✅ Logout completed successfully')
      
    } catch (error) {
      console.error('❌ Logout error:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, connectionError }}>
      {children}
      {/* Show connection error banner only after multiple failures */}
      {connectionError && retryCount >= 2 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-3 text-sm shadow-lg">
          <div className="flex items-center justify-center gap-3">
            <span>⚠️ Authentication timeout detected. Using cached session data.</span>
            <button
              onClick={() => {
                setConnectionError(false)
                setRetryCount(0)
                checkAuth(true)
              }}
              className="text-xs bg-amber-600 hover:bg-amber-700 px-2 py-1 rounded transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}