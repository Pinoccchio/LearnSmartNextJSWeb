"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LANDING_FEATURES } from "@/lib/constants"
import { Brain, MessageSquare, Clock, Target, ArrowRight } from "lucide-react"

const iconMap = {
  brain: Brain,
  message: MessageSquare,
  clock: Clock,
  target: Target,
}

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 mb-6">
            <Brain className="w-4 h-4 mr-2" />
            Proven Study Techniques
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Master Criminology with
            <span className="block gradient-text">Science-Backed Methods</span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Our AI-powered platform combines four powerful study techniques specifically optimized 
            for criminology education. Each method is proven to increase retention and exam performance.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
          {LANDING_FEATURES.map((feature, index) => {
            const IconComponent = iconMap[feature.icon as keyof typeof iconMap]
            
            return (
              <Card key={index} className="feature-card bg-white dark:bg-gray-800 border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {feature.stats}
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  
                  {/* Feature Benefits */}
                  <div className="space-y-2 mb-6">
                    {index === 0 && (
                      <>
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          AI analyzes your reading material
                        </div>
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          Generates targeted questions
                        </div>
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          Tracks your progress over time
                        </div>
                      </>
                    )}
                    
                    {index === 1 && (
                      <>
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          Simplify complex legal concepts
                        </div>
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          Voice recording capabilities
                        </div>
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          AI feedback on explanations
                        </div>
                      </>
                    )}
                    
                    {index === 2 && (
                      <>
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          25-minute focused sessions
                        </div>
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          Smart break reminders
                        </div>
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          Daily productivity tracking
                        </div>
                      </>
                    )}
                    
                    {index === 3 && (
                      <>
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          Immediate post-reading quizzes
                        </div>
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          Adaptive difficulty levels
                        </div>
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          Spaced repetition algorithm
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Learn More Link */}
                  <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group cursor-pointer">
                    Learn more about this technique
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
      </div>
    </section>
  )
}