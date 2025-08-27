'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, FileText, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { useAuth } from '@/contexts/auth-context'

interface UploadMaterialFormProps {
  moduleId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function UploadMaterialForm({ moduleId, onSuccess, onCancel }: UploadMaterialFormProps) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.')
      return
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      setError('File too large. Maximum size is 50MB.')
      return
    }

    setFile(selectedFile)
    setError('')
    
    // Auto-generate title from filename if not set
    if (!title) {
      const nameWithoutExt = selectedFile.name.split('.').slice(0, -1).join('.')
      setTitle(nameWithoutExt)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setError('Please select a file to upload.')
      return
    }

    if (!title.trim()) {
      setError('Please enter a title for the material.')
      return
    }

    if (!user?.id) {
      setError('Authentication required. Please log in again.')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      console.log('🚀 Starting material upload with timeout protection')

      const formData = new FormData()
      formData.append('file', file)
      formData.append('moduleId', moduleId)
      formData.append('title', title.trim())
      formData.append('description', description.trim())

      // Use custom header authentication instead of session token
      const uploadPromise = fetch('/api/instructor/upload-material', {
        method: 'POST',
        headers: {
          'X-User-ID': user.id,
          'X-User-Role': user.role
        },
        credentials: 'include',
        body: formData
      })

      // Add timeout protection to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
      )

      const response = await Promise.race([uploadPromise, timeoutPromise]) as Response

      if (!response.ok) {
        console.error('❌ Upload response not OK:', response.status, response.statusText)
        let errorMessage = `Upload failed (${response.status}): `
        try {
          const errorData = await response.json()
          errorMessage += errorData.error || errorData.message || 'Unknown error'
          console.error('💥 Upload error details:', errorData)
        } catch (parseError) {
          const errorText = await response.text()
          errorMessage += errorText || 'Failed to parse error response'
          console.error('💥 Raw upload response:', errorText)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('✅ Material uploaded successfully:', result)
      onSuccess()

    } catch (error: any) {
      console.error('💥 Error uploading material:', error)
      
      // Provide specific error messages based on error type
      if (error.message?.includes('timeout')) {
        console.log('⏰ Upload timed out')
        setError('Upload timed out. Please try again with a smaller file or check your connection.')
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        console.log('🌐 Network error during upload')
        setError('Network error during upload. Please check your connection and try again.')
      } else if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
        console.log('🔑 Authentication error during upload')
        setError('Authentication error. Please refresh the page and log in again.')
      } else {
        console.log('❓ Unknown error during upload')
        setError(error.message || 'Failed to upload material. Please try again.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload Area */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
          Course Material File
        </label>
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : file
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          
          {file ? (
            <div className="flex items-center justify-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PDF, DOC, DOCX, TXT (max 50MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Title Input */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
          Material Title *
        </label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a descriptive title for this material"
          required
          disabled={isUploading}
        />
      </div>

      {/* Description Input */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md h-24 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
          placeholder="Provide additional context or instructions for students..."
          disabled={isUploading}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!file || !title.trim() || isUploading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Material
            </>
          )}
        </Button>
      </div>
    </form>
  )
}