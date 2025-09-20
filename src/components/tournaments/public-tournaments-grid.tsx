'use client'

import { useEffect, useState } from 'react'
import { db, Tournament } from '@/lib/database'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Trophy, Users, Calendar, Eye, Loader2 } from 'lucide-react'

type PublicTournament = Tournament & { teamsCount?: number, matchesCount?: number }

export function PublicTournamentsGrid() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tournaments, setTournaments] = useState<PublicTournament[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await db.getPublicTournaments()
        setTournaments(data)
      } catch (e) {
        console.error(e)
        setError('Error al cargar torneos')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        <span className="ml-3 text-white">Cargando torneos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (tournaments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center shadow-lg mb-6">
          <Trophy className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Aún no hay torneos públicos</h2>
        <p className="text-gray-400 mb-8 text-center max-w-md">
          Cuando los organizadores publiquen nuevos torneos podrás verlos aquí. Mientras tanto, puedes recargar para comprobar si hay novedades.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-xl transition-colors"
          >
            <Loader2 className="h-4 w-4" />
            Recargar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Torneos</h1>
        <p className="text-gray-400">Explora torneos disponibles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((t, index) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-green-500/50 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{t.name}</h3>
                  {t.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">{t.description}</p>
                  )}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                t.status === 'active' ? 'bg-green-900/50 text-green-300' :
                t.status === 'completed' ? 'bg-blue-900/50 text-blue-300' :
                t.status === 'paused' ? 'bg-yellow-900/50 text-yellow-300' :
                'bg-gray-700 text-gray-300'
              }`}>
                {t.status === 'active' ? 'Activo' : t.status === 'completed' ? 'Finalizado' : t.status === 'paused' ? 'Pausado' : 'Borrador'}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Equipos</span>
                <span className="text-white flex items-center gap-1">
                  <Users className="h-4 w-4 text-purple-400" />
                  {t.teamsCount ?? 0}/{t.max_teams}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Partidos</span>
                <span className="text-white flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-orange-400" />
                  {t.matchesCount ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Inicio</span>
                <span className="text-white">{t.start_date ? formatDate(t.start_date) : 'No definido'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // Set navigation source as internal before navigating
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('tournamentNavigationSource', 'internal');
                  }
                  router.push(`/tournaments/${t.id}`);
                }}
                className="flex-1 flex items-center justify-center space-x-2 bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>Ver</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}



