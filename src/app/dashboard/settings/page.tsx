'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuración</h1>
          <p className="text-gray-400">Preferencias de tu cuenta y de la aplicación</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 text-gray-300">
          Aquí podrás ajustar opciones de perfil, notificaciones y preferencias del sistema.
        </div>
      </div>
    </DashboardLayout>
  )
}

