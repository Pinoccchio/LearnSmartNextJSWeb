/**
 * Gemini AI Service for Quiz Generation
 * Generates criminology-focused quizzes from PDF content using Google Generative AI SDK
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

interface QuizQuestion {
  id: number
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_in_blank' | 'definition_recall' | 'concept_matching' | 'explanation' | 'teach_concept'
  question: string
  options?: string[] // For multiple choice and concept matching
  correct_answer: number | boolean | string | string[]
  explanation?: string
  points?: number
}

interface QuizGenerationOptions {
  numQuestions: number
  questionTypes: ('multiple_choice' | 'true_false' | 'short_answer' | 'fill_in_blank' | 'definition_recall' | 'concept_matching' | 'explanation' | 'teach_concept')[]
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  studyTechniques?: string[] // Changed to array of techniques
  focusTopics?: string[]
}

interface GeneratedQuiz {
  title: string
  description: string
  questions: QuizQuestion[]
  timeLimit: number // in minutes
  passingScore: number // percentage
}

// Initialize Gemini AI with proper error handling
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''

if (!apiKey) {
  console.error('❌ Gemini API key is not configured. Please set GEMINI_API_KEY environment variable.')
}

const genAI = new GoogleGenerativeAI(apiKey)

// Get the generative model - using Gemini 2.0 Flash for optimal speed and performance
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.7,
    topK: 1,
    topP: 1,
    maxOutputTokens: 4096,
  },
})

class GeminiAIService {

  /**
   * Generate quiz questions from PDF text content
   */
  async generateQuizFromPDF(
    pdfText: string, 
    options: QuizGenerationOptions
  ): Promise<GeneratedQuiz> {
    try {
      // Check API key availability
      if (!apiKey) {
        throw new Error('Gemini API key is not configured. Please check your environment variables.')
      }

      console.log('🤖 Generating quiz with Gemini AI SDK')
      const prompt = this.buildQuizPrompt(pdfText, options)
      
      // Use the official SDK instead of manual fetch
      const result = await model.generateContent(prompt)
      const response = await result.response
      const generatedText = response.text()
      
      console.log('✅ Quiz content generated successfully')
      return this.parseQuizResponse(generatedText, options)
      
    } catch (error) {
      console.error('❌ Error generating quiz with Gemini AI:', error)
      
      // Provide specific error messages based on error type
      if (error instanceof Error) {
        if (error.message?.includes('API key')) {
          throw new Error('Gemini API key is invalid or not configured. Please check your environment variables.')
        } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
          throw new Error('Gemini API quota exceeded or rate limited. Please try again later.')
        } else if (error.message?.includes('safety') || error.message?.includes('blocked')) {
          throw new Error('Content was blocked by safety filters. Please try with different content.')
        } else if (error.message?.includes('parse') || error.message?.includes('JSON')) {
          throw new Error('AI response could not be parsed. Please try again with simpler content.')
        }
      }
      
      throw new Error(`Failed to generate quiz: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Build the prompt for quiz generation
   */
  private buildQuizPrompt(pdfText: string, options: QuizGenerationOptions): string {
    const { numQuestions, questionTypes, difficulty, studyTechniques = ['general'], focusTopics } = options

    const questionTypesText = questionTypes.map(type => {
      switch (type) {
        case 'multiple_choice': return 'multiple choice (4 options)'
        case 'true_false': return 'true/false'
        case 'short_answer': return 'short answer'
        case 'fill_in_blank': return 'fill in the blank'
        case 'definition_recall': return 'definition recall'
        case 'concept_matching': return 'concept matching'
        case 'explanation': return 'detailed explanation'
        case 'teach_concept': return 'teach the concept'
        default: return type
      }
    }).join(', ')

    const focusText = focusTopics && focusTopics.length > 0 
      ? `Focus particularly on these topics: ${focusTopics.join(', ')}.`
      : ''

    // Multi-technique instructions - combine all selected techniques
    const techniqueInstructions = this.getCombinedTechniqueInstructions(studyTechniques)
    const techniqueNames = studyTechniques.map(t => t.replace('_', ' ')).join(', ')

    return `
You are an expert criminology instructor creating educational quiz questions optimized for multiple study techniques: ${techniqueNames}. 

Based on the following PDF content, generate ${numQuestions} quiz questions for criminology students.

PDF Content:
"""
${pdfText.substring(0, 4000)} // Limit text to avoid token limits
"""

Requirements:
- Generate ${numQuestions} questions
- Question types: ${questionTypesText}
- Difficulty level: ${difficulty}
- All questions must be relevant to criminology education
- Focus on Philippine criminal law and procedures when applicable
- ${focusText}

${techniqueInstructions}

Question Type Guidelines:
- Multiple choice: Provide exactly 4 options (A, B, C, D)
- True/false: Provide a clear statement that can be definitively true or false
- Short answer: Expect 2-3 sentence responses
- Fill in the blank: Create sentences with key terms or concepts missing
- Definition recall: Ask for definitions of important criminology terms
- Concept matching: Pair concepts with examples, laws, or cases
- Explanation: Ask students to explain complex concepts in detail
- Teach concept: Ask students to explain as if teaching someone else

Please format your response as a JSON object with this exact structure:
{
  "title": "Quiz title based on the content",
  "description": "Brief description of what the quiz covers",
  "timeLimit": number (suggested time in minutes),
  "passingScore": number (suggested passing percentage),
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Brief explanation of the correct answer",
      "points": 5
    },
    {
      "id": 2,
      "type": "true_false",
      "question": "Statement to evaluate",
      "correct_answer": true,
      "explanation": "Explanation of why this is true/false",
      "points": 3
    },
    {
      "id": 3,
      "type": "short_answer",
      "question": "Question requiring written response",
      "correct_answer": "Sample answer or key points expected",
      "explanation": "What should be included in a good answer",
      "points": 10
    },
    {
      "id": 4,
      "type": "fill_in_blank",
      "question": "The ___ is the burden of proof required in criminal cases.",
      "correct_answer": "beyond a reasonable doubt",
      "explanation": "The standard of proof in criminal cases",
      "points": 5
    },
    {
      "id": 5,
      "type": "definition_recall",
      "question": "Define 'mens rea' in criminal law.",
      "correct_answer": "The mental element or guilty mind required for criminal liability",
      "explanation": "Mens rea is a fundamental concept in criminal law",
      "points": 7
    },
    {
      "id": 6,
      "type": "concept_matching",
      "question": "Match the criminal law principle with its description:",
      "options": ["Actus reus", "Mens rea", "Causation", "Concurrence"],
      "correct_answer": ["Physical act", "Mental state", "Link between act and harm", "Act and intent occurring together"],
      "explanation": "These are fundamental elements of criminal liability",
      "points": 8
    },
    {
      "id": 7,
      "type": "explanation",
      "question": "Explain the concept of criminal negligence and provide an example.",
      "correct_answer": "Criminal negligence involves a gross deviation from reasonable care that creates substantial risk. Example: A doctor performing surgery while intoxicated.",
      "explanation": "Should include definition, elements, and practical example",
      "points": 12
    },
    {
      "id": 8,
      "type": "teach_concept",
      "question": "Explain the Miranda rights as if teaching someone who has never heard of them.",
      "correct_answer": "Miranda rights are warnings police must give suspects before questioning. They include the right to remain silent and right to an attorney. This protects against self-incrimination.",
      "explanation": "Should be clear, simple, and comprehensive for a beginner",
      "points": 10
    }
  ]
}

Ensure the JSON is valid and follows this exact format.
`
  }

  /**
   * Get combined instructions for multiple study techniques
   */
  private getCombinedTechniqueInstructions(techniques: string[]): string {
    if (techniques.length === 1) {
      return this.getStudyTechniqueInstructions(techniques[0])
    }

    const allInstructions = techniques.map(technique => {
      const instructions = this.getStudyTechniqueInstructions(technique)
      const techniqueName = technique.replace('_', ' ').toUpperCase()
      return `\n**${techniqueName} APPROACH:**${instructions}`
    }).join('\n')

    return `
Multi-Technique Optimization Strategy:
Your quiz should balance and integrate the following study approaches:${allInstructions}

INTEGRATION GUIDELINES:
- Distribute questions across all selected study techniques
- Ensure each technique gets proportional representation
- Create questions that can serve multiple learning approaches when possible
- Maintain variety in question types to support different techniques
- Balance quick recall questions with deeper thinking questions
`
  }

  /**
   * Get study technique-specific instructions
   */
  private getStudyTechniqueInstructions(technique: string): string {
    switch (technique) {
      case 'active_recall':
        return `
Study Technique Focus - Active Recall:
- Prioritize memory retrieval and recall-based questions
- Emphasize fill-in-the-blank and definition recall questions
- Create questions that require students to retrieve information from memory
- Focus on key terms, concepts, and factual recall
- Questions should test whether students can remember information without prompts`

      case 'feynman':
        return `
Study Technique Focus - Feynman Technique:
- Prioritize explanation and teaching-focused questions
- Ask students to explain concepts in simple terms
- Include "teach the concept" type questions
- Encourage breaking down complex ideas into understandable parts
- Focus on conceptual understanding rather than memorization`

      case 'retrieval_practice':
        return `
Study Technique Focus - Retrieval Practice:
- Emphasize immediate recall without reference materials
- Mix question types to challenge different recall pathways
- Focus on application and analysis of learned concepts
- Include varied formats to strengthen memory consolidation
- Questions should require active mental effort to retrieve information`

      case 'pomodoro':
        return `
Study Technique Focus - Pomodoro Session:
- Create concise, focused questions suitable for short study sessions
- Prioritize clear, quick-answer questions (multiple choice, true/false)
- Avoid overly complex explanations or lengthy answers
- Focus on bite-sized learning chunks
- Questions should be answerable within focused 25-minute sessions`

      default:
        return `
Study Technique Focus - General Review:
- Create balanced mix of question types for comprehensive assessment
- Include both recall and application-based questions
- Ensure questions cover different cognitive levels
- Focus on criminology concepts applicable to board exam preparation`
    }
  }

  /**
   * Parse the AI response and convert to structured quiz data
   */
  private parseQuizResponse(generatedText: string, options: QuizGenerationOptions): GeneratedQuiz {
    try {
      console.log('🔍 Raw AI quiz response:', generatedText.substring(0, 200) + '...')
      
      // Try multiple JSON extraction methods (like LawBot implementation)
      let parsed = null
      
      // Method 1: Match complete JSON object
      const jsonMatch = generatedText.match(/\{[\s\S]*?\}(?=\s*$|[\s\n]*[^{}]*$)/)
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0])
          console.log('✅ Quiz JSON parsed successfully (method 1)')
        } catch (parseError) {
          console.warn('⚠️ Quiz JSON parse error (method 1):', parseError)
        }
      }
      
      // Method 2: Find first { to last } in response
      if (!parsed) {
        const firstBrace = generatedText.indexOf('{')
        const lastBrace = generatedText.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          try {
            const jsonString = generatedText.substring(firstBrace, lastBrace + 1)
            parsed = JSON.parse(jsonString)
            console.log('✅ Quiz JSON parsed successfully (method 2)')
          } catch (parseError) {
            console.warn('⚠️ Quiz JSON parse error (method 2):', parseError)
          }
        }
      }
      
      // Method 3: Clean and parse the response
      if (!parsed) {
        try {
          const cleanedText = generatedText.replace(/```json|```/g, '').trim()
          const lines = cleanedText.split('\n').filter(line => 
            line.trim().startsWith('{') || line.trim().includes(':') || line.trim().endsWith('}'))
          const jsonString = lines.join('')
          parsed = JSON.parse(jsonString)
          console.log('✅ Quiz JSON parsed successfully (method 3)')
        } catch (parseError) {
          console.warn('⚠️ Quiz JSON parse error (method 3):', parseError)
        }
      }
      
      if (!parsed) {
        console.error('❌ All JSON parsing methods failed for quiz response')
        throw new Error('No valid JSON found in AI response')
      }
      
      // Validate the structure
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid quiz structure: missing questions array')
      }

      // Ensure all questions have required fields
      const validatedQuestions: QuizQuestion[] = parsed.questions.map((q: any, index: number) => {
        return {
          id: q.id || index + 1,
          type: q.type || 'multiple_choice',
          question: q.question || '',
          options: q.options || undefined,
          correct_answer: q.correct_answer,
          explanation: q.explanation || '',
          points: q.points || (q.type === 'short_answer' ? 10 : 5)
        }
      })

      return {
        title: parsed.title || 'Generated Quiz',
        description: parsed.description || 'AI-generated quiz from course material',
        questions: validatedQuestions,
        timeLimit: parsed.timeLimit || Math.max(15, options.numQuestions * 2), // Default: 2 minutes per question, minimum 15
        passingScore: parsed.passingScore || 70
      }
      
    } catch (error) {
      console.error('Error parsing quiz response:', error)
      throw new Error('Failed to parse AI-generated quiz. Please try again.')
    }
  }

  /**
   * Extract text content from PDF (placeholder - would need actual PDF parsing library)
   * In a real implementation, you'd use a library like pdf-parse or pdf2pic
   */
  async extractTextFromPDF(file: File): Promise<string> {
    // This is a placeholder implementation
    // In production, you would:
    // 1. Upload file to server
    // 2. Use a PDF parsing library to extract text
    // 3. Return the extracted text
    
    throw new Error('PDF text extraction not yet implemented. Please implement with pdf-parse library.')
  }

  /**
   * Validate quiz question format
   */
  validateQuizQuestion(question: QuizQuestion): boolean {
    if (!question.question || question.question.trim().length === 0) {
      return false
    }

    if (question.type === 'multiple_choice') {
      return !!(question.options && 
               question.options.length === 4 && 
               typeof question.correct_answer === 'number' &&
               question.correct_answer >= 0 && 
               question.correct_answer < 4)
    }

    if (question.type === 'true_false') {
      return typeof question.correct_answer === 'boolean'
    }

    if (question.type === 'short_answer') {
      return typeof question.correct_answer === 'string' && 
             question.correct_answer.trim().length > 0
    }

    return false
  }

  /**
   * Generate a sample quiz for testing (without PDF content)
   */
  async generateSampleQuiz(): Promise<GeneratedQuiz> {
    const sampleOptions: QuizGenerationOptions = {
      numQuestions: 5,
      questionTypes: ['multiple_choice', 'true_false', 'short_answer'],
      difficulty: 'medium',
      studyTechniques: ['general', 'active_recall'], // Test with multiple techniques
      focusTopics: ['Criminal Law', 'Evidence', 'Procedure']
    }

    const sampleText = `
    Criminal law is a system of laws that deals with punishment of individuals who commit crimes. 
    The burden of proof in criminal cases lies with the prosecution, who must prove guilt beyond a reasonable doubt.
    The Miranda rights must be read to suspects during custodial interrogation.
    Evidence must be obtained legally to be admissible in court.
    `

    return this.generateQuizFromPDF(sampleText, sampleOptions)
  }
}

// Export a singleton instance
export const geminiAI = new GeminiAIService()
export type { QuizQuestion, QuizGenerationOptions, GeneratedQuiz }