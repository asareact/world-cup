'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { db, JoinRequest } from '@/lib/database'
import { Check, X, Users } from 'lucide-react'

type AdminJoinRequest = JoinRequest & {
  team?: { id: string, name: string, logo_url: string | null }
  tournament?: { id: string, name: string, creator_id: string }
}

export function JoinRequestsPanel() {
  const { user, role } = useAuth()
  const [requests, setRequests] = useState<AdminJoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchRequests = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)
      const data = await db.getPendingJoinRequestsForAdmin(user.id, role === 'superAdmin')
      setRequests(data)
    } catch (e) {
      console.error(e)
      setError('Error al cargar solicitudes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [user])

  const decision = async (id: string, approve: boolean) => {
    if (!user) return
    setProcessing(id)
    try {
      if (approve) await db.approveJoinRequest(id, user.id)
      else await db.rejectJoinRequest(id, user.id)
      await fetchRequests()
    } catch (e) {
      console.error(e)
      setError('No se pudo actualizar la solicitud')
    } finally {
      setProcessing(null)
    }
  }

  if (!user || role !== 'superAdmin') return null
  if (loading) return null
  if (requests.length === 0) return null

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Solicitudes de participación</h3>
      </div>
      {error && <div className="text-red-400 mb-3 text-sm">{error}</div>}
      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-700 overflow-hidden flex items-center justify-center">
                {r.team?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.team.logo_url} alt={r.team.name} className="w-full h-full object-cover" />
                ) : (
                  <Users className="h-4 w-4 text-gray-300" />
                )}
              </div>
              <div>
                <div className="text-white text-sm">{r.team?.name}</div>
                <div className="text-gray-400 text-xs">Torneo: {r.tournament?.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => decision(r.id, true)}
                disabled={processing === r.id}
                className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 flex items-center gap-1 text-sm"
              >
                <Check className="h-4 w-4" /> Aprobar
              </button>
              <button
                onClick={() => decision(r.id, false)}
                disabled={processing === r.id}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 flex items-center gap-1 text-sm"
              >
                <X className="h-4 w-4" /> Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
