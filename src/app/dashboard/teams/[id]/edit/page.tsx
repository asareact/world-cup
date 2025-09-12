'use server'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { EditTeamForm } from '@/components/teams/edit-team-form'

export default async function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <DashboardLayout>
      <EditTeamForm teamId={id} />
    </DashboardLayout>
  )
}
