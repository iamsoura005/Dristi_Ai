"use client"

import { motion } from "framer-motion"
import { Eye, Brain, Heart, Users, Award, Lightbulb, Target, Sparkles, CheckCircle } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const timelineEvents = [
  {
    year: "2025 June",
    title: "Foundation",
    description:
      "RetinalAI was founded by a team of ophthalmologists and AI researchers with a vision to revolutionize retinal disease detection.",
    icon: Lightbulb,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    year: "2025 July",
    title: "First AI Model",
    description: "Developed our first deep learning model trained on over 100,000 retinal images with 95% accuracy.",
    icon: Brain,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    year: "2025 August",
    title: "Clinical Trials",
    description:
      "Conducted extensive clinical trials across 15 hospitals, achieving 99.2% accuracy in diabetic retinopathy detection.",
    icon: Award,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    year: "2025 September",
    title: "Presenting in Hackloop",
    description:
      "Presenting AI-powered retinal analysis platform, marking a milestone in Hackloop.",
    icon: CheckCircle,
    gradient: "from-yellow-500 to-orange-500",
  },
  
  {
    year: "2024",
    title: "Next Generation",
    description:
      "Launched our next-generation platform with multi-disease detection and real-time analysis capabilities.",
    icon: Eye,
    gradient: "from-indigo-500 to-purple-500",
  },
]

const values = [
  {
    icon: Heart,
    title: "Patient-Centered Care",
    description:
      "Every innovation we make is driven by our commitment to improving patient outcomes and quality of life.",
    gradient: "from-red-500 to-pink-500",
  },
  {
    icon: Brain,
    title: "Scientific Excellence",
    description: "We maintain the highest standards of scientific rigor in our research and development processes.",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    icon: Users,
    title: "Collaborative Innovation",
    description:
      "We work closely with healthcare professionals to ensure our solutions meet real-world clinical needs.",
    gradient: "from-green-500 to-teal-500",
  },
  {
    icon: Target,
    title: "Precision & Accuracy",
    description: "We are relentlessly focused on delivering the most accurate and reliable diagnostic tools available.",
    gradient: "from-purple-500 to-violet-500",
  },
]

const stats = [
  { value: "1M+", label: "Images Analyzed", gradient: "from-blue-400 to-cyan-400" },
  { value: "1,000+", label: "Healthcare Facilities", gradient: "from-purple-400 to-pink-400" },
  { value: "50+", label: "Countries Served", gradient: "from-green-400 to-emerald-400" },
  { value: "99.2%", label: "Accuracy Rate", gradient: "from-yellow-400 to-orange-400" },
]

export default function AboutPage() {
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
              <span className="text-sm font-medium text-blue-400 uppercase tracking-wider">Our Story</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              <span className="text-white">Pioneering the Future of</span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
                Retinal Healthcare
              </span>
            </h1>

            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              At Dristi AI, we're on a mission to democratize access to world-class retinal disease detection through
              the power of artificial intelligence and machine learning.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              To empower healthcare professionals worldwide with AI-driven diagnostic tools that enable early detection
              of retinal diseases, ultimately saving sight and improving lives. We believe that advanced medical
              technology should be accessible to every patient, regardless of their location or economic circumstances.
            </p>
            <div className="flex items-center justify-center space-x-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div
                    className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                  >
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Journey</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From a vision to revolutionize retinal healthcare to becoming a trusted partner for medical professionals
              worldwide.
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-0.5 w-1 h-full bg-gradient-to-b from-blue-500 via-purple-500 to-teal-500 rounded-full" />

            <div className="space-y-12">
              {timelineEvents.map((event, index) => {
                const Icon = event.icon
                const isEven = index % 2 === 0

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`flex items-center ${isEven ? "flex-row" : "flex-row-reverse"}`}
                  >
                    <div className={`w-1/2 ${isEven ? "pr-8 text-right" : "pl-8 text-left"}`}>
                      <motion.div
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="glass rounded-xl p-6 group hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                      >
                        <div className={`flex items-center space-x-3 mb-4 ${isEven ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`w-12 h-12 rounded-lg bg-gradient-to-r ${event.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}
                          >
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div
                              className={`text-2xl font-bold bg-gradient-to-r ${event.gradient} bg-clip-text text-transparent`}
                            >
                              {event.year}
                            </div>
                            <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                          </div>
                        </div>
                        <p className="text-gray-300 leading-relaxed">{event.description}</p>
                      </motion.div>
                    </div>

                    {/* Timeline Node */}
                    <div className="relative z-10">
                      <div
                        className={`w-6 h-6 rounded-full bg-gradient-to-r ${event.gradient} border-4 border-black`}
                      />
                    </div>

                    <div className="w-1/2" />
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Values</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              The principles that guide everything we do and drive our commitment to excellence in healthcare
              innovation.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="glass rounded-xl p-8 group hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-r ${value.gradient} flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                        {value.title}
                      </h3>
                      <p className="text-gray-300 leading-relaxed">{value.description}</p>
                    </div>
                  </div>
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
              Join Us in
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {" "}
                Transforming Healthcare
              </span>
            </h2>

            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Be part of the revolution in retinal healthcare. Experience the power of AI-driven diagnostics and help us
              save sight worldwide.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg px-8 py-6 rounded-xl shadow-2xl shadow-blue-500/25"
                >
                  Get Started Today
                </Button>
              </motion.div>

              <Link href="/contact">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="glass border-2 border-blue-400/30 hover:border-blue-400/60 hover:bg-blue-400/10 text-white text-lg px-8 py-6 rounded-xl bg-transparent"
                  >
                    Contact Our Team
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
