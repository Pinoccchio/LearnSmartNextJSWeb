"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Play, BookOpen, Brain, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient and pattern */}
      <div className="absolute inset-0 hero-gradient hero-pattern"></div>
      
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/30 dark:bg-white/5 rounded-full floating-animation"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-blue-300/20 dark:bg-white/5 rounded-full floating-animation"></div>
        <div className="absolute bottom-20 left-1/4 w-32 h-32 bg-blue-100/40 dark:bg-white/5 rounded-full floating-animation"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left relative">
            <div className="mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/90 dark:bg-white/20 text-gray-900 dark:text-white backdrop-blur-sm border border-gray-200 dark:border-white/20">
                <Brain className="w-4 h-4 mr-2" />
                AI-Powered Learning Platform
              </span>
            </div>
            
            <div className="relative">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Master Criminology with
                <span className="block gradient-text bg-gradient-to-r from-yellow-400 to-orange-500 dark:from-yellow-300 dark:to-orange-300 bg-clip-text text-transparent">
                  Smart Study Techniques
                </span>
              </h1>
            </div>
            
            <p className="text-xl text-gray-700 dark:text-blue-100 mb-8 max-w-2xl">
              Transform your criminology studies with AI-powered Active Recall, Feynman Technique, 
              and proven study methods. Join 409+ students achieving higher grades and board exam success.
            </p>
            
            
            {/* Stats Preview */}
            <div className="grid grid-cols-3 gap-6 text-center lg:text-left">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">409+</div>
                <div className="text-gray-600 dark:text-blue-200 text-sm">Active Students</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">85%</div>
                <div className="text-gray-600 dark:text-blue-200 text-sm">Board Pass Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">23%</div>
                <div className="text-gray-600 dark:text-blue-200 text-sm">Grade Improvement</div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Visual */}
          <div className="relative">
            <div className="relative z-10">
              {/* Main Hero Image/Illustration */}
              <div className="glass-card rounded-2xl p-8 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <Image
                    src="/images/logo/logo.png"
                    alt="LearnSmart Logo"
                    width={150}
                    height={60}
                    className="h-12 w-auto"
                  />
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Live</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900 dark:text-white">Criminal Law Module</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <span>Progress</span>
                      <span>78%</span>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Brain className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-900 dark:text-white">Active Recall Session</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      AI generated 12 questions from your recent reading
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-gray-900 dark:text-white">Study Group</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      3 classmates online • Discussing Constitutional Law
                    </p>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}