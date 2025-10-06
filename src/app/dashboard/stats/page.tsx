"use client"

import { PlayerStatsManagement } from '@/components/admin-panels'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'



export default function StatsPage() {
  return (
    <DashboardLayout>
      <PlayerStatsManagement />
    </DashboardLayout>
  )
}
