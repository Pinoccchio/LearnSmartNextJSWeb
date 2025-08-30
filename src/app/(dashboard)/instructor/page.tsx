"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  FileText,
  BarChart3,
  Calendar,
  Award,
  Brain,
  Timer,
  MessageSquare,
  RefreshCw
} from 'lucide-react'
import { 
  StudyTechniquesChart, 
  ModulePerformanceChart,
  EngagementTrendsChart 
} from '@/components/analytics/interactive-charts'

interface Course {
  id: string
  title: string
  description: string
  status: string
  created_at: string
  modules: {
    id: string
    title: string
    description: string
    order_index: number
    course_materials: {
      id: string
      title: string
      file_type: string
      file_name: string
      file_size: number
      created_at: string
    }[]
  }[]
}

interface Student {
  id: string
  name: string
  email: string
  courseId: string
  courseTitle: string
  progress: number
  avgScore: number
  riskLevel: 'Low' | 'Medium' | 'High'
  lastActive: string
  enrollmentStatus: string
  enrolledAt: string
  strongAreas: string[]
  weakAreas: string[]
  studySessions: number
  streak: number
}

interface AnalyticsData {
  keyMetrics: {
    courseEffectiveness: number
    studentEngagement: number
    contentGenerated: number
    interventionsSent: number
  }
  studyTechniques: {
    technique: string
    type: string
    totalSessions: number
    adoptionRate: number
    effectivenessPercentage: number
    uniqueUsers: number
  }[]
  modulePerformance: {
    id: string
    title: string
    studentsCompleted: number
    totalStudents: number
    averageScore: number
    status: 'excellent' | 'good' | 'needs_improvement' | 'critical'
  }[]
  studentEngagement: {
    peakHours: {
      time: string
      activity: number
      percentage: number
    }[]
    contentTypes: {
      type: string
      engagement: number
      percentage: number
      color: string
    }[]
  }
  weeklyPerformance: {
    averageQuizScores: number
    moduleCompletion: number
    studySessionDuration: number
    contentEngagement: number
    interventionsSent: number
  }
  totalStudents: number
  activeStudents: number
}

export default function InstructorDashboard() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!user?.id) return

    try {
      setError(null)
      const headers = {
        'X-User-ID': user.id,
        'X-User-Role': user.role,
        'Content-Type': 'application/json'
      }

      // Fetch all data in parallel
      const [coursesRes, studentsRes, analyticsRes] = await Promise.all([
        fetch('/api/instructor/courses', { headers }),
        fetch('/api/instructor/students', { headers }),
        fetch('/api/instructor/analytics', { headers })
      ])

      if (!coursesRes.ok || !studentsRes.ok || !analyticsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [coursesData, studentsData, analyticsData] = await Promise.all([
        coursesRes.json(),
        studentsRes.json(),
        analyticsRes.json()
      ])

      if (coursesData.success) {
        setCourses(coursesData.courses || [])
      }

      if (studentsData.success) {
        setStudents(studentsData.data.students || [])
      }

      if (analyticsData.success) {
        setAnalytics(analyticsData.data)
      }

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user?.id])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchData()
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Dashboard</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instructor Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Here's an overview of your teaching activities.
          </p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Course Effectiveness"
            value={`${analytics.keyMetrics.courseEffectiveness}%`}
            description="Average student performance"
            icon={<Target className="h-4 w-4" />}
            trend={analytics.keyMetrics.courseEffectiveness >= 70 ? "up" : "down"}
          />
          <MetricCard
            title="Active Students"
            value={analytics.keyMetrics.studentEngagement.toString()}
            description="Students active in last 7 days"
            icon={<Users className="h-4 w-4" />}
            trend="up"
          />
          <MetricCard
            title="Study Sessions"
            value={analytics.keyMetrics.contentGenerated.toString()}
            description="Total sessions this month"
            icon={<Brain className="h-4 w-4" />}
            trend="up"
          />
          <MetricCard
            title="Total Courses"
            value={courses.length.toString()}
            description={`${analytics.totalStudents} total students`}
            icon={<BookOpen className="h-4 w-4" />}
            trend="stable"
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* My Courses Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                My Courses
              </CardTitle>
              <CardDescription>
                Courses you're currently teaching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {courses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No courses found</p>
                </div>
              ) : (
                courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Students Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                My Students
              </CardTitle>
              <CardDescription>
                Recent student activity and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No enrolled students found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {students.slice(0, 5).map((student) => (
                    <StudentCard key={student.id} student={student} />
                  ))}
                  {students.length > 5 && (
                    <div className="text-center pt-4 border-t">
                      <Button variant="outline" size="sm">
                        View All {students.length} Students
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Teaching Analytics Section */}
      {analytics && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <h2 className="text-2xl font-bold">Teaching Analytics</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Study Techniques Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Study Techniques Usage</CardTitle>
                <CardDescription>
                  How students are using different learning methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.studyTechniques.length > 0 ? (
                  <StudyTechniquesChart data={analytics.studentEngagement.contentTypes} />
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    No study technique data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Module Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Module Performance</CardTitle>
                <CardDescription>
                  Average scores and completion rates by module
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.modulePerformance.length > 0 ? (
                  <ModulePerformanceChart data={analytics.modulePerformance} />
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    No module performance data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Study Techniques Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Technique Performance</CardTitle>
                <CardDescription>Effectiveness by study method</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.studyTechniques.map((technique) => (
                  <div key={technique.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTechniqueIcon(technique.type)}
                      <div>
                        <p className="font-medium">{technique.technique}</p>
                        <p className="text-sm text-muted-foreground">
                          {technique.totalSessions} sessions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{technique.effectivenessPercentage}%</p>
                      <p className="text-sm text-muted-foreground">
                        {technique.adoptionRate}% adoption
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Peak Activity Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Peak Study Hours</CardTitle>
                <CardDescription>When students are most active</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.studentEngagement.peakHours.slice(0, 4).map((hour, index) => (
                  <div key={hour.time} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-green-500' : 
                        index === 1 ? 'bg-blue-500' :
                        index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                      }`} />
                      <span className="font-medium">{hour.time}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{hour.activity} sessions</p>
                      <p className="text-sm text-muted-foreground">{hour.percentage}%</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Weekly Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Summary</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Average Quiz Scores</span>
                    <span className="text-sm">{analytics.weeklyPerformance.averageQuizScores}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Module Completion</span>
                    <span className="text-sm">{analytics.weeklyPerformance.moduleCompletion}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Avg Session Duration</span>
                    <span className="text-sm">{analytics.weeklyPerformance.studySessionDuration}min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Content Engagement</span>
                    <span className="text-sm">{analytics.weeklyPerformance.contentEngagement}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend 
}: { 
  title: string
  value: string
  description: string
  icon: React.ReactNode
  trend: 'up' | 'down' | 'stable'
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
          {trend === 'down' && <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />}
          {description}
        </p>
      </CardContent>
    </Card>
  )
}

function CourseCard({ course }: { course: Course }) {
  const moduleCount = course.modules?.length || 0
  const materialCount = course.modules?.reduce((acc, module) => 
    acc + (module.course_materials?.length || 0), 0
  ) || 0

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm leading-tight">{course.title}</h3>
            <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
              {course.status}
            </Badge>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-2">
          {course.description}
        </p>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {moduleCount} modules
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {materialCount} materials
          </div>
        </div>
        
      </div>
    </Card>
  )
}

function StudentCard({ student }: { student: Student }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${
          student.riskLevel === 'Low' ? 'bg-green-500' :
          student.riskLevel === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
        <div>
          <p className="font-medium text-sm">{student.name}</p>
          <p className="text-xs text-muted-foreground">{student.courseTitle}</p>
        </div>
      </div>
      
      <div className="text-right space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{student.progress}%</span>
          <Badge 
            variant={student.riskLevel === 'Low' ? 'default' : 'destructive'}
            className={`text-xs ${
              student.riskLevel === 'Low' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : student.riskLevel === 'Medium'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {student.riskLevel} Risk
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {student.lastActive}
        </div>
      </div>
    </div>
  )
}

function getTechniqueIcon(type: string) {
  switch (type) {
    case 'active_recall':
      return <Brain className="h-4 w-4 text-green-600" />
    case 'pomodoro':
      return <Timer className="h-4 w-4 text-blue-600" />
    case 'feynman':
      return <MessageSquare className="h-4 w-4 text-red-600" />
    case 'retrieval_practice':
      return <Award className="h-4 w-4 text-purple-600" />
    default:
      return <Target className="h-4 w-4" />
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-20" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}