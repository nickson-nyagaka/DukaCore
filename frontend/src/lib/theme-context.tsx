'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  brand: string
  setBrand: (brand: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Read initial theme synchronously from DOM attribute (set by head script)
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const domTheme = document.documentElement.getAttribute('data-theme') as Theme
      if (domTheme === 'light' || domTheme === 'dark') return domTheme
      const stored = localStorage.getItem('theme') as Theme
      if (stored === 'light' || stored === 'dark') return stored
    }
    return 'dark'
  })

  // Read initial brand synchronously
  const [brand, setBrandState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const domBrand = document.documentElement.getAttribute('data-brand')
      if (domBrand) return domBrand
      return localStorage.getItem('brand') || 'default'
    }
    return 'default'
  })

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  const setBrand = useCallback((newBrand: string) => {
    setBrandState(newBrand)
    localStorage.setItem('brand', newBrand)
    document.documentElement.setAttribute('data-brand', newBrand)
  }, [])

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme, brand, setBrand }),
    [theme, toggleTheme, setTheme, brand, setBrand]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
