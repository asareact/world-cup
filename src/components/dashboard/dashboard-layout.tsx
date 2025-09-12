'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, 
  Users, 
  BarChart3, 
  Calendar, 
  Settings, 
  Menu, 
  X, 
  LogOut, 
  User,
  Plus,
  Home
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useDashboardStats } from '@/lib/hooks/use-dashboard-stats'

const sidebarItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard', id: 'dashboard' },
  { icon: Trophy, label: 'Mis Torneos', href: '/dashboard/tournaments', id: 'tournaments' },
  { icon: Users, label: 'Equipos', href: '/dashboard/teams', id: 'teams' },
  { icon: Calendar, label: 'Partidos', href: '/dashboard/matches', id: 'matches' },
  { icon: BarChart3, label: 'Estadísticas', href: '/dashboard/stats', id: 'stats' },
  { icon: Settings, label: 'Configuración', href: '/dashboard/settings', id: 'settings' },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  )
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { stats } = useDashboardStats()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const getActiveItem = () => {
    if (pathname === '/dashboard') return 'dashboard'
    const pathSegments = pathname.split('/')
    return pathSegments[2] || 'dashboard'
  }

  const activeItem = getActiveItem()

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    // Set initial value and subscribe
    setIsDesktop(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="mx-auto w-full max-w-7xl flex">
      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isDesktop ? 0 : (sidebarOpen ? 0 : -300),
        }}
        className="fixed lg:static inset-y-0 left-0 z-50 w-72 shrink-0 bg-gray-800 border-r border-gray-700 lg:translate-x-0 lg:block"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="relative">
                <Trophy className="h-8 w-8 text-green-500" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <span className="text-xl font-black text-white">FutsalPro</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.user_metadata?.full_name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => {
              const isActive = activeItem === item.id
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group ${
                    isActive
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-green-400'}`} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-green-600 rounded-xl -z-10"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-700">
            <button 
              onClick={() => router.push('/dashboard/tournaments')}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span>Nuevo Torneo</span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-gray-800 border-b border-gray-700 lg:pl-0">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-white"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {sidebarItems.find(item => item.id === activeItem)?.label || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-400">
                  Gestiona tus torneos de futsal
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{stats.activeTournaments}</p>
                <p className="text-xs text-gray-400">Torneos Activos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{stats.totalTeams}</p>
                <p className="text-xs text-gray-400">Equipos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{stats.matchesPlayed}</p>
                <p className="text-xs text-gray-400">Partidos</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
            {children}
          </div>
        </main>
      </div>
      </div>
    </div>
  )
}
