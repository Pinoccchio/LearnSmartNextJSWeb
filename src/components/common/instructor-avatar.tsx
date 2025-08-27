"use client"

import { User, Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface InstructorAvatarProps {
  instructor?: {
    id: string
    name: string
    email: string
    profile_picture?: string
  } | null
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  showStatus?: boolean
  showTooltip?: boolean
}

export function InstructorAvatar({ 
  instructor, 
  size = 'md', 
  showName = true, 
  showStatus = true,
  showTooltip = true 
}: InstructorAvatarProps) {
  // Size configurations
  const sizeConfig = {
    sm: {
      avatar: 'w-8 h-8',
      text: 'text-xs',
      icon: 'w-4 h-4',
      badge: 'w-4 h-4'
    },
    md: {
      avatar: 'w-12 h-12',
      text: 'text-sm',
      icon: 'w-5 h-5',
      badge: 'w-5 h-5'
    },
    lg: {
      avatar: 'w-16 h-16',
      text: 'text-base',
      icon: 'w-6 h-6',
      badge: 'w-6 h-6'
    }
  }

  const config = sizeConfig[size]

  // Generate initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Component for when instructor is assigned
  const AssignedInstructor = () => (
    <div className="flex items-center gap-3">
      <div className="relative">
        {instructor?.profile_picture ? (
          <img
            src={instructor.profile_picture}
            alt={instructor.name}
            className={`${config.avatar} rounded-full object-cover border-2 border-green-500`}
          />
        ) : (
          <div className={`${config.avatar} rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-green-500 flex items-center justify-center text-white font-semibold ${config.text}`}>
            {getInitials(instructor?.name || 'IN')}
          </div>
        )}
        
        {showStatus && (
          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
            <Check className={`${config.badge} text-white`} />
          </div>
        )}
      </div>
      
      {showName && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-gray-900 dark:text-white ${config.text}`}>
              {instructor?.name}
            </span>
            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 border-purple-200 dark:border-purple-700">
              Instructor
            </Badge>
          </div>
          {showTooltip && (
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {instructor?.email}
            </span>
          )}
        </div>
      )}
    </div>
  )

  // Component for when no instructor is assigned
  const UnassignedInstructor = () => (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className={`${config.avatar} rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center`}>
          <User className={`${config.icon} text-gray-400 dark:text-gray-500`} />
        </div>
        
        {showStatus && (
          <div className="absolute -bottom-1 -right-1 bg-gray-400 rounded-full p-1">
            <X className={`${config.badge} text-white`} />
          </div>
        )}
      </div>
      
      {showName && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-gray-600 dark:text-gray-300 ${config.text}`}>
              No Instructor
            </span>
            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600">
              Unassigned
            </Badge>
          </div>
          {showTooltip && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Needs instructor assignment
            </span>
          )}
        </div>
      )}
    </div>
  )

  return instructor ? <AssignedInstructor /> : <UnassignedInstructor />
}