'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { CreateTeamForm } from '@/components/teams/create-team-form'

export default function CreateTeamPage() {
  return (
    <DashboardLayout>
      <CreateTeamForm />
    </DashboardLayout>
  )
}

