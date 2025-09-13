'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { PublicTournamentsGrid } from '@/components/tournaments/public-tournaments-grid'

export default function DashboardPage() {
  const { user, loading, role } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  // Redirect captains to Teams page for focused experience
  useEffect(() => {
    if (!loading && user && role === 'capitan') {
      router.replace('/dashboard/teams')
    }
  }, [loading, user, role, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (role === 'capitan') return null

  return (
    <DashboardLayout>
      {role === 'superAdmin' ? <DashboardOverview /> : <PublicTournamentsGrid />}
    </DashboardLayout>
  )
}
