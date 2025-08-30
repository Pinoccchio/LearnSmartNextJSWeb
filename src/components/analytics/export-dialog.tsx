'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Download,
  FileText,
  Users,
  BookOpen,
  BarChart3,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { useAuth } from '@/contexts/auth-context'

interface ExportDialogProps {
  activeTimeRange: string
  trigger?: React.ReactNode
}

export function ExportDialog({ activeTimeRange, trigger }: ExportDialogProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<{
    success: boolean
    data?: any
    error?: string
  } | null>(null)
  const [exportConfig, setExportConfig] = useState({
    exportType: 'overview',
    includeCharts: true,
    includeDetails: false,
    timeRange: activeTimeRange
  })

  const exportOptions = [
    {
      id: 'overview',
      title: 'Overview Report',
      description: 'High-level summary of course performance and student engagement',
      icon: BarChart3,
      color: 'text-blue-500'
    },
    {
      id: 'student-progress',
      title: 'Student Progress Report',
      description: 'Detailed progress tracking for all enrolled students',
      icon: Users,
      color: 'text-green-500'
    },
    {
      id: 'course-details',
      title: 'Course Analysis',
      description: 'In-depth analysis of course modules and materials effectiveness',
      icon: BookOpen,
      color: 'text-purple-500'
    },
    {
      id: 'comprehensive',
      title: 'Comprehensive Report',
      description: 'Complete analytics export including all data and insights',
      icon: FileText,
      color: 'text-orange-500'
    }
  ]

  const handleExport = async () => {
    if (!user?.id) {
      setExportResult({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    setIsExporting(true)
    setExportResult(null)

    try {
      const response = await fetch('/api/instructor/analytics/export-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id
        },
        body: JSON.stringify(exportConfig)
      })

      if (!response.ok) {
        throw new Error('Failed to generate export')
      }

      const result = await response.json()
      
      if (result.success) {
        setExportResult({
          success: true,
          data: result.data
        })
        
        // Create and download JSON file
        const jsonStr = JSON.stringify(result.data.exportData, null, 2)
        const blob = new Blob([jsonStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = `learnsmart-analytics-${exportConfig.exportType}-${exportConfig.timeRange}-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        setExportResult({
          success: false,
          error: result.error || 'Export generation failed'
        })
      }
    } catch (error) {
      setExportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadAsText = () => {
    if (!exportResult?.data) return

    const data = exportResult.data.exportData
    let textContent = ''
    
    // Generate text report
    textContent += `LearnSmart Teaching Analytics Report\n`
    textContent += `Generated: ${new Date(data.generatedAt).toLocaleString()}\n`
    textContent += `Instructor: ${data.instructor}\n`
    textContent += `Time Range: ${data.timeRange}\n`
    textContent += `Export Type: ${data.exportType}\n`
    textContent += `\n===========================================\n\n`
    
    if (data.summary) {
      textContent += `SUMMARY\n`
      textContent += `-------\n`
      textContent += `Total Courses: ${data.summary.totalCourses}\n`
      textContent += `Active Courses: ${data.summary.activeCourses}\n`
      textContent += `Total Modules: ${data.summary.totalModules}\n`
      textContent += `Total Students: ${data.summary.totalStudents}\n`
      textContent += `Total Sessions: ${data.summary.totalSessions}\n`
      textContent += `Average Score: ${data.summary.averageScoreAcrossCourses}%\n`
      textContent += `Average Completion Rate: ${data.summary.averageCompletionRate}%\n`
      textContent += `\n`
    }
    
    if (data.courses) {
      textContent += `COURSE DETAILS\n`
      textContent += `--------------\n`
      data.courses.forEach((course: any) => {
        textContent += `\nCourse: ${course.title}\n`
        textContent += `  Status: ${course.status}\n`
        textContent += `  Modules: ${course.totalModules}\n`
        textContent += `  Students: ${course.totalStudents}\n`
        textContent += `  Sessions: ${course.totalSessions}\n`
        textContent += `  Average Score: ${course.averageScore}%\n`
        textContent += `  Completion Rate: ${course.completionRate}%\n`
      })
    }

    // Create and download text file
    const blob = new Blob([textContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `learnsmart-analytics-${exportConfig.exportType}-${exportConfig.timeRange}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Analytics Report
          </DialogTitle>
          <DialogDescription>
            Generate and download comprehensive analytics reports for your courses and students.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Export Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Report Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exportOptions.map((option) => {
                const Icon = option.icon
                return (
                  <div
                    key={option.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      exportConfig.exportType === option.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setExportConfig(prev => ({ ...prev, exportType: option.id }))}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 ${option.color} mt-0.5`} />
                      <div className="flex-1">
                        <h4 className="font-medium">{option.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {option.description}
                        </p>
                      </div>
                      {exportConfig.exportType === option.id && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Time Range */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Time Range</Label>
            <div className="flex gap-2">
              {['week', 'month', 'quarter'].map((range) => (
                <Button
                  key={range}
                  variant={exportConfig.timeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExportConfig(prev => ({ ...prev, timeRange: range }))}
                  className="capitalize"
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Options</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="include-charts">Include Chart Data</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Include data points for recreating charts and visualizations
                  </p>
                </div>
                <Switch
                  id="include-charts"
                  checked={exportConfig.includeCharts}
                  onCheckedChange={(checked) => 
                    setExportConfig(prev => ({ ...prev, includeCharts: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="include-details">Include Detailed Data</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Include granular module and student-level details (larger file size)
                  </p>
                </div>
                <Switch
                  id="include-details"
                  checked={exportConfig.includeDetails}
                  onCheckedChange={(checked) => 
                    setExportConfig(prev => ({ ...prev, includeDetails: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Export Result */}
          {exportResult && (
            <div className="space-y-3">
              {exportResult.success ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-400 mb-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Export Generated Successfully</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                    Your analytics report has been generated and downloaded as a JSON file.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadAsText}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Download as Text
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Export Failed</span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {exportResult.error}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Export Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Export Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Report Type:</span>
                <div className="font-medium capitalize">
                  {exportConfig.exportType.replace('-', ' ')}
                </div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Time Range:</span>
                <div className="font-medium capitalize">{exportConfig.timeRange}</div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Include Charts:</span>
                <div className="font-medium">{exportConfig.includeCharts ? 'Yes' : 'No'}</div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Include Details:</span>
                <div className="font-medium">{exportConfig.includeDetails ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Generate Export
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}