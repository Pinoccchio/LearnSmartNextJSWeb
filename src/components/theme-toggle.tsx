"use client"

import { useTheme } from '@/contexts/theme-context'
import { Button } from '@/components/ui/button'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme()
  const [showOptions, setShowOptions] = useState(false)

  const options = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ]

  const currentOption = options.find(option => option.value === theme)
  const CurrentIcon = currentOption?.icon || Monitor

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowOptions(!showOptions)}
        className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg relative"
        title={`Theme: ${currentOption?.label || 'System'}`}
      >
        <CurrentIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
      </Button>

      {showOptions && (
        <>
          {/* Overlay to close dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowOptions(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-2 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[120px]">
            {options.map((option) => {
              const Icon = option.icon
              const isSelected = theme === option.value
              
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setTheme(option.value)
                    setShowOptions(false)
                  }}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                    isSelected 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                  {isSelected && (
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full ml-auto" />
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}