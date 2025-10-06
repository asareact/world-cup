'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { useAuth } from '@/lib/auth-context'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMatches } from '@/lib/hooks/use-matches'
import Link from 'next/link'
import { Calendar, ArrowRight, Loader2 } from 'lucide-react'
import Image from 'next/image'

// Helper to format date
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Fecha no definida'
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function MatchesPage() {
  const { role } = useAuth()
  const router = useRouter()
  const { groupedMatches, groupedMatchesByDate, isLoading, error } = useMatches()

  useEffect(() => {
    if (role && role !== 'superAdmin' && role !== 'arbitro') {
      router.replace('/dashboard')
    }
  }, [role, router])

  if (!role || (role !== 'superAdmin' && role !== 'arbitro')) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    )
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          <p className="ml-4 text-gray-300">Cargando partidos...</p>
        </div>
      )
    }

    if (error) {
      return <p className="text-center text-red-500">Error al cargar los partidos: {error.message}</p>
    }

    const isReferee = role === 'arbitro'

    if (isReferee) {
      const todayKey = new Date().toLocaleDateString('en-CA')
      const todaysMatches = groupedMatchesByDate[todayKey] || []

      if (todaysMatches.length === 0) {
        return <p className="text-center text-gray-400">No hay partidos programados para hoy.</p>
      }

      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-green-400 border-b-2 border-gray-700 pb-2">Partidos de hoy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {todaysMatches.map((match) => (
              <div key={match.id} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 ease-in-out shadow-lg hover:shadow-green-500/20">
                <div className="p-5">
                  <p className="text-xs text-gray-400 mb-2">{match.tournament?.name || 'Torneo no definido'}</p>
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex flex-col items-center text-center w-1/3">
                      <Image src={match.home_team?.logo_url || '/file.svg'} alt={match.home_team?.name || 'Local'} width={48} height={48} className="h-12 w-12 object-contain mb-2" />
                      <span className="font-semibold text-white text-sm truncate">{match.home_team?.name || 'Equipo Local'}</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-500">VS</div>
                    <div className="flex flex-col items-center text-center w-1/3">
                      <Image src={match.away_team?.logo_url || '/file.svg'} alt={match.away_team?.name || 'Visitante'} width={48} height={48} className="h-12 w-12 object-contain mb-2" />
                      <span className="font-semibold text-white text-sm truncate">{match.away_team?.name || 'Equipo Visitante'}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-400 mt-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(match.scheduled_at)}</span>
                  </div>
                </div>
                <div className="bg-gray-700/50 p-3">
                  <Link href={`/dashboard/matches/${match.id}/referee`} className="flex items-center justify-center text-sm font-semibold text-green-400 hover:text-white transition-colors duration-200 group">
                    Arbitrar Partido
                    <ArrowRight className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    const rounds = Object.keys(groupedMatches)
    if (rounds.length === 0) {
      return <p className="text-center text-gray-400">No hay partidos programados por el momento.</p>
    }

    return (
      <div className="space-y-8">
        {rounds.map((round) => (
          <section key={round}>
            <h2 className="text-2xl font-bold text-green-400 mb-4 border-b-2 border-gray-700 pb-2">
              {round}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedMatches[round].map((match) => (
                <div key={match.id} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 ease-in-out shadow-lg hover:shadow-green-500/20">
                  <div className="p-5">
                    <p className="text-xs text-gray-400 mb-2">{match.tournament?.name || 'Torneo no definido'}</p>
                    <div className="flex items-center justify-between space-x-4">
                      <div className="flex flex-col items-center text-center w-1/3">
                        <Image src={match.home_team?.logo_url || '/file.svg'} alt={match.home_team?.name || 'Local'} width={48} height={48} className="h-12 w-12 object-contain mb-2" />
                        <span className="font-semibold text-white text-sm truncate">{match.home_team?.name || 'Equipo Local'}</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-500">VS</div>
                      <div className="flex flex-col items-center text-center w-1/3">
                        <Image src={match.away_team?.logo_url || '/file.svg'} alt={match.away_team?.name || 'Visitante'} width={48} height={48} className="h-12 w-12 object-contain mb-2" />
                        <span className="font-semibold text-white text-sm truncate">{match.away_team?.name || 'Equipo Visitante'}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-400 mt-4">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{formatDate(match.scheduled_at)}</span>
                    </div>
                  </div>
                  <div className="bg-gray-700/50 p-3">
                    <Link href={`/dashboard/matches/${match.id}/referee`} className="flex items-center justify-center text-sm font-semibold text-green-400 hover:text-white transition-colors duration-200 group">
                      Arbitrar Partido
                      <ArrowRight className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Partidos</h1>
          <p className="text-gray-400">Visualiza y arbitra los partidos programados.</p>
        </div>
        {renderContent()}
      </div>
    </DashboardLayout>
  )
}
