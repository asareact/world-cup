'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { INVITADO_PUBLIC_TOURNAMENT_ROUTE } from '@/lib/role-routes'

export default function DashboardPage() {
  const router = useRouter()
  const { user, role, loading } = useAuth()

  useEffect(() => {
    // Redirigir basado en el rol del usuario
    if (!loading && user) {
      let destination: string | null = null

      if (role === 'superAdmin') {
        destination = '/dashboard/overview'
      } else if (role === 'capitan') {
        destination = '/dashboard/tournaments'
      } else if (role === 'arbitro') {
        destination = '/dashboard/matches'
      } else if (role === 'invitado') {
        destination = INVITADO_PUBLIC_TOURNAMENT_ROUTE
      } else {
        destination = '/dashboard/tournaments'
      }

      if (destination) {
        router.replace(destination)
      }
    }
  }, [user, role, loading, router])

  // Mientras se carga o se redirige, no mostrar nada
  return null
}



