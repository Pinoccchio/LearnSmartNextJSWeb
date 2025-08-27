"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the hash from URL (contains the tokens)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        if (accessToken && refreshToken) {
          // Set the session with the tokens from email confirmation
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) throw error

          if (data.user) {
            setStatus('success')
            setMessage('Your email has been confirmed successfully!')
            
            // Wait a moment then redirect to login
            setTimeout(() => {
              router.push('/login')
            }, 3000)
          }
        } else {
          throw new Error('No confirmation tokens found')
        }
      } catch (error: any) {
        console.error('Email confirmation error:', error)
        setStatus('error')
        setMessage(error.message || 'Failed to confirm your email. Please try again.')
      }
    }

    handleEmailConfirmation()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
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
              
              <div className="flex justify-center mb-4">
                {status === 'loading' && (
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                  </div>
                )}
                
                {status === 'success' && (
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                )}
                
                {status === 'error' && (
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                )}
              </div>
              
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {status === 'loading' && 'Confirming Your Email...'}
                {status === 'success' && 'Email Confirmed!'}
                {status === 'error' && 'Confirmation Failed'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {status === 'loading' && 'Please wait while we confirm your email address.'}
                {message}
              </p>

              {status === 'success' && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      You will be redirected to the sign-in page in a few seconds...
                    </p>
                  </div>
                  
                  <Button asChild className="w-full">
                    <Link href="/login">
                      Continue to Sign In
                    </Link>
                  </Button>
                </div>
              )}

              {status === 'error' && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      The confirmation link may have expired or been used already.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Button asChild className="w-full">
                      <Link href="/register">
                        Try Registering Again
                      </Link>
                    </Button>
                    
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/login">
                        Back to Sign In
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}