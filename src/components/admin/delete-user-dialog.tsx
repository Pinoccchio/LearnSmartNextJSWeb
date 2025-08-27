"use client"

import { useState } from 'react'
import { userAPI } from '@/lib/supabase-api'
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
import { AlertTriangle, Loader2, User } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
}

interface DeleteUserDialogProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onUserDeleted: () => void
  currentUser?: { id: string; role: string } | null
}

export function DeleteUserDialog({ user, isOpen, onClose, onUserDeleted, currentUser }: DeleteUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!user) return
    
    // Check if we have current user context for admin operations
    if (!currentUser?.id || !currentUser?.role) {
      setError('Current user context required for deletion')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      await userAPI.delete(user.id, currentUser)
      
      // Show success toast
      toast({
        title: "User deleted",
        description: `${user.name} has been successfully removed from the system.`,
        variant: "default",
      })

      // Notify parent component
      onUserDeleted()
      onClose()
      
    } catch (error: any) {
      console.error('Error deleting user:', error)
      const errorMessage = error.message || 'Failed to delete user'
      setError(errorMessage)
      
      // Show error toast
      toast({
        title: "Error deleting user",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setError('')
      onClose()
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-lg text-gray-900 dark:text-white">
                Delete User Account
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 dark:text-gray-300">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {user.email}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            <p>
              Are you sure you want to permanently delete this user account? This will remove:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
              <li>User profile and authentication access</li>
              <li>All associated study progress and data</li>
              <li>Course enrollments and session history</li>
            </ul>
            <p className="mt-3 font-medium text-red-600 dark:text-red-400">
              This action cannot be undone.
            </p>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
            className="dark:text-gray-100"
          >
            Cancel
          </Button>
          <Button 
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Delete User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}