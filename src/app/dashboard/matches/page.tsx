'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { useAuth } from '@/lib/auth-context'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MatchesPage() {
  const { role } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (role !== 'superAdmin') router.replace('/dashboard')
  }, [role, router])
  if (role !== 'superAdmin') return null
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Partidos</h1>
          <p className="text-gray-400">Programa y administra los partidos de tus torneos</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 text-gray-300">
          Aún no hay interfaz específica para partidos. Aquí podrás ver, crear y actualizar partidos asociados a tus torneos.
        </div>
      </div>
    </DashboardLayout>
  )
}

