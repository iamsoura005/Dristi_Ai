import {
  Search,
  Bell,
  User,
  LayoutDashboard,
  Settings,
  Compass,
  Users,
  Package,
  Sliders,
  ChevronsDown,
  MessageSquare,
} from "lucide-react"

// The main App component that contains the entire UI
const App = () => {
  // Array to hold the sidebar navigation items
  const navItems = [
    { name: "Bandcards", icon: <LayoutDashboard size={20} />, count: 123 },
    { name: "Playbooks", icon: <Package size={20} />, count: 18 },
    { name: "Team", icon: <Users size={20} />, count: 42 },
    { name: "Settings", icon: <Settings size={20} />, count: 53 },
    { name: "Compass", icon: <Compass size={20} />, count: 86 },
  ]

  // Array for the smaller bottom navigation items
  const bottomNavItems = [
    { name: "Message", icon: <MessageSquare size={20} /> },
    { name: "Adjust", icon: <Sliders size={20} /> },
    { name: "Down", icon: <ChevronsDown size={20} /> },
  ]

  return (
    // Main container with a dark background and text color
    <div className="min-h-screen bg-[#0E0E10] text-gray-300 p-6 font-sans flex antialiased">
      {/* Sidebar navigation container */}
      <aside className="w-64 flex-shrink-0 bg-[#1A1A1E] rounded-3xl p-6 flex flex-col justify-between shadow-lg">
        <div>
          {/* Logo/title section */}
          <div className="flex items-center space-x-2 text-white font-bold text-2xl mb-12">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-teal-400">Team</span>
          </div>
          {/* Main navigation list */}
          <nav className="space-y-4">
            {navItems.map((item, index) => (
              <a
                key={index}
                href="#"
                className="flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover:bg-white/10 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-gray-400 group-hover:text-purple-400 transition-colors">{item.icon}</div>
                  <span className="text-gray-400 group-hover:text-white font-medium transition-colors">
                    {item.name}
                  </span>
                </div>
                {item.count && (
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/10 text-white/70">
                    {item.count}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </div>

        {/* Bottom navigation section */}
        <div className="mt-8 pt-4 border-t border-gray-700/50">
          <nav className="flex space-x-3">
            {bottomNavItems.map((item, index) => (
              <a
                key={index}
                href="#"
                className="p-3 rounded-xl transition-colors duration-200 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                {item.icon}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col ml-6">
        {/* Top header/profile section */}
        <header className="flex-shrink-0 flex items-center justify-between bg-[#1A1A1E] rounded-3xl p-4 shadow-lg mb-6">
          {/* Team title in the header */}
          <div className="flex items-center space-x-2 text-white font-bold text-xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-teal-400">Team</span>
          </div>
          {/* Search bar */}
          <div className="flex-1 max-w-lg mx-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-gray-800/50 text-white placeholder-gray-500 rounded-full py-2 px-6 pl-10 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            </div>
          </div>
          {/* User icons */}
          <div className="flex items-center space-x-4 text-gray-400">
            <Bell size={24} className="hover:text-white cursor-pointer transition-colors" />
            <User size={24} className="hover:text-white cursor-pointer transition-colors" />
            <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium text-white/80">User</span>
          </div>
        </header>

        {/* Main content section with the unique card */}
        <section className="flex-1 flex items-center justify-center p-6 bg-[#1A1A1E] rounded-3xl shadow-lg relative overflow-hidden">
          {/* Background glow effects */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-500/20 mix-blend-screen filter blur-3xl opacity-50 animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-400/20 mix-blend-screen filter blur-3xl opacity-50 animate-pulse delay-200"></div>
          </div>

          {/* The main card with glassmorphism effect */}
          <div className="relative z-10 p-8 rounded-3xl backdrop-filter backdrop-blur-2xl bg-white/10 border border-white/20 shadow-xl">
            {/* The central triangular shape */}
            <div
              className="w-[450px] h-[350px] bg-gradient-to-br from-[#7700FF] to-[#00FFF1] rounded-2xl flex items-center justify-center"
              style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
            >
              {/* Mirrored text inside the triangle */}
              <div className="flex items-center justify-center h-full w-full">
                <p className="text-white text-3xl font-bold p-8 text-center" style={{ transform: "scaleX(-1)" }}>
                  <span style={{ transform: "scaleX(-1)" }}>Your next steps await!</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
