'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'

export default function StatsPage() {
  return (
    <DashboardLayout>
      {/* Reutilizamos el overview como sección de estadísticas por ahora */}
      <DashboardOverview />
    </DashboardLayout>
  )
}

