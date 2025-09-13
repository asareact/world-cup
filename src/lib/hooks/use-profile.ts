import { useAuth } from '@/lib/auth-context'
import { useState } from 'react'

export function useProfile() {
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateFullName = async (fullName: string) => {
    if (!user) {
      const errorMsg = 'Usuario no autenticado'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }

    setLoading(true)
    setError(null)

    try {
      // Permitir que fullName sea una cadena vacía (para borrar el nombre)
      await updateProfile({ full_name: fullName || undefined })
      return { success: true, error: null }
    } catch (err) {
      let errorMessage = 'Error al actualizar el perfil'
      
      if (err instanceof Error) {
        // Proporcionar mensajes de error más específicos
        if (err.message.includes('constraint')) {
          errorMessage = 'Error de validación en los datos del perfil'
        } else if (err.message.includes('permission')) {
          errorMessage = 'No tienes permisos para actualizar el perfil'
        } else if (err.message.includes('network')) {
          errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet'
        } else if (err.message.includes('coerce')) {
          errorMessage = 'Error de formato en los datos del perfil. Por favor, intenta con un nombre diferente.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return {
    updateFullName,
    loading,
    error
  }
}