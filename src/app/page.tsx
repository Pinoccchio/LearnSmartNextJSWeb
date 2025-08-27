"use client"

import { useAuth } from '@/contexts/auth-context'
import LandingPage from '@/components/landing/landing-page'
import DashboardLoading from '@/components/common/dashboard-loading'

export default function Home() {
  const { user, isLoading } = useAuth()

  // Show loading while checking authentication
  if (isLoading) {
    return <DashboardLoading />
  }

  // Always show landing page - let users navigate manually
  return <LandingPage />
}