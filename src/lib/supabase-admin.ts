import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Admin client for server-side operations
// This client has elevated privileges for admin operations like user deletion
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Admin-only functions
export const adminAPI = {
  // Delete user from both auth and database
  async deleteUser(userId: string): Promise<void> {
    console.log('Admin: Starting complete user deletion for:', userId)
    
    try {
      // Step 1: Delete from public.users table first
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId)
      
      if (dbError) {
        console.error('Failed to delete from database:', dbError)
        throw new Error(`Database deletion failed: ${dbError.message}`)
      }
      
      console.log('Admin: Successfully deleted user from database')
      
      // Step 2: Delete from auth.users
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      
      if (authError) {
        console.error('Failed to delete from auth:', authError)
        
        // If auth deletion fails, we should ideally restore the database record
        // But for now, we'll just throw an error
        throw new Error(`Auth deletion failed: ${authError.message}`)
      }
      
      console.log('Admin: Successfully deleted user from auth')
      console.log('Admin: Complete user deletion successful for:', userId)
      
    } catch (error) {
      console.error('Admin: User deletion failed:', error)
      throw error
    }
  },

  // Get user by ID (useful for verification)
  async getUserById(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // List all auth users (for debugging)
  async listAuthUsers() {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) throw error
    return data
  }
}

export default supabaseAdmin