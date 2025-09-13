"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowRight, UserPlus, Wallet } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import MetaMaskAuth from "@/components/auth/MetaMaskAuth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const { login, isAuthenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(email, password)
      // Redirect will happen via useEffect when isAuthenticated changes
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = email.trim() !== "" && password.trim() !== ""

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <Navigation />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass rounded-2xl p-8 space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
              >
                <LogIn className="w-8 h-8 text-white" />
              </motion.div>
              
              <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
              <p className="text-gray-200">Sign in to your medical AI account</p>
            </div>

            {/* Authentication Tabs */}
            <Tabs defaultValue="wallet" className="w-full text-black">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="wallet" className="flex items-center gap-2 text-black">
                  <Wallet className="w-4 h-4 text-black" />
                  MetaMask
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2 text-black">
                  <Mail className="w-4 h-4 text-black" />
                  Email
                </TabsTrigger>
              </TabsList>

              <TabsContent value="wallet" className="space-y-4 text-black">
                <MetaMaskAuth
                  onSuccess={() => router.push("/")}
                  onError={(error) => setError(error)}
                />
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-white">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/10 border-white/30 text-white placeholder-gray-300 focus:border-blue-400 focus:ring-blue-400/20"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-white">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/10 border-white/30 text-white placeholder-gray-300 focus:border-blue-400 focus:ring-blue-400/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-6 text-lg rounded-xl shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </motion.div>
                </form>
              </TabsContent>
            </Tabs>

            {/* Footer Links */}
            <div className="space-y-4">
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
              
              <div className="flex items-center">
                <div className="flex-1 border-t border-white/20"></div>
                <span className="px-3 text-sm text-gray-300">or</span>
                <div className="flex-1 border-t border-white/20"></div>
              </div>

              <div className="text-center">
                <span className="text-gray-200">Don't have an account? </span>
                <Link
                  href="/register"
                  className="text-blue-300 hover:text-blue-200 transition-colors font-medium"
                >
                  Sign up here
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-8 text-center"
          >
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <UserPlus className="w-4 h-4 text-blue-300" />
                <span className="text-sm font-medium text-white">New to Medical AI?</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Create an account to save your test results, track your eye health over time, 
                and access personalized medical insights.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}