'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { db, JoinRequest } from '@/lib/database'
import { useTeams } from '@/lib/hooks/use-teams'

export function JoinRequestButton({ tournamentId }: { tournamentId: string }) {
  const { user, role } = useAuth()
  const { teams, loading: teamsLoading } = useTeams()
  const [loading, setLoading] = useState(false)
  const [request, setRequest] = useState<JoinRequest | null>(null)
  const [error, setError] = useState<string | null>(null)

  const myTeam = useMemo(() => teams[0], [teams])

  const refreshRequest = async () => {
    if (!myTeam) return
    try {
      const existing = await db.getJoinRequest(tournamentId, myTeam.id)
      setRequest(existing || null)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refreshRequest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTeam?.id, tournamentId])

  const disabledReason = useMemo(() => {
    if (!user) return 'Inicia sesión'
    if (role !== 'capitan') return 'Solo capitanes'
    if (teamsLoading) return 'Cargando equipo'
    if (!myTeam) return 'Crea tu equipo primero'
    if (request?.status === 'pending') return 'Solicitud enviada'
    if (request?.status === 'approved') return 'Aprobado'
    if (request?.status === 'rejected') return 'Rechazado'
    return null
  }, [user, role, teamsLoading, myTeam, request])

  const handleClick = async () => {
    if (!user || !myTeam) return
    setError(null)
    setLoading(true)
    try {
      const created = await db.createJoinRequest(tournamentId, myTeam.id, user.id)
      setRequest(created)
    } catch (e) {
      console.error(e)
      setError('No se pudo enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  if (disabledReason && !['Solicitud enviada', 'Aprobado', 'Rechazado'].includes(disabledReason)) {
    // Hide button in cases it doesn't make sense
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={!!disabledReason || loading}
        className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        <span>{disabledReason || 'Solicitar participación'}</span>
      </button>
      {error && <span className="text-red-400 text-sm">{error}</span>}
    </div>
  )
}
