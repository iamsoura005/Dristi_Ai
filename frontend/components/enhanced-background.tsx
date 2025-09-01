"use client"

export const EnhancedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base dark background */}
      <div className="absolute inset-0 bg-[#0E0E10]" />

      {/* Animated glow effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-500/20 mix-blend-screen filter blur-3xl opacity-50 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-400/20 mix-blend-screen filter blur-3xl opacity-50 animate-pulse delay-200" />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 rounded-full bg-blue-500/15 mix-blend-screen filter blur-2xl opacity-40 animate-pulse delay-500" />
        <div className="absolute top-1/2 right-1/3 w-80 h-80 rounded-full bg-indigo-500/15 mix-blend-screen filter blur-3xl opacity-30 animate-pulse delay-700" />
      </div>

      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-teal-900/10" />
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/5 via-transparent to-indigo-900/5" />
    </div>
  )
}
