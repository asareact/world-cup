'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { EditTeamForm } from '@/components/teams/edit-team-form'

interface EditTeamPageProps {
  params: {
    id: string
  }
}

export default function EditTeamPage({ params }: EditTeamPageProps) {
  return (
    <DashboardLayout>
      <EditTeamForm teamId={params.id} />
    </DashboardLayout>
  )
}