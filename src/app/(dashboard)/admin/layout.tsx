"use client"

import { useState, createContext, useContext, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, Bell, Settings, User, Shield, Menu, LayoutDashboard, BookOpen, Users, BarChart3 } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import ProtectedRoute from '@/components/auth/protected-route'

// Create context for sidebar state
const AdminSidebarContext = createContext<{
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}>({
  isCollapsed: false,
  setIsCollapsed: () => {}
})

// Create context for admin dashboard data
export const AdminDataContext = createContext<{
  dashboardData: any
  dataLoading: boolean
  dataError: string | null
  refreshData: () => void
}>({
  dashboardData: null,
  dataLoading: false,
  dataError: null,
  refreshData: () => {}
})

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  const { user } = useAuth()

  // Fetch admin dashboard data
  const fetchData = async () => {
    if (!user?.id) return

    setDataLoading(true)
    setDataError(null)

    try {
      console.log('🏫 Fetching admin dashboard data')
      
      const fetchPromise = fetch('/api/admin/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
          'X-User-Role': user.role
        },
        credentials: 'include'
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Dashboard data fetch timeout')), 10000)
      )
      
      const response = await Promise.race([fetchPromise, timeoutPromise])
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication error. Please refresh the page and log in again.')
        }
        throw new Error(`Failed to fetch dashboard data: ${response.status}`)
      }
      
      const result = await response.json()
      
      console.log('✅ Admin dashboard data fetched successfully')
      setDashboardData(result)
    } catch (error: any) {
      console.error('💥 Error fetching admin dashboard data:', error)
      setDataError(error.message || 'Failed to load dashboard data')
    } finally {
      setDataLoading(false)
    }
  }

  const refreshData = () => {
    fetchData()
  }

  // Fetch data when user is available - with caching
  useEffect(() => {
    if (user?.id && user?.role === 'admin' && !dashboardData && !dataLoading) {
      fetchData()
    }
  }, [user?.id, user?.role, dashboardData, dataLoading])

  return (
    <ProtectedRoute requiredRole="admin">
      <AdminSidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
        <AdminDataContext.Provider value={{ dashboardData, dataLoading, dataError, refreshData }}>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <AdminSidebar />
            <AdminContent>{children}</AdminContent>
          </div>
        </AdminDataContext.Provider>
      </AdminSidebarContext.Provider>
    </ProtectedRoute>
  )
}

function AdminContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useContext(AdminSidebarContext)
  
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
            <AdminHeader />
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
  const { isCollapsed, setIsCollapsed } = useContext(AdminSidebarContext)
  
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

// Custom Admin Sidebar Component
function AdminSidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { isCollapsed } = useContext(AdminSidebarContext)
  const pathname = usePathname()

  const adminNavItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Course Management', href: '/admin/courses', icon: BookOpen },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 }
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700"
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
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative ${
                    isActive 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" 
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
    if (pathname === '/admin') return 'Dashboard'
    if (pathname === '/admin/courses') return 'Course Management'
    if (pathname === '/admin/users') return 'User Management'
    if (pathname === '/admin/analytics') return 'Analytics'
    return 'Admin Panel'
  }

  const getPageDescription = () => {
    if (pathname === '/admin') return 'Welcome back to LearnSmart Admin'
    if (pathname === '/admin/courses') return 'Manage criminology courses and modules'
    if (pathname === '/admin/users') return 'Manage students and instructors'
    if (pathname === '/admin/analytics') return 'AI-powered insights and reports'
    return 'Administration panel for LearnSmart'
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Shield className="h-5 w-5 text-blue-600" />
        {getPageTitle()}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{getPageDescription()}</p>
    </div>
  )
}

function AdminHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
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
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
          3
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
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name || 'Admin User'}</p>
            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">
              Admin
            </Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">RKM Criminology Solutions</p>
        </div>
        
        {/* User Avatar */}
        <div className="relative">
          <div className="h-8 w-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-sm">
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