import { NextRequest, NextResponse } from 'next/server'
import { geminiAI } from '@/lib/gemini-ai'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

// Helper function to create hash for cache key
function createCacheKey(params: any): string {
  const str = JSON.stringify({
    questionTypes: params.questionTypes.sort(),
    difficulty: params.difficulty,
    technique: params.studyTechnique
  })
  return crypto.createHash('md5').update(str).digest('hex')
}

// Helper function to create content hash
function createContentHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 16)
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎓 Student quiz generation API called')
    
    // Get user authentication
    const authHeader = request.headers.get('Authorization')
    let userId = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (!authError && user) {
        userId = user.id
      }
    }
    
    // Fallback to custom headers
    if (!userId) {
      userId = request.headers.get('X-User-ID')
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    // Verify user is a student
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (userError || !userProfile || userProfile.role !== 'student') {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 })
    }
    
    const body = await request.json()
    const {
      moduleId,
      studyTechnique,
      difficulty = 'medium',
      questionTypes,
      numQuestions,
      focusTopics = []
    } = body
    
    // Validate required fields
    if (!moduleId || !studyTechnique) {
      return NextResponse.json({ 
        error: 'Module ID and study technique are required' 
      }, { status: 400 })
    }
    
    console.log('📚 Processing quiz generation request:', {
      moduleId,
      studyTechnique,
      difficulty,
      userId
    })
    
    // Step 1: Check cache for existing quiz
    const cacheKey = createCacheKey({ questionTypes, difficulty, studyTechnique })
    
    const { data: cachedQuiz } = await supabase
      .from('quiz_generation_cache')
      .select('quiz_id, quiz_data')
      .eq('module_id', moduleId)
      .eq('study_technique', studyTechnique)
      .eq('difficulty', difficulty)
      .eq('question_types_hash', cacheKey)
      .eq('is_valid', true)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (cachedQuiz) {
      console.log('✅ Found cached quiz:', cachedQuiz.quiz_id)
      
      // Update cache usage
      await supabase
        .from('quiz_generation_cache')
        .update({ 
          use_count: supabase.raw('use_count + 1'),
          last_used_at: new Date().toISOString()
        })
        .eq('quiz_id', cachedQuiz.quiz_id)
      
      // Record request as cached
      await supabase
        .from('student_quiz_requests')
        .insert({
          student_id: userId,
          module_id: moduleId,
          selected_technique: studyTechnique,
          difficulty,
          generated_quiz_id: cachedQuiz.quiz_id,
          status: 'cached',
          completed_at: new Date().toISOString()
        })
      
      return NextResponse.json({
        success: true,
        cached: true,
        quiz: cachedQuiz.quiz_data,
        quizId: cachedQuiz.quiz_id,
        message: 'Quiz retrieved from cache'
      })
    }
    
    // Step 2: Get module materials for quiz generation
    console.log('📖 Fetching module materials...')
    
    const { data: materials } = await supabase
      .from('course_materials')
      .select('id, title, description, file_url, file_type')
      .eq('module_id', moduleId)
    
    if (!materials || materials.length === 0) {
      return NextResponse.json({ 
        error: 'No materials found for this module' 
      }, { status: 404 })
    }
    
    // Step 3: Get technique-specific configuration
    const { data: config } = await supabase
      .from('quiz_generation_config')
      .select('config')
      .eq('scope', 'global')
      .single()
    
    const techniqueConfig = config?.config?.technique_optimization?.[studyTechnique] || {}
    
    // Determine question types based on technique if not provided
    const finalQuestionTypes = questionTypes || techniqueConfig.question_types || ['multiple_choice', 'true_false']
    const finalNumQuestions = numQuestions || 
      techniqueConfig.min_questions || 
      (studyTechnique === 'pomodoro' ? 5 : 10)
    
    // Step 4: Create generation request
    const { data: request, error: requestError } = await supabase
      .from('student_quiz_requests')
      .insert({
        student_id: userId,
        module_id: moduleId,
        selected_technique: studyTechnique,
        num_questions: finalNumQuestions,
        difficulty,
        question_types: finalQuestionTypes,
        focus_topics: focusTopics,
        material_ids: materials.map(m => m.id),
        status: 'processing'
      })
      .select()
      .single()
    
    if (requestError) {
      console.error('Failed to create request:', requestError)
      return NextResponse.json({ 
        error: 'Failed to create generation request' 
      }, { status: 500 })
    }
    
    const requestId = request.id
    const startTime = Date.now()
    
    try {
      // Step 5: Prepare content for quiz generation
      const materialContent = materials.map(m => 
        `Material: ${m.title}\n${m.description || ''}`
      ).join('\n\n')
      
      // Add technique-specific instructions
      const techniqueInstructions = getTechniqueInstructions(studyTechnique)
      const fullContent = `${techniqueInstructions}\n\nCourse Materials:\n${materialContent}`
      
      console.log('🤖 Generating quiz with Gemini AI...')
      
      // Step 6: Generate quiz using Gemini AI
      const generatedQuiz = await geminiAI.generateQuizFromPDF(fullContent, {
        numQuestions: finalNumQuestions,
        questionTypes: finalQuestionTypes,
        difficulty,
        studyTechniques: [studyTechnique], // Single technique for student
        focusTopics,
        studentMode: true // Flag for student-specific generation
      })
      
      const processingTime = Date.now() - startTime
      console.log(`✅ Quiz generated in ${processingTime}ms`)
      
      // Step 7: Save generated quiz
      const { data: savedQuiz, error: saveError } = await supabase
        .from('quizzes')
        .insert({
          module_id: moduleId,
          title: `${studyTechnique.replace('_', ' ').toUpperCase()} Quiz - ${generatedQuiz.title}`,
          description: generatedQuiz.description,
          questions: generatedQuiz.questions,
          time_limit: techniqueConfig.time_limit_minutes || generatedQuiz.timeLimit,
          passing_score: generatedQuiz.passingScore,
          ai_generated: true,
          study_techniques: [studyTechnique],
          generation_source: 'student',
          generated_for_user_id: userId,
          generation_context: {
            technique: studyTechnique,
            difficulty,
            requestId,
            processingTime
          },
          status: 'published',
          created_by: userId
        })
        .select()
        .single()
      
      if (saveError) {
        throw saveError
      }
      
      // Step 8: Cache the generated quiz
      const contentHash = createContentHash(materialContent)
      await supabase
        .from('quiz_generation_cache')
        .insert({
          module_id: moduleId,
          study_technique: studyTechnique,
          difficulty,
          question_types_hash: cacheKey,
          content_hash: contentHash,
          quiz_id: savedQuiz.id,
          quiz_data: savedQuiz,
          use_count: 1,
          last_used_at: new Date().toISOString()
        })
      
      // Step 9: Update generation request
      await supabase
        .from('student_quiz_requests')
        .update({
          generated_quiz_id: savedQuiz.id,
          status: 'completed',
          completed_at: new Date().toISOString(),
          processing_time_ms: processingTime,
          material_content: materialContent.substring(0, 1000) // Store first 1000 chars
        })
        .eq('id', requestId)
      
      // Step 10: Update student technique preference
      await updateStudentPreference(userId, moduleId, studyTechnique)
      
      return NextResponse.json({
        success: true,
        cached: false,
        quiz: savedQuiz,
        quizId: savedQuiz.id,
        processingTime,
        message: `Quiz generated successfully for ${studyTechnique} technique`
      })
      
    } catch (error: any) {
      console.error('Quiz generation failed:', error)
      
      // Update request with error
      await supabase
        .from('student_quiz_requests')
        .update({
          status: 'failed',
          error_message: error.message || 'Generation failed',
          completed_at: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime
        })
        .eq('id', requestId)
      
      // Check if instructor quiz exists as fallback
      const { data: fallbackQuiz } = await supabase
        .from('quizzes')
        .select('*')
        .eq('module_id', moduleId)
        .eq('generation_source', 'instructor')
        .contains('study_techniques', [studyTechnique])
        .single()
      
      if (fallbackQuiz) {
        return NextResponse.json({
          success: true,
          cached: false,
          fallback: true,
          quiz: fallbackQuiz,
          quizId: fallbackQuiz.id,
          message: 'Using instructor-generated quiz as fallback'
        })
      }
      
      return NextResponse.json({ 
        error: 'Quiz generation failed',
        details: error.message 
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

// Get technique-specific instructions for quiz generation
function getTechniqueInstructions(technique: string): string {
  const instructions: Record<string, string> = {
    active_recall: `
Generate questions that test memory retrieval without hints.
Focus on:
- Fill-in-the-blank questions requiring recall
- Definition questions without multiple choices initially
- Concept-to-example matching
- Questions that force active memory retrieval
Avoid giving away answers in the question stem.`,
    
    feynman: `
Generate questions that test deep understanding and ability to explain.
Focus on:
- "Explain in simple terms" questions
- "Teach this concept to a beginner" scenarios
- Questions about underlying principles
- Application of concepts to new situations
- "Why" and "How" questions rather than "What"`,
    
    retrieval_practice: `
Generate questions for immediate recall practice.
Focus on:
- Quick factual recall questions
- True/false for rapid assessment
- Short answer requiring brief responses
- Questions covering key facts and concepts
- Mix of recognition and recall tasks`,
    
    pomodoro: `
Generate concise questions suitable for 25-minute study sessions.
Focus on:
- Maximum 5-10 questions total
- Quick-to-answer formats (multiple choice, true/false)
- Clear, unambiguous questions
- Time-efficient question types
- Essential concepts only`,
    
    general: `
Generate a balanced mix of questions for comprehensive review.
Include various question types and difficulty levels.
Cover all major topics from the materials.`
  }
  
  return instructions[technique] || instructions.general
}

// Update student's technique preference based on usage
async function updateStudentPreference(
  userId: string, 
  moduleId: string, 
  technique: string
) {
  try {
    // Check if preference exists
    const { data: existing } = await supabase
      .from('student_technique_preferences')
      .select('id, technique_performance')
      .eq('student_id', userId)
      .eq('module_id', moduleId)
      .single()
    
    if (existing) {
      // Update existing preference
      const performance = existing.technique_performance || {}
      const techniqueData = performance[technique] || { attempts: 0 }
      techniqueData.attempts = (techniqueData.attempts || 0) + 1
      performance[technique] = techniqueData
      
      await supabase
        .from('student_technique_preferences')
        .update({
          preferred_technique: technique,
          technique_performance: performance,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
    } else {
      // Create new preference
      await supabase
        .from('student_technique_preferences')
        .insert({
          student_id: userId,
          module_id: moduleId,
          preferred_technique: technique,
          technique_performance: {
            [technique]: { attempts: 1 }
          }
        })
    }
  } catch (error) {
    console.error('Failed to update preference:', error)
    // Non-critical error, don't fail the request
  }
}

// GET endpoint to check generation status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const requestId = searchParams.get('requestId')
    const userId = request.headers.get('X-User-ID')
    
    if (!requestId || !userId) {
      return NextResponse.json({ 
        error: 'Request ID and user ID required' 
      }, { status: 400 })
    }
    
    const { data: genRequest, error } = await supabase
      .from('student_quiz_requests')
      .select('*, generated_quiz:quizzes(*)')
      .eq('id', requestId)
      .eq('student_id', userId)
      .single()
    
    if (error || !genRequest) {
      return NextResponse.json({ 
        error: 'Request not found' 
      }, { status: 404 })
    }
    
    return NextResponse.json({
      status: genRequest.status,
      quiz: genRequest.generated_quiz,
      error: genRequest.error_message,
      processingTime: genRequest.processing_time_ms
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to check status' 
    }, { status: 500 })
  }
}