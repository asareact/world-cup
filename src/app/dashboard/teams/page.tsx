'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { TeamManagement } from '@/components/teams/team-management'

export default function TeamsPage() {
  return (
    <DashboardLayout>
      <TeamManagement />
    </DashboardLayout>
  )
}

