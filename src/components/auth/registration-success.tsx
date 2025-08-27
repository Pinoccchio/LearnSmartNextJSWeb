"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { resendConfirmationEmail, getEmailConfirmationInstructions } from '@/lib/email-confirmation'
import Image from 'next/image'
import Link from 'next/link'

interface RegistrationSuccessProps {
  email: string
  name: string
  onBackToLogin: () => void
}

export function RegistrationSuccess({ email, name, onBackToLogin }: RegistrationSuccessProps) {
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [resendSuccess, setResendSuccess] = useState(false)

  const handleResendConfirmation = async () => {
    setResendLoading(true)
    setResendMessage('')

    try {
      const result = await resendConfirmationEmail(email)
      setResendMessage(result.message)
      setResendSuccess(result.success)
    } catch (error) {
      setResendMessage('Failed to resend confirmation email. Please try again.')
      setResendSuccess(false)
    } finally {
      setResendLoading(false)
    }
  }

  const instructions = getEmailConfirmationInstructions()

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
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome to LearnSmart, {name}!
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Your account has been created successfully
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Email confirmation notice */}
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                      Confirm Your Email Address
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                      We've sent a confirmation email to <strong>{email}</strong>
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-500">
                      Please click the link in your email to activate your account and start learning.
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Next steps:
                </h4>
                
                {instructions.map((instruction) => (
                  <div key={instruction.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                      {instruction.step}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 pt-1">
                      {instruction.instruction}
                    </p>
                  </div>
                ))}
              </div>

              {/* Resend section */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Didn't receive the email? Check your spam folder or resend it.
                </p>
                
                <Button 
                  variant="outline" 
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  className="w-full"
                >
                  {resendLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend Confirmation Email
                    </>
                  )}
                </Button>

                {resendMessage && (
                  <div className={`mt-3 p-3 rounded-lg ${
                    resendSuccess 
                      ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700' 
                      : 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'
                  }`}>
                    <p className={`text-sm ${
                      resendSuccess 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {resendMessage}
                    </p>
                  </div>
                )}
              </div>

              {/* Back to login */}
              <div className="text-center pt-4">
                <Button 
                  variant="ghost" 
                  onClick={onBackToLogin}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}