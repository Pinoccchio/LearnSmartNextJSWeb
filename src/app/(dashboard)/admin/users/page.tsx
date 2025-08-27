"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { userAPI } from "@/lib/supabase-api"
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from "@/hooks/use-toast"
import { Database } from '@/lib/database.types'
import { Search, Filter, Download, UserPlus, Edit, Trash2, AlertTriangle, Users, Loader2, Eye, EyeOff, Lock } from "lucide-react"
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog"

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  role: z.enum(['admin', 'instructor', 'student'], {
    required_error: 'Please select a role'
  }),
  status: z.enum(['active', 'inactive', 'suspended']).optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Edit user schema (without password fields)
const editUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'instructor', 'student'], {
    required_error: 'Please select a role'
  }),
  status: z.enum(['active', 'inactive', 'suspended'], {
    required_error: 'Please select a status'
  })
})

type UserFormData = z.infer<typeof userSchema>
type EditUserFormData = z.infer<typeof editUserSchema>

const USER_ROLES = ['All', 'admin', 'instructor', 'student'] as const
const USER_STATUSES = ['All', 'active', 'inactive', 'suspended'] as const

export default function AdminUserManagement() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeStudents: 0,
    instructors: 0,
    pendingReviews: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isUpdatingUser, setIsUpdatingUser] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { toast } = useToast()

  const addForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
      status: 'active'
    }
  })

  const editForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema)
  })

  // Load users when user is available (similar to instructor pattern)
  useEffect(() => {
    if (user?.id && user?.role === 'admin') {
      loadUsers()
    }
  }, [user?.id, user?.role])
  
  // Calculate stats whenever users data changes
  useEffect(() => {
    calculateStats()
  }, [users])

  const loadUsers = async () => {
    // Don't load users if user context is not available
    if (!user?.id || user?.role !== 'admin') {
      console.log('⚠️ User context not available, skipping user load')
      return
    }

    try {
      setIsLoading(true)
      console.log('🔄 Loading users with timeout protection')
      
      // Use new API route with timeout protection
      const fetchPromise = fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user?.id || '',
          'X-User-Role': user?.role || ''
        },
        credentials: 'include'
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User loading timeout after 10 seconds')), 10000)
      )
      
      const response = await Promise.race([fetchPromise, timeoutPromise])
      
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
        }
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      const userData = result.users || []
      console.log('✅ Users loaded successfully:', userData.length, 'users')
      setUsers(userData)
    } catch (error: any) {
      console.error('💥 Error loading users:', error)
      
      let errorMessage = 'Failed to load users. Please try again.'
      if (error.message?.includes('timeout')) {
        errorMessage = 'User loading timed out. Please check your connection and try again.'
      } else if (error.message?.includes('401') || error.message?.includes('Authentication')) {
        errorMessage = 'Authentication error. Please refresh the page and log in again.'
      } else if (error.message?.includes('403') || error.message?.includes('Admin access')) {
        errorMessage = 'You do not have permission to view users.'
      } else if (error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = () => {
    // Calculate real stats from actual users data
    const totalUsers = users.length
    const activeStudents = users.filter(u => u.role === 'student' && u.status === 'active').length
    const instructors = users.filter(u => u.role === 'instructor').length
    const pendingReviews = users.filter(u => u.status === 'suspended').length // Users needing attention
    
    setStats({
      totalUsers,
      activeStudents,
      instructors,
      pendingReviews
    })
    
    console.log('Stats calculated:', { totalUsers, activeStudents, instructors, pendingReviews })
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'All' || user.role === filterRole
    const matchesStatus = filterStatus === 'All' || user.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  const handleAddUser = async (data: UserFormData) => {
    setIsCreatingUser(true)
    
    try {
      console.log('🚀 Creating user via API:', { email: data.email, role: data.role })
      
      if (!user?.id || user?.role !== 'admin') {
        throw new Error('Authentication error. Please refresh the page and log in again.')
      }
      
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        status: data.status || 'active'
      }
      
      // Use new API route with timeout protection
      const fetchPromise = fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
          'X-User-Role': user.role
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User creation timeout after 15 seconds')), 15000)
      )
      
      const response = await Promise.race([fetchPromise, timeoutPromise])
      
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
        }
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      console.log('✅ User created successfully:', result.user)
      
      // Refresh users list
      await loadUsers()
      
      // Close modal and reset form
      setIsAddModalOpen(false)
      setShowPassword(false)
      setShowConfirmPassword(false)
      addForm.reset()
      
      toast({
        title: 'Success',
        description: `User created successfully! ${data.name} can now log in with their email and password.`,
        variant: 'default'
      })
      
      console.log('User creation process completed successfully')
      
    } catch (error: any) {
      console.error('💥 Error creating user:', error)
      
      // Handle specific error cases with better messaging
      let errorMessage = 'Failed to create user. Please try again.'
      
      if (error.message?.includes('timeout')) {
        errorMessage = 'User creation timed out. Please check your connection and try again.'
      } else if (error.message?.includes('401') || error.message?.includes('Authentication')) {
        errorMessage = 'Authentication error. Please refresh the page and log in again.'
      } else if (error.message?.includes('403') || error.message?.includes('Admin access')) {
        errorMessage = 'You do not have permission to create users.'
      } else if (error.message?.includes('User already registered') || error.message?.includes('already exists')) {
        errorMessage = 'A user with this email address already exists.'
      } else if (error.message?.includes('Password should be at least 6 characters')) {
        errorMessage = 'Password must be at least 6 characters long.'
      } else if (error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleEditUser = async (data: EditUserFormData) => {
    if (!editingUser || isUpdatingUser || !user?.id || user?.role !== 'admin') return
    
    setIsUpdatingUser(true)
    
    try {
      const updates = {
        name: data.name,
        role: data.role,
        status: data.status
      }
      
      console.log('📝 Updating user via API:', editingUser.id, 'with:', updates)
      
      const payload = {
        targetUserId: editingUser.id,
        updates: updates
      }
      
      // Use new API route with timeout protection
      const fetchPromise = fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
          'X-User-Role': user.role
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User update timeout after 10 seconds')), 10000)
      )
      
      const response = await Promise.race([fetchPromise, timeoutPromise])
      
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
        }
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      const updatedUser = result.user
      console.log('✅ User updated successfully:', updatedUser)
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u))
      setIsEditModalOpen(false)
      setEditingUser(null)
      editForm.reset()
      
      toast({
        title: 'Success',
        description: 'User updated successfully',
        variant: 'default'
      })
    } catch (error: any) {
      console.error('💥 Error updating user:', error)
      
      let errorMessage = 'Failed to update user. Please try again.'
      if (error.message?.includes('timeout')) {
        errorMessage = 'Update request timed out. Please check your connection and try again.'
      } else if (error.message?.includes('401') || error.message?.includes('Authentication')) {
        errorMessage = 'Authentication error. Please refresh the page and log in again.'
      } else if (error.message?.includes('403') || error.message?.includes('Admin access')) {
        errorMessage = 'You do not have permission to update users.'
      } else if (error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsUpdatingUser(false)
    }
  }

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user)
    setIsDeleteModalOpen(true)
  }

  const handleUserDeleted = () => {
    // Refresh the user list
    loadUsers()
  }

  const handlePasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) throw error
      
      toast({
        title: 'Password reset email sent',
        description: `A password reset link has been sent to ${email}`,
        variant: 'default'
      })
    } catch (error: any) {
      console.error('Error sending password reset:', error)
      toast({
        title: 'Error',
        description: 'Failed to send password reset email. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      
      const updatedUser = await userAPI.update(userId, { status: newStatus as 'active' | 'inactive' })
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u))
      
      toast({
        title: 'Success',
        description: `User status updated to ${newStatus}`,
        variant: 'success'
      })
    } catch (error) {
      console.error('Error updating user status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update user status. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    editForm.reset({
      name: user.name,
      role: user.role,
      status: user.status
    })
    setIsEditModalOpen(true)
  }

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Status', 'Created Date', 'Last Login'],
      ...filteredUsers.map(user => [
        user.name,
        user.email,
        user.role,
        user.status,
        new Date(user.created_at).toLocaleDateString(),
        user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast({
      title: 'Success',
      description: 'Users exported successfully',
      variant: 'success'
    })
  }

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  // Show loading state while waiting for user authentication
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading user session...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Manage students and instructors for RKM Criminology Solutions</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account. They will receive an email with login instructions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={addForm.handleSubmit(handleAddUser)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  {...addForm.register('name')}
                  placeholder="Enter full name"
                />
                {addForm.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">{addForm.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  {...addForm.register('email')}
                  type="email"
                  placeholder="Enter email address"
                />
                {addForm.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">{addForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    {...addForm.register('password')}
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {addForm.formState.errors.password && (
                  <p className="text-red-500 text-sm mt-1">{addForm.formState.errors.password.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    {...addForm.register('confirmPassword')}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {addForm.formState.errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{addForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  {...addForm.register('role')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Administrator</option>
                </select>
                {addForm.formState.errors.role && (
                  <p className="text-red-500 text-sm mt-1">{addForm.formState.errors.role.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  {...addForm.register('status')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                {addForm.formState.errors.status && (
                  <p className="text-red-500 text-sm mt-1">{addForm.formState.errors.status.message}</p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setIsAddModalOpen(false)
                  setShowPassword(false)
                  setShowConfirmPassword(false)
                  addForm.reset()
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingUser || addForm.formState.isSubmitting}>
                  {(isCreatingUser || addForm.formState.isSubmitting) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isCreatingUser ? 'Creating User...' : 'Create User'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStudents}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Currently active students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Instructors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.instructors}</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Criminology experts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Pending Reviews</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReviews}</div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Suspended users</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">All Users</CardTitle>
              <CardDescription className="dark:text-gray-300">Manage user accounts, roles, and performance tracking</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportUsers}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" className="text-white" onClick={() => setIsAddModalOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {USER_ROLES.map(role => (
                  <option key={role} value={role}>
                    {role === 'All' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {USER_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status === 'All' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : (
            /* Users Table */
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-sm">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-sm">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-sm">Joined</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-sm">Last Active</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                          {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge 
                        className={
                          user.role === 'student' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                            : user.role === 'instructor'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.status === 'active'}
                          onCheckedChange={() => handleStatusToggle(user.id, user.status)}
                          disabled={user.status === 'suspended'}
                        />
                        <Badge 
                          className={
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : user.status === 'suspended'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }
                        >
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">{formatLastActive(user.updated_at)}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditUser)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                {...editForm.register('name')}
                placeholder="Enter full name"
                disabled={isUpdatingUser}
              />
              {editForm.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <div className="flex gap-2">
                <Input
                  value={editingUser?.email || ''}
                  type="email"
                  placeholder="Enter email address"
                  disabled={true}
                  className="flex-1 opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editingUser && handlePasswordReset(editingUser.email)}
                  disabled={isUpdatingUser}
                  className="whitespace-nowrap"
                >
                  <Lock className="h-4 w-4 mr-1" />
                  Reset Password
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email cannot be changed for security reasons. Use "Reset Password" to send a password reset email.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                {...editForm.register('role')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUpdatingUser}
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Administrator</option>
              </select>
              {editForm.formState.errors.role && (
                <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.role.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                {...editForm.register('status')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUpdatingUser}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              {editForm.formState.errors.status && (
                <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.status.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
                disabled={isUpdatingUser}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingUser}>
                {isUpdatingUser ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update User'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <DeleteUserDialog
        user={deletingUser}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeletingUser(null)
        }}
        onUserDeleted={handleUserDeleted}
        currentUser={user ? { id: user.id, role: user.role } : null}
      />
    </div>
  )
}