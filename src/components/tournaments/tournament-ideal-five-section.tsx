'use client'

import { useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Trophy, Shield, Wind, Lock, Target, BarChart3, Loader2, AlertCircle, Medal, Square, CalendarDays } from 'lucide-react'
import { useIdealFive } from '@/lib/hooks/use-ideal-five'
import type { IdealFivePlayerPerformance, PlayerPosition } from '@/lib/tournaments/ideal-five-service'

type TournamentIdealFiveSectionProps = {
  tournamentId?: string | null
}

type RoleVisual = {
  label: string
  gradient: string
  icon: LucideIcon
}

const ROLE_VISUALS: Record<PlayerPosition, RoleVisual> = {
  portero: {
    label: 'Portero',
    gradient: 'from-blue-500/15 to-blue-900/20 border-blue-500/40',
    icon: Shield,
  },
  ala: {
    label: 'Ala',
    gradient: 'from-emerald-500/15 to-emerald-900/20 border-emerald-500/40',
    icon: Wind,
  },
  cierre: {
    label: 'Cierre',
    gradient: 'from-purple-500/15 to-purple-900/25 border-purple-500/40',
    icon: Lock,
  },
  pivote: {
    label: 'Pivote',
    gradient: 'from-orange-500/15 to-orange-900/25 border-orange-500/40',
    icon: Target,
  },
}

const RANKING_LABEL: Record<PlayerPosition, string> = {
  portero: 'Portero',
  ala: 'Alas',
  cierre: 'Cierre',
  pivote: 'Pivote',
}

const SCORING_RULES = [
  { label: 'Gol', value: '+5 pts' },
  { label: 'Asistencia', value: '+4 pts' },
  { label: 'Atajada', value: '+0.5 pts' },
  { label: 'Tarjeta amarilla', value: '-1 pt' },
  { label: 'Tarjeta roja', value: '-3 pts' },
  { label: 'Gol recibido (portero)', value: '-1 pt' },
]

type StatKey = 'goals' | 'assists' | 'saves' | 'goalsConceded' | 'cards'

const STAT_CONFIG: Record<StatKey, { label: string; icon: LucideIcon }> = {
  goals: { label: 'Goles', icon: Target },
  assists: { label: 'Asistencias', icon: BarChart3 },
  saves: { label: 'Atajadas', icon: Shield },
  goalsConceded: { label: 'Goles recibidos', icon: AlertCircle },
  cards: { label: 'Tarjetas', icon: Square },
}

const formatCards = (player: IdealFivePlayerPerformance | null) => {
  if (!player) return '0 A / 0 R'
  const { yellowCards, redCards } = player.breakdown
  return `${yellowCards} A / ${redCards} R`
}

const formatDate = (isoDate: string | null) => {
  if (!isoDate) return 'Fecha por confirmar'
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return 'Fecha por confirmar'
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const PlayerAvatar = ({ name, photoUrl }: { name: string; photoUrl: string | null }) => {
  const initials = useMemo(() => {
    const segments = name.trim().split(/\s+/).slice(0, 2)
    const letters = segments.map((segment) => segment.charAt(0).toUpperCase())
    return letters.join('') || 'J'
  }, [name])

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className="h-12 w-12 rounded-full border border-white/20 object-cover shadow-md"
      />
    )
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-lg font-semibold text-white shadow-inner">
      {initials}
    </div>
  )
}

const PlayerCard = ({
  role,
  player,
  customLabel,
  highlight,
}: {
  role: PlayerPosition
  player: IdealFivePlayerPerformance | null
  customLabel?: string
  highlight?: boolean
}) => {
  const visual = ROLE_VISUALS[role]
  const Icon = visual.icon
  const label = customLabel ?? visual.label
  const stats = player?.breakdown
  const isWing = role === 'ala'

  const statGridCols =
    role === 'portero'
      ? 'grid-cols-2 md:grid-cols-4 xl:grid-cols-5'
      : 'grid-cols-2 md:grid-cols-4'

  const statsWrapperClass = isWing
    ? 'flex flex-wrap gap-3 text-sm text-slate-200'
    : `grid ${statGridCols} gap-3 text-sm text-slate-200`

  const statTiles: Array<{ key: StatKey; value: string }> = [
    { key: 'goals', value: String(stats?.goals ?? 0) },
    { key: 'assists', value: String(stats?.assists ?? 0) },
  ]

  const savesValue = stats?.saves ?? 0
  if (role === 'portero' || savesValue > 0) {
    statTiles.push({ key: 'saves', value: String(savesValue) })
  }

  if (role === 'portero') {
    statTiles.push({ key: 'goalsConceded', value: String(stats?.goalsConceded ?? 0) })
  }

  statTiles.push({ key: 'cards', value: formatCards(player) })

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border bg-slate-950/60 p-5 sm:p-6 shadow-lg transition-all duration-300 ${visual.gradient} ${
        highlight
          ? 'ring-2 ring-emerald-400/70 shadow-emerald-500/20'
          : 'hover:border-emerald-400/30 hover:shadow-emerald-500/10'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative flex flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-black/30 p-3 shadow-inner">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-300">{label}</p>
              <p className="text-sm text-slate-400">Reconocimiento de la jornada</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">Puntos</p>
            <p className="text-3xl font-bold text-emerald-300">
              {player ? player.breakdown.points.toFixed(2) : '--'}
            </p>
          </div>
        </header>

        {player ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  <PlayerAvatar name={player.playerName} photoUrl={player.photoUrl} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{player.playerName}</h3>
                  <p className="text-sm text-slate-400">{player.teamName}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-300">
                  {label}
                </span>
                {highlight ? (
                  <span className="rounded-md border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                    MVP Jornada
                  </span>
                ) : null}
              </div>
            </div>

            <dl className={statsWrapperClass}>
              {statTiles.map((tile) => {
                const config = STAT_CONFIG[tile.key]
                const StatIcon = config.icon

                if (isWing) {
                  return (
                    <div
                      key={`${player.playerId}-${tile.key}`}
                      className="flex min-w-[150px] flex-1 items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-500/10 p-2">
                          <StatIcon className="h-4 w-4 text-emerald-300" />
                        </div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 leading-tight">
                          {config.label}
                        </dt>
                      </div>
                      <dd className="text-lg font-semibold text-white">{tile.value}</dd>
                    </div>
                  )
                }

                return (
                  <div
                    key={`${player.playerId}-${tile.key}`}
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 shadow-inner"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-emerald-500/10 p-2">
                        <StatIcon className="h-4 w-4 text-emerald-300" />
                      </div>
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 leading-tight">
                          {config.label}
                        </dt>
                        <dd className="mt-1 text-lg font-semibold text-white">{tile.value}</dd>
                      </div>
                    </div>
                  </div>
                )
              })}
            </dl>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No se registraron aportes para esta posicion en la jornada seleccionada.
          </p>
        )}
      </div>
    </article>
  )
}

export function TournamentIdealFiveSection({ tournamentId }: TournamentIdealFiveSectionProps) {
  const { rounds, loading, error } = useIdealFive(tournamentId)
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0)
  const [userSelected, setUserSelected] = useState(false)

  useEffect(() => {
    setUserSelected(false)
    setSelectedRoundIndex(0)
  }, [tournamentId])

  useEffect(() => {
    if (rounds.length === 0) {
      setSelectedRoundIndex(0)
      return
    }

    setSelectedRoundIndex((prev) => {
      if (!userSelected) {
        return rounds.length - 1
      }
      return Math.min(prev, rounds.length - 1)
    })
  }, [rounds.length, userSelected])

  const handleRoundSelect = (index: number) => {
    setUserSelected(true)
    setSelectedRoundIndex(index)
  }

  const selectedRound = rounds[selectedRoundIndex]

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-white shadow-xl sm:p-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-emerald-500/10 to-transparent" />

      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-3 shadow-lg">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold lg:text-3xl">Ideal 5 por jornada</h2>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Seleccion automatica segun rendimiento ofensivo y disciplina: goles (5 pts), asistencias (4 pts) y atajadas (0.5 pts). Las tarjetas restan, y a los porteros se les descuenta 1 punto por cada gol recibido.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {SCORING_RULES.map((rule) => (
            <div
              key={rule.label}
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium text-slate-100 shadow-inner"
            >
              <span className="mr-2 text-white/60">{rule.label}</span>
              <span className="text-emerald-300">{rule.value}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="mt-8 space-y-8">
        {loading && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-black/30 p-10 text-slate-300">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-300" />
            <span>Calculando la jornada ideal???</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && rounds.length === 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-black/30 p-6 text-sm text-slate-300">
            <AlertCircle className="h-5 w-5 text-emerald-300" />
            <div>
              <p className="font-semibold text-white">Sin jornadas completadas por ahora</p>
              <p className="text-slate-400">El ideal 5 se mostrara en cuanto finalice la primera jornada completa.</p>
            </div>
          </div>
        )}

        {!loading && !error && rounds.length > 0 && selectedRound && (
          <div className="space-y-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <CalendarDays className="h-5 w-5 text-emerald-300" />
                  <span>{selectedRound.roundLabel}</span>
                  <span className="text-slate-500">|</span>
                  <span>{formatDate(selectedRound.referenceDate)}</span>
                </div>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200 uppercase tracking-wide">
                  Jornada completada
                </span>
              </div>

              <div className="flex flex-wrap gap-2 overflow-x-auto rounded-2xl border border-slate-800 bg-black/20 p-2">
                {rounds.map((round, index) => {
                  const isActive = index === selectedRoundIndex
                  return (
                    <button
                      key={round.roundKey}
                      type="button"
                      onClick={() => handleRoundSelect(index)}
                      className={`flex min-w-[160px] items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                        isActive
                          ? 'border-emerald-400/60 bg-emerald-500/15 text-white shadow'
                          : 'border-slate-700 bg-transparent text-slate-300 hover:border-emerald-500/30 hover:text-white'
                      }`}
                    >
                      <span className="font-medium">{round.roundLabel}</span>
                      <span className="text-xs text-slate-400">{round.totalMatches} pj</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-full lg:w-4/5">
                  <PlayerCard role="portero" player={selectedRound.idealFive.portero} highlight />
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-full lg:w-4/5">
                  <PlayerCard role="cierre" player={selectedRound.idealFive.cierre} />
                </div>
              </div>
              <div className="flex flex-col gap-4 lg:flex-row lg:justify-center lg:gap-6">
                {Array.from({ length: 2 }).map((_, idx) => (
                  <div key={`ala-${idx}`} className="w-full lg:w-2/5">
                    <PlayerCard
                      role="ala"
                      player={selectedRound.idealFive.alas[idx] ?? null}
                      customLabel={`Ala ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <div className="w-full lg:w-4/5">
                  <PlayerCard role="pivote" player={selectedRound.idealFive.pivote} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-black/25 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-emerald-300" />
                  <h3 className="text-lg font-semibold text-white">Ranking por posicion</h3>
                </div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Top 3 segun puntaje</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {selectedRound.rankings.map((ranking) => (
                  <div
                    key={ranking.role}
                    className="rounded-xl border border-white/5 bg-white/5 p-4 shadow-inner"
                  >
                    <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                      <Medal className="h-4 w-4 text-emerald-300" />
                      {RANKING_LABEL[ranking.role]}
                    </p>
                    {ranking.players.length === 0 ? (
                      <p className="text-sm text-slate-400">Sin registros para esta posicion.</p>
                    ) : (
                      <ul className="space-y-2">
                        {ranking.players.slice(0, 3).map((player, idx) => (
                          <li
                            key={`${ranking.role}-${player.playerId}`}
                            className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-3 py-2 text-sm text-slate-200"
                          >
                            <span className="text-xs font-semibold text-emerald-200">#{idx + 1}</span>
                            <div className="flex-1">
                              <p className="font-medium text-white">{player.playerName}</p>
                              <p className="text-xs text-slate-400">{player.teamName}</p>
                            </div>
                            <span className="text-sm font-semibold text-emerald-300">
                              {player.breakdown.points.toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

