'use client'

import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Engagement Trends Chart
export function EngagementTrendsChart({ data }: { 
  data: Array<{
    date: string
    sessions: number
    activeStudents: number
    completedSessions: number
  }> 
}) {
  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Total Sessions',
        data: data.map(d => d.sessions),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Completed Sessions',
        data: data.map(d => d.completedSessions),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Active Students',
        data: data.map(d => d.activeStudents),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Student Engagement Trends'
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }

  return (
    <div className="h-80">
      <Line data={chartData} options={options} />
    </div>
  )
}

// Study Techniques Distribution Chart
export function StudyTechniquesChart({ data }: { 
  data: Array<{
    type: string
    engagement: number
    percentage: number
    color: string
  }> 
}) {
  const chartData = {
    labels: data.map(d => d.type),
    datasets: [
      {
        data: data.map(d => d.engagement),
        backgroundColor: data.map(d => d.color),
        borderColor: data.map(d => d.color),
        borderWidth: 2,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Study Techniques Usage Distribution'
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || ''
            const value = context.parsed
            const total = data.reduce((sum, item) => sum + item.engagement, 0)
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
            return `${label}: ${value} sessions (${percentage}%)`
          }
        }
      }
    },
  }

  return (
    <div className="h-80">
      <Doughnut data={chartData} options={options} />
    </div>
  )
}

// Module Performance Bar Chart
export function ModulePerformanceChart({ data }: { 
  data: Array<{
    title: string
    averageScore: number
    studentsCompleted: number
    totalStudents: number
  }> 
}) {
  const chartData = {
    labels: data.map(d => d.title.length > 20 ? d.title.substring(0, 20) + '...' : d.title),
    datasets: [
      {
        label: 'Average Score (%)',
        data: data.map(d => d.averageScore),
        backgroundColor: data.map(d => 
          d.averageScore >= 80 ? 'rgba(16, 185, 129, 0.8)' :
          d.averageScore >= 70 ? 'rgba(59, 130, 246, 0.8)' :
          d.averageScore >= 60 ? 'rgba(245, 158, 11, 0.8)' :
          'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: data.map(d => 
          d.averageScore >= 80 ? 'rgb(16, 185, 129)' :
          d.averageScore >= 70 ? 'rgb(59, 130, 246)' :
          d.averageScore >= 60 ? 'rgb(245, 158, 11)' :
          'rgb(239, 68, 68)'
        ),
        borderWidth: 1,
      },
      {
        label: 'Completion Rate (%)',
        data: data.map(d => Math.round((d.studentsCompleted / d.totalStudents) * 100)),
        backgroundColor: 'rgba(139, 92, 246, 0.6)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 1,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Module Performance Overview'
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context: any) {
            const index = context.dataIndex
            const moduleData = data[index]
            return [
              `Students Completed: ${moduleData.studentsCompleted}/${moduleData.totalStudents}`,
              `Completion Rate: ${Math.round((moduleData.studentsCompleted / moduleData.totalStudents) * 100)}%`
            ]
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value: any) {
            return value + '%'
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
  }

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  )
}

// Time-based Technique Analysis Chart
export function TimeBasedTechniqueChart({ data }: { 
  data: Array<{
    date: string
    activeRecall: number
    pomodoro: number
    feynman: number
    retrievalPractice: number
    total: number
  }> 
}) {
  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Active Recall',
        data: data.map(d => d.activeRecall),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Pomodoro',
        data: data.map(d => d.pomodoro),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Feynman',
        data: data.map(d => d.feynman),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Retrieval Practice',
        data: data.map(d => d.retrievalPractice),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Study Techniques Usage Over Time'
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }

  return (
    <div className="h-80">
      <Line data={chartData} options={options} />
    </div>
  )
}

// Study Session Heatmap (simplified bar representation)
export function StudyHeatmapChart({ data }: { 
  data: Array<{
    day: string
    hour: number
    sessions: number
    intensity: number
  }> 
}) {
  // Group by day for better visualization
  const dayGroups = data.reduce((acc, item) => {
    if (!acc[item.day]) acc[item.day] = []
    acc[item.day].push(item)
    return acc
  }, {} as Record<string, typeof data>)

  // Get peak hours for each day
  const peakHours = Object.entries(dayGroups).map(([day, hours]) => {
    const totalSessions = hours.reduce((sum, h) => sum + h.sessions, 0)
    const peakHour = hours.sort((a, b) => b.sessions - a.sessions)[0]
    
    return {
      day,
      totalSessions,
      peakHour: peakHour?.hour || 0,
      peakSessions: peakHour?.sessions || 0
    }
  })

  const chartData = {
    labels: peakHours.map(d => d.day),
    datasets: [
      {
        label: 'Total Sessions per Day',
        data: peakHours.map(d => d.totalSessions),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Weekly Study Activity Pattern'
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context: any) {
            const index = context.dataIndex
            const dayData = peakHours[index]
            return [
              `Peak Hour: ${dayData.peakHour}:00`,
              `Peak Sessions: ${dayData.peakSessions}`
            ]
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
  }

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  )
}

// Technique Effectiveness Radar Chart
export function TechniqueEffectivenessChart({ data }: { 
  data: Record<string, {
    averageImprovement: number
    sessionCount: number
    effectivenessRating: string
  }> 
}) {
  const techniques = Object.keys(data)
  const effectiveness = techniques.map(t => data[t]?.averageImprovement || 0)
  const sessionCounts = techniques.map(t => data[t]?.sessionCount || 0)

  // Normalize session counts to 0-100 scale for radar chart
  const maxSessions = Math.max(...sessionCounts)
  const normalizedSessions = sessionCounts.map(s => maxSessions > 0 ? (s / maxSessions) * 100 : 0)

  const chartData = {
    labels: techniques.map(t => t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
    datasets: [
      {
        label: 'Effectiveness (%)',
        data: effectiveness,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: 'rgb(16, 185, 129)',
        pointHoverBackgroundColor: 'rgb(16, 185, 129)',
        pointHoverBorderColor: 'rgb(16, 185, 129)',
      },
      {
        label: 'Usage Level (Normalized)',
        data: normalizedSessions,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'rgb(59, 130, 246)',
        pointHoverBackgroundColor: 'rgb(59, 130, 246)',
        pointHoverBorderColor: 'rgb(59, 130, 246)',
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Study Technique Effectiveness Analysis'
      },
    },
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          display: true,
          stepSize: 20
        }
      }
    }
  }

  return (
    <div className="h-80">
      <Radar data={chartData} options={options} />
    </div>
  )
}

// Performance Distribution Chart
export function PerformanceDistributionChart({ data }: { 
  data: Array<{
    range: string
    count: number
    percentage: number
  }> 
}) {
  const chartData = {
    labels: data.map(d => d.range),
    datasets: [
      {
        label: 'Number of Students',
        data: data.map(d => d.count),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',   // 0-59%
          'rgba(245, 158, 11, 0.8)',  // 60-69%
          'rgba(59, 130, 246, 0.8)',  // 70-79%
          'rgba(16, 185, 129, 0.8)',  // 80-89%
          'rgba(16, 185, 129, 0.9)',  // 90-100%
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)',
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(16, 185, 129)',
        ],
        borderWidth: 2,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Student Performance Distribution'
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const index = context.dataIndex
            const item = data[index]
            return `${item.range}: ${item.count} students (${item.percentage}%)`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          stepSize: 1
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
  }

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  )
}