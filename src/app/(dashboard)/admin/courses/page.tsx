"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { courseAPI, userAPI } from "@/lib/supabase-api"
import { useAuth } from '@/contexts/auth-context'
import { relationshipDiagnostics as relationshipDiagnosticsFunc, emergencyDataRecovery } from "@/lib/supabase-relationship-fix"

// Create an object with the runFullDiagnostic method to match the expected structure
const relationshipDiagnostics = {
  runFullDiagnostic: async () => {
    const result = await relationshipDiagnosticsFunc();
    
    // Type guard to check if result has tests property
    if ('tests' in result && Array.isArray(result.tests)) {
      // Add the expected summary structure
      return {
        ...result,
        summary: {
          overallHealth: result.tests.some((t: any) => t.status === 'failed') ? 'DEGRADED' : 'HEALTHY',
          passedTests: result.tests.filter((t: any) => t.status === 'success').length,
          failedTests: result.tests.filter((t: any) => t.status === 'failed').length,
          totalTests: result.tests.length
        }
      };
    } else {
      // Handle error case where tests don't exist
      return {
        ...result,
        tests: [],
        summary: {
          overallHealth: 'CRITICAL',
          passedTests: 0,
          failedTests: 1,
          totalTests: 1
        }
      };
    }
  }
}
import { CreateCourseDialog } from "@/components/admin/create-course-dialog"
import { ViewCourseDialog } from "@/components/admin/view-course-dialog"
import { EditCourseDialog } from "@/components/admin/edit-course-dialog"
import { DeleteCourseDialog } from "@/components/admin/delete-course-dialog"
import { InstructorAvatar } from "@/components/common/instructor-avatar"
import { BookOpen, Users, TrendingUp, Search, Edit, Eye, BarChart3, Loader2, Activity, Archive, FileText, Trash2 } from "lucide-react"

export default function AdminCoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [instructorsLoading, setInstructorsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalEnrollments: 0,
    avgCompletion: 0
  })

  // Enhanced courses with instructor data
  const coursesWithInstructors = useMemo(() => {
    return courses.map(course => {
      const instructor = instructors.find(inst => inst.id === course.instructor_id);
      return {
        ...course,
        instructor: instructor || null
      };
    });
  }, [courses, instructors]);

  // Filtered and sorted courses based on search query and filter status
  const filteredCourses = useMemo(() => {
    let filtered = coursesWithInstructors;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(course => 
        course.title?.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query) ||
        course.instructor?.name?.toLowerCase().includes(query) ||
        course.modules?.some((module: any) => 
          module.title?.toLowerCase().includes(query) ||
          module.description?.toLowerCase().includes(query)
        )
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(course => course.status === filterStatus);
    }

    // Sort by title alphabetically
    return filtered.sort((a, b) => a.title?.localeCompare(b.title) || 0);
  }, [coursesWithInstructors, searchQuery, filterStatus])

  // Fetch instructors data
  const fetchInstructors = async () => {
    if (!user?.id) {
      console.log('❌ No user ID available for instructor fetch')
      return
    }

    setInstructorsLoading(true);
    try {
      console.log('👥 Fetching instructors with timeout protection');
      
      // Use new API route with timeout protection
      const fetchPromise = fetch('/api/admin/courses?type=instructors', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
          'X-User-Role': user.role
        },
        credentials: 'include'
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Instructor loading timeout after 10 seconds')), 10000)
      )
      
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response
      
      if (!response.ok) {
        console.error('❌ API response not OK:', response.status, response.statusText)
        throw new Error(`Server error (${response.status})`)
      }
      
      const result = await response.json()
      const instructorList = result.instructors || []
      console.log('✅ Instructors loaded successfully:', instructorList.length);
      setInstructors(instructorList);
    } catch (error: any) {
      console.error('💥 Error fetching instructors:', error);
      // Don't show error for instructors, just log it
    } finally {
      setInstructorsLoading(false);
    }
  };

  const fetchCourses = async (retry = 0, useEmergencyMode = false) => {
    if (!user?.id) {
      console.log('❌ No user ID available for course fetch')
      return
    }

    setIsLoading(true)
    setError('')
    console.log('📚 Fetching courses...', { retry, useEmergencyMode, timestamp: new Date().toISOString() })
    
    try {
      let data: any[]
      
      if (useEmergencyMode) {
        console.log('Using emergency data recovery...')
        const emergencyResult = await emergencyDataRecovery()
        
        // Handle both formats (courses or data key) for backward compatibility
        // Add type guard to check if courses exists on emergencyResult
        if ('courses' in emergencyResult && Array.isArray(emergencyResult.courses)) {
          data = emergencyResult.courses;
        } else if ('data' in emergencyResult && Array.isArray(emergencyResult.data)) {
          data = emergencyResult.data;
        } else {
          // Default to empty array if neither property exists
          console.error('Emergency data recovery failed to return course data');
          data = [];
        }
        
        console.log('Emergency data recovery returned courses with statuses:', 
          data?.map(c => ({ id: c.id, title: c.title, status: c.status }))
        )
      } else {
        // Use new API route with timeout protection
        console.log('🌐 Using admin courses API route')
        const fetchPromise = fetch('/api/admin/courses', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': user.id,
            'X-User-Role': user.role
          },
          credentials: 'include'
        })
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Course loading timeout after 15 seconds')), 15000)
        )
        
        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response
        
        if (!response.ok) {
          console.error('❌ API response not OK:', response.status, response.statusText)
          let errorMessage = `Server error (${response.status}): `
          try {
            const errorData = await response.json()
            errorMessage += errorData.error || errorData.message || 'Unknown error'
            console.error('💥 Server error details:', errorData)
          } catch (parseError) {
            const errorText = await response.text()
            errorMessage += errorText || 'Failed to parse error response'
            console.error('💥 Raw server response:', errorText)
          }
          throw new Error(errorMessage)
        }
        
        const result = await response.json()
        data = result.courses || []
        
        if (result.fallbackMode) {
          console.warn('⚠️ Courses loaded in fallback mode:', result.message)
        }
      }
      
      console.log('Courses data received:', { count: data?.length, timestamp: new Date().toISOString() })
      
      if (data && Array.isArray(data)) {
        // Log the received courses and their statuses for debugging
        console.log('Courses received with statuses:', data.map(c => ({ id: c.id, title: c.title, status: c.status })))
        
        // Ensure all courses have a status field
        const normalizedCourses = data.map(course => ({
          ...course,
          status: course.status || 'active' // Default to 'active' if missing
        }))
        
        console.log('Normalized courses with statuses:', 
          normalizedCourses.map(c => ({ id: c.id, title: c.title, status: c.status }))
        )
        
        setCourses(normalizedCourses)
        
        // Extract modules from courses
        const allModules = normalizedCourses.flatMap(course => {
          if (course.modules && Array.isArray(course.modules)) {
            return course.modules.map((module: any) => ({
              ...module,
              courseName: course.title,
              // Use course status for module display instead of hardcoded 'active'
              status: course.status || 'active',
              topics: [],
              enrolledStudents: 0,
              progress: 0
            }))
          }
          return []
        })
        setModules(allModules)

        // Update stats
        setStats({
          totalCourses: data.length,
          totalEnrollments: 0, // Would need a query to get actual enrollments
          avgCompletion: 0 // Would need a query to calculate average completion
        })
      } else {
        console.warn('No courses data returned or data is not an array:', data)
        setError('No courses found or data format unexpected')
      }
    } catch (error: any) {
      console.error('💥 Error fetching courses:', error)
      
      // Structured error handling for API route responses
      if (error.message?.includes('timeout')) {
        setError('Course loading timed out. The server took too long to respond. Please try again.')
      } 
      // Implement retry for network errors
      else if (retry < 3 && (error.message?.includes('network') || error.message?.includes('Failed to fetch'))) {
        console.log(`Retrying (${retry + 1}/3)...`)
        setTimeout(() => fetchCourses(retry + 1), 1500) // Retry after 1.5 seconds
        return
      }
      // Authentication errors
      else if (error.message?.includes('401') || error.message?.includes('Authentication')) {
        setError('Authentication error. Please refresh the page and log in again.')
      }
      // Permission errors
      else if (error.message?.includes('403') || error.message?.includes('Admin access')) {
        setError('You do not have permission to view these courses. Please check your account permissions.')
      }
      // Server errors that might indicate relationship issues - try emergency mode
      else if (error.message?.includes('500') || error.message?.includes('relationship between') ||
               error.message?.includes('schema cache')) {
        setError('Database relationship issue detected. Attempting emergency data recovery...')
        // Try emergency mode
        setTimeout(() => fetchCourses(0, true), 1000)
        return
      }
      // Service unavailable
      else if (error.message?.includes('503') || error.message?.includes('504')) {
        setError('Database service temporarily unavailable. Please try again in a few minutes.')
      }
      // Generic error with more context
      else {
        setError(`Failed to load courses: ${error.message || 'Unknown error'}. Please refresh the page or try again later.`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh courses and instructors when user is available
  useEffect(() => {
    if (user?.id && user?.role === 'admin') {
      fetchCourses()
      fetchInstructors()
    }
  }, [user?.id, user?.role])

  // Handle course CRUD operations
  const handleCourseCreated = () => {
    fetchCourses()
    fetchInstructors() // Refresh instructors in case new ones were added
  }
  
  const handleCourseUpdated = async () => {
    console.log('Course updated, refreshing course list...')
    
    // Clear current data and set loading state
    setIsLoading(true)
    setCourses([])
    setModules([])
    setError('')
    
    try {
      // Use a longer timeout to ensure database has time to commit changes
      // This is important for ensuring we get the latest data after an update
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('Fetching fresh course data after update...')
      
      // First try with regular fetch
      try {
        await fetchCourses(0, false)
        await fetchInstructors() // Also refresh instructors after course update
      } catch (error) {
        console.error('Error in primary fetch after update:', error)
        
        // If regular fetch fails, try with emergency mode
        console.log('Attempting emergency fetch after update failure...')
        await fetchCourses(0, true)
        await fetchInstructors()
      }
      
      console.log('Course refresh completed successfully')
    } catch (error) {
      console.error('Failed to refresh courses after update:', error)
      setError('Failed to refresh after update. Please reload the page.')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Open view dialog
  const handleViewCourse = (course: any) => {
    setSelectedCourse(course)
    setViewDialogOpen(true)
  }
  
  // Open edit dialog
  const handleEditCourse = async (course: any) => {
    // Use the provided course data directly to avoid additional API calls
    // The course data should be fresh from the recent fetchCourses call
    console.log('📝 Opening edit dialog for course:', course.id, course.title)
    setSelectedCourse(course)
    setEditDialogOpen(true)
  }
  
  // Open delete dialog
  const handleDeleteCourse = (course: any) => {
    setSelectedCourse(course)
    setDeleteDialogOpen(true)
  }

  // Run diagnostics
  const runDiagnostics = async () => {
    console.log('Running relationship diagnostics...')
    try {
      const diagnosticResult = await relationshipDiagnostics.runFullDiagnostic()
      console.log('Diagnostic complete:', diagnosticResult)
      
      if (diagnosticResult.summary.overallHealth === 'CRITICAL') {
        setError('Critical database issues detected. Please contact support with the diagnostic information from the browser console.')
      } else if (diagnosticResult.summary.overallHealth === 'DEGRADED') {
        setError('Database relationship issues detected. The system is using fallback queries. Consider running the schema fix script.')
      } else {
        setError('Diagnostics passed. The relationship should be working correctly.')
      }
    } catch (err) {
      console.error('Diagnostic failed:', err)
      setError('Unable to run diagnostics. Please check browser console for details.')
    }
  }

  // Show loading state while waiting for user authentication
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading user session...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Course Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Create, edit, and manage criminology review courses and modules</p>
        </div>
        <CreateCourseDialog onCourseCreated={handleCourseCreated} />
      
      {/* View Course Dialog */}
      {selectedCourse && (
        <ViewCourseDialog 
          course={selectedCourse} 
          isOpen={viewDialogOpen} 
          onClose={() => setViewDialogOpen(false)} 
        />
      )}
      
      {/* Edit Course Dialog */}
      {selectedCourse && (
        <EditCourseDialog 
          course={selectedCourse} 
          isOpen={editDialogOpen} 
          onClose={() => setEditDialogOpen(false)}
          onCourseUpdated={handleCourseUpdated}
        />
      )}
      
      {/* Delete Course Dialog */}
      {selectedCourse && (
        <DeleteCourseDialog 
          course={selectedCourse} 
          isOpen={deleteDialogOpen} 
          onClose={() => setDeleteDialogOpen(false)}
          onCourseDeleted={handleCourseUpdated}
        />
      )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input 
            placeholder="Search courses, modules, and instructors..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={filterStatus === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterStatus('all')}
            className="dark:text-white"
          >
            All Subjects
          </Button>
          <Button 
            variant={filterStatus === 'active' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterStatus('active')}
            className="dark:text-white"
          >
            Active
          </Button>
          <Button 
            variant={filterStatus === 'draft' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterStatus('draft')}
            className="dark:text-white"
          >
            Draft
          </Button>
          <Button 
            variant={filterStatus === 'archived' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterStatus('archived')}
            className="dark:text-white"
          >
            Archived
          </Button>
        </div>
      </div>

      {/* Course Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Active criminology subjects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments || '0'}</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Students across all courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Average Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCompletion || '0'}%</div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Across all active courses</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Error message with retry button */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 border border-red-200 rounded-md flex flex-col gap-2">
          <div className="flex items-start">
            <div className="flex-1">{error}</div>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-700 hover:bg-red-100 ml-4"
              onClick={() => fetchCourses()}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Retrying...
                </>
              ) : (
                'Retry'
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-blue-700 hover:bg-blue-100 ml-2"
              onClick={runDiagnostics}
              disabled={isLoading}
            >
              Run Diagnostics
            </Button>
          </div>
          <div className="text-sm text-red-600">
            {error.includes('schema') && 'This may be due to recent database changes. The system will attempt to adapt automatically.'}
            {error.includes('relationship') && 'This appears to be a database relationship configuration issue. Run diagnostics for more information.'}
          </div>
        </div>
      )}

      {/* Course Modules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            Criminology Courses
            {!isLoading && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                ({filteredCourses.length} of {courses.length} courses)
              </span>
            )}
          </CardTitle>
          <CardDescription className="dark:text-gray-300">
            {searchQuery || filterStatus !== 'all' ? 
              'Filtered courses based on your search and filter criteria' : 
              'All available courses in the database'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center p-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              {courses.length === 0 ? (
                <>
                  <p className="mb-2">No courses found</p>
                  <p className="text-sm">Create your first course to get started</p>
                </>
              ) : (
                <>
                  <p className="mb-2">No courses match your search criteria</p>
                  <p className="text-sm">
                    {searchQuery ? `Try adjusting your search for "${searchQuery}"` : 
                     filterStatus !== 'all' ? `No courses with "${filterStatus}" status found` : 
                     'Try different filter options'}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setSearchQuery('');
                      setFilterStatus('all');
                    }}
                    className="mt-3"
                  >
                    Clear Filters
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCourses.map((course) => (
                <div key={course.id} className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600">
                  {/* Main Content Section */}
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left Section - Course Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{course.title}</h3>
                              <Badge 
                                variant={
                                  course.status === 'active' ? 'success' :
                                  course.status === 'draft' ? 'warning' :
                                  course.status === 'archived' ? 'archived' : 'info'
                                }
                                className="font-medium"
                              >
                                {course.status === 'active' && <Activity className="h-3 w-3 mr-1" />}
                                {course.status === 'draft' && <FileText className="h-3 w-3 mr-1" />}
                                {course.status === 'archived' && <Archive className="h-3 w-3 mr-1" />}
                                {course.status || 'active'}
                              </Badge>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-3">
                              {course.description}
                            </p>
                            {course.modules && course.modules.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  {course.modules.length} {course.modules.length === 1 ? 'module' : 'modules'}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Instructor & Actions */}
                      <div className="lg:w-80 flex flex-col gap-4">
                        {/* Instructor Section */}
                        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-3">Course Instructor</h4>
                          {instructorsLoading ? (
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                              <div className="flex-1">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
                              </div>
                            </div>
                          ) : (
                            <InstructorAvatar 
                              instructor={course.instructor}
                              size="md"
                              showName={true}
                              showStatus={true}
                              showTooltip={true}
                            />
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewCourse(course)}
                            className="dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditCourse(course)}
                            className="dark:text-gray-100 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="dark:text-gray-100 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analytics
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteCourse(course)}
                            className="dark:text-gray-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom Stats Section */}
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 px-6 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Users className="h-4 w-4 text-blue-500" />
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</p>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Enrolled Students</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">0%</p>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Avg Completion</p>
                      </div>
                      <div className="text-center">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mb-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                            style={{ width: '0%' }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Overall Progress</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Course Management Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
            <CardDescription className="dark:text-gray-300">Common course management tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <BookOpen className="h-4 w-4 mr-2" />
              Import Course Content
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              Bulk Enroll Students
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Course Reports
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">AI Content Generation</CardTitle>
            <CardDescription className="dark:text-gray-300">Use Gemini AI to create course content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Generate Quiz Questions
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Create Study Materials
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Analyze Content Gaps
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}