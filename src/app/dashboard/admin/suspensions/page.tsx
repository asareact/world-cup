import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import AdminSuspensionsDashboard from '@/components/admin/AdminSuspensionsDashboard'

export default async function SuspensionsPage() {
  // Verificar autenticación
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Verificar rol de usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'superAdmin' && profile.role !== 'capitan')) {
    redirect('/dashboard')
  }

  // Solo superAdmin puede acceder al panel de suspensiones
  if (profile.role !== 'superAdmin') {
    redirect('/dashboard')
  }

  return (
    <DashboardLayout>
      <AdminSuspensionsDashboard />
    </DashboardLayout>
  )
}