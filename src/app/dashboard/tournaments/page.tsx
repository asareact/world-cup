'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { TournamentManagement } from '@/components/dashboard/tournament-management'
import { useAuth } from '@/lib/auth-context'

export default function TournamentsPage() {
  const { role } = useAuth()
  
  return (
    <DashboardLayout>
      <TournamentManagement />
    </DashboardLayout>
  )
}

