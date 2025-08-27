"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { INSTRUCTOR_RECENT_ACTIVITIES, INSTRUCTOR_COURSE, TEACHING_INSIGHTS } from "@/lib/constants"

// TODO: Replace INSTRUCTOR_STATS usage with real API data from /api/instructor/students
// Temporary placeholders until main instructor page gets its own real data API
const TEMP_STATS = {
  totalStudents: 0,
  activeStudents: 0,
  averageScore: 0,
  atRiskStudents: 0,
  studySessionsToday: 0
}
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle, 
  Brain,
  CheckCircle,
  Clock,
  Target,
  Send,
  Eye,
  Sparkles,
  Calendar
} from "lucide-react"

export default function InstructorDashboard() {
  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, Prof. Juan!</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Your Criminal Jurisprudence course is performing well with 73 active students</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Brain className="h-4 w-4 mr-2" />
              Generate Content
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">My Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{TEMP_STATS.totalStudents}</div>
            <p className="text-xs text-emerald-600 mt-1">{TEMP_STATS.activeStudents} active today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{TEMP_STATS.averageScore}%</div>
            <p className="text-xs text-green-600 mt-1">+2.3% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">At-Risk Students</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{TEMP_STATS.atRiskStudents}</div>
            <p className="text-xs text-amber-600 mt-1">Need intervention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Study Sessions Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{TEMP_STATS.studySessionsToday}</div>
            <p className="text-xs text-green-600 mt-1">Peak: 7-9 PM</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Overview & Teaching Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              {INSTRUCTOR_COURSE.title}
            </CardTitle>
            <CardDescription>Course performance and module progress overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Course Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="text-2xl font-bold text-emerald-700">{INSTRUCTOR_COURSE.completionRate}%</div>
                  <p className="text-sm text-emerald-600">Completion Rate</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">{INSTRUCTOR_COURSE.averageScore}%</div>
                  <p className="text-sm text-blue-600">Average Score</p>
                </div>
              </div>

              {/* Module Progress */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Module Progress</h4>
                {INSTRUCTOR_COURSE.modules.map((module) => (
                  <div key={module.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{module.title}</p>
                        <Badge 
                          variant="outline"
                          className={module.status === 'published' ? 'border-green-500 text-green-700' : 'border-amber-500 text-amber-700'}
                        >
                          {module.status}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="text-xs dark:text-black dark:bg-gray-300">
                        {module.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-full bg-gray-200 rounded-full h-2 flex-1">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(module.studentsCompleted / INSTRUCTOR_COURSE.totalStudents) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[4rem]">
                        {module.studentsCompleted}/{INSTRUCTOR_COURSE.totalStudents}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Sparkles className="h-5 w-5 text-blue-500" />
              AI Teaching Insights
            </CardTitle>
            <CardDescription className="dark:text-gray-300">Personalized recommendations for improving student outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {TEACHING_INSIGHTS.map((insight, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    insight.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                    insight.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
                    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`font-medium ${
                        insight.type === 'success' ? 'text-green-900 dark:text-green-100' :
                        insight.type === 'warning' ? 'text-amber-900 dark:text-amber-100' :
                        'text-blue-900 dark:text-blue-100'
                      }`}>
                        {insight.title}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        insight.type === 'success' ? 'text-green-700 dark:text-green-300' :
                        insight.type === 'warning' ? 'text-amber-700 dark:text-amber-300' :
                        'text-blue-700 dark:text-blue-300'
                      }`}>
                        {insight.description}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={`mt-3 text-xs text-gray-900 dark:text-white ${
                      insight.type === 'success' ? 'border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-800' :
                      insight.type === 'warning' ? 'border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-800' :
                      'border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800'
                    }`}
                  >
                    {insight.action}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-gray-900 dark:text-white">Recent Student Activities</CardTitle>
                <CardDescription>Latest progress and achievements from your students</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {INSTRUCTOR_RECENT_ACTIVITIES.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'completion' ? 'bg-green-500' :
                    activity.type === 'achievement' ? 'bg-blue-500' :
                    activity.type === 'alert' ? 'bg-red-500' :
                    activity.type === 'support' ? 'bg-amber-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.student}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.action}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 dark:text-gray-500">{activity.time}</p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs mt-1 ${
                        activity.type === 'completion' ? 'border-green-500 text-green-700' :
                        activity.type === 'achievement' ? 'border-blue-500 text-blue-700' :
                        activity.type === 'alert' ? 'border-red-500 text-red-700' :
                        activity.type === 'support' ? 'border-amber-500 text-amber-700' :
                        'border-gray-500 text-gray-700'
                      }`}
                    >
                      {activity.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
            <CardDescription>Common tasks for managing your criminology course</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-16 flex-col">
                <Brain className="h-5 w-5 mb-1" />
                <span className="text-xs">Generate Quiz</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col">
                <Send className="h-5 w-5 mb-1" />
                <span className="text-xs">Send Intervention</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col">
                <Users className="h-5 w-5 mb-1" />
                <span className="text-xs">View Students</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col">
                <TrendingUp className="h-5 w-5 mb-1" />
                <span className="text-xs">View Analytics</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col">
                <BookOpen className="h-5 w-5 mb-1" />
                <span className="text-xs">Add Content</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col">
                <CheckCircle className="h-5 w-5 mb-1" />
                <span className="text-xs">Grade Assignments</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}