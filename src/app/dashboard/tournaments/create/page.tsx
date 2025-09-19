'use client'

import { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { HybridTournamentForm } from '@/components/dashboard/hybrid-tournament-form'
import { ArrowLeft, Info } from 'lucide-react'

type TournamentTypeKey = 'league' | 'cup' | 'hybrid'

type TournamentTypeConfig = {
  title: string
  description: string
  helper: string
  businessRules?: string[]
}

const typeConfig: Record<TournamentTypeKey, TournamentTypeConfig> = {
  league: {
    title: 'Liga',
    description: 'Formato todos contra todos pensado para temporadas completas.',
    helper: 'Configura jornadas, reglas de puntuacion y criterios de desempate.',
    businessRules: [
      'Participan entre 9 y 14 equipos; el formato se optimiza para 13.',
      'Los seis mejores de la fase regular avanzan directo a cuartos de final.',
      'Los puestos 7.o al 10.o disputan repechaje a partido unico para entregar dos plazas restantes.',
      'Los tres ultimos quedan eliminados de forma directa (si el cupo permite, de lo contrario se ajusta automaticamente).',
      'Los ocho clasificados se sortean para conformar los cruces de cuartos.'
    ]
  },
  cup: {
    title: 'Copa',
    description: 'Eliminacion directa para definir un campeon rapidamente.',
    helper: 'Define rondas eliminatorias, ida y vuelta y reglas de desempate.'
  },
  hybrid: {
    title: 'Hibrido',
    description: 'Grupos clasificatorios seguidos por fases finales eliminatorias.',
    helper: 'Configura grupos, criterios de clasificacion y llaves finales.'
  }
}

export default function CreateTournamentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const requestedType = (searchParams.get('type') || 'league').toLowerCase() as TournamentTypeKey
  const tournamentType = useMemo(() => {
    return typeConfig[requestedType] ?? typeConfig.league
  }, [requestedType])

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center space-x-2 text-sm text-gray-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>

        {requestedType === 'hybrid' ? (
          <HybridTournamentForm />
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-green-600/20 flex items-center justify-center">
                <Info className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Nuevo torneo - {tournamentType.title}</h1>
                <p className="text-gray-400 text-sm">{tournamentType.description}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/40 p-8 text-center">
              <p className="text-gray-300">
                El formulario de creacion especifico para este formato estara disponible proximamente.
              </p>
              <p className="text-gray-500 text-sm mt-3">
                {tournamentType.helper}
              </p>
            </div>

            {tournamentType.businessRules && (
              <div className="mt-6 border border-gray-800 rounded-2xl bg-gray-900/60 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Reglas clave del formato</h2>
                <ul className="space-y-2 text-gray-300 text-sm list-disc list-inside">
                  {tournamentType.businessRules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
                <p className="text-xs text-gray-500 mt-4">
                  * La asignacion de repechaje y eliminados se adapta automaticamente si la cantidad de equipos no permite respetar exactamente los cupos establecidos.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

