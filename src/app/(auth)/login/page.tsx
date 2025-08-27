"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, ArrowLeft, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { resendConfirmationEmail } from '@/lib/email-confirmation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showResendButton, setShowResendButton] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const { user, isLoading: authLoading } = useAuth()
  const { login } = useAuth()
  const router = useRouter()

  // Check if user is already authenticated and redirect
  useEffect(() => {
    if (authLoading) return // Wait for auth check to complete
    
    if (user) {
      console.log('🔐 Login page: User already authenticated, redirecting', user.role)
      
      // User is already authenticated, redirect to their dashboard
      switch (user.role) {
        case 'admin':
          router.replace('/admin')
          break
        case 'instructor':
          router.replace('/instructor')
          break
        case 'student':
          // Students should be redirected away from web platform
          router.replace('/')
          break
        default:
          router.replace('/')
      }
    }
  }, [user, authLoading, router])

  // Validation helper functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email address is required')
      return false
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return false
    }

    if (!password) {
      setError('Password is required')
      return false
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    return true
  }

  const handleResendConfirmation = async () => {
    if (!email || !validateEmail(email)) {
      setError('Please enter a valid email address first')
      return
    }

    setResendLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await resendConfirmationEmail(email.trim())
      
      if (result.success) {
        setSuccess(result.message)
        setShowResendButton(false) // Hide button after successful send
        
        // Show button again after 60 seconds
        setTimeout(() => {
          setShowResendButton(true)
        }, 60000)
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError('Failed to resend confirmation email. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    // Validate email first
    if (!email || !email.trim()) {
      setError('Please enter your email address first before requesting a password reset.')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setForgotPasswordLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        throw error
      }

      setSuccess(
        `Password reset instructions have been sent to ${email}. Please check your email and follow the instructions to reset your password.`
      )
      
      // Clear the form
      setPassword('')
    } catch (error: any) {
      console.error('Forgot password error:', error)
      
      // Handle specific error messages
      if (error.message?.includes('rate limit')) {
        setError('Too many password reset requests. Please wait a few minutes before trying again.')
      } else if (error.message?.includes('not found')) {
        setError('No account found with this email address. Please check your email or contact support.')
      } else {
        setError(error.message || 'Failed to send password reset email. Please try again.')
      }
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setShowResendButton(false)

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Use real authentication with entered credentials
      await login(email.trim(), password)
      
      // Redirect will be handled by auth context based on user role
      // No manual redirect needed here
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Handle specific error messages
      if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.')
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Your email address has not been confirmed yet. Please check your email and click the confirmation link.')
        setShowResendButton(true) // Show resend button for unconfirmed emails
      } else if (error.message?.includes('Too many requests')) {
        setError('Too many login attempts. Please wait a few minutes before trying again.')
      } else {
        setError(error.message || 'An error occurred during sign in. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking authentication or if already authenticated
  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {user ? 'Redirecting to dashboard...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header with back button and theme toggle */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="flex justify-between items-center">
          <Button 
            asChild
            variant="ghost" 
            size="sm"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="min-h-screen flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md">
          {/* Main Login Card */}
          <Card className="glass-card shadow-xl border-0">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-6">
                <Image
                  src="/images/logo/logo.png"
                  alt="LearnSmart Logo"
                  width={200}
                  height={80}
                  className="h-16 w-auto"
                  priority
                />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome Back to LearnSmart
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Sign in to access the administration dashboard
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  
                  {showResendButton && (
                    <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                      <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                        Didn't receive the email? Check your spam folder or resend it.
                      </p>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={handleResendConfirmation}
                        disabled={resendLoading}
                        className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        {resendLoading ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 mr-2" />
                            Resend Confirmation Email
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setError('') // Clear error when user starts typing
                        setSuccess('') // Clear success when user starts typing
                        setShowResendButton(false) // Hide resend button
                      }}
                      className="pl-10 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={forgotPasswordLoading || isLoading}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {forgotPasswordLoading ? 'Sending...' : 'Forgot password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setError('') // Clear error when user starts typing
                        setSuccess('') // Clear success when user starts typing
                        setShowResendButton(false) // Hide resend button
                      }}
                      className="pl-10 pr-10 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200 hover:scale-105" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Secure & Encrypted</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>409+ Students Trust Us</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}