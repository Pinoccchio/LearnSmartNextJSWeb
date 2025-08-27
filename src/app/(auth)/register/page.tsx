"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, GraduationCap, Shield, Users } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { RegistrationSuccess } from '@/components/auth/registration-success'
import Image from 'next/image'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'admin' | 'instructor' | 'student'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessScreen, setShowSuccessScreen] = useState(false)
  const { register, login } = useAuth()
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing/selecting
    if (error) setError('')
  }

  // Validation helper functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    // Simple length validation
    return password.length >= 6
  }

  const validateName = (name: string) => {
    return name.trim().length >= 2
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Full name is required')
      return false
    }

    if (!validateName(formData.name)) {
      setError('Name must be at least 2 characters long')
      return false
    }

    if (!formData.email.trim()) {
      setError('Email address is required')
      return false
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }

    if (!formData.password) {
      setError('Password is required')
      return false
    }

    if (!validatePassword(formData.password)) {
      setError('Password must be at least 6 characters long')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Register with Supabase including selected role
      await register(formData.email.trim(), formData.password, formData.name.trim(), formData.role)
      
      // Show success screen instead of auto-login (user needs to confirm email first)
      setShowSuccessScreen(true)
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Handle specific error messages
      if (error.message?.includes('User already registered')) {
        setError('An account with this email address already exists. Please sign in instead.')
      } else if (error.message?.includes('Email rate limit exceeded')) {
        setError('Too many registration attempts. Please wait a few minutes before trying again.')
      } else if (error.message?.includes('Password should be at least 6 characters')) {
        setError('Password must be at least 6 characters long.')
      } else {
        setError(error.message || 'An error occurred during registration. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Show success screen after registration
  if (showSuccessScreen) {
    return (
      <RegistrationSuccess 
        email={formData.email}
        name={formData.name}
        onBackToLogin={() => router.push('/login')}
      />
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
          {/* Main Registration Card */}
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
                Join LearnSmart
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Create your account to start your criminology journey
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Account Type</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="student"
                        name="role"
                        value="student"
                        checked={formData.role === 'student'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <label htmlFor="student" className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <Users className="w-4 h-4 mr-2" />
                        Student - Access to courses and study materials
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="instructor"
                        name="role"
                        value="instructor"
                        checked={formData.role === 'instructor'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <label htmlFor="instructor" className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Instructor - Teach courses and manage students
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="admin"
                        name="role"
                        value="admin"
                        checked={formData.role === 'admin'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <label htmlFor="admin" className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <Shield className="w-4 h-4 mr-2" />
                        Administrator - Full platform management access
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 pr-10 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10 pr-10 h-12 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-center space-x-2">
                  <input
                    id="terms"
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
                    I agree to the{' '}
                    <Link href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200 hover:scale-105" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>

              {/* Sign In Link */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Why Choose LearnSmart?
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 glass-card rounded-lg p-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">AI-Powered Learning</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Personalized study techniques for criminology</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 glass-card rounded-lg p-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <div className="text-xs font-bold text-green-600 dark:text-green-400">85%</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">High Success Rate</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Students pass board exams on first attempt</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 glass-card rounded-lg p-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <div className="text-xs font-bold text-purple-600 dark:text-purple-400">409+</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Growing Community</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Join successful criminology students</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}