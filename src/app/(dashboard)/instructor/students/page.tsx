"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/contexts/auth-context'
import { 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Users, 
  Filter, 
  Download,
  Send,
  Eye,
  BookOpen,
  Target,
  Brain,
  MessageSquare,
  Star,
  CheckCircle
} from "lucide-react"

interface Student {
  id: string
  name: string
  email: string
  courseId: string
  courseTitle: string
  progress: number
  avgScore: number
  riskLevel: 'High' | 'Medium' | 'Low'
  lastActive: string
  enrollmentStatus: string
  enrolledAt: string
  strongAreas: string[]
  weakAreas: string[]
  studySessions: number
  streak: number
}

interface InstructorStats {
  totalStudents: number
  activeStudents: number
  averageScore: number
  completionRate: number
  atRiskStudents: number
  studySessionsToday: number
}

export default function InstructorStudents() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<InstructorStats>({
    totalStudents: 0,
    activeStudents: 0,
    averageScore: 0,
    completionRate: 0,
    atRiskStudents: 0,
    studySessionsToday: 0
  })

  // Helper functions for risk level styling (dark mode compatible)
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High':
        return 'border-red-400 dark:border-red-600 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20'
      case 'Medium':
        return 'border-amber-400 dark:border-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20'
      case 'Low':
        return 'border-green-400 dark:border-green-600 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20'
      default:
        return 'border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/20'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'High':
        return <AlertTriangle className="h-3 w-3" />
      case 'Medium':
        return <Clock className="h-3 w-3" />
      case 'Low':
        return <TrendingUp className="h-3 w-3" />
      default:
        return <Users className="h-3 w-3" />
    }
  }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRisk, setFilterRisk] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [showInterventionModal, setShowInterventionModal] = useState(false)

  // Fetch enrolled students data
  useEffect(() => {
    fetchStudents()
  }, [user])

  const fetchStudents = async () => {
    if (!user?.id) {
      console.log('❌ No user ID available for students fetch')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('👥 Fetching instructor students...')
      
      // Use the same authentication pattern as courses
      const response = await fetch('/api/instructor/students', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
          'X-User-Role': user.role
        },
        credentials: 'include'
      })
      
      if (!response.ok) {
        console.error('❌ API response not OK:', response.status, response.statusText)
        const errorData = await response.json()
        console.error('💥 Server error details:', errorData)
        throw new Error(errorData.error || 'Failed to fetch students')
      }
      
      const { data } = await response.json()
      console.log('✅ Students fetched successfully:', data.stats)
      setStudents(data.students)
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching students:', error)
      setError(error instanceof Error ? error.message : 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRisk = filterRisk === 'all' || student.riskLevel === filterRisk
    return matchesSearch && matchesRisk
  })

  const riskStats = {
    high: students.filter(s => s.riskLevel === 'High').length,
    medium: students.filter(s => s.riskLevel === 'Medium').length,
    low: students.filter(s => s.riskLevel === 'Low').length
  }


  const handleViewStudent = (student: any) => {
    setSelectedStudent(student)
    setShowStudentModal(true)
  }

  const handleSendIntervention = (student: any) => {
    setSelectedStudent(student)
    setShowInterventionModal(true)
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Students</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Monitor student progress in Criminal Jurisprudence and provide targeted intervention</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white">
              <Brain className="h-4 w-4 mr-2" />
              AI Recommendations
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Active enrollments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At-Risk Students</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.atRiskStudents}</div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">Need intervention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Class average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Sessions</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studySessionsToday}</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Total completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Search and Filter */}
        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="High">High Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="Low">Low Risk</option>
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Cards */}
        {filteredStudents.map((student) => (
          <Card key={student.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-emerald-500 dark:bg-emerald-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{student.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className={getRiskColor(student.riskLevel)}>
                  {getRiskIcon(student.riskLevel)}
                  <span className="ml-1">{student.riskLevel}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Course Progress</span>
                    <span className="font-medium text-gray-900 dark:text-white">{student.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        student.progress >= 80 ? 'bg-green-500 dark:bg-green-400' :
                        student.progress >= 60 ? 'bg-amber-500 dark:bg-amber-400' : 'bg-red-500 dark:bg-red-400'
                      }`}
                      style={{ width: `${student.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Average Score</p>
                    <p className="font-medium text-lg text-gray-900 dark:text-white">{student.avgScore}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Study Sessions</p>
                    <p className="font-medium text-lg text-gray-900 dark:text-white">{student.studySessions}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Streak</p>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-amber-500 dark:text-amber-400 mr-1" />
                      <p className="font-medium text-gray-900 dark:text-white">{student.streak} days</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Last Active</p>
                    <p className="font-medium text-gray-900 dark:text-white">{student.lastActive}</p>
                  </div>
                </div>

                {/* Strong & Weak Areas */}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Strong Areas</p>
                  <div className="flex flex-wrap gap-1">
                    {student.strongAreas.slice(0, 2).map((area, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                {student.weakAreas.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Needs Support</p>
                    <div className="flex flex-wrap gap-1">
                      {student.weakAreas.slice(0, 2).map((area, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => handleViewStudent(student)} className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleSendIntervention(student)}
                    className={student.riskLevel === 'High' ? 'border-red-300 text-red-700 hover:bg-red-50' : ''}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* At-Risk Students Alert */}
      {riskStats.high > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <CardTitle className="text-red-800 dark:text-red-200">High Risk Students Alert</CardTitle>
            </div>
            <CardDescription className="text-red-700 dark:text-red-300">
              {riskStats.high} student{riskStats.high !== 1 ? 's' : ''} require immediate intervention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {students.filter(s => s.riskLevel === 'High').map(student => (
                <div key={student.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-700">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-medium mr-3">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {student.avgScore}% average • {student.studySessions} sessions • Weak in: {student.weakAreas.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleSendIntervention(student)}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Intervention
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleViewStudent(student)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Detail Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-lg font-medium mr-4">
                    {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{selectedStudent.name}</CardTitle>
                    <CardDescription>{selectedStudent.email}</CardDescription>
                    <Badge variant="outline" className={`mt-2 ${getRiskColor(selectedStudent.riskLevel)}`}>
                      {getRiskIcon(selectedStudent.riskLevel)}
                      <span className="ml-1">{selectedStudent.riskLevel} Risk</span>
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setShowStudentModal(false)}>×</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance Overview */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Performance Overview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Progress</p>
                      <p className="text-2xl font-bold">{selectedStudent.progress}%</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Average Score</p>
                      <p className="text-2xl font-bold">{selectedStudent.avgScore}%</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Study Sessions</p>
                      <p className="text-2xl font-bold">{selectedStudent.studySessions}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Current Streak</p>
                      <p className="text-2xl font-bold">{selectedStudent.streak} days</p>
                    </div>
                  </div>
                </div>

                {/* Learning Analysis */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Learning Analysis</h3>
                  
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">Strong Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedStudent.strongAreas.map((area, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {selectedStudent.weakAreas.length > 0 && (
                    <div>
                      <h4 className="font-medium text-amber-700 mb-2">Areas Needing Support</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudent.weakAreas.map((area, idx) => (
                          <Badge key={idx} variant="outline" className="border-amber-300 text-amber-700">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-900 dark:text-white mb-2">AI Recommendation</h4>
                    <p className="text-sm text-blue-700 dark:text-white">
                      {selectedStudent.riskLevel === 'High' 
                        ? "Schedule one-on-one consultation. Recommend Feynman Technique for weak areas and provide additional Constitutional Law resources."
                        : selectedStudent.riskLevel === 'Medium'
                        ? "Monitor progress closely. Suggest Active Recall sessions for challenging topics and encourage peer study groups."
                        : "Student is performing well. Consider advanced materials and leadership opportunities in study groups."
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowStudentModal(false)}>Close</Button>
                <Button onClick={() => { setShowStudentModal(false); handleSendIntervention(selectedStudent); }}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Intervention
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Intervention Modal */}
      {showInterventionModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Send Intervention to {selectedStudent.name}</CardTitle>
              <CardDescription>Provide personalized support and guidance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Intervention Type</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>Academic Support</option>
                    <option>Motivational Message</option>
                    <option>Schedule Meeting</option>
                    <option>Provide Resources</option>
                    <option>Study Technique Recommendation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <Input placeholder="Enter subject line" defaultValue={`Support for ${selectedStudent.weakAreas[0] || 'Criminal Jurisprudence'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea 
                    className="w-full p-3 border rounded-md h-32"
                    placeholder="Dear student..."
                    defaultValue={`Hi ${selectedStudent.name.split(' ')[0]},

I've noticed you're experiencing some challenges with ${selectedStudent.weakAreas.join(' and ')}. I'd like to schedule a brief meeting to discuss strategies that can help improve your understanding of these topics.

Based on your learning patterns, I recommend trying the Feynman Technique for these concepts. I've also prepared some additional resources that might be helpful.

Please let me know your availability for a 30-minute consultation this week.

Best regards,
Prof. Juan Dela Cruz`}
                  ></textarea>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="aiEnhance" defaultChecked />
                  <label htmlFor="aiEnhance" className="text-sm">Enhance message with AI recommendations</label>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowInterventionModal(false)}>Cancel</Button>
                <Button onClick={() => setShowInterventionModal(false)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Send className="h-4 w-4 mr-2" />
                  Send Intervention
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}