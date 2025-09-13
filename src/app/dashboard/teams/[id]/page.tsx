'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { db, Player, Team } from '@/lib/database'
import { ArrowLeft, Users, Crown, Mail, Phone, Loader2 } from 'lucide-react'

type TeamWithPlayers = Team & { players?: Pick<Player, 'id'|'name'|'position'|'is_active'|'is_captain'>[] }

export default function TeamDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id as string
  const router = useRouter()
  const [team, setTeam] = useState<TeamWithPlayers | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const t = await db.getTeam(id)
        setTeam(t as TeamWithPlayers)
      } catch (e) {
        console.error(e)
        setError('No se pudo cargar el equipo')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const players = (team?.players || []).filter(p => p.is_active)
  const captain = players.find(p => p.is_captain)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-white">Detalle del Equipo</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-white">Cargando equipo...</span>
          </div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : team ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-700 rounded-xl overflow-hidden flex items-center justify-center">
                  {team.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{team.name}</h2>
                  {team.description && <p className="text-gray-400 text-sm">{team.description}</p>}
                </div>
              </div>
              {team.contact_email && (
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{team.contact_email}</span>
                </div>
              )}
              {team.contact_phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{team.contact_phone}</span>
                </div>
              )}
              <div className="text-sm text-gray-400">Creado el {new Date(team.created_at).toLocaleDateString('es-ES')}</div>
              <div>
                <button onClick={() => router.push(`/dashboard/teams/${team.id}/edit`)} className="w-full bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700">Editar equipo</button>
              </div>
            </div>

            <div className="lg:col-span-2 bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Jugadores activos ({players.length})</h3>
                {captain && (
                  <div className="text-sm text-yellow-300 flex items-center space-x-2">
                    <Crown className="h-4 w-4" />
                    <span>Capitán: {captain.name}</span>
                  </div>
                )}
              </div>
              {players.length === 0 ? (
                <div className="text-gray-400">Sin jugadores activos.</div>
              ) : (
                <ul className="divide-y divide-gray-700">
                  {players.map(p => (
                    <li key={p.id} className="py-3 flex items-center justify-between">
                      <div className="text-gray-200">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.position || '—'}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
