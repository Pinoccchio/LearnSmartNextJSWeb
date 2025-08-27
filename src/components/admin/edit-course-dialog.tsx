"use client"

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { courseAPI, userAPI } from '@/lib/supabase-api'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Loader2 } from "lucide-react"

interface EditCourseDialogProps {
  course: any
  isOpen: boolean
  onClose: () => void
  onCourseUpdated?: () => void
}

export function EditCourseDialog({ course, isOpen, onClose, onCourseUpdated }: EditCourseDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [instructors, setInstructors] = useState<any[]>([])
  const [loadingInstructors, setLoadingInstructors] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const courseIdRef = useRef<string | null>(null)

  // Initialize form data with course values
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    instructor_id: '',
    status: 'active'
  })
  
  // Load instructors when dialog opens
  const loadInstructors = async () => {
    setLoadingInstructors(true)
    try {
      const users = await userAPI.getAll()
      const instructorList = users.filter(user => user.role === 'instructor')
      setInstructors(instructorList)
      console.log('EditDialog: Loaded instructors:', instructorList)
    } catch (error) {
      console.error('EditDialog: Error loading instructors:', error)
    } finally {
      setLoadingInstructors(false)
    }
  }
  
  // Fetch and update form data when course changes or dialog opens
  useEffect(() => {
    const fetchLatestCourseData = async () => {
      if (course?.id && isOpen) {
        try {
          // We'll try to get the latest course data from the API
          // to ensure we have the most up-to-date status
          console.log('EditDialog: Fetching latest course data for:', course.id)
          const latestCourse = await courseAPI.getById(course.id)
          
          // Set form data from the latest course data
          const initialFormData = {
            title: latestCourse.title || '',
            description: latestCourse.description || '',
            image_url: latestCourse.image_url || '',
            instructor_id: latestCourse.instructor_id || '',
            status: latestCourse.status || 'active'
          }
          
          console.log('EditDialog: Initializing form with latest course data:', {
            courseId: latestCourse.id,
            courseStatus: latestCourse.status,
            formStatus: initialFormData.status
          })
          
          setFormData(initialFormData)
        } catch (error) {
          console.error('EditDialog: Error fetching latest course data:', error)
          
          // Fall back to using the provided course data if fetch fails
          const fallbackFormData = {
            title: course.title || '',
            description: course.description || '',
            image_url: course.image_url || '',
            instructor_id: course.instructor_id || '',
            status: course.status || 'active'
          }
          
          console.log('EditDialog: Using fallback course data:', {
            courseId: course.id,
            courseStatus: course.status,
            formStatus: fallbackFormData.status
          })
          
          setFormData(fallbackFormData)
        }
      }
    }
    
    fetchLatestCourseData()
    
    // Load instructors when dialog opens
    if (isOpen) {
      loadInstructors()
    }
    
    // Update the reference to track the current course ID
    courseIdRef.current = course?.id || null
  }, [course?.id, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    console.log(`Form field changed: ${name} = ${value}`)
    setFormData(prev => {
      const updatedForm = {
        ...prev,
        [name]: value
      }
      console.log('Updated form data:', updatedForm)
      return updatedForm
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error('Course update timed out after 10 seconds')
      setIsLoading(false)
      setError('Operation timed out. Please try again.')
      
      toast({
        title: "Operation timed out",
        description: "Course update took too long. Please try again.",
        variant: "destructive",
      })
    }, 10000) // 10-second timeout

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Course title is required')
      }
      if (!formData.description.trim()) {
        throw new Error('Course description is required')
      }

      // Check if anything has changed
      console.log('Current course status:', course.status)
      console.log('New status in form:', formData.status)
      
      const hasChanges = 
        formData.title !== course.title ||
        formData.description !== course.description ||
        formData.image_url !== course.image_url ||
        formData.status !== course.status
      
      console.log('Changes detected:', {
        titleChanged: formData.title !== course.title,
        descriptionChanged: formData.description !== course.description,
        imageUrlChanged: formData.image_url !== course.image_url,
        statusChanged: formData.status !== course.status,
        hasChanges: hasChanges
      })

      if (!hasChanges) {
        console.log('No changes detected, closing dialog')
        clearTimeout(timeoutId)
        setIsLoading(false)
        onClose()
        return
      }

      // Prepare update data
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        image_url: formData.image_url || null,
        instructor_id: formData.instructor_id || null, // Include instructor assignment
        status: formData.status // Ensure status is included
      }
      
      console.log('Sending update data to API:', updateData)

      console.log('Updating course with data:', updateData)
      try {
        // Explicitly validate the status before sending to API
        if (!['active', 'draft', 'archived'].includes(updateData.status)) {
          throw new Error(`Invalid status value: ${updateData.status}`)
        }
        
        const result = await courseAPI.update(course.id, updateData)
        console.log('Course updated successfully:', result)
      } catch (updateError) {
        console.error('Error during course update API call:', updateError)
        throw updateError
      }

      // Show success toast notification
      toast({
        title: "Course updated",
        description: `${formData.title} has been successfully updated.`,
        variant: "default",
      })

      // First close dialog
      onClose()
      
      // Then notify parent component to refresh data
      // This helps ensure we get fresh data after the update
      if (onCourseUpdated) {
        console.log('Notifying parent of course update, triggering refresh')
        setTimeout(() => onCourseUpdated(), 500)
      }

    } catch (error: any) {
      console.error('Error updating course:', error)
      
      // Show a more comprehensive error message
      const errorMessage = error.message || 'Failed to update course'
      console.error('Error message:', errorMessage)
      setError(errorMessage)
      
      // Show error toast notification
      toast({
        title: "Error updating course",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      // Clear the timeout to prevent state updates after component unmount
      clearTimeout(timeoutId)
      setIsLoading(false)
    }
  }

  // Function to refresh course data
  const refreshCourseData = async () => {
    if (!courseIdRef.current || !isOpen) return
    
    try {
      setIsLoading(true)
      console.log('EditDialog: Refreshing course data for:', courseIdRef.current)
      const refreshedCourse = await courseAPI.getById(courseIdRef.current)
      
      setFormData({
        title: refreshedCourse.title || '',
        description: refreshedCourse.description || '',
        image_url: refreshedCourse.image_url || '',
        status: refreshedCourse.status || 'active'
      })
      
      console.log('EditDialog: Course data refreshed successfully', {
        status: refreshedCourse.status
      })
    } catch (error) {
      console.error('EditDialog: Error refreshing course data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogDescription>
            Update the course details and click Save Changes when done.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-100 border border-red-300 rounded-md">
              {error}
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-right">
              Course Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Criminal Jurisprudence and Procedure"
              value={formData.title}
              onChange={handleInputChange}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-right">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Provide a detailed description of the course"
              value={formData.description}
              onChange={handleInputChange}
              disabled={isLoading}
              required
              className="min-h-[100px]"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="image_url" className="text-right">
              Image URL
            </Label>
            <Input
              id="image_url"
              name="image_url"
              placeholder="https://example.com/image.jpg"
              value={formData.image_url}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Optional: URL to an image that represents this course
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="instructor_id" className="text-right">
              Assign Instructor
            </Label>
            <select
              id="instructor_id"
              name="instructor_id"
              value={formData.instructor_id}
              onChange={handleInputChange}
              disabled={isLoading || loadingInstructors}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-100 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="">No Instructor Assigned</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name} ({instructor.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              {loadingInstructors ? 'Loading instructors...' : 'Select an instructor to assign to this course'}
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="status" className="text-right">
              Course Status
            </Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-100 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <p className="text-xs text-gray-500">
              Set the current status of this course
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={refreshCourseData} 
              disabled={isLoading}
              className="dark:text-gray-100 mr-2"
            >
              Refresh
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading}
              className="dark:text-gray-100"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="dark:text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}