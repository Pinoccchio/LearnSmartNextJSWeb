"use client"

import { useState, createContext, useContext, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, Bell, Settings, User, GraduationCap, Menu, LayoutDashboard, BookOpen, Users, BarChart3 } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import ProtectedRoute from '@/components/auth/protected-route'

// Create context for sidebar state
const InstructorSidebarContext = createContext<{
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}>({
  isCollapsed: false,
  setIsCollapsed: () => {}
})

// Create context for instructor courses
const InstructorCoursesContext = createContext<{
  courses: any[]
  coursesLoading: boolean
  coursesError: string | null
  refreshCourses: () => void
}>({
  courses: [],
  coursesLoading: false,
  coursesError: null,
  refreshCourses: () => {}
})

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [coursesError, setCoursesError] = useState<string | null>(null)
  const { user } = useAuth()

  // Fetch instructor courses
  const fetchCourses = async () => {
    if (!user?.id) return

    setCoursesLoading(true)
    setCoursesError(null)

    try {
      console.log('🏫 Fetching instructor courses for header display')
      
      const fetchPromise = fetch('/api/instructor/courses', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
          'X-User-Role': user.role
        },
        credentials: 'include'
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Course fetch timeout')), 10000)
      )
      
      const response = await Promise.race([fetchPromise, timeoutPromise])
      
      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`)
      }
      
      const result = await response.json()
      const instructorCourses = result.courses || []
      
      console.log('✅ Instructor courses fetched for header:', instructorCourses.length, 'courses')
      setCourses(instructorCourses)
    } catch (error: any) {
      console.error('💥 Error fetching instructor courses for header:', error)
      setCoursesError(error.message || 'Failed to load courses')
    } finally {
      setCoursesLoading(false)
    }
  }

  const refreshCourses = () => {
    fetchCourses()
  }

  // Fetch courses when user is available - with caching
  useEffect(() => {
    if (user?.id && courses.length === 0 && !coursesLoading) {
      fetchCourses()
    }
  }, [user?.id, courses.length, coursesLoading])

  return (
    <ProtectedRoute requiredRole="instructor">
      <InstructorSidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
        <InstructorCoursesContext.Provider value={{ courses, coursesLoading, coursesError, refreshCourses }}>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <InstructorSidebar />
            <InstructorContent>{children}</InstructorContent>
          </div>
        </InstructorCoursesContext.Provider>
      </InstructorSidebarContext.Provider>
    </ProtectedRoute>
  )
}

function InstructorContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useContext(InstructorSidebarContext)
  
  return (
    <div className={`transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
      {/* Modern Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <SidebarToggle />
              <div className="md:ml-0 ml-12">
                <PageTitle />
              </div>
            </div>
            <InstructorHeader />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 bg-transparent">
        {children}
      </main>
    </div>
  )
}


// Sidebar Toggle Component
function SidebarToggle() {
  const { isCollapsed, setIsCollapsed } = useContext(InstructorSidebarContext)
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setIsCollapsed(!isCollapsed)}
      className="hidden md:flex hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
    >
      <Menu className="h-4 w-4 text-gray-600 dark:text-gray-300" />
    </Button>
  )
}

// Custom Instructor Sidebar Component
function InstructorSidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { isCollapsed } = useContext(InstructorSidebarContext)
  const pathname = usePathname()

  const instructorNavItems = [
    { name: 'Dashboard', href: '/instructor', icon: LayoutDashboard },
    { name: 'My Course', href: '/instructor/courses', icon: BookOpen },
    { name: 'My Students', href: '/instructor/students', icon: Users },
    { name: 'Teaching Analytics', href: '/instructor/analytics', icon: BarChart3 }
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden fixed top-4 left-4 z-50 bg-white shadow-md hover:shadow-lg border border-gray-200"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className="flex h-full flex-col bg-white dark:bg-gray-900 w-full">
          {/* Logo Section */}
          <div className="flex items-center h-16 justify-center px-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            {isCollapsed ? (
              <img
                src="/images/logo/logo.png"
                alt="LearnSmart Logo"
                className="h-10 w-auto rounded-md"
              />
            ) : (
              <div className="flex items-center gap-3">
                <img
                  src="/images/logo/logo.png"
                  alt="LearnSmart Logo"
                  className="h-10 w-auto rounded-md"
                />
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  LearnSmart
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3">
            {instructorNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative ${
                    isActive 
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" 
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className={`flex-shrink-0 h-5 w-5 ${isCollapsed ? '' : 'mr-3'} transition-colors duration-200 ${
                    isActive ? "text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                  }`} />
                  {!isCollapsed && (
                    <>
                      <span className="transition-opacity duration-200">{item.name}</span>
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white/50" />
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </nav>

        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          <div 
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="md:hidden fixed left-0 top-0 z-50 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-xl transform transition-transform duration-300">
            {/* Mobile sidebar content - same as desktop but always expanded */}
          </aside>
        </>
      )}
    </>
  )
}

function PageTitle() {
  const pathname = usePathname()
  
  const getPageTitle = () => {
    if (pathname === '/instructor') return 'My Dashboard'
    if (pathname === '/instructor/courses') return 'My Course'
    if (pathname === '/instructor/students') return 'My Students'
    if (pathname === '/instructor/analytics') return 'Teaching Analytics'
    return 'Instructor Panel'
  }

  const getPageDescription = () => {
    if (pathname === '/instructor') return 'Welcome back to your criminology course'
    if (pathname === '/instructor/courses') return 'Manage your course content and modules'
    if (pathname === '/instructor/students') return 'Monitor student progress and intervention'
    if (pathname === '/instructor/analytics') return 'Teaching effectiveness and student insights'
    return 'Instructor dashboard for LearnSmart'
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-emerald-600" />
        {getPageTitle()}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{getPageDescription()}</p>
    </div>
  )
}

function InstructorHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { courses, coursesLoading, coursesError } = useContext(InstructorCoursesContext)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Format course titles for display
  const formatCourseDisplay = () => {
    if (coursesLoading) {
      return 'Loading courses...'
    }
    
    if (coursesError) {
      return 'Error loading courses'
    }
    
    if (!courses || courses.length === 0) {
      return 'No courses assigned'
    }
    
    if (courses.length === 1) {
      return courses[0].title || 'Untitled Course'
    }
    
    if (courses.length === 2) {
      return `${courses[0].title}, ${courses[1].title}`
    }
    
    if (courses.length === 3) {
      const titles = courses.map(c => c.title).join(', ')
      return titles.length > 40 ? `${courses.length} Courses Assigned` : titles
    }
    
    // For 4+ courses, show count
    return `${courses.length} Courses Assigned`
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Notifications */}
      <Button
        variant="ghost"
        size="sm"
        className="relative hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
      >
        <Bell className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full text-xs flex items-center justify-center text-white">
          2
        </span>
      </Button>

      {/* Settings */}
      <Button
        variant="ghost"
        size="sm"
        className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
      >
        <Settings className="h-4 w-4 text-gray-600 dark:text-gray-300" />
      </Button>

      {/* User Profile Section */}
      <div className="flex items-center space-x-3 pl-3 border-l border-gray-200 dark:border-gray-700">
        <div className="hidden sm:block text-right">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name || 'Prof. Juan Dela Cruz'}</p>
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs">
              Instructor
            </Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400" title={courses?.map(c => c.title).join(', ')}>
            {formatCourseDisplay()}
          </p>
        </div>
        
        {/* User Avatar */}
        <div className="relative">
          <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        
        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}