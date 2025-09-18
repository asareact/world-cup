'use client'

import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export default function DashboardOverviewPage() {
  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  )
}