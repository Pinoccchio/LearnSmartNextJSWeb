"use client"

import { useState, useEffect } from 'react'
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"

interface CreateCourseDialogProps {
  onCourseCreated?: () => void
}

export function CreateCourseDialog({ onCourseCreated }: CreateCourseDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [instructors, setInstructors] = useState<any[]>([])
  const [loadingInstructors, setLoadingInstructors] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    instructor_id: '',
    status: 'active'
  })

  // Load instructors when component mounts
  useEffect(() => {
    loadInstructors()
  }, [])

  const loadInstructors = async () => {
    setLoadingInstructors(true)
    try {
      const users = await userAPI.getAll()
      const instructorList = users.filter(user => user.role === 'instructor')
      setInstructors(instructorList)
      console.log('Loaded instructors:', instructorList)
    } catch (error) {
      console.error('Error loading instructors:', error)
      toast({
        title: 'Warning',
        description: 'Failed to load instructors. You can still create the course.',
        variant: 'destructive'
      })
    } finally {
      setLoadingInstructors(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Add debugging information
    console.log('Starting course creation...')
    console.log('Form data:', formData)
    console.log('Current user:', user)

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error('Course creation timed out after 10 seconds')
      setIsLoading(false)
      setError('Operation timed out. Please try again.')
      
      // Show timeout toast notification
      toast({
        title: "Operation timed out",
        description: "Course creation took too long. Please try again.",
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

      // Use selected instructor from dropdown, or null if none selected
      const instructorId = formData.instructor_id || null
      console.log('Using instructor_id:', instructorId)

      console.log('Calling courseAPI.create...')
      const result = await courseAPI.create({
        title: formData.title.trim(),
        description: formData.description.trim(),
        image_url: formData.image_url || null,
        instructor_id: instructorId,
        created_by: user?.id || null, // Track who created the course
        status: formData.status || 'active'
      })
      console.log('Course created successfully:', result)

      // Reset form and close dialog
      setFormData({
        title: '',
        description: '',
        image_url: '',
        instructor_id: '',
        status: 'active'
      })
      setOpen(false)

      // Show success toast notification
      toast({
        title: "Course created",
        description: `${formData.title} has been successfully created.`,
        variant: "default",
      })

      // Notify parent component
      if (onCourseCreated) {
        console.log('Notifying parent component of course creation')
        onCourseCreated()
      }

    } catch (error: any) {
      console.error('Error creating course:', error)
      // More detailed error logging
      if (error.code) console.error('Error code:', error.code)
      if (error.details) console.error('Error details:', error.details)
      if (error.hint) console.error('Error hint:', error.hint)
      
      // Show a more comprehensive error message
      const errorMessage = error.message || 'Failed to create course'
      console.error('Error message:', errorMessage)
      setError(errorMessage)
      
      // Show error toast notification
      toast({
        title: "Error creating course",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      // Clear the timeout to prevent state updates after component unmount
      clearTimeout(timeoutId)
      setIsLoading(false)
      console.log('Course creation process completed (success or failure)')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 text-white">
          <Plus className="h-4 w-4" />
          Create New Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
          <DialogDescription>
            Add a new criminology course to the platform. Fill in all required fields.
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
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Course'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}