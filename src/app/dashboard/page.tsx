'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function DashboardPage() {
  const router = useRouter()
  const { user, role, loading } = useAuth()

  useEffect(() => {
    // Redirigir basado en el rol del usuario
    if (!loading && user) {
      if (role === 'superAdmin') {
        router.replace('/dashboard/overview')
      } else {
        // Para capitanes e invitados, mostrar torneos por defecto
        router.replace('/dashboard/tournaments')
      }
    }
  }, [user, role, loading, router])

  // Mientras se carga o se redirige, no mostrar nada
  return null
}
