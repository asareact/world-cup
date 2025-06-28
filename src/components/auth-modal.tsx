'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'signin' | 'signup'
}

export function AuthModal({ isOpen, onClose, defaultTab = 'signin' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(defaultTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn, signUp, signInWithGoogle } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (activeTab === 'signin') {
        const { error } = await signIn(email, password)
        if (error) throw error
        onClose()
      } else {
        const { error } = await signUp(email, password, { full_name: name })
        if (error) throw error
        setError('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ha ocurrido un error'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) throw error
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión con Google'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setError('')
    setShowPassword(false)
  }

  const switchTab = (tab: 'signin' | 'signup') => {
    setActiveTab(tab)
    resetForm()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="p-6 pb-0">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {activeTab === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </h2>
                <p className="text-gray-300">
                  {activeTab === 'signin' 
                    ? 'Accede a tu cuenta de FutsalPro' 
                    : 'Únete a la comunidad de FutsalPro'
                  }
                </p>
              </div>

              {/* Tabs */}
              <div className="flex bg-gray-700 rounded-lg p-1 mb-6">
                <button
                  onClick={() => switchTab('signin')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'signin'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => switchTab('signup')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'signup'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Registrarse
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              {error && (
                <div className={`p-3 rounded-lg text-sm mb-4 ${
                  error.includes('exitoso') 
                    ? 'bg-green-900/50 text-green-300 border border-green-700'
                    : 'bg-red-900/50 text-red-300 border border-red-700'
                }`}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Tu nombre completo"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Procesando...' : (activeTab === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta')}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800 text-gray-400">O continúa con</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="mt-4 w-full bg-white text-gray-900 py-3 px-4 rounded-lg font-semibold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}