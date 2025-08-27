"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LANDING_NAVIGATION } from "@/lib/constants"
import { Menu, X, LayoutDashboard, LogOut, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"

export default function Navigation() {
  const { user, logout } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'nav-blur bg-white/90 dark:bg-gray-900/90 shadow-lg' 
          : 'bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/logo/logo.png"
                alt="LearnSmart Logo"
                width={120}
                height={48}
                className="h-8 w-auto"
                priority
              />
              <div className={`text-xl font-bold transition-colors ${
                isScrolled 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                LearnSmart
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {LANDING_NAVIGATION.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400 ${
                    isScrolled 
                      ? 'text-gray-700 dark:text-gray-300' 
                      : 'text-gray-700 dark:text-blue-100 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <ThemeToggle />
              
              {user ? (
                // Authenticated user actions
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {user.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded capitalize">
                      {user.role}
                    </span>
                  </div>
                  
                  {user.role === 'admin' && (
                    <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Link href="/admin">
                        <LayoutDashboard className="w-4 h-4 mr-1" />
                        Admin Dashboard
                      </Link>
                    </Button>
                  )}
                  
                  {user.role === 'instructor' && (
                    <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Link href="/instructor">
                        <LayoutDashboard className="w-4 h-4 mr-1" />
                        Instructor Dashboard
                      </Link>
                    </Button>
                  )}
                  
                  {user.role === 'student' && (
                    <span className="text-sm text-gray-600 dark:text-gray-400 px-3 py-1.5">
                      Please use the mobile app
                    </span>
                  )}
                  
                  <Button 
                    onClick={logout}
                    variant="outline"
                    size="sm"
                    className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Logout
                  </Button>
                </div>
              ) : (
                // Unauthenticated user actions
                <Button 
                  asChild
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Link href="/login">
                    Sign In
                  </Link>
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col gap-4">
                {LANDING_NAVIGATION.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-700 dark:text-gray-300 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
                  >
                    {item.name}
                  </Link>
                ))}
                
                <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {user ? (
                    // Authenticated mobile actions
                    <>
                      <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          {user.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded capitalize">
                          {user.role}
                        </span>
                      </div>
                      
                      {user.role === 'admin' && (
                        <Button 
                          asChild
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link href="/admin">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Admin Dashboard
                          </Link>
                        </Button>
                      )}
                      
                      {user.role === 'instructor' && (
                        <Button 
                          asChild
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Link href="/instructor">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Instructor Dashboard
                          </Link>
                        </Button>
                      )}
                      
                      {user.role === 'student' && (
                        <div className="text-center text-sm text-gray-600 dark:text-gray-400 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          Please use the mobile app for your studies
                        </div>
                      )}
                      
                      <Button 
                        onClick={() => {
                          logout()
                          setIsMobileMenuOpen(false)
                        }}
                        variant="outline"
                        className="w-full text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    // Unauthenticated mobile actions
                    <Button 
                      asChild
                      className="w-full"
                    >
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        Sign In
                      </Link>
                    </Button>
                  )}
                  
                  <div className="flex justify-center pt-2">
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* Spacer to prevent content from going under fixed nav */}
      <div className="h-16"></div>
    </>
  )
}