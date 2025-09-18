'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export default function DashboardPage() {
  const router = useRouter()
  const { user, role, loading } = useAuth()

  useEffect(() => {
    // Redirigir basado en el rol del usuario
    if (!loading && user) {
      if (role === 'capitan') {
        router.replace('/dashboard/my-team')
      } else if (role === 'superAdmin') {
        router.replace('/dashboard/overview')
      } else {
        // Para invitados, mostrar torneos públicos
        router.replace('/tournaments')
      }
    }
  }, [user, role, loading, router])

  // Mientras se carga o se redirige, mostrar un mensaje
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-white">Redirigiendo...</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
