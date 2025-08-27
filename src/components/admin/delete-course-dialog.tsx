"use client"

import { useState } from 'react'
import { courseAPI } from '@/lib/supabase-api'
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
import { Badge } from "@/components/ui/badge"
import { InstructorAvatar } from "@/components/common/instructor-avatar"
import { Trash2, AlertTriangle, BookOpen, Users, Loader2 } from "lucide-react"

interface DeleteCourseDialogProps {
  course: any
  isOpen: boolean
  onClose: () => void
  onCourseDeleted?: () => void
}

export function DeleteCourseDialog({ course, isOpen, onClose, onCourseDeleted }: DeleteCourseDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [error, setError] = useState('')
  const { toast } = useToast()

  const handleDelete = async () => {
    if (confirmationText !== course?.title) {
      setError('Course title does not match. Please type the exact course title to confirm deletion.')
      return
    }

    setIsDeleting(true)
    setError('')

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error('Course deletion timed out after 10 seconds')
      setIsDeleting(false)
      setError('Operation timed out. Please try again.')
      
      toast({
        title: "Operation timed out",
        description: "Course deletion took too long. Please try again.",
        variant: "destructive",
      })
    }, 10000) // 10-second timeout

    try {
      console.log('Deleting course:', course.id)
      await courseAPI.delete(course.id)
      
      // Success feedback
      toast({
        title: "Course deleted",
        description: `${course.title} has been permanently deleted.`,
        variant: "default",
      })

      // Reset form and close dialog
      setConfirmationText('')
      onClose()
      
      // Notify parent to refresh data
      if (onCourseDeleted) {
        console.log('Notifying parent of course deletion')
        setTimeout(() => onCourseDeleted(), 500)
      }

    } catch (error: any) {
      console.error('Error deleting course:', error)
      
      // Handle specific error cases
      let errorMessage = 'Failed to delete course'
      
      if (error.message?.includes('foreign key')) {
        errorMessage = 'Cannot delete course: Students are enrolled or modules exist. Please remove enrollments and modules first.'
      } else if (error.message?.includes('permission')) {
        errorMessage = 'You do not have permission to delete this course.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      
      toast({
        title: "Error deleting course",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      clearTimeout(timeoutId)
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmationText('')
      setError('')
      onClose()
    }
  }

  if (!course) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-red-900 dark:text-red-100">Delete Course</DialogTitle>
              <DialogDescription className="text-red-700 dark:text-red-300">
                This action cannot be undone. This will permanently delete the course and all associated data.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Warning Alert */}
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  Warning: Permanent Deletion
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Deleting this course will also remove:
                </p>
                <ul className="text-sm text-red-700 dark:text-red-300 mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    <BookOpen className="h-3 w-3" />
                    All course modules and content
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    Student enrollment data and progress
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Course Information */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Course Details</h4>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{course.title}</h3>
                  <Badge 
                    variant={
                      course.status === 'active' ? 'success' :
                      course.status === 'draft' ? 'warning' :
                      course.status === 'archived' ? 'archived' : 'info'
                    }
                  >
                    {course.status || 'active'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{course.description}</p>
              </div>

              {/* Module Count */}
              {course.modules && course.modules.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.modules.length} {course.modules.length === 1 ? 'module' : 'modules'} will be deleted</span>
                </div>
              )}

              {/* Instructor Information */}
              {course.instructor && (
                <div>
                  <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Assigned Instructor</h5>
                  <InstructorAvatar 
                    instructor={course.instructor}
                    size="sm"
                    showName={true}
                    showStatus={false}
                    showTooltip={false}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-sm font-medium text-gray-900 dark:text-white">
              Type the course title to confirm deletion:
            </Label>
            <Input
              id="confirmation"
              placeholder={`Type: ${course.title}`}
              value={confirmationText}
              onChange={(e) => {
                setConfirmationText(e.target.value)
                if (error && e.target.value === course.title) {
                  setError('')
                }
              }}
              disabled={isDeleting}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This action requires typing the exact course title for confirmation.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isDeleting}
            className="dark:text-gray-100"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting || confirmationText !== course.title}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Course
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}