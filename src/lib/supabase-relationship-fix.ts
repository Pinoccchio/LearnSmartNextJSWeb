/**
 * Supabase Relationship Diagnostic and Fix Utilities
 * 
 * This file contains utilities for diagnosing and fixing relationship issues
 * between tables in Supabase, particularly for the courses-modules relationship.
 */

import { supabase } from './supabase'

/**
 * Run diagnostics on the courses-modules relationship
 * This helps identify common issues with table relationships
 */
export async function relationshipDiagnostics() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    fixes_attempted: [] as string[],
    recommendations: [] as string[]
  }

  try {
    // Test 1: Check if courses table exists and is accessible
    try {
      const { count, error } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        results.tests.push({
          name: 'Courses table access',
          status: 'failed',
          error: error.message
        })
        results.recommendations.push('Verify the courses table exists and is accessible')
      } else {
        results.tests.push({
          name: 'Courses table access',
          status: 'success',
          data: `Found courses table with approximately ${count} records`
        })
      }
    } catch (err: any) {
      results.tests.push({
        name: 'Courses table access',
        status: 'failed',
        error: err.message
      })
    }

    // Test 2: Check if modules table exists and is accessible
    try {
      const { count, error } = await supabase
        .from('modules')
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        results.tests.push({
          name: 'Modules table access',
          status: 'failed',
          error: error.message
        })
        results.recommendations.push('Verify the modules table exists and is accessible')
      } else {
        results.tests.push({
          name: 'Modules table access',
          status: 'success',
          data: `Found modules table with approximately ${count} records`
        })
      }
    } catch (err: any) {
      results.tests.push({
        name: 'Modules table access',
        status: 'failed',
        error: err.message
      })
    }

    // Test 3: Try a basic join between courses and modules
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id, title,
          modules:modules (id, title)
        `)
        .limit(1)
      
      if (error) {
        results.tests.push({
          name: 'Course-module relationship join',
          status: 'failed',
          error: error.message
        })
        
        if (error.message.includes('relationship between')) {
          results.recommendations.push('Run the SQL script in supabase-schema-fix.sql to repair the relationship')
        }
      } else {
        results.tests.push({
          name: 'Course-module relationship join',
          status: 'success',
          data: `Join query successful`
        })
      }
    } catch (err: any) {
      results.tests.push({
        name: 'Course-module relationship join',
        status: 'failed',
        error: err.message
      })
    }

    // Test 4: Check if the fallback approach works
    try {
      // Get a sample course
      const { data: courseSample, error: courseError } = await supabase
        .from('courses')
        .select('id, title')
        .limit(1)
      
      if (courseError) {
        results.tests.push({
          name: 'Fallback query approach',
          status: 'failed',
          error: courseError.message
        })
      } else if (courseSample && courseSample.length > 0) {
        // Try to get modules for this course
        const { data: moduleSample, error: moduleError } = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', courseSample[0].id)
        
        if (moduleError) {
          results.tests.push({
            name: 'Fallback query approach',
            status: 'failed',
            error: moduleError.message
          })
        } else {
          results.tests.push({
            name: 'Fallback query approach',
            status: 'success',
            data: `Found ${moduleSample?.length || 0} modules for course "${courseSample[0].title}"`
          })
          
          // If successful, but the join failed, recommend using the fallback
          const joinTest = results.tests.find(t => t.name === 'Course-module relationship join')
          if (joinTest && joinTest.status === 'failed') {
            results.recommendations.push('The fallback approach works - application can function while you fix the relationship')
          }
        }
      } else {
        results.tests.push({
          name: 'Fallback query approach',
          status: 'skipped',
          data: 'No courses found to test with'
        })
      }
    } catch (err: any) {
      results.tests.push({
        name: 'Fallback query approach',
        status: 'failed',
        error: err.message
      })
    }

    // Add final recommendations
    if (results.tests.some(t => t.status === 'failed')) {
      results.recommendations.push('Run the SQL fix script found in supabase-schema-fix.sql')
      results.recommendations.push('If issues persist, check Supabase logs for more details')
    }

    return results
  } catch (err: any) {
    return {
      timestamp: new Date().toISOString(),
      error: 'Failed to run diagnostics',
      message: err.message,
      recommendations: [
        'Check your network connection',
        'Verify Supabase is online',
        'Check your API keys and configuration'
      ]
    }
  }
}

/**
 * Emergency data recovery function - as a last resort to get courses
 * This uses a simplified approach that bypasses relationships
 */
export async function emergencyDataRecovery() {
  try {
    // Get all courses - explicitly including the status field
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, description, image_url, instructor_id, created_by, status, created_at, updated_at')
      .order('created_at', { ascending: false })
    
    if (coursesError) {
      throw new Error(`Failed to retrieve courses: ${coursesError.message}`)
    }
    
    console.log('Emergency data recovery: Retrieved courses with statuses:', 
      courses?.map(c => ({ id: c.id, title: c.title, status: c.status }))
    )
    
    // For each course, try to get its modules separately
    const coursesWithModules = await Promise.all(
      (courses || []).map(async (course) => {
        try {
          const { data: modules } = await supabase
            .from('modules')
            .select('*')
            .eq('course_id', course.id)
            .order('order_index', { ascending: true })
          
          // Ensure status field is present and has a default if missing
          return {
            ...course,
            status: course.status || 'active', // Ensure status is always defined
            modules: modules || []
          }
        } catch {
          // If module retrieval fails, return course without modules
          return {
            ...course,
            status: course.status || 'active', // Ensure status is always defined
            modules: []
          }
        }
      })
    )
    
    // Log status data for debugging
    console.log('Emergency recovery returning course statuses:', 
      coursesWithModules.map(c => ({ id: c.id, title: c.title, status: c.status }))
    )
    
    return {
      success: true,
      courses: coursesWithModules, // Using 'courses' key instead of 'data' for clarity
      message: `Successfully recovered ${coursesWithModules.length} courses in emergency mode`
    }
  } catch (err: any) {
    console.error('Emergency data recovery failed:', err)
    return {
      success: false,
      error: err.message,
      message: 'Emergency data recovery failed'
    }
  }
}