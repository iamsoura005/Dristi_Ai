"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import { Loader2, Lock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "patient" | "doctor" | "admin"
  requireAuth?: boolean
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !isAuthenticated) {
        router.push("/login")
        return
      }
      
      if (requiredRole && user && user.role !== requiredRole) {
        // User doesn't have required role
        return
      }
      
      setShowContent(true)
    }
  }, [loading, isAuthenticated, user, requiredRole, requireAuth, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto" />
          <p className="text-white text-lg">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized for wrong role
  if (requiredRole && user && user.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 max-w-md mx-auto text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Access Denied</h1>
            <p className="text-gray-300">
              This area is restricted to {requiredRole}s only.
            </p>
          </div>

          <div className="p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-400">Current Role</span>
            </div>
            <p className="text-sm text-orange-300 capitalize">
              You are signed in as a {user.role}
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                Return to Home
              </Button>
            </Link>
            
            <p className="text-xs text-gray-400">
              Need access? Contact your administrator or create a new account with the appropriate role.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Don't show content until verification is complete
  if (!showContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  // Show protected content
  return <>{children}</>
}

// Higher-order component for easy wrapping
export function withAuth<T extends object>(
  Component: React.ComponentType<T>, 
  requiredRole?: "patient" | "doctor" | "admin"
) {
  return function WrappedComponent(props: T) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Role-specific components
export function PatientRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRole="patient">{children}</ProtectedRoute>
}

export function DoctorRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRole="doctor">{children}</ProtectedRoute>
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>
}