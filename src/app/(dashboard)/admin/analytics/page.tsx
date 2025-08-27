"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { STUDY_TECHNIQUES, AT_RISK_STUDENTS } from "@/lib/constants"
import { TrendingUp, Users, BookOpen, Target, Download, Filter, Brain, AlertTriangle, Clock, BookOpenCheck } from "lucide-react"

export default function AdminAnalytics() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">AI-powered insights for RKM Criminology Solutions learning platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key AI Insights Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">AI Quiz Generation</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Gemini AI quizzes generated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">At-Risk Students</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10</div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Students needing intervention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68.9%</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">+3.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Study Sessions</CardTitle>
            <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4,523</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Total completed this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Study Technique Effectiveness & Course Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Study Technique Effectiveness</CardTitle>
            <CardDescription className="dark:text-gray-300">AI insights on learning method performance across criminology courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {STUDY_TECHNIQUES.map((technique, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{technique.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{technique.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {technique.effectiveness}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Effectiveness Bar */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Effectiveness</span>
                      <span className="font-medium text-gray-900 dark:text-white">{technique.effectiveness}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: technique.effectiveness }}
                      ></div>
                    </div>
                    
                    {/* Usage Bar */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Usage</span>
                      <span className="font-medium text-gray-900 dark:text-white">{technique.usage}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: technique.usage }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Course Performance Analysis</CardTitle>
            <CardDescription className="dark:text-gray-300">Subject-wise completion rates and student engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { course: "Criminal Jurisprudence", completion: 68, students: 73, avgScore: "72%", trend: "up" },
                { course: "Law Enforcement Admin", completion: 72, students: 65, avgScore: "75%", trend: "up" },
                { course: "Crime Detection", completion: 45, students: 58, avgScore: "58%", trend: "down" },
                { course: "Correctional Admin", completion: 62, students: 52, avgScore: "65%", trend: "up" },
                { course: "Criminology", completion: 78, students: 71, avgScore: "80%", trend: "up" }
              ].map((course, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3 bg-white dark:bg-gray-800">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900 dark:text-white">{course.course}</h4>
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`h-4 w-4 ${course.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{course.avgScore}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                    <span>{course.students} students enrolled</span>
                    <span>{course.completion}% completion</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        course.completion > 70 ? 'bg-green-500' : 
                        course.completion > 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${course.completion}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI-Powered Smart Recommendations & At-Risk Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Brain className="h-5 w-5 text-blue-500" />
              Smart Recommendations
            </CardTitle>
            <CardDescription className="dark:text-gray-300">Gemini AI-powered insights for criminology education improvement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Optimize Study Technique Recommendations</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Students using Feynman Technique show 90% effectiveness. Recommend this technique 
                      for students struggling with Criminal Procedure concepts.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-amber-900 dark:text-amber-100">Crime Detection Course Needs Attention</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      45% completion rate indicates difficulty. Generate remedial quizzes focusing 
                      on Investigation Process and Evidence Collection topics.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">Adaptive Learning Success</h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Students with personalized learning paths show 23% higher retention rates. 
                      Expand AI-driven path customization to more modules.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              At-Risk Students
            </CardTitle>
            <CardDescription className="dark:text-gray-300">Students requiring immediate intervention and support</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {AT_RISK_STUDENTS.map((student, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{student.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                    </div>
                    <Badge 
                      variant="outline"
                      className={`${
                        student.riskLevel === 'High' ? 'border-red-500 text-red-700 bg-red-50' :
                        'border-amber-500 text-amber-700 bg-amber-50'
                      }`}
                    >
                      {student.riskLevel} Risk
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Avg Score:</span>
                      <span className="font-medium ml-1 text-gray-900 dark:text-white">{student.avgScore}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">{student.lastActive}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Weak Areas:</p>
                    <div className="flex flex-wrap gap-1">
                      {student.weakAreas.map((area, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      Send Intervention
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All At-Risk Students
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}