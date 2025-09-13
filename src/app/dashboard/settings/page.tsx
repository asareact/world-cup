'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { useAuth } from '@/lib/auth-context'
import { useProfile } from '@/lib/hooks/use-profile'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { db } from '@/lib/database'

export default function SettingsPage() {
  const { user } = useAuth()
  const { updateFullName, loading: saving, error } = useProfile()
  const [fullName, setFullName] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const initializeProfile = async () => {
      if (user) {
        try {
          // Obtener el nombre de los metadatos del usuario
          const metadataName = user.user_metadata?.full_name || ''
          
          // Si no hay nombre en los metadatos, intentamos obtenerlo de la base de datos
          if (!metadataName) {
            const profile = await db.getProfile(user.id)
            const name = profile.full_name || ''
            setFullName(name)
          } else {
            setFullName(metadataName)
          }
        } catch (error) {
          // Si hay un error, usamos el email como fallback
          const fallbackName = user.email || ''
          setFullName(fallbackName)
          console.error('Error initializing profile:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    initializeProfile()
  }, [user])

  const handleSave = async () => {
    if (!user) return
    
    try {
      const result = await updateFullName(fullName)
      if (result.success) {
        setIsEditing(false)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      // Error already handled in the hook, but we can add additional logging if needed
      console.error('Error in handleSave:', err)
    }
  }

  const handleCancel = () => {
    // Resetear al valor de los metadatos del usuario o email
    const metadataName = user?.user_metadata?.full_name || user?.email || ''
    setFullName(metadataName || '')
    setIsEditing(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuración</h1>
          <p className="text-gray-400">Preferencias de tu cuenta y de la aplicación</p>
        </div>
        
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Perfil</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Editar
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre completo
              </label>
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={fullName ?? ''}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Tu nombre completo"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                  {loading ? 'Cargando...' : fullName || 'No especificado'}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Correo electrónico
              </label>
              <div className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                {user?.email || 'No disponible'}
              </div>
            </div>
          </div>
          
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-green-900/50 border border-green-800 rounded-lg text-green-400"
            >
              ¡Perfil actualizado correctamente!
            </motion.div>
          )}
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-400"
            >
              Error al actualizar el perfil: {error}
            </motion.div>
          )}
        </div>
        
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 text-gray-300">
          Aquí podrás ajustar opciones de perfil, notificaciones y preferencias del sistema.
        </div>
      </div>
    </DashboardLayout>
  )
}