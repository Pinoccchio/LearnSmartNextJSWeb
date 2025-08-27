"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function InstructorCoursePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the correct courses route
    router.push('/instructor/courses')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="text-gray-600">Redirecting to course management page</p>
      </div>
    </div>
  )
}