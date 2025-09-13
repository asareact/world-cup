'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { EditTeamForm } from '@/components/teams/edit-team-form'
import { useParams } from 'next/navigation'

export default function EditTeamPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id as string
  return (
    <DashboardLayout>
      <EditTeamForm teamId={id} />
    </DashboardLayout>
  )
}
