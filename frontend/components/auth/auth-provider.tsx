"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, authService } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    role?: 'patient' | 'doctor' | 'admin'
  }) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  hasRole: (role: 'patient' | 'doctor' | 'admin') => boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First check if we have a token and if it's valid
        if (authService.isAuthenticated()) {
          try {
            const currentUser = await authService.getCurrentUser()
            setUser(currentUser)
          } catch (error) {
            console.error('Failed to get current user:', error)
            // Clear invalid auth state
            await authService.logout()
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        // Ensure we clean up any invalid state
        await authService.logout()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { user: loggedInUser } = await authService.login(email, password)
      setUser(loggedInUser)
    } catch (error) {
      setUser(null)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    role?: 'patient' | 'doctor' | 'admin'
  }) => {
    setLoading(true)
    try {
      const { user: registeredUser } = await authService.register(userData)
      setUser(registeredUser)
    } catch (error) {
      setUser(null)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await authService.logout()
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      // Clear user state even if logout request fails
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    if (!authService.isAuthenticated()) {
      setUser(null)
      return
    }

    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
    }
  }

  const hasRole = (role: 'patient' | 'doctor' | 'admin') => {
    return user?.role === role
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && authService.isAuthenticated(),
    hasRole,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider