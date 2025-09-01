"use client"

import { useEffect, useRef } from "react"

export function AtmosphericBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    let animationId: number
    let time = 0

    const animate = () => {
      time += 0.01

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create gradient background
      const bgGradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height),
      )
      bgGradient.addColorStop(0, "rgba(20, 30, 48, 0.8)")
      bgGradient.addColorStop(0.5, "rgba(10, 15, 25, 0.9)")
      bgGradient.addColorStop(1, "rgba(5, 8, 15, 1)")

      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Animated glow effects
      const glowIntensity = 0.5 + Math.sin(time) * 0.3

      // Bottom light bar
      const barGradient = ctx.createLinearGradient(0, canvas.height - 100, 0, canvas.height)
      barGradient.addColorStop(0, `rgba(0, 255, 255, ${glowIntensity * 0.1})`)
      barGradient.addColorStop(0.5, `rgba(0, 200, 255, ${glowIntensity * 0.8})`)
      barGradient.addColorStop(1, `rgba(0, 150, 255, ${glowIntensity})`)

      ctx.fillStyle = barGradient
      ctx.fillRect(0, canvas.height - 60, canvas.width, 60)

      // Floating glow orbs
      for (let i = 0; i < 3; i++) {
        const x = (canvas.width / 4) * (i + 1) + Math.sin(time + i) * 50
        const y = canvas.height / 3 + Math.cos(time * 0.7 + i) * 30
        const radius = 150 + Math.sin(time + i) * 30

        const orbGradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        orbGradient.addColorStop(0, `rgba(0, 255, 255, ${glowIntensity * 0.3})`)
        orbGradient.addColorStop(0.3, `rgba(0, 200, 255, ${glowIntensity * 0.2})`)
        orbGradient.addColorStop(0.7, `rgba(0, 150, 255, ${glowIntensity * 0.1})`)
        orbGradient.addColorStop(1, "rgba(0, 100, 200, 0)")

        ctx.fillStyle = orbGradient
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      // Subtle particle effects
      for (let i = 0; i < 20; i++) {
        const x = (Math.sin(time * 0.5 + i) * canvas.width) / 4 + canvas.width / 2
        const y = (Math.cos(time * 0.3 + i) * canvas.height) / 4 + canvas.height / 2
        const opacity = ((Math.sin(time + i) + 1) / 2) * 0.5

        ctx.fillStyle = `rgba(0, 255, 255, ${opacity})`
        ctx.beginPath()
        ctx.arc(x, y, 1, 0, Math.PI * 2)
        ctx.fill()
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <>
      {/* Static CSS background as fallback */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-cyan-500/50 via-blue-500/30 to-transparent blur-sm" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-2/3 left-1/2 w-56 h-56 bg-teal-400/20 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Animated canvas overlay */}
      <canvas ref={canvasRef} className="fixed inset-0 -z-10 pointer-events-none" style={{ mixBlendMode: "screen" }} />
    </>
  )
}
