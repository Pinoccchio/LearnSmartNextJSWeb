"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextProps {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [isDark, setIsDark] = useState(false)

  // Initialize theme from what's already applied
  useEffect(() => {
    const initializeTheme = () => {
      if (typeof window === 'undefined') return

      // Get saved theme from localStorage
      const savedTheme = localStorage.getItem('theme') as Theme
      const currentTheme = savedTheme && ['light', 'dark', 'system'].includes(savedTheme) ? savedTheme : 'system'
      
      // Check if dark class is already applied (by our blocking script)
      const isDarkApplied = document.documentElement.classList.contains('dark')
      
      setThemeState(currentTheme)
      setIsDark(isDarkApplied)
    }

    initializeTheme()
  }, [])

  // Update theme when theme state changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkSystemPreference = () => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    const updateTheme = () => {
      let shouldBeDark = false

      if (theme === 'dark') {
        shouldBeDark = true
      } else if (theme === 'light') {
        shouldBeDark = false
      } else {
        // system
        shouldBeDark = checkSystemPreference()
      }

      setIsDark(shouldBeDark)
      
      // Update document class
      if (shouldBeDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    // Only update if theme actually changed (not initial load)
    if (theme !== 'system' || localStorage.getItem('theme')) {
      updateTheme()
    }

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        updateTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}