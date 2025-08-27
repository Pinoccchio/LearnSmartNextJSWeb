'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, Loader2, AlertTriangle } from "lucide-react"
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'

interface Module {
  id: string
  title: string
  description?: string
  order_index: number
  course_id: string
}

interface EditModuleFormProps {
  module: Module
  onSuccess: () => void
  onCancel: () => void
}

export default function EditModuleForm({ module, onSuccess, onCancel }: EditModuleFormProps) {
  const [title, setTitle] = useState(module.title)
  const [description, setDescription] = useState(module.description || '')
  const [orderIndex, setOrderIndex] = useState(module.order_index)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')
  
  // Use auth context instead of direct session calls
  const { user } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚀 Edit form submission started')
    console.log('📋 Form data:', { 
      moduleId: module.id,
      title: title.trim(), 
      titleLength: title.trim().length,
      descriptionLength: description.length,
      orderIndex,
      originalTitle: module.title
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
      setError('You must be logged in to edit modules.')
      return
    }

    setIsUpdating(true)
    setError('')

    try {
      console.log('🔧 Calling edit module API...')
      
      const response = await fetch(`/api/instructor/edit-module?moduleId=${module.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
          'X-User-Role': user.role
        },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          orderIndex
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API error response:', errorData)
        throw new Error(errorData.error || 'Failed to update module')
      }

      const result = await response.json()
      console.log('✅ Module updated successfully:', result)
      
      // Show success toast
      toast({
        title: '✏️ Module Updated Successfully!',
        description: `"${result.module?.title || title.trim()}" has been updated with your changes.`,
        variant: 'success'
      })
      
      onSuccess()

    } catch (error: any) {
      console.error('💥 Error updating module:', error)
      
      // Provide user-friendly error messages
      let errorMessage = error.message || 'Failed to update module. Please try again.'
      
      if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
        errorMessage = 'A module with this title already exists in the course. Please choose a different title.'
      } else if (error.message?.includes('access denied') || error.message?.includes('permission')) {
        errorMessage = 'You do not have permission to edit this module.'
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      }
      
      setError(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Module Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Module Title <span className="text-red-500">*</span>
        </label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter module title"
          disabled={isUpdating}
          required
          maxLength={200}
          className="w-full"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {title.length}/200 characters
        </p>
      </div>

      {/* Module Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description <span className="text-gray-400">(Optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter module description"
          disabled={isUpdating}
          maxLength={500}
          rows={3}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {description.length}/500 characters
        </p>
      </div>

      {/* Module Order */}
      <div>
        <label htmlFor="orderIndex" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Module Order
        </label>
        <Input
          id="orderIndex"
          type="number"
          value={orderIndex}
          onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
          min={0}
          disabled={isUpdating}
          className="w-full"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Position of this module in the course (0 = first)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isUpdating}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isUpdating || !title.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating Module...
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Update Module
            </>
          )}
        </Button>
      </div>
    </form>
  )
}