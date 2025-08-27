'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Loader2, AlertTriangle, FileText, Brain } from "lucide-react"
import { supabase } from '@/lib/supabase'

interface DeleteModuleModalProps {
  module: {
    id: string
    title: string
    course_materials?: any[]
    quizzes?: any[]
  }
  onSuccess: () => void
  onCancel: () => void
}

export default function DeleteModuleModal({ module, onSuccess, onCancel }: DeleteModuleModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [cascadeDelete, setCascadeDelete] = useState(false)

  const hasContent = (module.course_materials && module.course_materials.length > 0) || 
                    (module.quizzes && module.quizzes.length > 0)

  const materialsCount = module.course_materials?.length || 0
  const quizzesCount = module.quizzes?.length || 0

  const handleDelete = async () => {
    if (hasContent && !cascadeDelete) {
      setError('Cannot delete module with existing content. Please delete all materials and quizzes first, or enable "Delete all content".')
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Authentication session not found. Please log in again.')
      }

      const url = `/api/instructor/delete-module?moduleId=${module.id}${cascadeDelete ? '&cascade=true' : ''}`
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      })

      if (!response.ok) {
        let errorMessage = `Server error (${response.status}): `
        try {
          const errorData = await response.json()
          errorMessage += errorData.error || errorData.message || 'Unknown error'
          console.error('Server error details:', errorData)
        } catch (parseError) {
          const errorText = await response.text()
          errorMessage += errorText || 'Failed to parse error response'
          console.error('Raw server response:', errorText)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('Module deleted successfully:', result)
      
      // Show success message based on cascade deletion
      if (result.cascadeDeleted) {
        console.log(`✅ Module and content deleted: ${result.materialsDeleted} materials, ${result.quizzesDeleted} quizzes`)
      }
      
      onSuccess()

    } catch (error: any) {
      console.error('Error deleting module:', error)
      setError(error.message || 'Failed to delete module. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Trash2 className="h-5 w-5" />
            Delete Module
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Warning message */}
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-200">
                    Are you sure you want to delete this module?
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    <strong>"{module.title}"</strong>
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Content summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">Module Content</h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Course Materials</span>
                  </div>
                  <span className={`text-sm font-medium ${materialsCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'}`}>
                    {materialsCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Quizzes</span>
                  </div>
                  <span className={`text-sm font-medium ${quizzesCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'}`}>
                    {quizzesCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Content warning and options */}
            {hasContent && (
              <div className="space-y-3">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-orange-800 dark:text-orange-200">
                        Module Contains Content
                      </h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        This module contains {materialsCount} material(s) and {quizzesCount} quiz(es).
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Cascade deletion option */}
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={cascadeDelete}
                      onChange={(e) => setCascadeDelete(e.target.checked)}
                      className="mt-0.5 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-red-800 dark:text-red-200">
                        Delete module and all content
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        This will permanently delete the module along with all {materialsCount} material(s) 
                        and {quizzesCount} quiz(es). Files will be removed from storage and cannot be recovered.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || (hasContent && !cascadeDelete)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Module
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}