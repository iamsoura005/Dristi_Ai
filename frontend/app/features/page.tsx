"use client"

import { motion } from "framer-motion"
import { Brain, Eye, Zap, Shield, BarChart3, Clock, Users, CheckCircle, ArrowRight, Sparkles } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description:
      "Advanced machine learning algorithms trained on millions of retinal images for precise disease detection and classification.",
    highlights: ["Deep Learning Models", "Neural Networks", "Pattern Recognition"],
    gradient: "from-blue-500 to-cyan-500",
    delay: 0,
  },
  {
    icon: Eye,
    title: "Multi-Disease Detection",
    description:
      "Comprehensive screening for 15+ retinal conditions including diabetic retinopathy, glaucoma, and macular degeneration.",
    highlights: ["Diabetic Retinopathy", "Glaucoma Detection", "AMD Screening"],
    gradient: "from-purple-500 to-pink-500",
    delay: 0.1,
  },
  {
    icon: Zap,
    title: "Real-Time Processing",
    description:
      "Get instant results with our optimized processing pipeline that delivers accurate analysis in under 30 seconds.",
    highlights: ["< 30s Analysis", "Cloud Processing", "Instant Reports"],
    gradient: "from-yellow-500 to-orange-500",
    delay: 0.2,
  },
  {
    icon: Shield,
    title: "Clinical Grade Security",
    description:
      "HIPAA-compliant infrastructure with end-to-end encryption ensuring your patient data remains secure and private.",
    highlights: ["HIPAA Compliant", "End-to-End Encryption", "Secure Storage"],
    gradient: "from-green-500 to-emerald-500",
    delay: 0.3,
  },
]

const additionalFeatures = [
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Comprehensive reporting and trend analysis for better patient outcomes.",
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Round-the-clock access to AI analysis whenever you need it.",
  },
  {
    icon: Users,
    title: "Multi-User Support",
    description: "Collaborative platform for healthcare teams and specialists.",
  },
  {
    icon: CheckCircle,
    title: "Quality Assurance",
    description: "Rigorous validation processes ensure consistent, reliable results.",
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-blue-400 uppercase tracking-wider">Advanced Features</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
                Cutting-Edge Technology
              </span>
              <br />
              <span className="text-white">for Medical Excellence</span>
            </h1>

            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Discover the powerful features that make RetinalAI the most advanced retinal analysis platform trusted by
              healthcare professionals worldwide.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: feature.delay }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="glass rounded-2xl p-8 group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500"
                >
                  {/* Icon and Title */}
                  <div className="flex items-start space-x-4 mb-6">
                    <div
                      className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="space-y-3">
                    {feature.highlights.map((highlight, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: feature.delay + 0.1 + idx * 0.1 }}
                        viewport={{ once: true }}
                        className="flex items-center space-x-3"
                      >
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.gradient}`} />
                        <span className="text-gray-400 text-sm font-medium">{highlight}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Hover Effect Overlay */}
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`}
                  />
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need for
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {" "}
                Success
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Additional features designed to streamline your workflow and enhance patient care.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5, scale: 1.05 }}
                  className="glass rounded-xl p-6 text-center group hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-12 space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Ready to Transform Your
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {" "}
                Practice?
              </span>
            </h2>

            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of healthcare professionals who trust RetinalAI for accurate, fast, and reliable retinal
              disease detection.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg px-8 py-6 rounded-xl shadow-2xl shadow-blue-500/25 group"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>

              <Link href="/about">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="glass border-2 border-blue-400/30 hover:border-blue-400/60 hover:bg-blue-400/10 text-white text-lg px-8 py-6 rounded-xl bg-transparent"
                  >
                    Learn More
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
