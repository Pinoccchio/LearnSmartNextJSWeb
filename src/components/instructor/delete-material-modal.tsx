'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Loader2, AlertTriangle, FileText, File, HardDrive } from "lucide-react"
import { supabase } from '@/lib/supabase'

interface CourseMaterial {
  id: string
  title: string
  description?: string
  file_name: string
  file_type: string
  file_size?: number
  file_url: string
  created_at: string
}

interface DeleteMaterialModalProps {
  material: CourseMaterial
  onSuccess: () => void
  onCancel: () => void
}

export default function DeleteMaterialModal({ material, onSuccess, onCancel }: DeleteMaterialModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    setIsDeleting(true)
    setError('')

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Authentication session not found. Please log in again.')
      }

      console.log('Deleting material:', material.id, material.title)

      const response = await fetch(`/api/instructor/delete-material?materialId=${material.id}`, {
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
      console.log('Material deleted successfully:', result)
      onSuccess()

    } catch (error: any) {
      console.error('Error deleting material:', error)
      setError(error.message || 'Failed to delete material. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatFileSize = (sizeInBytes?: number) => {
    if (!sizeInBytes) return 'Unknown size'
    
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`
    } else {
      return `${(sizeInBytes / 1024 / 1024).toFixed(1)} MB`
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />
      case 'doc':
      case 'docx':
        return <File className="h-5 w-5 text-blue-500" />
      case 'txt':
        return <FileText className="h-5 w-5 text-gray-500" />
      default:
        return <File className="h-5 w-5 text-orange-500" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Trash2 className="h-5 w-5" />
            Delete Course Material
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
                    Are you sure you want to delete this material?
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    <strong>"{material.title}"</strong>
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Material details */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">Material Details</h5>
              <div className="space-y-3">
                {/* File info */}
                <div className="flex items-start gap-3">
                  {getFileIcon(material.file_type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {material.file_name}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                        {material.file_type.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(material.file_size)}</span>
                      <span>{new Date(material.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Description if available */}
                {material.description && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {material.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Storage warning */}
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-start space-x-2">
                <HardDrive className="h-4 w-4 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    <strong>File Storage:</strong> The physical file will be permanently deleted from storage and cannot be recovered.
                  </p>
                </div>
              </div>
            </div>

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
                disabled={isDeleting}
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
                    Delete Material
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