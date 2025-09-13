"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Eye, Brain, Users, Mail, TestTube, ArrowRight, Upload, LogIn, LogOut, User, Settings, Contrast, Type, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { ThemeToggle } from "./theme-toggle"

const navItems = [
  { href: "/", label: "Home", icon: Eye },
  { href: "/features", label: "Features", icon: Brain },
  { href: "/analyze", label: "Analyze", icon: Upload },
  { href: "/refractive-analysis", label: "Refractive Power", icon: Calculator },
  { href: "/about", label: "About", icon: Users },
  { href: "/color-test", label: "Color Test", icon: TestTube },
  { href: "/contact", label: "Contact", icon: Mail },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout, loading } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      setShowUserMenu(false)
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "glass-nav border-b border-white/10 shadow-2xl shadow-black/20" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <motion.div
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              whileHover={{ rotate: 720 }}
              transition={{ duration: 0.6 }}
            >
              <Eye className="w-5 h-5 text-white" />
            </motion.div>
            <span className="font-bold text-xl text-glass group-hover:text-glass-accent transition-all duration-500">
              {"Dristi AI"}
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <motion.div key={item.href} className="relative">
                  <Link
                    href={item.href}
                    className={`relative flex items-center space-x-2 text-sm font-medium transition-all duration-300 px-3 py-2 rounded-lg group ${
                      isActive ? "text-glass-accent" : "text-glass hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-transform duration-300 ${
                        isActive ? "text-blue-400" : "group-hover:scale-110"
                      }`}
                    />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Accessibility Controls */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => document.documentElement.classList.toggle('high-contrast')}
              className="glass border-white/30 hover:bg-white/20"
              aria-label="Toggle high contrast mode"
            >
              <Contrast className="h-[1.2rem] w-[1.2rem]" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => document.documentElement.classList.toggle('large-text')}
              className="glass border-white/30 hover:bg-white/20"
              aria-label="Toggle large text mode"
            >
              <Type className="h-[1.2rem] w-[1.2rem]" />
            </Button>
            
            {!loading && (
              <>
                {isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    {/* User Info */}
                    <div className="relative">
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-white">
                            {user?.first_name} {user?.last_name}
                          </div>
                          <div className="text-xs text-gray-400 capitalize">
                            {user?.role}
                          </div>
                        </div>
                      </button>

                      {/* User Dropdown Menu */}
                      <AnimatePresence>
                        {showUserMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-2 w-64 glass rounded-xl shadow-xl z-50"
                          >
                            <div className="p-4 border-b border-white/10">
                              <div className="font-medium text-white">
                                {user?.first_name} {user?.last_name}
                              </div>
                              <div className="text-sm text-gray-400">{user?.email}</div>
                              <div className="text-xs text-blue-400 capitalize mt-1">
                                {user?.role} Account
                              </div>
                            </div>
                            
                            <div className="p-2">
                              <Link
                                href="/dashboard"
                                onClick={() => setShowUserMenu(false)}
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                              >
                                <Settings className="w-4 h-4" />
                                <span>Dashboard</span>
                              </Link>
                              
                              <button
                                onClick={handleLogout}
                                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-colors"
                              >
                                <LogOut className="w-4 h-4" />
                                <span>Sign Out</span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link href="/login">
                      <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                    
                    <Link href="/register">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg shadow-lg shadow-blue-500/25 group transition-all duration-300">
                          Get Started
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </motion.div>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          <motion.div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden backdrop-blur-md border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-400/30"
                          : "hover:bg-white/5 text-gray-300 hover:text-white"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </motion.div>
                )
              })}
              <motion.div
                className="pt-4 border-t border-white/10 mt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: navItems.length * 0.1 }}
              >
                {!loading && (
                  <>
                    {isAuthenticated ? (
                      <div className="space-y-3">
                        <div className="px-4 py-3 bg-white/5 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-white">
                                {user?.first_name} {user?.last_name}
                              </div>
                              <div className="text-xs text-gray-400 capitalize">
                                {user?.role} Account
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                            <Settings className="w-4 h-4 mr-2" />
                            Dashboard
                          </Button>
                        </Link>
                        
                        <Button 
                          onClick={handleLogout}
                          variant="outline" 
                          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Link href="/login" onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                            <LogIn className="w-4 h-4 mr-2" />
                            Sign In
                          </Button>
                        </Link>
                        
                        <Link href="/register" onClick={() => setIsOpen(false)}>
                          <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-xl shadow-lg shadow-blue-500/25">
                            Get Started
                          </Button>
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
