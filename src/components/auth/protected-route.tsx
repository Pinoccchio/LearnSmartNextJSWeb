"use client"

import { useEffect, ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import DashboardLoading from '@/components/common/dashboard-loading'
import Link from 'next/link'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'admin' | 'instructor' | 'student'
  fallbackPath?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallbackPath = '/login' 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If no user after loading completes, redirect to login only
    if (!isLoading && !user) {
      console.log('❌ No user, redirecting to login')
      router.replace(fallbackPath)
    }
  }, [user, isLoading, router, fallbackPath])

  // Show loading while checking authentication
  if (isLoading) {
    return <DashboardLoading />
  }

  // If no user, show loading (will redirect to login)
  if (!user) {
    return <DashboardLoading />
  }

  // Check if student is trying to access web platform
  if (user.role === 'student') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👨‍🎓</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Student Access
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Student accounts cannot access the web platform. Please use the mobile app for your studies.
            </p>
          </div>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Check role-based access - show access denied instead of redirecting
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚫</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You need <strong>{requiredRole}</strong> role to access this page. Your current role is <strong>{user.role}</strong>.
            </p>
          </div>
          <div className="space-y-2">
            <Link 
              href="/"
              className="block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              ← Back to Home
            </Link>
            {user.role === 'admin' && (
              <Link 
                href="/admin"
                className="block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Go to Admin Dashboard
              </Link>
            )}
            {user.role === 'instructor' && (
              <Link 
                href="/instructor"
                className="block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Go to Instructor Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  console.log('✅ Access granted to', user.email, 'with role', user.role)

  // User is authenticated and has correct role
  return <>{children}</>
}