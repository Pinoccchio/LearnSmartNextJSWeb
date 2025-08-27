"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { INSTRUCTOR_COURSE } from "@/lib/constants"
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  Clock, 
  Download, 
  Filter, 
  Calendar,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Sparkles,
  Eye,
  MessageSquare
} from "lucide-react"

interface AnalyticsData {
  keyMetrics: {
    courseEffectiveness: number
    studentEngagement: number
    contentGenerated: number
    interventionsSent: number
  }
  studyTechniques: Array<{
    technique?: string
    name?: string
    type: string
    usage?: string
    usagePercentage?: number
    adoptionRate?: number
    effectiveness?: string
    effectivenessPercentage?: number
    totalSessions: number
    averagePerformance?: number
    averageScore?: number
    uniqueUsers?: number
  }>
  modulePerformance: Array<{
    id: string
    title: string
    studentsCompleted: number
    totalStudents: number
    averageScore: number
    status: string
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

interface AIInsightsData {
  insights: Array<{
    id: string
    title: string
    description: string
    type: 'success' | 'warning' | 'info' | 'critical'
    action: string
    confidence: number
    priority: number
  }>
  recommendations: Array<{
    id: string
    type: string
    title: string
    description: string
    actionSteps: string[]
    priority: number
  }>
  aiStatus: string
}

// Component for individual insight cards with overflow handling
interface InsightCardProps {
  insight: {
    id: string
    title: string
    description: string
    type: 'success' | 'warning' | 'info' | 'critical'
    action: string
    confidence: number
    priority: number
  }
}

function InsightCard({ insight }: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const shouldTruncate = insight.description.length > 120

  return (
    <div 
      className={`p-4 rounded-lg border transition-all duration-200 h-full flex flex-col min-h-[200px] ${
        insight.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' :
        insight.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700' :
        insight.type === 'critical' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700' :
        'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
      }`}
    >
      <div className="flex items-start flex-1">
        <div className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${
          insight.type === 'success' ? 'bg-green-500 dark:bg-green-400' :
          insight.type === 'warning' ? 'bg-amber-500 dark:bg-amber-400' :
          insight.type === 'critical' ? 'bg-red-500 dark:bg-red-400' :
          'bg-blue-500 dark:bg-blue-400'
        }`}></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className={`font-semibold text-sm leading-tight break-words hyphens-auto flex-1 ${
              insight.type === 'success' ? 'text-green-800 dark:text-green-100' :
              insight.type === 'warning' ? 'text-amber-800 dark:text-amber-100' :
              insight.type === 'critical' ? 'text-red-800 dark:text-red-100' :
              'text-blue-800 dark:text-blue-100'
            }`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
              {insight.title}
            </h4>
            <Badge variant="secondary" className="text-xs flex-shrink-0 ml-2 dark:bg-gray-700 dark:text-gray-200">
              {Math.round(insight.confidence * 100)}%
            </Badge>
          </div>
          <div className={`text-sm flex-1 ${
            insight.type === 'success' ? 'text-green-700 dark:text-green-200' :
            insight.type === 'warning' ? 'text-amber-700 dark:text-amber-200' :
            insight.type === 'critical' ? 'text-red-700 dark:text-red-200' :
            'text-blue-700 dark:text-blue-200'
          }`}>
            <p className="break-words hyphens-auto leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
              {shouldTruncate && !isExpanded 
                ? `${insight.description.substring(0, 120)}...` 
                : insight.description
              }
              {shouldTruncate && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`ml-2 text-xs underline hover:no-underline whitespace-nowrap ${
                    insight.type === 'success' ? 'text-green-600 dark:text-green-400' :
                    insight.type === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                    insight.type === 'critical' ? 'text-red-600 dark:text-red-400' :
                    'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
        <Button 
          variant="outline" 
          size="sm" 
          className={`text-xs w-full min-h-[2rem] px-2 py-1 whitespace-normal text-center leading-tight font-medium ${
            insight.type === 'success' 
              ? 'border-green-400 dark:border-green-500 text-green-800 dark:text-green-100 hover:bg-green-100 dark:hover:bg-green-800/50 bg-green-50/50 dark:bg-green-900/20' :
            insight.type === 'warning' 
              ? 'border-amber-400 dark:border-amber-500 text-amber-800 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-800/50 bg-amber-50/50 dark:bg-amber-900/20' :
            insight.type === 'critical' 
              ? 'border-red-400 dark:border-red-500 text-red-800 dark:text-red-100 hover:bg-red-100 dark:hover:bg-red-800/50 bg-red-50/50 dark:bg-red-900/20' :
            'border-blue-400 dark:border-blue-500 text-blue-800 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-800/50 bg-blue-50/50 dark:bg-blue-900/20'
          }`}
          title={insight.action}
        >
          <span className="break-words hyphens-auto" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {insight.action}
          </span>
        </Button>
      </div>
    </div>
  )
}

// Component for recommendation cards with overflow handling
interface RecommendationCardProps {
  recommendation: {
    id: string
    type: string
    title: string
    description: string
    actionSteps?: string[]
    priority: number
  }
}

function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const shouldTruncate = recommendation.description.length > 90

  return (
    <div 
      className={`p-3 rounded-lg border transition-all duration-200 h-full flex flex-col ${
        recommendation.priority <= 2 ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700' :
        recommendation.priority === 3 ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700' :
        'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
      }`}
    >
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h5 className={`text-xs font-medium leading-tight break-words hyphens-auto flex-1 ${
            recommendation.priority <= 2 ? 'text-red-800 dark:text-red-200' :
            recommendation.priority === 3 ? 'text-amber-800 dark:text-amber-200' :
            'text-blue-800 dark:text-blue-200'
          }`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {recommendation.title}
          </h5>
          <Badge variant="outline" className="text-xs flex-shrink-0 ml-1 dark:border-gray-600 dark:text-gray-300">
            P{recommendation.priority}
          </Badge>
        </div>
        <div className="flex-1">
          <p className={`text-xs break-words hyphens-auto leading-relaxed ${
            recommendation.priority <= 2 ? 'text-red-700 dark:text-red-300' :
            recommendation.priority === 3 ? 'text-amber-700 dark:text-amber-300' :
            'text-blue-700 dark:text-blue-300'
          }`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {shouldTruncate && !isExpanded 
              ? `${recommendation.description.substring(0, 90)}...` 
              : recommendation.description
            }
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`ml-1 underline hover:no-underline whitespace-nowrap text-xs ${
                  recommendation.priority <= 2 ? 'text-red-600 dark:text-red-400' :
                  recommendation.priority === 3 ? 'text-amber-600 dark:text-amber-400' :
                  'text-blue-600 dark:text-blue-400'
                }`}
              >
                {isExpanded ? 'less' : 'more'}
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function InstructorAnalytics() {
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState('month')
  const [showDetailedView, setShowDetailedView] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [aiInsights, setAIInsights] = useState<AIInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    if (!user?.id) {
      console.log('No user authenticated')
      setError('Please log in to view analytics')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const [analyticsResponse, aiResponse, techniquesResponse, engagementResponse] = await Promise.all([
        fetch(`/api/instructor/analytics?timeRange=${timeRange}`, {
          headers: {
            'X-User-ID': user.id,
            'X-User-Role': user.role
          }
        }),
        fetch(`/api/instructor/analytics/ai-insights?timeRange=${timeRange}`, {
          headers: {
            'X-User-ID': user.id,
            'X-User-Role': user.role
          }
        }),
        fetch(`/api/instructor/analytics/study-techniques?timeRange=${timeRange}`, {
          headers: {
            'X-User-ID': user.id,
            'X-User-Role': user.role
          }
        }),
        fetch(`/api/instructor/analytics/student-engagement?timeRange=${timeRange}`, {
          headers: {
            'X-User-ID': user.id,
            'X-User-Role': user.role
          }
        })
      ])

      let baseAnalytics = null
      if (analyticsResponse.ok) {
        const analyticsResult = await analyticsResponse.json()
        baseAnalytics = analyticsResult.data
      }

      // Merge study techniques data if available
      if (techniquesResponse.ok) {
        const techniquesResult = await techniquesResponse.json()
        if (baseAnalytics && techniquesResult.data) {
          baseAnalytics.studyTechniques = techniquesResult.data.techniques || []
          baseAnalytics.techniquesSummary = techniquesResult.data.summary || {}
        }
      }

      // Merge engagement data if available
      if (engagementResponse.ok) {
        const engagementResult = await engagementResponse.json()
        if (baseAnalytics && engagementResult.data) {
          baseAnalytics.studentEngagement = engagementResult.data.engagement || {}
        }
      }

      if (baseAnalytics) {
        setAnalyticsData(baseAnalytics)
      } else {
        throw new Error('Failed to fetch analytics data')
      }

      if (aiResponse.ok) {
        const aiResult = await aiResponse.json()
        setAIInsights(aiResult.data)
      } else {
        console.warn('AI insights failed to load')
        setAIInsights({ insights: [], recommendations: [], aiStatus: 'error' })
      }

    } catch (err) {
      console.error('Error fetching analytics:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data'
      setError(`Analytics Error: ${errorMessage}`)
      
      // Set empty fallback data with proper structure
      setAnalyticsData({
        keyMetrics: { 
          courseEffectiveness: 0, 
          studentEngagement: 0, 
          contentGenerated: 0, 
          interventionsSent: 0 
        },
        studyTechniques: [],
        modulePerformance: [],
        studentEngagement: { peakHours: [], contentTypes: [] },
        weeklyPerformance: { 
          averageQuizScores: 0, 
          moduleCompletion: 0, 
          studySessionDuration: 0, 
          contentEngagement: 0, 
          interventionsSent: 0 
        },
        totalStudents: 0,
        activeStudents: 0
      })
      setAIInsights({ 
        insights: [], 
        recommendations: [], 
        aiStatus: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchAnalyticsData()
    }
  }, [user, timeRange])

  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange)
  }

  const handleRefresh = () => {
    fetchAnalyticsData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading teaching analytics...</p>
        </div>
      </div>
    )
  }

  if (error && !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teaching Analytics</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              AI-powered insights for {analyticsData?.totalStudents || 0} students
              {error && <span className="text-amber-600"> (Limited data available)</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDetailedView(!showDetailedView)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {timeRange === 'week' ? 'Last Week' : 
                 timeRange === 'month' ? 'Last Month' : 
                 timeRange === 'quarter' ? 'Last Quarter' : 'Last Month'}
              </Button>
              {showDetailedView && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-10 min-w-[120px]">
                  {['week', 'month', 'quarter'].map(range => (
                    <button
                      key={range}
                      onClick={() => {
                        handleTimeRangeChange(range)
                        setShowDetailedView(false)
                      }}
                      className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm capitalize"
                    >
                      Last {range}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <Download className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button 
              size="sm" 
              className={`${aiInsights?.aiStatus === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'} text-white`}
              onClick={() => window.scrollTo({ top: document.getElementById('ai-insights')?.offsetTop, behavior: 'smooth' })}
            >
              <Brain className="h-4 w-4 mr-2" />
              {aiInsights?.aiStatus === 'success' ? 'AI Insights' : 'AI Limited'}
            </Button>
          </div>
        </div>
      </div>

      {/* Key Teaching Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Course Effectiveness</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.keyMetrics.courseEffectiveness || 0}%</div>
            <p className="text-xs text-green-600 mt-1">
              {analyticsData?.keyMetrics.courseEffectiveness > 70 ? 'Above target' : 
               analyticsData?.keyMetrics.courseEffectiveness > 60 ? 'On track' : 'Needs improvement'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Student Engagement</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.keyMetrics.studentEngagement || 0}</div>
            <p className="text-xs text-emerald-600 mt-1">
              of {analyticsData?.totalStudents || 0} students active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Study Sessions</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.keyMetrics.contentGenerated || 0}</div>
            <p className="text-xs text-blue-600 mt-1">Total sessions completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">AI Recommendations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiInsights?.recommendations?.length || 0}</div>
            <p className="text-xs text-amber-600 mt-1">
              {aiInsights?.aiStatus === 'success' 
                ? 'AI-generated insights' 
                : aiInsights?.aiStatus === 'insufficient_data' 
                  ? 'Insufficient data for AI analysis'
                  : aiInsights?.aiStatus === 'limited_data'
                    ? 'Limited insights due to sparse data'
                    : 'Basic analytics available'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Study Techniques Performance & Module Performance */}
      <div className="space-y-6 mb-8">
        {/* Study Techniques Performance - Full Width */}
        {analyticsData?.studyTechniques && analyticsData.studyTechniques.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Study Techniques Performance</CardTitle>
              <CardDescription className="dark:text-gray-300">How different study methods perform in your courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {analyticsData.studyTechniques.map((technique, index) => {
                  const techniqueName = technique.technique || technique.name || 'Unknown Technique'
                  const effectivenessValue = technique.effectivenessPercentage || technique.averageScore || 0
                  const adoptionValue = technique.adoptionRate || technique.usagePercentage || 0
                  const performanceValue = technique.averagePerformance || technique.averageScore || effectivenessValue
                  
                  return (
                    <div key={index} className="space-y-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{techniqueName}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {technique.totalSessions} sessions • {technique.uniqueUsers || 0} students
                          </p>
                        </div>
                        <Badge 
                          variant="default" 
                          className={`ml-2 flex-shrink-0 ${
                            performanceValue >= 80 ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300' :
                            performanceValue >= 60 ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                            'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {effectivenessValue}% effective
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Effectiveness Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Effectiveness</span>
                            <span className="font-medium text-gray-900 dark:text-white">{effectivenessValue}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(effectivenessValue, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Usage Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Adoption Rate</span>
                            <span className="font-medium text-gray-900 dark:text-white">{adoptionValue}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(adoptionValue, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        {performanceValue >= 70 && (
                          <Button size="sm" variant="outline" className="flex-1">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Recommend
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Module Performance Analysis - Full Width */}
        {analyticsData?.modulePerformance && analyticsData.modulePerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Module Performance Analysis</CardTitle>
              <CardDescription className="dark:text-gray-300">Student performance breakdown by course modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analyticsData.modulePerformance.map((module) => (
                  <div key={module.id} className="space-y-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{module.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline"
                            className={`${
                              module.status === 'excellent' ? 'border-green-500 text-green-700 dark:text-green-400' :
                              module.status === 'good' ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400' :
                              module.status === 'needs_improvement' ? 'border-amber-500 text-amber-700 dark:text-amber-400' :
                              'border-red-500 text-red-700 dark:text-red-400'
                            }`}
                          >
                            {module.status === 'excellent' ? 'Excellent' :
                             module.status === 'good' ? 'Good' :
                             module.status === 'needs_improvement' ? 'Needs Improvement' : 'Critical'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{module.averageScore}%</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Avg Score</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                        <span className="font-medium ml-1 text-gray-900 dark:text-white">
                          {module.studentsCompleted}/{module.totalStudents}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Completion Rate:</span>
                        <span className="font-medium ml-1 text-gray-900 dark:text-white">
                          {Math.round((module.studentsCompleted / Math.max(module.totalStudents, 1)) * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          module.averageScore >= 80 ? 'bg-green-500' :
                          module.averageScore >= 70 ? 'bg-emerald-500' :
                          module.averageScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(module.studentsCompleted / Math.max(module.totalStudents, 1)) * 100}%` }}
                      ></div>
                    </div>

                    {module.averageScore < 70 && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            Below target performance. Consider additional resources or review sessions.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Teaching Insights & Student Engagement Patterns */}
      <div className="space-y-6 mb-8" id="ai-insights">
        {/* Determine if we have engagement data to show */}
        {(() => {
          const hasEngagementData = (analyticsData?.studentEngagement?.peakHours && analyticsData.studentEngagement.peakHours.length > 0) ||
            (analyticsData?.studentEngagement?.contentTypes && analyticsData.studentEngagement.contentTypes.length > 0);
          
          return (
            <div className={hasEngagementData ? "grid grid-cols-1 xl:grid-cols-2 gap-6" : ""}>
              {/* AI Teaching Insights */}
              <Card className={hasEngagementData ? "" : "mx-auto max-w-6xl"}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Sparkles className={`h-5 w-5 ${
                      aiInsights?.aiStatus === 'success' ? 'text-blue-500' : 'text-amber-500'
                    }`} />
                    AI Teaching Insights
                  </CardTitle>
                  <CardDescription className="dark:text-gray-300">
                    {aiInsights?.aiStatus === 'success' 
                      ? 'AI-powered recommendations to improve teaching effectiveness'
                      : 'Limited AI insights available - using basic analytics'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                  <div className={`gap-4 ${hasEngagementData ? "grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-2" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"} ${aiInsights?.insights && aiInsights.insights.length === 0 ? "flex" : ""}`}>
                    {aiInsights?.insights && aiInsights.insights.length > 0 ? (
                      aiInsights.insights.slice(0, hasEngagementData ? 4 : 6).map((insight, index) => (
                        <InsightCard key={insight.id} insight={insight} />
                      ))
                    ) : (
                      <div className={`text-center py-8 flex flex-col items-center justify-center ${hasEngagementData ? "" : "md:col-span-2 xl:col-span-3"} w-full`}>
                        <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-400">No AI insights available yet.</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          {aiInsights?.aiStatus === 'error' 
                            ? 'AI service temporarily unavailable.'
                            : 'More data needed for AI analysis.'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Student Engagement Patterns - Only show if has data */}
              {hasEngagementData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Student Engagement Patterns</CardTitle>
                    <CardDescription className="dark:text-gray-300">When and how students interact with your course content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Peak Activity Times */}
                      {analyticsData?.studentEngagement?.peakHours && analyticsData.studentEngagement.peakHours.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Peak Study Hours</h4>
                          <div className="space-y-3">
                            {analyticsData.studentEngagement.peakHours.slice(0, 4).map((period, index) => (
                              <div key={index} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">{period.time}</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {period.activity} sessions ({period.percentage}%)
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                  <div 
                                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(period.percentage, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Content Engagement */}
                      {analyticsData?.studentEngagement?.contentTypes && analyticsData.studentEngagement.contentTypes.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Study Technique Performance</h4>
                          <div className="space-y-3">
                            {analyticsData.studentEngagement.contentTypes.map((content, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center">
                                  <div 
                                    className="w-3 h-3 rounded-full mr-3" 
                                    style={{ backgroundColor: content.color }}
                                  ></div>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">{content.type}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {content.engagement} sessions
                                  </span>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {content.percentage}% of total
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )
        })()}
      </div>

      {/* Weekly Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Teaching Performance Summary</CardTitle>
          <CardDescription className="dark:text-gray-300">
            Overview of your course impact and student outcomes for the selected time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Student Success Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center min-w-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate">Average Scores</span>
                  <span className={`font-medium flex-shrink-0 ml-2 ${
                    (analyticsData?.weeklyPerformance?.averageQuizScores || 0) >= 80 ? 'text-green-600 dark:text-green-400' :
                    (analyticsData?.weeklyPerformance?.averageQuizScores || 0) >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
                    'text-amber-600 dark:text-amber-400'
                  }`}>
                    {analyticsData?.weeklyPerformance?.averageQuizScores || 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center min-w-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate">Module Completion</span>
                  <span className={`font-medium flex-shrink-0 ml-2 ${
                    (analyticsData?.weeklyPerformance?.moduleCompletion || 0) >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                    (analyticsData?.weeklyPerformance?.moduleCompletion || 0) >= 70 ? 'text-blue-600 dark:text-blue-400' :
                    'text-amber-600 dark:text-amber-400'
                  }`}>
                    {analyticsData?.weeklyPerformance?.moduleCompletion || 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center min-w-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate">Study Session Duration</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2">
                    {analyticsData?.weeklyPerformance?.studySessionDuration || 0} min avg
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Teaching Effectiveness</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center min-w-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate">Student Engagement</span>
                  <span className={`font-medium flex-shrink-0 ml-2 ${
                    (analyticsData?.weeklyPerformance?.contentEngagement || 0) >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                    (analyticsData?.weeklyPerformance?.contentEngagement || 0) >= 60 ? 'text-blue-600 dark:text-blue-400' :
                    'text-amber-600 dark:text-amber-400'
                  }`}>
                    {analyticsData?.weeklyPerformance?.contentEngagement || 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center min-w-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate">Active Students</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2">
                    {analyticsData?.activeStudents || 0} of {analyticsData?.totalStudents || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center min-w-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate">Study Sessions</span>
                  <span className="font-medium text-purple-600 dark:text-purple-400 flex-shrink-0 ml-2">
                    {analyticsData?.keyMetrics?.contentGenerated || 0} completed
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-white">AI Recommendations</h4>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {aiInsights?.recommendations && aiInsights.recommendations.length > 0 ? (
                  aiInsights.recommendations.slice(0, 3).map((rec, index) => (
                    <RecommendationCard key={rec.id} recommendation={rec} />
                  ))
                ) : (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 break-words hyphens-auto leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      {aiInsights?.aiStatus === 'error' 
                        ? 'AI recommendations temporarily unavailable'
                        : aiInsights?.aiStatus === 'insufficient_data'
                          ? 'Insufficient data for AI recommendations'
                          : 'No specific recommendations at this time - continue current approach'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}