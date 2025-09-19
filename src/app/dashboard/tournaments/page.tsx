'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { TournamentManagement } from '@/components/dashboard/tournament-management'

export default function TournamentsPage() {
  
  return (
    <DashboardLayout>
      <TournamentManagement />
    </DashboardLayout>
  )
}

