"use client"

import { LANDING_TESTIMONIALS } from "@/lib/constants"
import { Quote, Star, GraduationCap } from "lucide-react"

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 mb-6">
            <GraduationCap className="w-4 h-4 mr-2" />
            Student Success Stories
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Real Results from
            <span className="block gradient-text">Real Students</span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what criminology students are saying 
            about their success with LearnSmart's study techniques.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {LANDING_TESTIMONIALS.map((testimonial, index) => (
            <div key={index} className="testimonial-card rounded-2xl p-6 relative">
              {/* Quote Icon */}
              <div className="absolute -top-4 left-6">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Quote className="w-4 h-4 text-white" />
                </div>
              </div>
              
              {/* Rating */}
              <div className="flex items-center mb-4 pt-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              
              {/* Quote */}
              <blockquote className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </blockquote>
              
              {/* Author Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {testimonial.course}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Additional Success Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 lg:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Join the Success Community
            </h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              LearnSmart users consistently outperform their peers in board exams and academic assessments.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Success Rate */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">85%</div>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Board Exam Pass Rate
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Students using LearnSmart have an 85% first-attempt pass rate on criminology board exams
              </p>
            </div>
            
            {/* Grade Improvement */}
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">23%</div>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Average Grade Boost
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Students see an average 23% improvement in their grades within the first semester
              </p>
            </div>
            
            {/* Retention Rate */}
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">92%</div>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Student Retention
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                92% of students continue using LearnSmart throughout their entire criminology program
              </p>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  )
}