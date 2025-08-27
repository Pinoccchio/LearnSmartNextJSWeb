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
import { Settings, Sparkles, Users, BookOpen, AlertCircle } from "lucide-react"
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface ModuleSettingsDialogProps {
  moduleId: string
  moduleTitle: string
  currentSettings?: {
    quizGenerationMode?: 'instructor' | 'student' | 'both'
    allowDynamicGeneration?: boolean
    requireMaterials?: boolean
  }
  onSettingsUpdate?: () => void
}

export default function ModuleSettingsDialog({
  moduleId,
  moduleTitle,
  currentSettings,
  onSettingsUpdate
}: ModuleSettingsDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Settings state
  const [quizMode, setQuizMode] = useState(
    currentSettings?.quizGenerationMode || 'both'
  )
  const [allowDynamic, setAllowDynamic] = useState(
    currentSettings?.allowDynamicGeneration !== false
  )
  const [requireMaterials, setRequireMaterials] = useState(
    currentSettings?.requireMaterials !== false
  )

  const handleSaveSettings = async () => {
    setIsUpdating(true)
    
    try {
      // Update module settings in database
      const { error } = await supabase
        .from('modules')
        .update({
          settings: {
            quizGenerationMode: quizMode,
            allowDynamicGeneration: allowDynamic,
            requireMaterials: requireMaterials,
            updatedAt: new Date().toISOString()
          }
        })
        .eq('id', moduleId)
      
      if (error) throw error
      
      toast({
        title: '✅ Settings Updated',
        description: 'Module quiz generation settings have been saved.',
        variant: 'success'
      })
      
      setOpen(false)
      onSettingsUpdate?.()
      
    } catch (error: any) {
      console.error('Failed to update settings:', error)
      toast({
        title: '❌ Update Failed',
        description: error.message || 'Failed to update module settings',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Quiz Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Quiz Generation Settings</DialogTitle>
          <DialogDescription>
            Configure how quizzes are generated for "{moduleTitle}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Quiz Generation Mode */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Quiz Generation Mode
            </Label>
            <div className="space-y-2">
              {/* Instructor Only Mode */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  quizMode === 'instructor' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setQuizMode('instructor')}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="quizMode"
                    value="instructor"
                    checked={quizMode === 'instructor'}
                    onChange={() => setQuizMode('instructor')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Instructor Only</span>
                      <Badge variant="outline" className="text-xs">Traditional</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You create all quizzes. Students take pre-made quizzes regardless of their chosen study technique.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Student Only Mode */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  quizMode === 'student' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setQuizMode('student')}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="quizMode"
                    value="student"
                    checked={quizMode === 'student'}
                    onChange={() => setQuizMode('student')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Student Dynamic</span>
                      <Badge className="text-xs bg-green-600">Recommended</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Students generate personalized quizzes based on their selected study technique. AI creates optimal questions for each learning style.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Hybrid Mode */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  quizMode === 'both' 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setQuizMode('both')}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="quizMode"
                    value="both"
                    checked={quizMode === 'both'}
                    onChange={() => setQuizMode('both')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Hybrid Mode</span>
                      <Badge variant="outline" className="text-xs">Flexible</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You can create template quizzes, and students can also generate personalized ones. Uses your quizzes as fallback if generation fails.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Settings */}
          {quizMode !== 'instructor' && (
            <div className="space-y-3 pt-3 border-t">
              <Label className="text-base font-semibold">
                Dynamic Generation Options
              </Label>
              
              {/* Allow Dynamic Generation */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="allowDynamic" className="font-normal">
                    Enable Student Quiz Generation
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Allow students to generate quizzes based on their study technique
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="allowDynamic"
                  checked={allowDynamic}
                  onChange={(e) => setAllowDynamic(e.target.checked)}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
              
              {/* Require Materials */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="requireMaterials" className="font-normal">
                    Require Course Materials
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Materials must be uploaded before students can generate quizzes
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="requireMaterials"
                  checked={requireMaterials}
                  onChange={(e) => setRequireMaterials(e.target.checked)}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          )}
          
          {/* Info Box */}
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium mb-1">Impact on Students:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  {quizMode === 'instructor' && (
                    <li>Students will see your pre-made quizzes only</li>
                  )}
                  {quizMode === 'student' && (
                    <li>Students must wait for AI to generate personalized quizzes</li>
                  )}
                  {quizMode === 'both' && (
                    <li>Students get the best of both worlds with fallback options</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isUpdating ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}