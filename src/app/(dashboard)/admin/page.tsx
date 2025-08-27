"use client"

import { useContext } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { AdminDataContext } from "./layout"
import { MOCK_ACTIVITIES, MOCK_COURSES, AT_RISK_STUDENTS, STUDY_TECHNIQUES } from "@/lib/constants"
import { Users, BookOpen, TrendingUp, Target, AlertTriangle, Clock, TrendingUp as TrendingUpIcon, Loader2 } from "lucide-react"
import { DashboardStatsLoading, DashboardCardsLoading } from "@/components/common/dashboard-loading"

export default function AdminDashboard() {
  const { user } = useAuth()
  const { dashboardData, dataLoading, dataError, refreshData } = useContext(AdminDataContext)

  // Show loading state while waiting for user or data
  if (!user || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-300">
            {!user ? 'Loading user session...' : 'Loading dashboard data...'}
          </p>
        </div>
      </div>
    )
  }

  // Show error state with retry option
  if (dataError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-red-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md">
            {dataError}
          </p>
          <Button onClick={refreshData} className="bg-blue-600 hover:bg-blue-700 text-white">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Get stats from API data or use fallback
  const stats = dashboardData?.stats ? [
    { title: "Total Students", value: dashboardData.stats.totalStudents.toString(), change: "+12% from last month", icon: Users },
    { title: "Active Courses", value: dashboardData.stats.totalCourses.toString(), change: "+5% from last month", icon: BookOpen },
    { title: "Completion Rate", value: `${dashboardData.stats.completionRate}%`, change: "+8% from last month", icon: Target },
    { title: "Active Sessions", value: dashboardData.stats.activeSessions.toString(), change: "+15% from last month", icon: TrendingUpIcon },
  ] : [
    { title: "Total Students", value: "0", change: "Loading...", icon: Users },
    { title: "Active Courses", value: "0", change: "Loading...", icon: BookOpen },
    { title: "Completion Rate", value: "0%", change: "Loading...", icon: Target },
    { title: "Active Sessions", value: "0", change: "Loading...", icon: TrendingUpIcon },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Platform overview for RKM Criminology Solutions - Monitor student progress and system performance.
        </p>
      </div>

      {/* Key Metrics */}
      {dataLoading ? (
        <div className="mb-8">
          <DashboardStatsLoading />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {dataLoading ? (
        <div className="mb-8">
          <DashboardCardsLoading />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Recent Activities</CardTitle>
            <CardDescription className="dark:text-gray-300">Latest student progress and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_ACTIVITIES.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.user}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{activity.action}</p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{activity.time}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              View Full Report
            </Button>
          </CardContent>
        </Card>

        {/* At-Risk Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              At-Risk Students
            </CardTitle>
            <CardDescription className="dark:text-gray-300">Students needing attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {AT_RISK_STUDENTS.map((student, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      student.riskLevel === 'High' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {student.riskLevel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avg Score: {student.avgScore}</p>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-gray-400 dark:text-gray-500">{student.lastActive}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              View All Students
            </Button>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Course Performance & Study Techniques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Course Performance Summary</CardTitle>
            <CardDescription className="dark:text-gray-300">Enrollment and completion rates by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_COURSES.map((course, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{course.course}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{course.students} students</p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{course.progress}% avg completion</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Study Technique Effectiveness</CardTitle>
            <CardDescription className="dark:text-gray-300">AI insights on learning method performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {STUDY_TECHNIQUES.map((technique, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{technique.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{technique.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">{technique.effectiveness}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{technique.usage} usage</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              Detailed Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}