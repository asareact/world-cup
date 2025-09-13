'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { JoinRequestsPanel } from '@/components/dashboard/join-requests-panel'

export default function RequestsPage() {
  const { user, loading, role } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!user) return null

  // Sólo visible para superAdmin o creadores de torneos (la consulta RLS limita datos de todas formas)
  if (role !== 'superAdmin') {
    return (
      <DashboardLayout>
        <div className="text-gray-300">No tienes acceso a esta sección.</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Solicitudes de participación</h1>
          <p className="text-gray-400">Aprueba o rechaza solicitudes de equipos a tus torneos</p>
        </div>
        <JoinRequestsPanel />
      </div>
    </DashboardLayout>
  )
}

