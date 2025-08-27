"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from '@/contexts/auth-context'
import { instructorCourseAPI } from '@/lib/supabase-course-materials'
import UploadMaterialForm from '@/components/instructor/upload-material-form'
import AddModuleForm from '@/components/instructor/add-module-form'
import EditModuleForm from '@/components/instructor/edit-module-form'
import DeleteModuleModal from '@/components/instructor/delete-module-modal'
import DeleteMaterialModal from '@/components/instructor/delete-material-modal'
import { 
  BookOpen, 
  Users, 
  Eye, 
  Edit, 
  Plus, 
  Brain, 
  BarChart3, 
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Save,
  Loader2,
  Upload,
  Trash2
} from "lucide-react"

export default function InstructorCourse() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFetching, setIsFetching] = useState(false) // Prevent concurrent fetches
  
  const [selectedModule, setSelectedModule] = useState<any>(null)
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [showAddContentModal, setShowAddContentModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showAddModuleModal, setShowAddModuleModal] = useState(false)
  const [showEditModuleModal, setShowEditModuleModal] = useState(false)
  const [showDeleteModuleModal, setShowDeleteModuleModal] = useState(false)
  const [moduleToEdit, setModuleToEdit] = useState<any>(null)
  const [moduleToDelete, setModuleToDelete] = useState<any>(null)
  
  // Material deletion state
  const [materialToDelete, setMaterialToDelete] = useState<any>(null)
  const [showDeleteMaterialModal, setShowDeleteMaterialModal] = useState(false)
  
  // Module view state
  const [selectedModuleForView, setSelectedModuleForView] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'materials'>('materials')

  // Fetch instructor's courses on component mount
  useEffect(() => {
    fetchInstructorCourses()
  }, [user])

  const fetchInstructorCourses = async (isRefresh = false) => {
    if (!user?.id) {
      console.log('❌ No user ID available for course fetch')
      return
    }

    // Prevent concurrent fetches
    if (isFetching) {
      console.log('⚠️ Already fetching courses, skipping duplicate request')
      return
    }

    console.log('🏫 Fetching instructor courses...', isRefresh ? '(refresh)' : '(initial)')
    setIsFetching(true)
    if (!isRefresh) {
      setIsLoading(true)
    }
    setError('')

    try {
      // Add timeout protection to prevent hanging
      console.log('⏱️ Starting course fetch with 10-second timeout')
      
      // Use new API route with custom headers for reliable authentication
      const fetchPromise = fetch('/api/instructor/courses', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
          'X-User-Role': user.role
        },
        credentials: 'include'
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Course fetch timeout after 10 seconds')), 10000)
      )
      
      const response = await Promise.race([fetchPromise, timeoutPromise])
      
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
      const instructorCourses = result.courses || []
      console.log('✅ Courses fetched successfully:', instructorCourses.length, 'courses')
      setCourses(instructorCourses)
      
      // Select first course by default or maintain current selection
      if (instructorCourses.length > 0) {
        if (!selectedCourse || !instructorCourses.find(c => c.id === selectedCourse.id)) {
          setSelectedCourse(instructorCourses[0])
          console.log('📚 Selected default course:', instructorCourses[0].title)
        } else {
          // Update the selected course with fresh data
          const updatedSelectedCourse = instructorCourses.find(c => c.id === selectedCourse.id)
          if (updatedSelectedCourse) {
            setSelectedCourse(updatedSelectedCourse)
            console.log('🔄 Updated selected course with fresh data')
          }
        }
      }
    } catch (error: any) {
      console.error('💥 Error fetching instructor courses:', error)
      console.error('💥 Error type:', error.constructor.name)
      console.error('💥 Error message:', error.message)
      
      // Provide specific error messages based on error type
      if (error.message?.includes('timeout')) {
        console.log('⏰ Course fetch timed out')
        setError('Course loading timed out. This may be a temporary issue. Please try again.')
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        console.log('🌐 Network error during course fetch')
        setError('Network error loading courses. Please check your connection and try again.')
      } else if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
        console.log('🔑 Authentication error during course fetch')
        setError('Authentication error. Please refresh the page and log in again.')
      } else {
        console.log('❓ Unknown error during course fetch')
        setError(`Failed to load your courses: ${error.message || 'Unknown error'}. Please try again.`)
      }
    } finally {
      setIsLoading(false)
      setIsFetching(false)
      console.log('🔄 Course fetch completed')
    }
  }

  const handleViewModule = (module: any) => {
    setSelectedModuleForView(module)
    setShowModuleModal(true)
  }

  const handleAddContent = (module: any) => {
    setSelectedModule(module)
    setShowUploadModal(true)
  }


  const handleEditModule = (module: any) => {
    setModuleToEdit(module)
    setShowEditModuleModal(true)
  }

  const handleDeleteModule = (module: any) => {
    setModuleToDelete(module)
    setShowDeleteModuleModal(true)
  }

  const handleViewMaterials = (module: any) => {
    setSelectedModuleForView(module)
    setShowModuleModal(true)
  }


  const handleDeleteMaterial = (material: any) => {
    setMaterialToDelete(material)
    setShowDeleteMaterialModal(true)
  }

  // Calculate stats for selected course
  const calculateCourseStats = () => {
    if (!selectedCourse) return { totalStudents: 0, completionRate: 0, averageScore: 0, moduleCount: 0 }

    const moduleCount = selectedCourse.modules?.length || 0
    const totalStudents = 0 // TODO: Get from enrollments
    const completionRate = 0 // TODO: Calculate from user progress
    const averageScore = 0 // TODO: Calculate from quiz attempts

    return { totalStudents, completionRate, averageScore, moduleCount }
  }

  const stats = calculateCourseStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-300">Loading your courses...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <Button 
          onClick={() => fetchInstructorCourses(false)} 
          className="mt-4"
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="text-center p-8">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Courses Assigned</h2>
        <p className="text-gray-600 dark:text-gray-300">
          You don't have any courses assigned yet. Contact your administrator to get courses assigned to you.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Course Selection */}
      {courses.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Course
          </label>
          <select
            value={selectedCourse?.id || ''}
            onChange={(e) => {
              const course = courses.find(c => c.id === e.target.value)
              setSelectedCourse(course)
            }}
            className="block w-full max-w-md p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Course Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {selectedCourse?.title || 'My Course'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {selectedCourse?.description || 'Manage your course content and student progress'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview Course
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Brain className="h-4 w-4 mr-2" />
              Generate Content
            </Button>
          </div>
        </div>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-emerald-600 mt-1">{stats.totalStudents} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">No enrollments yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">AI Learning</CardTitle>
            <Brain className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Active</div>
            <p className="text-xs text-emerald-600 mt-1">Student-generated quizzes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.moduleCount}</div>
            <p className="text-xs text-blue-600 mt-1">{stats.moduleCount} modules available</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-gray-900 dark:text-white">Course Modules</CardTitle>
                <CardDescription>Manage your criminology course content and structure</CardDescription>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowAddModuleModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedCourse?.modules?.length > 0 ? (
                selectedCourse.modules.map((module: any) => (
                  <div key={module.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{module.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline"
                            className="border-blue-500 text-blue-700 dark:text-blue-400"
                          >
                            Active
                          </Badge>
                          <Badge variant="secondary" className="text-xs dark:text-black dark:bg-gray-300">
                            {module.description ? 'With Description' : 'Basic'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleViewModule(module)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEditModule(module)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                          onClick={() => handleDeleteModule(module)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <button
                        className="text-left p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleViewMaterials(module)}
                      >
                        <span className="text-gray-600 dark:text-gray-400">Materials:</span>
                        <span className="font-medium ml-1 text-gray-900 dark:text-white">{module.course_materials?.length || 0}</span>
                      </button>
                      <div className="text-left p-2">
                        <span className="text-gray-600 dark:text-gray-400">AI Quizzes:</span>
                        <span className="font-medium ml-1 text-emerald-600 dark:text-emerald-400">Student Generated</span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300 bg-blue-500"
                        style={{ width: `${Math.min((module.course_materials?.length || 0) * 33, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleAddContent(module)}>
                        <FileText className="h-4 w-4 mr-1" />
                        Add Materials
                      </Button>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                        ✨ AI Quizzes: Student Generated
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-8 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Modules Found</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    This course doesn't have any modules yet. Contact your administrator to add modules to this course.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Content Suggestions
            </CardTitle>
            <CardDescription className="dark:text-gray-300">AI-powered recommendations to improve your course</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Add Interactive Case Studies</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Students respond well to real-world criminal cases. Consider adding Philippine criminal case studies to Criminal Procedure module.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800">
                      Generate Cases
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">Video Lectures Performing Well</h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Students engage 40% more with video content. Consider recording lectures for Elements of Crime module.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-800">
                      Schedule Recording
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-amber-900 dark:text-amber-100">Review Prerequisites</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Criminal Procedure module has 35% completion. Students may need Constitutional Law review first.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-800">
                      Add Prerequisites
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
          <CardDescription>Common course management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-16 flex-col" disabled>
              <Brain className="h-5 w-5 mb-1 text-emerald-500" />
              <span className="text-xs">Student AI Quizzes</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <FileText className="h-5 w-5 mb-1" />
              <span className="text-xs">Upload Materials</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <Users className="h-5 w-5 mb-1" />
              <span className="text-xs">Student Progress</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col">
              <BarChart3 className="h-5 w-5 mb-1" />
              <span className="text-xs">Course Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Module Details Modal */}
      {showModuleModal && selectedModuleForView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-5xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedModuleForView.title}</CardTitle>
                  <CardDescription>Manage module content and quizzes</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setShowModuleModal(false)}>
                  Close
                </Button>
              </div>
              
              {/* Single Materials Tab */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 mt-4">
                <div className="px-4 py-2 text-sm font-medium border-b-2 border-blue-500 text-blue-600 dark:text-blue-400">
                  <FileText className="h-4 w-4 mr-2 inline" />
                  Materials ({selectedModuleForView.course_materials?.length || 0})
                </div>
                <div className="px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <Brain className="h-4 w-4 mr-2 inline" />
                  AI Quizzes: Generated by Students
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Materials Content */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Course Materials</h3>
                  <Button size="sm" onClick={() => handleAddContent(selectedModuleForView)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Add Material
                  </Button>
                </div>
                
                {selectedModuleForView.course_materials && selectedModuleForView.course_materials.length > 0 ? (
                    <div className="space-y-3">
                      {selectedModuleForView.course_materials.map((material: any) => (
                        <div key={material.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">{material.title}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {material.file_type.toUpperCase()} • {material.file_name}
                                {material.file_size && ` • ${(material.file_size / 1024 / 1024).toFixed(1)} MB`}
                              </p>
                              {material.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{material.description}</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteMaterial(material)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 ml-4"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Materials Yet</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Upload course materials to get started.
                      </p>
                      <Button onClick={() => handleAddContent(selectedModuleForView)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Add First Material
                      </Button>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Material Modal */}
      {showUploadModal && selectedModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle>Upload Material to {selectedModule.title}</CardTitle>
              <CardDescription>Upload PDF, DOC, DOCX, or TXT files for your students</CardDescription>
            </CardHeader>
            <CardContent>
              <UploadMaterialForm 
                moduleId={selectedModule.id}
                onSuccess={() => {
                  setShowUploadModal(false)
                  fetchInstructorCourses(true) // Refresh data
                }}
                onCancel={() => setShowUploadModal(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}


      {/* Add Module Modal */}
      {showAddModuleModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle>Add New Module to {selectedCourse.title}</CardTitle>
              <CardDescription>Create a new learning module for your criminology course</CardDescription>
            </CardHeader>
            <CardContent>
              <AddModuleForm 
                courseId={selectedCourse.id}
                existingModulesCount={selectedCourse.modules?.length || 0}
                onSuccess={() => {
                  setShowAddModuleModal(false)
                  fetchInstructorCourses(true) // Refresh data
                }}
                onCancel={() => setShowAddModuleModal(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Module Modal */}
      {showEditModuleModal && moduleToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle>Edit Module: {moduleToEdit.title}</CardTitle>
              <CardDescription>Update the module information and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <EditModuleForm 
                module={moduleToEdit}
                onSuccess={() => {
                  setShowEditModuleModal(false)
                  setModuleToEdit(null)
                  fetchInstructorCourses(true) // Refresh data
                }}
                onCancel={() => {
                  setShowEditModuleModal(false)
                  setModuleToEdit(null)
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Module Modal */}
      {showDeleteModuleModal && moduleToDelete && (
        <DeleteModuleModal 
          module={moduleToDelete}
          onSuccess={() => {
            setShowDeleteModuleModal(false)
            setModuleToDelete(null)
            fetchInstructorCourses(true) // Refresh data
          }}
          onCancel={() => {
            setShowDeleteModuleModal(false)
            setModuleToDelete(null)
          }}
        />
      )}

      {/* Delete Material Modal */}
      {showDeleteMaterialModal && materialToDelete && (
        <DeleteMaterialModal 
          material={materialToDelete}
          onSuccess={() => {
            setShowDeleteMaterialModal(false)
            setMaterialToDelete(null)
            fetchInstructorCourses(true) // Refresh data
          }}
          onCancel={() => {
            setShowDeleteMaterialModal(false)
            setMaterialToDelete(null)
          }}
        />
      )}
    </div>
  )
}