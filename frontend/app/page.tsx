"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Sparkles, TestTube, Eye, Brain, Shield, Zap, CheckCircle, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function HomePage() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Enhanced floating particles with mouse interaction */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 4 + 1,
                height: Math.random() * 4 + 1,
                background: `linear-gradient(45deg, hsl(${200 + Math.random() * 60}, 70%, 60%), hsl(${260 + Math.random() * 60}, 70%, 60%))`,
              }}
              initial={{
                x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1200),
                y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
              }}
              animate={{
                y: [null, -30, 30],
                x: [null, -15, 15],
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
            x: useTransform(scrollYProgress, [0, 1], [0, -100]),
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)",
            x: useTransform(scrollYProgress, [0, 1], [0, 100]),
          }}
        />

        <div className="max-w-5xl mx-auto text-center space-y-12 relative z-10">
          {/* Enhanced Main Headline with typewriter effect */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-6"
          >
            <motion.div
              className="flex items-center justify-center space-x-3 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse" />
              <Sparkles className="w-6 h-6 text-blue-400" />
              <span className="text-sm font-semibold text-blue-400 uppercase tracking-widest">
                AI-Powered Medical Analysis
              </span>
              <Sparkles className="w-6 h-6 text-purple-400" />
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 animate-pulse" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
              <motion.span
                className="block bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-center text-transparent"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {"Drisit AI- The Ultimate\nOphthamologist"}
              </motion.span>
              <motion.span
                className="block text-white mt-2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Advanced Fundus
              </motion.span>
              <motion.span
                className="block bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                Image Analysis
              </motion.span>
            </h1>
          </motion.div>

          {/* Enhanced Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light"
          >
            AI-powered retinal disease detection with{" "}
            <span className="text-blue-400 font-semibold">clinical-grade accuracy</span>. Revolutionizing early
            diagnosis and patient care through advanced machine learning.
          </motion.p>

          {/* Enhanced CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link href="/analyze">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg px-10 py-7 rounded-xl shadow-2xl shadow-blue-500/25 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity" />
                  <Eye className="w-6 h-6 mr-3" />
                  Start Analysis
                  <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </Link>

            <Link href="/color-test">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="glass border-2 border-teal-400/30 hover:border-teal-400/60 hover:bg-teal-400/10 text-white text-lg px-10 py-7 rounded-xl group backdrop-blur-md bg-black"
                >
                  <TestTube className="w-6 h-6 mr-3 text-teal-400" />
                  Color Blindness Checker
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Enhanced Stats with animations */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto"
          >
            {[
              { label: "Accuracy Rate", value: "99.2%", icon: CheckCircle, color: "from-green-400 to-emerald-500" },
              { label: "Diseases Detected", value: "15+", icon: Brain, color: "from-blue-400 to-cyan-500" },
              { label: "Analysis Time", value: "<30s", icon: Zap, color: "from-yellow-400 to-orange-500" },
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.6 + index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="glass rounded-2xl p-8 text-center group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
                >
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div
                    className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}
                  >
                    {stat.value}
                  </div>
                  <div className="text-gray-400 font-medium">{stat.label}</div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Trusted by Medical Professionals</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Join thousands of healthcare providers using RetinalAI for accurate, fast, and reliable retinal analysis.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "FDA Approved", desc: "Clinically validated" },
              { icon: Star, title: "99.2% Accuracy", desc: "Peer-reviewed results" },
              { icon: Zap, title: "Real-time Analysis", desc: "Instant results" },
              { icon: Eye, title: "15+ Conditions", desc: "Comprehensive detection" },
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="glass rounded-xl p-6 text-center group bg-slate-800/50"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
