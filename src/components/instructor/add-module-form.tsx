'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Loader2, AlertTriangle } from "lucide-react"
import { useAuth } from '@/contexts/auth-context'

interface AddModuleFormProps {
  courseId: string
  existingModulesCount: number
  onSuccess: () => void
  onCancel: () => void
}

export default function AddModuleForm({ courseId, existingModulesCount, onSuccess, onCancel }: AddModuleFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [orderIndex, setOrderIndex] = useState(existingModulesCount)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  
  // Use auth context instead of direct session calls
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚀 Form submission started')
    console.log('📋 Form data:', { 
      title: title.trim(), 
      titleLength: title.trim().length,
      descriptionLength: description.length,
      orderIndex,
      courseId 
    })
    console.log('👤 Current user:', user ? `${user.name} (${user.role})` : 'No user')
    
    e.preventDefault()
    
    if (!title.trim()) {
      console.log('❌ Validation failed: Empty title')
      setError('Module title is required.')
      return
    }

    if (!user) {
      console.log('❌ Validation failed: No authenticated user')
      setError('You must be logged in to create modules.')
      return
    }

    if (user.role !== 'instructor' && user.role !== 'admin') {
      console.log('❌ Validation failed: Wrong user role:', user.role)
      setError('Only instructors can create modules.')
      return
    }

    console.log('✅ All validations passed, starting submission process')
    setIsCreating(true)
    setError('')

    try {
      const payload = {
        courseId,
        title: title.trim(),
        description: description.trim() || null,
        orderIndex
      }

      console.log('📤 Sending module creation request:', payload)
      console.log('🌐 Making API call to /api/instructor/add-module')
      console.log('🔐 Using auth context user for validation (server will handle session)')
      
      // Make API call - server will handle authentication via Supabase
      const response = await fetch('/api/instructor/add-module', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include a user identifier for the server to validate
          'X-User-ID': user.id,
          'X-User-Role': user.role
        },
        credentials: 'include', // Include cookies for server-side auth
        body: JSON.stringify(payload)
      })

      console.log('📥 API Response received - status:', response.status)

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
          console.error('💥 Parse error:', parseError)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('✅ Module created successfully:', result)
      console.log('🎉 Calling onSuccess callback')
      onSuccess()

    } catch (error: any) {
      console.error('🚨 Complete error in handleSubmit:', error)
      console.error('🚨 Error name:', error.name)
      console.error('🚨 Error message:', error.message)
      console.error('🚨 Error stack:', error.stack)
      
      // More specific error messages
      if (error.message?.includes('401') || error.message?.includes('Authentication')) {
        console.log('🔑 Setting auth error message')
        setError('Authentication failed. Please refresh the page and log in again.')
      } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        console.log('🚫 Setting permission error message')
        setError('You do not have permission to create modules.')
      } else if (error.message?.includes('TypeError') || error.message?.includes('Failed to fetch')) {
        console.log('🌐 Setting network error message')
        setError('Network error. Please check your connection and try again.')
      } else if (error.message?.includes('500')) {
        console.log('🖥️ Setting server error message')
        setError('Server error. Please try again in a moment.')
      } else {
        console.log('❓ Setting generic error message')
        setError(error.message || 'Failed to create module. Please try again.')
      }
    } finally {
      console.log('🔄 Resetting loading state')
      setIsCreating(false)
      console.log('✅ Module creation attempt finished')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Module Title */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
          Module Title *
        </label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Criminal Procedure, Evidence Collection, Forensic Science"
          required
          disabled={isCreating}
          maxLength={200}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {title.length}/200 characters
        </p>
      </div>

      {/* Module Description */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
          Module Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md h-24 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
          placeholder="Provide a brief description of what this module covers..."
          disabled={isCreating}
          maxLength={500}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {description.length}/500 characters
        </p>
      </div>

      {/* Module Order */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
          Module Position
        </label>
        <select
          value={orderIndex}
          onChange={(e) => setOrderIndex(parseInt(e.target.value))}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          disabled={isCreating}
        >
          {Array.from({ length: existingModulesCount + 1 }, (_, i) => (
            <option key={i} value={i}>
              {i === 0 ? 'First module' : 
               i === existingModulesCount ? `After module ${i} (Last)` : 
               `After module ${i}`}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Choose where to position this module in the course sequence
        </p>
      </div>

      {/* Module Guidelines */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Module Guidelines</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Focus on specific criminology topics or concepts</li>
          <li>• Keep module scope manageable for student learning</li>
          <li>• Consider prerequisites and learning progression</li>
          <li>• You can add materials and quizzes after creating the module</li>
        </ul>
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
          disabled={isCreating}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!title.trim() || isCreating}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Module...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Module
            </>
          )}
        </Button>
      </div>
    </form>
  )
}