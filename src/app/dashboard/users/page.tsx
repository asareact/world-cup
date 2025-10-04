"use client"

import { UserRolesManagement } from '@/components/admin-panels'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { UserManagement } from '@/components/dashboard/user-management'

export default function UsersDashboardPage() {
  return (
    <DashboardLayout>
      <UserRolesManagement />
    </DashboardLayout>
  )
}
