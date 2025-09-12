'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { TournamentManagement } from '@/components/dashboard/tournament-management'
import { useAuth } from '@/lib/auth-context'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TournamentsPage() {
  const { role } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (role !== 'superAdmin') router.replace('/dashboard')
  }, [role, router])
  if (role !== 'superAdmin') return null
  return (
    <DashboardLayout>
      <TournamentManagement />
    </DashboardLayout>
  )
}

