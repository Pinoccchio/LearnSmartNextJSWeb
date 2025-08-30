'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  BookOpen, 
  Clock, 
  Target,
  AlertTriangle,
  CheckCircle,
  Activity,
  Brain,
  Timer,
  MessageSquare,
  RefreshCw,
  Download,
  Filter,
  Eye,
  Lightbulb,
  AlertCircle,
  TrendingDown,
  Calendar
} from "lucide-react"
import { useAuth } from '@/contexts/auth-context'
import { 
  EngagementTrendsChart,
  StudyTechniquesChart,
  ModulePerformanceChart,
  TimeBasedTechniqueChart,
  StudyHeatmapChart,
  TechniqueEffectivenessChart,
  PerformanceDistributionChart
} from '@/components/analytics/interactive-charts'
import { ExportDialog } from '@/components/analytics/export-dialog'

interface AnalyticsData {
  keyMetrics: {
    courseEffectiveness: number
    studentEngagement: number
    contentGenerated: number
    interventionsSent: number
  }
  studyTechniques: Array<{
    technique: string
    type: string
    totalSessions: number
    adoptionRate: number
    effectivenessPercentage: number
    uniqueUsers: number
  }>
  modulePerformance: Array<{
    id: string
    title: string
    studentsCompleted: number
    totalStudents: number
    averageScore: number
    status: 'excellent' | 'good' | 'needs_improvement' | 'critical'
  }>
  studentEngagement: {
    peakHours: Array<{
      time: string
      activity: number
      percentage: number
    }>
    contentTypes: Array<{
      type: string
      engagement: number
      percentage: number
      color: string
    }>
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

interface DetailedEngagementData {
  studentsList: Array<{
    id: string
    name: string
    email: string
    lastLogin: string
    engagementLevel: 'high' | 'medium' | 'low'
    totalSessions: number
    recentSessions: number
    completedSessions: number
    completionRate: number
    averagePerformance: number
    moduleCompletionRate: number
    preferredTechnique: string
    lastActivity: string
  }>
  engagementTrends: Array<{
    date: string
    sessions: number
    activeStudents: number
    completedSessions: number
  }>
  techniquePreferences: Array<{
    technique: string
    sessions: number
    users: number
    adoptionRate: number
    completionRate: number
  }>
}

interface StudyTechniquesDetailedData {
  activeRecallAnalytics: any
  pomodoroAnalytics: any
  feynmanAnalytics: any
  retrievalPracticeAnalytics: any
  techniqueComparison: Array<{
    technique: string
    sessions: number
    users: number
    adoptionRate: number
    sessionsPerUser: number
    color: string
  }>
  timeBasedAnalysis: Array<{
    date: string
    activeRecall: number
    pomodoro: number
    feynman: number
    retrievalPractice: number
    total: number
  }>
}

interface AIInsightsData {
  teachingRecommendations: Array<{
    id: string
    type: string
    title: string
    description: string
    actionableAdvice: string
    priority: number
    frequency: number
    affectedStudentsCount: number
    affectedStudents: string[]
    confidence: number
    impact: 'high' | 'medium' | 'low'
  }>
  studentInterventions: Array<{
    studentId: string
    studentName: string
    interventionLevel: 'urgent' | 'high' | 'medium'
    reasons: string[]
    recommendedActions: string[]
    lastAnalyzed: string
    sessionsAnalyzed: number
    improvementTrend: number
  }>
  performanceAlerts: Array<{
    type: 'critical' | 'warning' | 'info'
    title: string
    description: string
    moduleTitle: string
    value: number
    affectedStudents: number
    totalStudents: number
    severity: 'high' | 'medium' | 'low'
  }>
  classPerformanceInsights: Array<{
    type: string
    title: string
    insight: string
    metrics: any
    trend: 'positive' | 'concerning' | 'stable'
  }>
}

interface CourseInsightsData {
  courseOverview: Array<{
    id: string
    title: string
    description: string
    status: string
    totalModules: number
    totalStudents: number
    averageProgress: number
    totalSessions: number
    completionRate: number
    averageScore: number
    totalAttempts: number
    createdAt: string
    lastUpdated: string
  }>
  moduleInsights: Array<{
    id: string
    title: string
    courseTitle: string
    description: string
    totalStudents: number
    completedStudents: number
    completionRate: number
    averageScore: number
    needRemedial: number
    remedialRate: number
    totalSessions: number
    totalMaterials: number
    difficulty: 'low' | 'medium' | 'high'
    engagement: 'low' | 'medium' | 'high'
  }>
  contentEngagement: Array<{
    id: string
    title: string
    moduleTitle: string
    fileType: string
    relatedSessions: number
    studentsAccessed: number
    engagementScore: number
    effectiveness: number
  }>
  materialEffectiveness: Record<string, {
    count: number
    totalSessions: number
    totalStudents: number
    avgEffectiveness: number
  }>
  courseCompletion: {
    totalCourses: number
    activeCourses: number
    totalModules: number
    totalMaterials: number
    totalEnrollments: number
    averageCourseCompletion: number
    totalSessions: number
    sessionsPerStudent: number
  }
}

export default function InstructorAnalytics() {
  const { user } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [detailedEngagement, setDetailedEngagement] = useState<DetailedEngagementData | null>(null)
  const [studyTechniquesData, setStudyTechniquesData] = useState<StudyTechniquesDetailedData | null>(null)
  const [aiInsightsData, setAIInsightsData] = useState<AIInsightsData | null>(null)
  const [courseInsightsData, setCourseInsightsData] = useState<CourseInsightsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTimeRange, setActiveTimeRange] = useState('month')
  const [activeTab, setActiveTab] = useState('overview')
  const [error, setError] = useState<string | null>(null)

  const fetchAnalyticsData = async (timeRange: string = 'month') => {
    try {
      setIsLoading(true)
      setError(null)
      
      const headers = {
        'Content-Type': 'application/json',
        'X-User-ID': user?.id || ''
      }

      // Fetch all analytics data in parallel
      const [
        mainAnalytics,
        detailedEngagementResponse,
        studyTechniquesResponse,
        aiInsightsResponse,
        courseInsightsResponse
      ] = await Promise.all([
        fetch(`/api/instructor/analytics?timeRange=${timeRange}`, { headers }),
        fetch(`/api/instructor/analytics/detailed-student-engagement?timeRange=${timeRange}`, { headers }),
        fetch(`/api/instructor/analytics/study-techniques-detailed?timeRange=${timeRange}`, { headers }),
        fetch(`/api/instructor/analytics/ai-insights-detailed?timeRange=${timeRange}`, { headers }),
        fetch(`/api/instructor/analytics/course-insights?timeRange=${timeRange}`, { headers })
      ])

      if (!mainAnalytics.ok) {
        throw new Error('Failed to fetch main analytics')
      }

      const mainData = await mainAnalytics.json()
      setAnalyticsData(mainData.data)

      if (detailedEngagementResponse.ok) {
        const engagementData = await detailedEngagementResponse.json()
        setDetailedEngagement(engagementData.data)
      }

      if (studyTechniquesResponse.ok) {
        const techniquesData = await studyTechniquesResponse.json()
        setStudyTechniquesData(techniquesData.data)
      }

      if (aiInsightsResponse.ok) {
        const insightsData = await aiInsightsResponse.json()
        setAIInsightsData(insightsData.data)
      }

      if (courseInsightsResponse.ok) {
        const courseData = await courseInsightsResponse.json()
        setCourseInsightsData(courseData.data)
      }

    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchAnalyticsData(activeTimeRange)
    }
  }, [user?.id, activeTimeRange])

  const handleRefresh = () => {
    fetchAnalyticsData(activeTimeRange)
  }

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500 dark:text-gray-400">
              Please sign in to view analytics
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teaching Analytics</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Comprehensive insights into your students' learning progress and engagement
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <ExportDialog activeTimeRange={activeTimeRange} />
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {['week', 'month', 'quarter'].map((range) => (
          <Button
            key={range}
            variant={activeTimeRange === range ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTimeRange(range)}
            className="capitalize"
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'students', label: 'Student Engagement', icon: Users },
          { id: 'techniques', label: 'Study Techniques', icon: Brain },
          { id: 'courses', label: 'Course & Module Insights', icon: BookOpen },
          { id: 'insights', label: 'AI Insights', icon: Lightbulb }
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Button>
          )
        })}
      </div>

      {error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <OverviewTab 
          data={analyticsData}
          isLoading={isLoading}
          aiInsights={aiInsightsData}
        />
      )}
      
      {activeTab === 'students' && (
        <StudentEngagementTab 
          data={detailedEngagement}
          mainData={analyticsData}
          isLoading={isLoading}
        />
      )}
      
      {activeTab === 'techniques' && (
        <StudyTechniquesTab 
          data={studyTechniquesData}
          isLoading={isLoading}
        />
      )}
      
      {activeTab === 'courses' && (
        <CourseInsightsTab 
          data={courseInsightsData}
          isLoading={isLoading}
        />
      )}
      
      {activeTab === 'insights' && (
        <AIInsightsTab 
          data={aiInsightsData}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ data, isLoading, aiInsights }: { 
  data: AnalyticsData | null
  isLoading: boolean
  aiInsights: AIInsightsData | null
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-4" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500 dark:text-gray-400">
            No analytics data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Course Effectiveness"
          value={`${data.keyMetrics.courseEffectiveness}%`}
          icon={Target}
          trend={data.keyMetrics.courseEffectiveness >= 80 ? 'up' : 'stable'}
          description="Overall course performance score"
        />
        
        <MetricCard
          title="Active Students"
          value={data.keyMetrics.studentEngagement.toString()}
          icon={Users}
          trend="up"
          description={`${data.totalStudents} total enrolled`}
        />
        
        <MetricCard
          title="Study Sessions"
          value={data.keyMetrics.contentGenerated.toString()}
          icon={Activity}
          trend="up"
          description="Total learning sessions completed"
        />
        
        <MetricCard
          title="Average Score"
          value={`${data.weeklyPerformance.averageQuizScores}%`}
          icon={TrendingUp}
          trend={data.weeklyPerformance.averageQuizScores >= 75 ? 'up' : 'stable'}
          description="Student performance average"
        />
      </div>

      {/* Study Techniques Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Study Techniques Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.studyTechniques.map((technique, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{technique.technique}</h4>
                  <Badge 
                    variant={
                      technique.effectivenessPercentage >= 85 ? "success" : 
                      technique.effectivenessPercentage >= 70 ? "info" :
                      technique.effectivenessPercentage >= 60 ? "warning" : "destructive"
                    }
                  >
                    {technique.effectivenessPercentage}%
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Sessions:</span>
                    <span className="font-medium">{technique.totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Users:</span>
                    <span className="font-medium">{technique.uniqueUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Adoption:</span>
                    <span className="font-medium">{technique.adoptionRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Module Performance with Interactive Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Module Performance Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.modulePerformance.length > 0 ? (
              <ModulePerformanceChart data={data.modulePerformance.slice(0, 8)} />
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No module performance data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Module Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {data.modulePerformance.slice(0, 5).map((module, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{module.title}</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {module.studentsCompleted} of {module.totalStudents} students completed
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-medium">{module.averageScore}%</div>
                      <div className="text-sm text-gray-500">
                        {Math.round((module.studentsCompleted / module.totalStudents) * 100)}% completion
                      </div>
                    </div>
                    <Badge 
                      variant={
                        module.status === 'excellent' ? 'default' :
                        module.status === 'good' ? 'secondary' :
                        module.status === 'needs_improvement' ? 'outline' : 'destructive'
                      }
                    >
                      {module.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Alerts */}
      {aiInsights?.performanceAlerts && aiInsights.performanceAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Performance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiInsights.performanceAlerts.slice(0, 3).map((alert, index) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${
                  alert.type === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                  alert.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
                  'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{alert.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {alert.description}
                      </p>
                    </div>
                    <Badge variant={alert.type === 'critical' ? 'destructive' : 'outline'}>
                      {alert.value}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Student Engagement Tab Component
function StudentEngagementTab({ data, mainData, isLoading }: { 
  data: DetailedEngagementData | null
  mainData: AnalyticsData | null
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data || !mainData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500 dark:text-gray-400">
            No student engagement data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Engagement Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Students"
          value={mainData.totalStudents.toString()}
          icon={Users}
          trend="stable"
          description="Enrolled in your courses"
        />
        
        <MetricCard
          title="Active Students"
          value={mainData.activeStudents.toString()}
          icon={Activity}
          trend="up"
          description={`${Math.round((mainData.activeStudents / mainData.totalStudents) * 100)}% engagement rate`}
        />
        
        <MetricCard
          title="Peak Activity"
          value={mainData.studentEngagement.peakHours[0]?.time.split(' - ')[0] || 'N/A'}
          icon={Clock}
          trend="stable"
          description="Most active time period"
        />
      </div>

      {/* Engagement Trends Chart */}
      {data.engagementTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Engagement Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EngagementTrendsChart data={data.engagementTrends} />
          </CardContent>
        </Card>
      )}

      {/* Peak Hours and Study Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              Peak Study Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mainData.studentEngagement.peakHours.map((hour, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="font-medium">{hour.time}</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {hour.activity}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {hour.percentage}% of activity
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              Study Activity Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.studyHeatmap && data.studyHeatmap.length > 0 ? (
              <StudyHeatmapChart data={data.studyHeatmap} />
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No heatmap data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Student Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.studentsList.slice(0, 10).map((student, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{student.name}</h4>
                    <Badge 
                      variant={
                        student.engagementLevel === 'high' ? 'default' :
                        student.engagementLevel === 'medium' ? 'secondary' : 'outline'
                      }
                    >
                      {student.engagementLevel}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {student.totalSessions} sessions • {student.preferredTechnique}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{student.averagePerformance}%</div>
                  <div className="text-sm text-gray-500">
                    {student.moduleCompletionRate}% modules completed
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Study Techniques Tab Component
function StudyTechniquesTab({ data, isLoading }: { 
  data: StudyTechniquesDetailedData | null
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500 dark:text-gray-400">
            No study techniques data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Technique Comparison with Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Technique Comparison Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.techniqueComparison.length > 0 ? (
              <StudyTechniquesChart data={data.techniqueComparison.map(t => ({
                type: t.technique,
                engagement: t.sessions,
                percentage: Math.round((t.sessions / data.techniqueComparison.reduce((sum, tech) => sum + tech.sessions, 1)) * 100),
                color: t.color
              }))} />
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No technique comparison data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Technique Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
              {data.techniqueComparison.map((technique, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">{technique.technique}</h4>
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: technique.color }}
                    />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Sessions:</span>
                      <span className="font-medium">{technique.sessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Users:</span>
                      <span className="font-medium">{technique.users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Adoption:</span>
                      <span className="font-medium">{technique.adoptionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Avg/User:</span>
                      <span className="font-medium">{technique.sessionsPerUser}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time-based Analysis Chart */}
      {data.timeBasedAnalysis && data.timeBasedAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Technique Usage Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TimeBasedTechniqueChart data={data.timeBasedAnalysis} />
          </CardContent>
        </Card>
      )}

      {/* Effectiveness Analysis */}
      {data.effectivenessMetrics && Object.keys(data.effectivenessMetrics).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Technique Effectiveness Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TechniqueEffectivenessChart data={data.effectivenessMetrics} />
          </CardContent>
        </Card>
      )}

      {/* Individual Technique Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Recall */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Active Recall
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Sessions:</span>
                <span className="font-medium">{data.activeRecallAnalytics?.totalSessions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                <span className="font-medium">{data.activeRecallAnalytics?.completedSessions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Attempts:</span>
                <span className="font-medium">{data.activeRecallAnalytics?.totalAttempts || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Avg Accuracy:</span>
                <span className="font-medium">{data.activeRecallAnalytics?.averageAccuracy || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Active Users:</span>
                <span className="font-medium">{data.activeRecallAnalytics?.userEngagement || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pomodoro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Timer className="h-5 w-5" />
              Pomodoro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Sessions:</span>
                <span className="font-medium">{data.pomodoroAnalytics?.totalSessions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                <span className="font-medium">{data.pomodoroAnalytics?.completedSessions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Cycles:</span>
                <span className="font-medium">{data.pomodoroAnalytics?.totalCycles || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Avg Focus Score:</span>
                <span className="font-medium">{data.pomodoroAnalytics?.averageFocusScore || 0}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Study Time:</span>
                <span className="font-medium">{data.pomodoroAnalytics?.totalStudyTime || 0}min</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feynman */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <MessageSquare className="h-5 w-5" />
              Feynman
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Sessions:</span>
                <span className="font-medium">{data.feynmanAnalytics?.totalSessions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                <span className="font-medium">{data.feynmanAnalytics?.completedSessions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Explanations:</span>
                <span className="font-medium">{data.feynmanAnalytics?.totalExplanations || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Avg Score:</span>
                <span className="font-medium">{data.feynmanAnalytics?.averageExplanationScore || 0}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Avg Word Count:</span>
                <span className="font-medium">{data.feynmanAnalytics?.averageWordCount || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Retrieval Practice */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-600">
              <Brain className="h-5 w-5" />
              Retrieval Practice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Sessions:</span>
                <span className="font-medium">{data.retrievalPracticeAnalytics?.totalSessions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                <span className="font-medium">{data.retrievalPracticeAnalytics?.completedSessions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Questions:</span>
                <span className="font-medium">{data.retrievalPracticeAnalytics?.totalQuestions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Avg Accuracy:</span>
                <span className="font-medium">{data.retrievalPracticeAnalytics?.averageAccuracy || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Avg Response Time:</span>
                <span className="font-medium">{data.retrievalPracticeAnalytics?.averageResponseTime || 0}s</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// AI Insights Tab Component
function AIInsightsTab({ data, isLoading }: { 
  data: AIInsightsData | null
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            AI Insights Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-gray-500 dark:text-gray-400">
              AI insights are currently unavailable. This may be due to:
            </div>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 text-left max-w-md mx-auto">
              <li>• Insufficient student activity data</li>
              <li>• AI service temporarily unavailable</li>
              <li>• No courses or enrollments found</li>
            </ul>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Encourage students to use study techniques to generate insights.
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show AI status message if available
  const statusMessage = data.message || data.aiStatus
  const hasInsights = (data.aiInsights && data.aiInsights.length > 0) || 
                     (data.teachingRecommendations && data.teachingRecommendations.length > 0)
  const hasRecommendations = (data.aiRecommendations && data.aiRecommendations.length > 0) ||
                            (data.studentInterventions && data.studentInterventions.length > 0)

  return (
    <div className="space-y-6">
      {/* AI Status Banner */}
      {statusMessage && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                AI Analysis Status: {statusMessage}
              </span>
            </div>
            {data.studentsAnalyzed && (
              <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Analyzed {data.studentsAnalyzed} students across {data.coursesAnalyzed} courses
                {data.atRiskStudents > 0 && ` • ${data.atRiskStudents} students need attention`}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Insights (New Format) */}
      {data.aiInsights && data.aiInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              AI-Generated Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.aiInsights.slice(0, 5).map((insight, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                  insight.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
                  insight.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' :
                  'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{insight.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={insight.priority <= 2 ? 'destructive' : insight.priority === 3 ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          Priority {insight.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(insight.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {insight.description}
                  </p>
                  <div className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded border-l-2 border-blue-500">
                    <strong>Recommended Action:</strong> {insight.action}
                  </div>
                  {insight.supportingData && insight.supportingData.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Supporting data: {insight.supportingData.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teaching Recommendations (Legacy Format) */}
      {data.teachingRecommendations && data.teachingRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Teaching Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.teachingRecommendations.slice(0, 5).map((rec, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{rec.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={rec.priority === 1 ? 'destructive' : rec.priority === 2 ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          Priority {rec.priority}
                        </Badge>
                        {rec.impact && (
                          <Badge variant="outline" className="text-xs">
                            {rec.impact} impact
                          </Badge>
                        )}
                        {rec.confidence && (
                          <Badge variant="outline" className="text-xs">
                            {rec.confidence}% confidence
                          </Badge>
                        )}
                      </div>
                    </div>
                    {rec.affectedStudentsCount && (
                      <div className="text-sm text-gray-500">
                        {rec.affectedStudentsCount} students
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {rec.description}
                  </p>
                  <div className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded border-l-2 border-blue-500">
                    <strong>Action:</strong> {rec.actionableAdvice || rec.action}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Interventions */}
      {data.studentInterventions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Student Interventions Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.studentInterventions.slice(0, 5).map((intervention, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  intervention.interventionLevel === 'urgent' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                  intervention.interventionLevel === 'high' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500' :
                  'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{intervention.studentName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={intervention.interventionLevel === 'urgent' ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          {intervention.interventionLevel}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {intervention.sessionsAnalyzed} sessions analyzed
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${
                        intervention.improvementTrend > 0 ? 'text-green-600' : 
                        intervention.improvementTrend < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {intervention.improvementTrend > 0 ? '+' : ''}{intervention.improvementTrend}%
                      </div>
                      <div className="text-xs text-gray-500">trend</div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <strong className="text-sm">Issues:</strong>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {intervention.reasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong className="text-sm">Recommended Actions:</strong>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {intervention.recommendedActions.slice(0, 2).map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Class Performance Insights */}
      {data.classPerformanceInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Class Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.classPerformanceInsights.map((insight, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{insight.title}</h4>
                    <Badge 
                      variant={insight.trend === 'positive' ? 'default' : insight.trend === 'concerning' ? 'destructive' : 'secondary'}
                    >
                      {insight.trend}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {insight.insight}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Course Insights Tab Component
function CourseInsightsTab({ data, isLoading }: { 
  data: CourseInsightsData | null
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500 dark:text-gray-400">
            No course insights data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Course Completion Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Courses"
          value={data.courseCompletion.totalCourses.toString()}
          icon={BookOpen}
          trend="stable"
          description={`${data.courseCompletion.activeCourses} active`}
        />
        
        <MetricCard
          title="Total Modules"
          value={data.courseCompletion.totalModules.toString()}
          icon={Target}
          trend="stable"
          description={`${data.courseCompletion.totalMaterials} materials`}
        />
        
        <MetricCard
          title="Avg Completion"
          value={`${data.courseCompletion.averageCourseCompletion}%`}
          icon={CheckCircle}
          trend={data.courseCompletion.averageCourseCompletion >= 75 ? 'up' : 'stable'}
          description="Across all courses"
        />
        
        <MetricCard
          title="Sessions/Student"
          value={data.courseCompletion.sessionsPerStudent.toString()}
          icon={Activity}
          trend="up"
          description={`${data.courseCompletion.totalSessions} total sessions`}
        />
      </div>

      {/* Course Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Course Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.courseOverview.map((course, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium">{course.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{course.totalModules} modules</span>
                      <span>{course.totalStudents} students</span>
                      <span>{course.totalSessions} sessions</span>
                      <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                        {course.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-lg">{course.averageScore}%</div>
                    <div className="text-sm text-gray-500">avg score</div>
                    <div className="font-medium">{course.completionRate}%</div>
                    <div className="text-sm text-gray-500">completion</div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course.averageProgress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {course.averageProgress}% average progress
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Module Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            Module Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.moduleInsights.slice(0, 10).map((module, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{module.title}</h4>
                    <Badge 
                      variant={module.difficulty === 'low' ? 'default' : 
                              module.difficulty === 'medium' ? 'secondary' : 'destructive'}
                    >
                      {module.difficulty} difficulty
                    </Badge>
                    <Badge 
                      variant={module.engagement === 'high' ? 'default' : 
                              module.engagement === 'medium' ? 'secondary' : 'outline'}
                    >
                      {module.engagement} engagement
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {module.courseTitle}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>{module.totalStudents} students</span>
                    <span>{module.totalSessions} sessions</span>
                    <span>{module.totalMaterials} materials</span>
                    {module.needRemedial > 0 && (
                      <span className="text-amber-600">
                        {module.needRemedial} need remedial
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-lg">{module.averageScore}%</div>
                  <div className="text-sm text-gray-500">avg score</div>
                  <div className="font-medium">{module.completionRate}%</div>
                  <div className="text-sm text-gray-500">
                    {module.completedStudents}/{module.totalStudents} completed
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Engagement Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              Content Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {data.contentEngagement.slice(0, 10).map((content, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{content.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {content.moduleTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {content.fileType}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {content.studentsAccessed} students
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{content.engagementScore}%</div>
                    <div className="text-xs text-gray-500">engagement</div>
                    <div className="font-medium">{content.effectiveness}%</div>
                    <div className="text-xs text-gray-500">effective</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-orange-500" />
              Material Type Effectiveness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.materialEffectiveness).map(([type, effectiveness], index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium capitalize">{type}</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {effectiveness.count} materials • {effectiveness.totalStudents} students
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{effectiveness.avgEffectiveness}%</div>
                    <div className="text-xs text-gray-500">effectiveness</div>
                    <div className="text-sm text-gray-500">
                      {effectiveness.totalSessions} sessions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description 
}: {
  title: string
  value: string
  icon: any
  trend: 'up' | 'down' | 'stable'
  description?: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
            {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
            <Icon className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}