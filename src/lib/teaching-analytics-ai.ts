/**
 * Teaching Analytics AI Service
 * Similar to Flutter's GeminiAIService but focused on teaching analytics
 * Generates AI-powered insights for instructors based on student performance data
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

interface TeachingInsight {
  id: string
  title: string
  description: string
  type: 'success' | 'warning' | 'info' | 'critical'
  action: string
  confidence: number
  priority: 1 | 2 | 3 | 4 | 5
  supportingData: string[]
}

interface StudentPerformanceData {
  userId: string
  userName: string
  courseId: string
  courseName: string
  moduleProgress: {
    moduleId: string
    moduleName: string
    completionPercentage: number
    averageScore: number
    lastActivity: string
  }[]
  studyTechniques: {
    technique: string
    sessionsCount: number
    effectiveness: number
    averageScore: number
  }[]
  overallProgress: number
  riskLevel: 'low' | 'medium' | 'high'
  engagementLevel: number
  lastActiveDate: string
}

interface CourseAnalyticsData {
  courseId: string
  courseName: string
  instructorId: string
  totalStudents: number
  activeStudents: number
  averageProgress: number
  averageScore: number
  studySessionsData: {
    technique: string
    totalSessions: number
    averageEffectiveness: number
    adoptionRate: number
  }[]
  modulePerformance: {
    moduleId: string
    moduleName: string
    difficulty: string
    completionRate: number
    averageScore: number
    strugglingStudents: number
  }[]
  timeRange: string
  peakStudyHours: { hour: number; activity: number }[]
}

interface AITeachingRecommendation {
  id: string
  type: 'content_creation' | 'intervention' | 'technique_recommendation' | 'scheduling' | 'assessment'
  title: string
  description: string
  actionSteps: string[]
  expectedOutcome: string
  priority: 1 | 2 | 3 | 4 | 5
  targetStudents?: string[]
  relatedModules?: string[]
  confidenceScore: number
}

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''

if (!apiKey) {
  console.error('❌ Gemini API key is not configured for teaching analytics')
}

const genAI = new GoogleGenerativeAI(apiKey)

const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.7,
    topK: 1,
    topP: 1,
    maxOutputTokens: 4096,
  },
})

class TeachingAnalyticsAIService {

  /**
   * Generate comprehensive teaching insights from course analytics data
   */
  async generateTeachingInsights(courseData: CourseAnalyticsData): Promise<TeachingInsight[]> {
    try {
      if (!apiKey) {
        throw new Error('Gemini API key is not configured')
      }

      console.log('🤖 [TEACHING AI] Generating teaching insights for course:', courseData.courseName)
      
      const prompt = this.buildTeachingInsightsPrompt(courseData)
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      const generatedText = response.text()
      
      console.log('✅ [TEACHING AI] Teaching insights generated successfully')
      
      return this.parseTeachingInsights(generatedText)
      
    } catch (error) {
      console.error('❌ [TEACHING AI] Error generating teaching insights:', error)
      return this.getFallbackTeachingInsights(courseData)
    }
  }

  /**
   * Generate personalized recommendations for at-risk students
   */
  async generateStudentInterventions(
    studentsData: StudentPerformanceData[]
  ): Promise<AITeachingRecommendation[]> {
    try {
      if (!apiKey) {
        throw new Error('Gemini API key is not configured')
      }

      const atRiskStudents = studentsData.filter(s => 
        s.riskLevel === 'high' || s.riskLevel === 'medium'
      )

      if (atRiskStudents.length === 0) {
        return []
      }

      console.log('🚨 [TEACHING AI] Generating interventions for', atRiskStudents.length, 'at-risk students')
      
      const prompt = this.buildInterventionPrompt(atRiskStudents)
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      const generatedText = response.text()
      
      return this.parseInterventionRecommendations(generatedText)
      
    } catch (error) {
      console.error('❌ [TEACHING AI] Error generating interventions:', error)
      return this.getFallbackInterventions(studentsData)
    }
  }

  /**
   * Analyze study technique effectiveness and recommend optimizations
   */
  async analyzeTechniqueEffectiveness(
    courseData: CourseAnalyticsData
  ): Promise<{ insights: TeachingInsight[], recommendations: AITeachingRecommendation[] }> {
    try {
      if (!apiKey) {
        throw new Error('Gemini API key is not configured')
      }

      console.log('📊 [TEACHING AI] Analyzing study technique effectiveness')
      
      const prompt = this.buildTechniqueAnalysisPrompt(courseData)
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      const generatedText = response.text()
      
      return this.parseTechniqueAnalysis(generatedText)
      
    } catch (error) {
      console.error('❌ [TEACHING AI] Error analyzing techniques:', error)
      return {
        insights: this.getFallbackTechniqueInsights(courseData),
        recommendations: this.getFallbackTechniqueRecommendations(courseData)
      }
    }
  }

  /**
   * Build prompt for teaching insights generation
   */
  private buildTeachingInsightsPrompt(courseData: CourseAnalyticsData): string {
    return `
You are an expert educational data scientist specializing in criminology education and teaching analytics. Analyze the following course performance data and provide actionable teaching insights.

COURSE DATA:
Course: ${courseData.courseName}
Total Students: ${courseData.totalStudents}
Active Students: ${courseData.activeStudents} (${Math.round((courseData.activeStudents / courseData.totalStudents) * 100)}%)
Average Progress: ${courseData.averageProgress}%
Average Score: ${courseData.averageScore}%
Time Range: ${courseData.timeRange}

STUDY TECHNIQUES PERFORMANCE:
${courseData.studySessionsData.map(technique => 
  `- ${technique.technique}: ${technique.totalSessions} sessions, ${technique.averageEffectiveness}% effectiveness, ${technique.adoptionRate}% adoption`
).join('\n')}

MODULE PERFORMANCE:
${courseData.modulePerformance.map(module => 
  `- ${module.moduleName} (${module.difficulty}): ${module.completionRate}% completion, ${module.averageScore}% avg score, ${module.strugglingStudents} struggling students`
).join('\n')}

PEAK STUDY HOURS:
${courseData.peakStudyHours.map(hour => 
  `${hour.hour}:00-${hour.hour + 1}:00: ${hour.activity} sessions`
).join('\n')}

Generate 4-6 specific, actionable teaching insights in JSON format:

{
  "insights": [
    {
      "id": "insight_1",
      "title": "High-Performing Study Technique",
      "description": "Specific observation about what's working well",
      "type": "success",
      "action": "Actionable recommendation",
      "confidence": 0.85,
      "priority": 2,
      "supportingData": ["specific data point", "trend observation"]
    },
    {
      "id": "insight_2", 
      "title": "Content Gap Identified",
      "description": "Specific area where students are struggling",
      "type": "warning",
      "action": "Concrete steps to address the issue",
      "confidence": 0.92,
      "priority": 1,
      "supportingData": ["performance data", "completion rates"]
    }
  ]
}

FOCUS ON:
- Criminal law and criminology education context
- Specific actionable recommendations
- Data-driven insights with confidence scores
- Prioritized based on impact potential
- Philippine legal education when applicable

Return ONLY the JSON response.
`;
  }

  /**
   * Build prompt for student intervention recommendations
   */
  private buildInterventionPrompt(atRiskStudents: StudentPerformanceData[]): string {
    const studentsContext = atRiskStudents.map(student => `
Student: ${student.userName}
Overall Progress: ${student.overallProgress}%
Risk Level: ${student.riskLevel}
Engagement: ${student.engagementLevel}%
Last Active: ${student.lastActiveDate}
Struggling Modules: ${student.moduleProgress.filter(m => m.completionPercentage < 60).map(m => m.moduleName).join(', ')}
Study Techniques Used: ${student.studyTechniques.map(t => `${t.technique} (${t.sessionsCount} sessions)`).join(', ')}
`).join('\n---\n')

    return `
You are an expert criminology instructor creating personalized intervention strategies for at-risk students.

AT-RISK STUDENTS DATA:
${studentsContext}

Generate targeted intervention recommendations in JSON format:

{
  "recommendations": [
    {
      "id": "intervention_1",
      "type": "intervention",
      "title": "Personalized Study Plan for Struggling Students",
      "description": "Detailed intervention strategy",
      "actionSteps": [
        "Specific step 1",
        "Specific step 2", 
        "Specific step 3"
      ],
      "expectedOutcome": "Measurable expected result",
      "priority": 1,
      "targetStudents": ["student_id_1", "student_id_2"],
      "relatedModules": ["module_name_1"],
      "confidenceScore": 0.88
    }
  ]
}

REQUIREMENTS:
- Focus on criminology education context
- Provide specific, actionable steps
- Target students by their specific weaknesses
- Consider their current study technique preferences
- Prioritize interventions by urgency and impact

Return ONLY the JSON response.
`;
  }

  /**
   * Build prompt for technique analysis
   */
  private buildTechniqueAnalysisPrompt(courseData: CourseAnalyticsData): string {
    return `
Analyze study technique effectiveness for criminology education based on this data:

TECHNIQUES PERFORMANCE:
${courseData.studySessionsData.map(t => 
  `${t.technique}: ${t.totalSessions} sessions, ${t.averageEffectiveness}% effectiveness, ${t.adoptionRate}% adoption`
).join('\n')}

COURSE CONTEXT:
- ${courseData.courseName}
- ${courseData.totalStudents} students
- ${courseData.averageScore}% average performance

Generate analysis in JSON format:

{
  "insights": [
    {
      "id": "technique_insight_1",
      "title": "Technique Performance Analysis",
      "description": "Analysis of technique effectiveness",
      "type": "info",
      "action": "Recommendation for optimization",
      "confidence": 0.9,
      "priority": 2,
      "supportingData": ["usage statistics", "effectiveness data"]
    }
  ],
  "recommendations": [
    {
      "id": "technique_rec_1",
      "type": "technique_recommendation",
      "title": "Optimize Study Technique Mix",
      "description": "Strategy to improve technique adoption",
      "actionSteps": [
        "Specific action 1",
        "Specific action 2"
      ],
      "expectedOutcome": "Expected improvement",
      "priority": 2,
      "confidenceScore": 0.85
    }
  ]
}

Return ONLY the JSON response.
`;
  }

  /**
   * Parse teaching insights from AI response
   */
  private parseTeachingInsights(response: string): TeachingInsight[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      
      const parsed = JSON.parse(jsonMatch[0])
      
      if (parsed.insights && Array.isArray(parsed.insights)) {
        return parsed.insights.map((insight: any) => ({
          id: insight.id || `insight_${Date.now()}`,
          title: insight.title || 'Teaching Insight',
          description: insight.description || '',
          type: insight.type || 'info',
          action: insight.action || 'Review data',
          confidence: insight.confidence || 0.7,
          priority: insight.priority || 3,
          supportingData: insight.supportingData || []
        }))
      }
      
      throw new Error('Invalid insights structure')
      
    } catch (error) {
      console.error('❌ Error parsing teaching insights:', error)
      return []
    }
  }

  /**
   * Parse intervention recommendations from AI response
   */
  private parseInterventionRecommendations(response: string): AITeachingRecommendation[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      
      const parsed = JSON.parse(jsonMatch[0])
      
      if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
        return parsed.recommendations.map((rec: any) => ({
          id: rec.id || `intervention_${Date.now()}`,
          type: rec.type || 'intervention',
          title: rec.title || 'Student Intervention',
          description: rec.description || '',
          actionSteps: rec.actionSteps || [],
          expectedOutcome: rec.expectedOutcome || '',
          priority: rec.priority || 3,
          targetStudents: rec.targetStudents || [],
          relatedModules: rec.relatedModules || [],
          confidenceScore: rec.confidenceScore || 0.7
        }))
      }
      
      throw new Error('Invalid recommendations structure')
      
    } catch (error) {
      console.error('❌ Error parsing interventions:', error)
      return []
    }
  }

  /**
   * Parse technique analysis from AI response  
   */
  private parseTechniqueAnalysis(response: string): { insights: TeachingInsight[], recommendations: AITeachingRecommendation[] } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      
      const parsed = JSON.parse(jsonMatch[0])
      
      const insights = (parsed.insights || []).map((insight: any) => ({
        id: insight.id || `tech_insight_${Date.now()}`,
        title: insight.title || 'Technique Insight',
        description: insight.description || '',
        type: insight.type || 'info',
        action: insight.action || 'Review technique performance',
        confidence: insight.confidence || 0.7,
        priority: insight.priority || 3,
        supportingData: insight.supportingData || []
      }))

      const recommendations = (parsed.recommendations || []).map((rec: any) => ({
        id: rec.id || `tech_rec_${Date.now()}`,
        type: rec.type || 'technique_recommendation',
        title: rec.title || 'Technique Recommendation',
        description: rec.description || '',
        actionSteps: rec.actionSteps || [],
        expectedOutcome: rec.expectedOutcome || '',
        priority: rec.priority || 3,
        confidenceScore: rec.confidenceScore || 0.7
      }))

      return { insights, recommendations }
      
    } catch (error) {
      console.error('❌ Error parsing technique analysis:', error)
      return { insights: [], recommendations: [] }
    }
  }

  /**
   * Fallback teaching insights when AI fails
   */
  private getFallbackTeachingInsights(courseData: CourseAnalyticsData): TeachingInsight[] {
    console.log('🔄 [TEACHING AI] Generating fallback insights for course:', courseData.courseName)
    const insights: TeachingInsight[] = []

    // Check if we have any meaningful data
    const hasStudents = courseData.totalStudents > 0
    const hasSessions = courseData.studySessionsData.some(t => t.totalSessions > 0)
    const hasModules = courseData.modulePerformance && courseData.modulePerformance.length > 0

    if (!hasStudents) {
      insights.push({
        id: 'no_students_enrolled',
        title: 'No Student Enrollment',
        description: 'This course currently has no enrolled students. Consider promoting the course or reviewing enrollment requirements.',
        type: 'info',
        action: 'Review course enrollment and marketing strategy',
        confidence: 1.0,
        priority: 1,
        supportingData: ['Zero enrolled students']
      })
      return insights
    }

    if (!hasSessions && !hasModules) {
      insights.push({
        id: 'no_student_activity',
        title: 'No Student Activity Detected',
        description: `${courseData.totalStudents} students are enrolled but no study activity has been recorded yet.`,
        type: 'warning',
        action: 'Encourage students to begin studying and engage with course materials',
        confidence: 0.9,
        priority: 1,
        supportingData: [`${courseData.totalStudents} enrolled students`, 'No study sessions recorded']
      })
      return insights
    }

    // Engagement insights
    const engagementRate = courseData.totalStudents > 0 ? (courseData.activeStudents / courseData.totalStudents) * 100 : 0
    
    if (engagementRate === 0) {
      insights.push({
        id: 'zero_engagement',
        title: 'No Recent Student Activity',
        description: 'No students have been active in the past 7 days. Immediate intervention may be needed.',
        type: 'critical',
        action: 'Contact students immediately to identify barriers to engagement',
        confidence: 0.95,
        priority: 1,
        supportingData: [`${courseData.totalStudents} total students`, 'No recent activity']
      })
    } else if (engagementRate < 30) {
      insights.push({
        id: 'very_low_engagement',
        title: 'Very Low Student Engagement',
        description: `Only ${Math.round(engagementRate)}% of students have been active recently. This requires immediate attention.`,
        type: 'critical',
        action: 'Implement engagement strategies and reach out to inactive students',
        confidence: 0.9,
        priority: 1,
        supportingData: [`${courseData.activeStudents}/${courseData.totalStudents} active students`]
      })
    } else if (engagementRate < 60) {
      insights.push({
        id: 'low_engagement',
        title: 'Low Student Engagement',
        description: `${Math.round(engagementRate)}% engagement rate suggests students need more motivation or support.`,
        type: 'warning',
        action: 'Schedule check-ins with inactive students and review course structure',
        confidence: 0.8,
        priority: 2,
        supportingData: [`${courseData.activeStudents}/${courseData.totalStudents} active students`]
      })
    } else if (engagementRate >= 80) {
      insights.push({
        id: 'good_engagement',
        title: 'Strong Student Engagement',
        description: `Excellent engagement with ${Math.round(engagementRate)}% of students actively participating.`,
        type: 'success',
        action: 'Continue current engagement strategies and consider sharing best practices',
        confidence: 0.85,
        priority: 3,
        supportingData: [`${courseData.activeStudents}/${courseData.totalStudents} active students`]
      })
    }

    // Performance insights based on available data
    if (courseData.averageScore > 0) {
      if (courseData.averageScore < 50) {
        insights.push({
          id: 'very_low_performance',
          title: 'Critical Performance Issues',
          description: `Course average of ${courseData.averageScore}% indicates serious learning difficulties.`,
          type: 'critical',
          action: 'Implement immediate remedial support and review course difficulty',
          confidence: 0.95,
          priority: 1,
          supportingData: [`Average score: ${courseData.averageScore}%`]
        })
      } else if (courseData.averageScore < 70) {
        insights.push({
          id: 'below_target_performance',
          title: 'Below-Target Performance',
          description: `Course average of ${courseData.averageScore}% indicates students need additional support.`,
          type: 'warning',
          action: 'Consider supplementary materials or adjusted teaching methods',
          confidence: 0.85,
          priority: 2,
          supportingData: [`Average score: ${courseData.averageScore}%`]
        })
      } else if (courseData.averageScore >= 85) {
        insights.push({
          id: 'excellent_performance',
          title: 'Outstanding Student Performance',
          description: `Excellent course average of ${courseData.averageScore}% shows effective teaching methods.`,
          type: 'success',
          action: 'Maintain current approach and consider advanced content for top performers',
          confidence: 0.9,
          priority: 4,
          supportingData: [`Average score: ${courseData.averageScore}%`]
        })
      }
    }

    // Study technique insights
    const activeTechniques = courseData.studySessionsData.filter(t => t.totalSessions > 0)
    
    if (activeTechniques.length === 0) {
      insights.push({
        id: 'no_study_techniques',
        title: 'No Study Technique Usage',
        description: 'Students have not yet started using any study techniques. Introduction and guidance may be needed.',
        type: 'info',
        action: 'Introduce students to available study techniques and their benefits',
        confidence: 0.8,
        priority: 2,
        supportingData: ['No study technique sessions recorded']
      })
    } else {
      const mostUsedTechnique = activeTechniques
        .sort((a, b) => b.totalSessions - a.totalSessions)[0]
      
      const mostEffectiveTechnique = activeTechniques
        .filter(t => t.averageEffectiveness > 0)
        .sort((a, b) => b.averageEffectiveness - a.averageEffectiveness)[0]
      
      if (mostUsedTechnique) {
        insights.push({
          id: 'popular_technique',
          title: 'Popular Study Technique Identified',
          description: `${mostUsedTechnique.technique} is the most used technique with ${mostUsedTechnique.totalSessions} sessions.`,
          type: 'info',
          action: 'Monitor effectiveness and consider promoting successful techniques',
          confidence: 0.7,
          priority: 3,
          supportingData: [`${mostUsedTechnique.totalSessions} sessions completed`]
        })
      }
      
      if (mostEffectiveTechnique && mostEffectiveTechnique.averageEffectiveness >= 70) {
        insights.push({
          id: 'effective_technique',
          title: 'High-Performing Study Technique',
          description: `${mostEffectiveTechnique.technique} shows ${mostEffectiveTechnique.averageEffectiveness}% effectiveness.`,
          type: 'success',
          action: 'Promote this technique to more students',
          confidence: 0.75,
          priority: 2,
          supportingData: [`${mostEffectiveTechnique.averageEffectiveness}% effectiveness`]
        })
      }
    }

    // Module performance insights
    if (hasModules) {
      const strugglingModules = courseData.modulePerformance.filter(m => m.averageScore < 60)
      const excellentModules = courseData.modulePerformance.filter(m => m.averageScore >= 85)
      
      if (strugglingModules.length > 0) {
        insights.push({
          id: 'struggling_modules',
          title: 'Modules Need Attention',
          description: `${strugglingModules.length} module(s) showing low performance: ${strugglingModules.map(m => m.moduleName).join(', ')}.`,
          type: 'warning',
          action: 'Review and enhance content for underperforming modules',
          confidence: 0.85,
          priority: 2,
          supportingData: strugglingModules.map(m => `${m.moduleName}: ${m.averageScore}%`)
        })
      }
      
      if (excellentModules.length > 0) {
        insights.push({
          id: 'excellent_modules',
          title: 'High-Performing Modules',
          description: `${excellentModules.length} module(s) showing excellent performance: ${excellentModules.map(m => m.moduleName).join(', ')}.`,
          type: 'success',
          action: 'Analyze successful modules for best practices to apply elsewhere',
          confidence: 0.8,
          priority: 3,
          supportingData: excellentModules.map(m => `${m.moduleName}: ${m.averageScore}%`)
        })
      }
    }

    console.log('✅ [TEACHING AI] Generated', insights.length, 'fallback insights')
    return insights
  }

  /**
   * Fallback interventions when AI fails
   */
  private getFallbackInterventions(studentsData: StudentPerformanceData[]): AITeachingRecommendation[] {
    const highRiskStudents = studentsData.filter(s => s.riskLevel === 'high')
    
    if (highRiskStudents.length === 0) return []

    return [{
      id: 'fallback_intervention',
      type: 'intervention',
      title: 'Support At-Risk Students',
      description: `${highRiskStudents.length} students need immediate attention due to low progress or engagement.`,
      actionSteps: [
        'Contact students individually to discuss challenges',
        'Provide additional study resources',
        'Schedule regular check-ins',
        'Consider alternative study techniques'
      ],
      expectedOutcome: 'Improved student engagement and performance',
      priority: 1,
      targetStudents: highRiskStudents.map(s => s.userId),
      confidenceScore: 0.8
    }]
  }

  /**
   * Fallback technique insights when AI fails
   */
  private getFallbackTechniqueInsights(courseData: CourseAnalyticsData): TeachingInsight[] {
    const totalSessions = courseData.studySessionsData.reduce((sum, t) => sum + t.totalSessions, 0)
    
    if (totalSessions === 0) {
      return [{
        id: 'no_activity',
        title: 'No Study Activity Detected',
        description: 'Students have not yet started using study techniques.',
        type: 'warning',
        action: 'Introduce students to available study techniques',
        confidence: 1.0,
        priority: 1,
        supportingData: ['No study sessions recorded']
      }]
    }

    return [{
      id: 'technique_adoption',
      title: 'Study Technique Adoption',
      description: `Students have completed ${totalSessions} study sessions using various techniques.`,
      type: 'info',
      action: 'Monitor technique effectiveness and guide student choices',
      confidence: 0.8,
      priority: 3,
      supportingData: [`Total sessions: ${totalSessions}`]
    }]
  }

  /**
   * Fallback technique recommendations when AI fails
   */
  private getFallbackTechniqueRecommendations(courseData: CourseAnalyticsData): AITeachingRecommendation[] {
    return [{
      id: 'optimize_techniques',
      type: 'technique_recommendation',
      title: 'Optimize Study Technique Mix',
      description: 'Balance technique usage to maximize learning effectiveness.',
      actionSteps: [
        'Analyze current technique performance data',
        'Guide students toward most effective techniques',
        'Provide technique-specific training if needed'
      ],
      expectedOutcome: 'Better technique adoption and improved learning outcomes',
      priority: 2,
      confidenceScore: 0.7
    }]
  }

  /**
   * Test AI connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!apiKey) return false
      
      const result = await model.generateContent([
        'Respond with "Teaching Analytics AI Connection Successful" if you can read this message.'
      ])
      
      const responseText = result.response.text()?.toLowerCase() || ''
      return responseText.includes('teaching analytics ai connection successful')
      
    } catch (error) {
      console.error('❌ [TEACHING AI] Connection test failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const teachingAnalyticsAI = new TeachingAnalyticsAIService()
export type { 
  TeachingInsight, 
  StudentPerformanceData, 
  CourseAnalyticsData, 
  AITeachingRecommendation 
}