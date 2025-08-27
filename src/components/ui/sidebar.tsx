"use client"

import { useState, createContext, useContext } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  BarChart3, 
  Menu, 
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'

interface SidebarProps {
  role: 'admin' | 'instructor'
}

const adminNavItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    name: 'Course Management',
    href: '/admin/courses',
    icon: BookOpen
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3
  }
]

const instructorNavItems = [
  {
    name: 'Dashboard',
    href: '/instructor',
    icon: LayoutDashboard
  },
  {
    name: 'Course',
    href: '/instructor/courses',
    icon: BookOpen
  },
  {
    name: 'My Students',
    href: '/instructor/students',
    icon: Users
  },
  {
    name: 'Analytics',
    href: '/instructor/analytics',
    icon: BarChart3
  }
]

// Create context for sidebar state
const SidebarContext = createContext<{
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}>({
  isCollapsed: false,
  setIsCollapsed: () => {},
  isMobileOpen: false,
  setIsMobileOpen: () => {}
})

export function Sidebar({ role }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  
  const navItems = role === 'admin' ? adminNavItems : instructorNavItems

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white">
      {/* Logo Section */}
      <div className={cn(
        "flex items-center border-b border-gray-200 bg-gray-50/50 transition-all duration-300",
        isCollapsed ? "h-16 justify-center px-2" : "h-16 justify-center px-6"
      )}>
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo/logo.png"
            alt="LearnSmart Logo"
            width={isCollapsed ? 32 : 120}
            height={isCollapsed ? 16 : 48}
            className={cn(
              "rounded-md transition-all duration-300",
              isCollapsed ? "h-8 w-auto" : "h-10 w-auto"
            )}
            priority
          />
          {!isCollapsed && (
            <div className="text-lg font-bold text-gray-900 transition-opacity duration-300">
              LearnSmart
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-1 p-3", isCollapsed && "px-2")}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                isCollapsed && "justify-center px-2"
              )}
            >
              <Icon className={cn(
                "flex-shrink-0 transition-colors duration-200",
                isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700",
                isCollapsed ? "h-5 w-5" : "h-5 w-5 mr-3"
              )} />
              {!isCollapsed && (
                <span className="transition-opacity duration-200">{item.name}</span>
              )}
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white/50" />
              )}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse Toggle (Desktop only) */}
      <div className="hidden md:block border-t border-gray-200 p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "w-full justify-center hover:bg-gray-100 transition-all duration-200",
            isCollapsed && "px-2"
          )}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4 text-gray-500" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }}>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden fixed top-4 left-4 z-50 bg-white shadow-md hover:shadow-lg border border-gray-200"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          {/* Overlay */}
          <div 
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Mobile Sidebar Panel */}
          <aside className="md:hidden fixed left-0 top-0 z-50 h-screen w-64 bg-white border-r border-gray-200 shadow-xl transform transition-transform duration-300">
            <SidebarContent />
          </aside>
        </>
      )}
    </SidebarContext.Provider>
  )
}

// Hook to use sidebar context
export function useSidebar() {
  return useContext(SidebarContext)
}