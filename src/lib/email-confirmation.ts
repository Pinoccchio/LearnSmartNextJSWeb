import { supabase } from './supabase'

// Utility functions for email confirmation handling

export async function resendConfirmationEmail(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes('rate limit')) {
        return {
          success: false,
          message: 'Too many requests. Please wait a few minutes before requesting another confirmation email.'
        }
      } else if (error.message.includes('not found')) {
        return {
          success: false,
          message: 'No account found with this email address. Please sign up first.'
        }
      } else {
        return {
          success: false,
          message: error.message || 'Failed to send confirmation email. Please try again.'
        }
      }
    }

    return {
      success: true,
      message: 'Confirmation email sent successfully! Please check your inbox.'
    }
  } catch (error: any) {
    console.error('Error resending confirmation email:', error)
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.'
    }
  }
}

export function getEmailConfirmationMessage(email: string): string {
  return `We've sent a confirmation link to ${email}. Please check your email and click the link to activate your account.`
}

export function getResendEmailMessage(): string {
  return "Didn't receive the email? Check your spam folder or click below to resend."
}

export function getEmailConfirmationInstructions(): Array<{
  step: number;
  instruction: string;
  icon: string;
}> {
  return [
    {
      step: 1,
      instruction: 'Check your email inbox for a message from LearnSmart',
      icon: 'mail'
    },
    {
      step: 2,
      instruction: 'Click the confirmation link in the email',
      icon: 'link'
    },
    {
      step: 3,
      instruction: 'You\'ll be redirected back to sign in',
      icon: 'check'
    }
  ]
}