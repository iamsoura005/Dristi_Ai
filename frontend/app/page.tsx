"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Sparkles, TestTube, Eye, Brain, Shield, Zap, CheckCircle, Star, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import Link from "next/link"


export default function HomePage() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Background is now global via layout.tsx */}

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
          {/* Enhanced Main Content with glassmorphic backdrop */}
          <div className="glass-strong p-8 md:p-12">
            {/* Enhanced Main Headline with typewriter effect */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="space-y-6"
            >
             

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
                <motion.span
                  className="block bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-center text-transparent text-readable-strong"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  {"Dristi AI-\nThe Ultimate\nOphthamologist"}
                </motion.span>
                <motion.span
                  className="block text-glass text-readable-strong"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  Advanced Fundus
                </motion.span>
                <motion.span
                  className="block bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent text-readable-strong"
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
              className="text-xl md:text-2xl text-glass max-w-3xl mx-auto leading-relaxed font-light"
            >
              AI-powered retinal disease detection with{" "}
              <span className="text-glass-accent font-semibold">clinical-grade accuracy</span>. Revolutionizing early
              diagnosis and patient care through advanced machine learning.
            </motion.p>
          </div>

          {/* Enhanced CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 flex-wrap"
          >
            <Link href="/analyze">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="glass-strong bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-600/90 hover:to-purple-700/90 text-white text-lg px-10 py-7 rounded-xl shadow-2xl shadow-blue-500/25 group relative overflow-hidden border-0"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Eye className="w-6 h-6 mr-3" />
                  Start Analysis
                  <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </Link>

            <Link href="/refractive-analysis">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="glass border-2 border-purple-400/50 hover:border-purple-400/80 hover:bg-purple-400/20 text-glass text-lg px-10 py-7 rounded-xl group"
                >
                  <Calculator className="w-6 h-6 mr-3 text-purple-400" />
                  Refractive Power
                </Button>
              </motion.div>
            </Link>

            <Link href="/color-test">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="glass border-2 border-teal-400/50 hover:border-teal-400/80 hover:bg-teal-400/20 text-glass text-lg px-10 py-7 rounded-xl group"
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
                  className="glass-card p-6 rounded-2xl text-center group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
                >
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div
                    className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2 text-readable`}
                  >
                    {stat.value}
                  </div>
                  <div className="text-gray-200 font-medium text-glass">{stat.label}</div>
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
            className="text-center mb-16 glass-card p-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-glass text-readable-strong mb-4">Trusted by Medical Professionals</h2>
            <p className="text-glass-muted text-lg max-w-2xl mx-auto">
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
                  className="glass-card p-6 rounded-xl text-center group"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-glass mb-2">{feature.title}</h3>
                  <p className="text-glass-muted text-sm">{feature.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
