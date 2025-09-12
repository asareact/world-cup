'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export default function MatchesPage() {
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

