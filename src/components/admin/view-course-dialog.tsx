"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { userAPI } from "@/lib/supabase-api"
import { BookOpen, Activity, FileText, Archive, Calendar, User, Clock } from "lucide-react"

interface ViewCourseDialogProps {
  course: any
  isOpen: boolean
  onClose: () => void
}

export function ViewCourseDialog({ course, isOpen, onClose }: ViewCourseDialogProps) {
  const [creatorName, setCreatorName] = useState<string>('Unknown')
  const [instructorName, setInstructorName] = useState<string>('Not assigned')
  const [isLoading, setIsLoading] = useState(false)
  
  // Format dates for better readability
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Fetch user data when course changes
  useEffect(() => {
    async function fetchUserData() {
      if (!course) return
      
      setIsLoading(true)
      
      try {
        // Fetch creator data if available
        if (course.created_by) {
          try {
            const creatorData = await userAPI.getById(course.created_by)
            if (creatorData) {
              setCreatorName(creatorData.name || 'Unknown')
            }
          } catch (error) {
            console.error('Error fetching creator data:', error)
          }
        }
        
        // Fetch instructor data if available
        if (course.instructor_id) {
          try {
            const instructorData = await userAPI.getById(course.instructor_id)
            if (instructorData) {
              setInstructorName(instructorData.name || 'Unknown')
            }
          } catch (error) {
            console.error('Error fetching instructor data:', error)
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (isOpen) {
      fetchUserData()
    }
  }, [course, isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            {course.title}
          </DialogTitle>
          <DialogDescription>
            Course details and information
            {isLoading && <span className="ml-2 text-blue-500">(Loading user data...)</span>}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Status Badge */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
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
          
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description:</h3>
            <p className="text-gray-900 dark:text-gray-100 text-sm">{course.description}</p>
          </div>
          
          {/* Image */}
          {course.image_url && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Course Image:</h3>
              <div className="rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <img 
                  src={course.image_url} 
                  alt={course.title} 
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/600x400?text=No+Image'
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Course Modules */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Modules:</h3>
            {course.modules && course.modules.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-3">
                {course.modules.map((module: any) => (
                  <div key={module.id} className="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{module.title}</span>
                      <Badge variant="outline" className="text-xs">
                        Module {module.order_index}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{module.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-md">
                <p className="text-gray-500 dark:text-gray-400">No modules available for this course</p>
              </div>
            )}
          </div>
          
          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Created:</span>
              <span className="text-xs text-gray-900 dark:text-gray-100">{formatDate(course.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Updated:</span>
              <span className="text-xs text-gray-900 dark:text-gray-100">{formatDate(course.updated_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Instructor:</span>
              <span className="text-xs text-gray-900 dark:text-gray-100">
                {isLoading ? 'Loading...' : instructorName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Created by:</span>
              <span className="text-xs text-gray-900 dark:text-gray-100">
                {isLoading ? 'Loading...' : creatorName}
              </span>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="dark:text-gray-100"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}