'use client'

import { motion } from 'framer-motion'
import { Trophy, Users, BarChart3, Calendar, ArrowRight, Star, Zap, Shield, Globe, LogIn, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthModal } from '@/components/auth-modal'

const features = [
  {
    icon: Trophy,
    title: 'Crear Torneos de Futsal',
    description: 'Organiza ligas y torneos de futsal con formatos específicos: eliminación directa, round-robin y grupos',
    color: 'from-yellow-400 to-orange-500'
  },
  {
    icon: Users,
    title: 'Gestión de Equipos',
    description: 'Administra plantillas de 5 jugadores, rotaciones, sustituciones y estadísticas individuales',
    color: 'from-blue-400 to-purple-500'
  },
  {
    icon: BarChart3,
    title: 'Estadísticas de Futsal',
    description: 'Seguimiento especializado: goles, asistencias, tarjetas, tiros libres y saques de esquina',
    color: 'from-green-400 to-blue-500'
  },
  {
    icon: Calendar,
    title: 'Programación Inteligente',
    description: 'Horarios optimizados para canchas de futsal con tiempos de 20 minutos por tiempo',
    color: 'from-pink-400 to-red-500'
  }
]

const stats = [
  { number: '3K+', label: 'Torneos de Futsal' },
  { number: '15K+', label: 'Equipos de 5 Jugadores' },
  { number: '180K+', label: 'Partidos de 40 Min' },
  { number: '99.9%', label: 'Tiempo de Actividad' }
]

export default function Home() {
  const { user, signOut, loading } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin')

  const handleAuthClick = (tab: 'signin' | 'signup') => {
    setAuthModalTab(tab)
    setAuthModalOpen(true)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-gray-900/80 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="relative">
                <Trophy className="h-9 w-9 text-green-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <span className="text-2xl font-black text-white tracking-tight">FutsalPro</span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-6">
                <nav className="hidden md:flex items-center space-x-6">
                  <Link href="#features" className="relative text-gray-300 hover:text-green-400 transition-colors font-medium group">
                    Características
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-600 transition-all group-hover:w-full"></span>
                  </Link>
                  <Link href="#stats" className="relative text-gray-300 hover:text-green-400 transition-colors font-medium group">
                    Estadísticas
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-600 transition-all group-hover:w-full"></span>
                  </Link>
                  <Link href="#about" className="relative text-gray-300 hover:text-green-400 transition-colors font-medium group">
                    Acerca de
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-600 transition-all group-hover:w-full"></span>
                  </Link>
                </nav>

                {!loading && (
                  <div className="flex items-center space-x-3">
                    {user ? (
                      <div className="flex items-center space-x-3">
                        <Link href="/dashboard" className="flex items-center space-x-2 text-gray-300 hover:text-green-400 transition-colors">
                          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <span className="hidden sm:block text-sm font-medium">
                            {user.user_metadata?.full_name || user.email?.split('@')[0]}
                          </span>
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span className="hidden sm:block">Salir</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleAuthClick('signin')}
                          className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                        >
                          <LogIn className="h-4 w-4" />
                          <span>Ingresar</span>
                        </button>
                        <button
                          onClick={() => handleAuthClick('signup')}
                          className="relative bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-full hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-sm"
                        >
                          <span className="relative z-10">Registrarse</span>
                          <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 hover:opacity-100 transition-opacity"></div>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-gray-800 opacity-30"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-green-400/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center space-x-2 bg-green-900/30 text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-8"
            >
              <Star className="h-4 w-4" />
              <span>Plataforma #1 para Torneos de Futsal</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight"
            >
              Gestiona tu Torneo de
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-green-500 to-blue-600"> Futsal</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              La plataforma más avanzada para organizar, seguir y analizar torneos de futsal profesionales. 
              <span className="font-semibold text-green-400">Desde equipos de 5 jugadores hasta estadísticas de cancha</span>, todo en un solo lugar.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
            >
              {user ? (
                <Link href="/dashboard" className="group relative bg-gradient-to-r from-green-600 to-green-700 text-white px-10 py-5 rounded-full text-lg font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-2xl hover:shadow-green-500/25 transform hover:scale-105 flex items-center space-x-3">
                  <span>Ir a Mi Dashboard</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Link>
              ) : (
                <button 
                  onClick={() => handleAuthClick('signup')}
                  className="group relative bg-gradient-to-r from-green-600 to-green-700 text-white px-10 py-5 rounded-full text-lg font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-2xl hover:shadow-green-500/25 transform hover:scale-105 flex items-center space-x-3"
                >
                  <span>Crear Mi Torneo de Futsal</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              )}
              <button className="group border-2 border-gray-600 text-gray-300 px-10 py-5 rounded-full text-lg font-bold hover:border-green-500 hover:text-green-400 transition-all bg-gray-800/50 backdrop-blur-sm">
                <span className="flex items-center space-x-2">
                  <span>Ver Demo</span>
                  <Globe className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                </span>
              </button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400"
            >
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span>100% Seguro</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-green-600" />
                <span>Tiempo Real</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-green-600" />
                <span>Especializado en Futsal</span>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Enhanced Floating Elements */}
        <motion.div 
          className="absolute top-1/4 right-10 w-20 h-20 bg-gradient-to-br from-gray-700 to-green-900 rounded-full shadow-2xl hidden lg:block border-4 border-gray-600"
          animate={{ 
            y: [-15, 15, -15],
            rotate: [0, 180, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <div className="absolute inset-2 bg-green-600 rounded-full opacity-20"></div>
        </motion.div>

        <motion.div 
          className="absolute top-3/4 left-10 w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-xl hidden lg:block"
          animate={{ 
            y: [-10, 20, -10],
            x: [-5, 5, -5],
            rotate: [0, -180, -360]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
        />
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 bg-gradient-to-r from-green-600 via-green-700 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-white mb-4"
            >
              Números que Hablan por Sí Solos
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-green-100 max-w-2xl mx-auto"
            >
              Confianza construida por la comunidad deportiva mundial
            </motion.p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-black text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-green-100 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black text-white mb-6"
            >
              Todo lo que necesitas para tu torneo
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-300 max-w-3xl mx-auto"
            >
              Herramientas profesionales diseñadas específicamente para las necesidades únicas del futsal: equipos de 5, canchas pequeñas, rotaciones rápidas
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group relative bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700"
              >
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl"
                     style={{ backgroundImage: `linear-gradient(to right, ${feature.color.split(' ')[0]}, ${feature.color.split(' ')[2]})` }}></div>
                
                <div className={`relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} mb-6 shadow-lg`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-green-400 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-gray-300 text-lg leading-relaxed">
                  {feature.description}
                </p>
                
                <div className="absolute top-4 right-4 w-2 h-2 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-gray-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 to-blue-900/10"></div>
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-8 left-1/3 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        
        <div className="relative max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 bg-green-900/30 text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-8"
          >
            <Trophy className="h-4 w-4" />
            <span>Únete a la Revolución del Futsal</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight"
          >
            ¿Listo para organizar tu 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600"> torneo de futsal perfecto?</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
          >
            Únete a <span className="font-bold text-green-400">más de 5,000 organizadores</span> que ya confían en FutsalPro para crear experiencias de futsal inolvidables
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12"
          >
            {user ? (
              <Link href="/dashboard" className="group relative bg-gradient-to-r from-green-600 to-green-700 text-white px-12 py-6 rounded-full text-xl font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-2xl hover:shadow-green-500/25 transform hover:scale-105">
                <span className="relative z-10 flex items-center space-x-3">
                  <span>Ir a Mi Dashboard</span>
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
            ) : (
              <button 
                onClick={() => handleAuthClick('signup')}
                className="group relative bg-gradient-to-r from-green-600 to-green-700 text-white px-12 py-6 rounded-full text-xl font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-2xl hover:shadow-green-500/25 transform hover:scale-105"
              >
                <span className="relative z-10 flex items-center space-x-3">
                  <span>Crear Torneo de Futsal</span>
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            )}
            
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white">+</div>
              </div>
              <span className="text-sm font-medium">+5,000 organizadores de futsal</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-900/30 rounded-full mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-white mb-2">100% Gratis</h4>
              <p className="text-gray-300 text-sm">Sin costos ocultos ni límites</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-900/30 rounded-full mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-white mb-2">Configuración Rápida</h4>
              <p className="text-gray-300 text-sm">Tu torneo de futsal listo en 5 minutos</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-900/30 rounded-full mb-4">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-white mb-2">Soporte 24/7</h4>
              <p className="text-gray-300 text-sm">Ayuda cuando la necesites</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Trophy className="h-6 w-6 text-green-400" />
              <span className="text-xl font-bold">FutsalPro</span>
            </div>
            <div className="text-gray-400">
              © 2024 FutsalPro. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </div>
  )
}