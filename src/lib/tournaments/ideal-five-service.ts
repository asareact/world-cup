import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase as defaultClient } from '@/lib/supabase'

export type PlayerPosition = 'portero' | 'ala' | 'cierre' | 'pivote'

type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

interface RawMatch {
  id: string
  round_name: string | null
  status: MatchStatus
  scheduled_at: string | null
  updated_at: string | null
  home_team_id: string | null
  away_team_id: string | null
  home_score: number | null
  away_score: number | null
}

interface SupabaseTeam {
  id: string
  name: string | null
  logo_url: string | null
}

interface SupabasePlayer {
  id: string
  name: string | null
  position: string | null
  photo_url: string | null
  team_id: string | null
  team?: SupabaseTeam | SupabaseTeam[] | null
}

interface RawEvent {
  id: string
  match_id: string
  player_id: string | null
  team_id: string | null
  assist_player_id: string | null
  event_type: 'goal' | 'yellow_card' | 'red_card' | 'own_goal' | 'assist' | 'save'
  minute: number | null
  player: SupabasePlayer | SupabasePlayer[] | null
  team: SupabaseTeam | SupabaseTeam[] | null
}

interface PlayerInfo {
  id: string
  name: string
  position: PlayerPosition | null
  teamId: string | null
  teamName: string
  teamLogoUrl: string | null
  photoUrl: string | null
}

interface PlayerAccumulator {
  info: PlayerInfo
  goals: number
  assists: number
  saves: number
  yellowCards: number
  redCards: number
  goalsConceded: number
  matches: Set<string>
}

export interface PerformanceBreakdown {
  goals: number
  assists: number
  saves: number
  goalsConceded: number
  yellowCards: number
  redCards: number
  matchesPlayed: number
  points: number
}

export interface IdealFivePlayerPerformance {
  playerId: string
  playerName: string
  position: PlayerPosition
  teamId: string | null
  teamName: string
  teamLogoUrl: string | null
  photoUrl: string | null
  breakdown: PerformanceBreakdown
}

export interface PositionRanking {
  role: PlayerPosition
  players: IdealFivePlayerPerformance[]
}

export interface IdealFiveRoundResult {
  roundKey: string
  roundLabel: string
  completedMatches: number
  totalMatches: number
  referenceDate: string | null
  idealFive: {
    portero: IdealFivePlayerPerformance | null
    alas: IdealFivePlayerPerformance[]
    cierre: IdealFivePlayerPerformance | null
    pivote: IdealFivePlayerPerformance | null
  }
  rankings: PositionRanking[]
}

const POINTS = {
  goal: 5,
  assist: 4,
  save: 0.5,
  yellowCard: -1,
  redCard: -3,
  goalConceded: -1,
}

const DEFAULT_PLAYER_NAME = 'Jugador desconocido'
const DEFAULT_TEAM_NAME = 'Equipo desconocido'

const asArray = <T>(value: T | T[] | null | undefined): T[] => {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

const normalisePosition = (position: string | null | undefined): PlayerPosition | null => {
  if (!position) return null
  const value = position.toLowerCase()
  if (value === 'portero' || value === 'ala' || value === 'cierre' || value === 'pivote') {
    return value
  }
  return null
}

const buildPlayerInfo = (payload?: SupabasePlayer | null, fallbackTeam?: SupabaseTeam | null): PlayerInfo | null => {
  if (!payload?.id) {
    return null
  }

  const teamData = asArray(payload.team)[0] ?? fallbackTeam ?? null
  const position = normalisePosition(payload.position)

  return {
    id: payload.id,
    name: payload.name ?? DEFAULT_PLAYER_NAME,
    position,
    teamId: payload.team_id ?? teamData?.id ?? null,
    teamName: teamData?.name ?? DEFAULT_TEAM_NAME,
    teamLogoUrl: teamData?.logo_url ?? null,
    photoUrl: payload.photo_url ?? null,
  }
}

const mergePlayerInfo = (current: PlayerInfo | undefined, incoming: PlayerInfo): PlayerInfo => {
  if (!current) return incoming

  return {
    id: incoming.id,
    name: incoming.name || current.name,
    position: incoming.position ?? current.position,
    teamId: incoming.teamId ?? current.teamId,
    teamName: incoming.teamName || current.teamName,
    teamLogoUrl: incoming.teamLogoUrl ?? current.teamLogoUrl,
    photoUrl: incoming.photoUrl ?? current.photoUrl,
  }
}

const toPerformance = (acc: PlayerAccumulator): IdealFivePlayerPerformance | null => {
  if (!acc.info.position) return null

  const rawPoints =
    acc.goals * POINTS.goal +
    acc.assists * POINTS.assist +
    acc.saves * POINTS.save +
    acc.yellowCards * POINTS.yellowCard +
    acc.redCards * POINTS.redCard +
    (acc.info.position === 'portero' ? acc.goalsConceded * POINTS.goalConceded : 0)

  const totalPoints = Number(rawPoints.toFixed(2))

  return {
    playerId: acc.info.id,
    playerName: acc.info.name,
    position: acc.info.position,
    teamId: acc.info.teamId,
    teamName: acc.info.teamName,
    teamLogoUrl: acc.info.teamLogoUrl,
    photoUrl: acc.info.photoUrl,
    breakdown: {
      goals: acc.goals,
      assists: acc.assists,
      saves: acc.saves,
      goalsConceded: acc.goalsConceded,
      yellowCards: acc.yellowCards,
      redCards: acc.redCards,
      matchesPlayed: acc.matches.size,
      points: totalPoints,
    },
  }
}

const byPerformance = (a: IdealFivePlayerPerformance, b: IdealFivePlayerPerformance) => {
  if (b.breakdown.points !== a.breakdown.points) return b.breakdown.points - a.breakdown.points
  if (b.breakdown.goals !== a.breakdown.goals) return b.breakdown.goals - a.breakdown.goals
  if (b.breakdown.assists !== a.breakdown.assists) return b.breakdown.assists - a.breakdown.assists
  if (b.breakdown.saves !== a.breakdown.saves) return b.breakdown.saves - a.breakdown.saves
  return a.playerName.localeCompare(b.playerName)
}

const normaliseRoundName = (value: string | null, index: number): { key: string; label: string } => {
  const trimmed = (value ?? '').trim()
  if (!trimmed) {
    const fallback = index + 1
    return {
      key: `jornada-${fallback}`,
      label: `Jornada ${fallback}`,
    }
  }

  const key = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `jornada-${index + 1}`

  return {
    key,
    label: trimmed,
  }
}

const extractReferenceDate = (matches: RawMatch[]): string | null => {
  if (matches.length === 0) return null
  const timestamp = matches.reduce<number | null>((latest, match) => {
    const candidate = match.updated_at ?? match.scheduled_at
    if (!candidate) return latest
    const timeValue = new Date(candidate).getTime()
    if (!Number.isFinite(timeValue)) return latest
    if (latest === null || timeValue > latest) return timeValue
    return latest
  }, null)

  return timestamp ? new Date(timestamp).toISOString() : null
}

const earliestTimestamp = (matches: RawMatch[]): number | null => {
  if (matches.length === 0) return null
  return matches.reduce<number | null>((earliest, match) => {
    const candidate = match.scheduled_at ?? match.updated_at
    if (!candidate) return earliest
    const timeValue = new Date(candidate).getTime()
    if (!Number.isFinite(timeValue)) return earliest
    if (earliest === null || timeValue < earliest) return timeValue
    return earliest
  }, null)
}

export async function getTournamentIdealFive(
  tournamentId: string,
  client: SupabaseClient = defaultClient,
): Promise<IdealFiveRoundResult[]> {
  if (!tournamentId) return []

  const { data: matches, error: matchesError } = await client
    .from('matches')
    .select(
      'id, round_name, status, scheduled_at, updated_at, home_team_id, away_team_id, home_score, away_score'
    )
    .eq('tournament_id', tournamentId)

  if (matchesError) {
    throw new Error(`No se pudo obtener el calendario del torneo: ${matchesError.message}`)
  }

  if (!matches || matches.length === 0) {
    return []
  }

  const groupedByRound = new Map<string, RawMatch[]>()
  matches.forEach((match) => {
    const key = (match.round_name ?? '__sin_round__') as string
    if (!groupedByRound.has(key)) {
      groupedByRound.set(key, [])
    }
    groupedByRound.get(key)!.push(match as RawMatch)
  })

  const completedRounds = Array.from(groupedByRound.entries())
    .map(([roundName, roundMatches]) => ({
      roundName,
      matches: roundMatches,
      completed: roundMatches.length > 0 && roundMatches.every((match) => match.status === 'completed'),
      earliestDate: earliestTimestamp(roundMatches),
    }))
    .filter((entry) => entry.completed)

  if (completedRounds.length === 0) {
    return []
  }

  completedRounds.sort((a, b) => {
    if (a.earliestDate === null && b.earliestDate === null) return 0
    if (a.earliestDate === null) return 1
    if (b.earliestDate === null) return -1
    return a.earliestDate - b.earliestDate
  })

  const roundsWithMeta = completedRounds.map((entry, index) => ({
    ...entry,
    meta: normaliseRoundName(entry.roundName === '__sin_round__' ? null : entry.roundName, index),
  }))

  const allMatchIds = roundsWithMeta.flatMap((round) => round.matches.map((match) => match.id))

  const { data: events, error: eventsError } = await client
    .from('match_events')
    .select(
      `id, match_id, player_id, team_id, assist_player_id, event_type, minute,
       player:players!match_events_player_id_fkey(id, name, position, photo_url, team_id, team:teams(id, name, logo_url)),
       team:teams!match_events_team_id_fkey(id, name, logo_url)`
    )
    .in('match_id', allMatchIds)

  if (eventsError) {
    throw new Error(`No se pudieron obtener los eventos de la jornada: ${eventsError.message}`)
  }

  const eventsByMatch = new Map<string, RawEvent[]>()
  events?.forEach((event) => {
    const bucket = eventsByMatch.get(event.match_id) ?? []
    bucket.push(event as RawEvent)
    eventsByMatch.set(event.match_id, bucket)
  })

  const matchMap = new Map<string, RawMatch>()
  roundsWithMeta.forEach((round) => {
    round.matches.forEach((match) => {
      matchMap.set(match.id, match)
    })
  })

  const results: IdealFiveRoundResult[] = []

  for (const round of roundsWithMeta) {
    const playerInfoMap = new Map<string, PlayerInfo>()
    const pendingAssistIds = new Set<string>()

    const roundEvents = round.matches.flatMap((match) => eventsByMatch.get(match.id) ?? [])

    roundEvents.forEach((event) => {
      const rawPlayer = asArray(event.player)[0] ?? null
      const rawTeam = asArray(event.team)[0] ?? null
      const info = buildPlayerInfo(rawPlayer, rawTeam)
      if (info) {
        playerInfoMap.set(info.id, mergePlayerInfo(playerInfoMap.get(info.id), info))
      }
      if (event.assist_player_id) {
        pendingAssistIds.add(event.assist_player_id)
      }
    })

    const missingAssistIds = Array.from(pendingAssistIds).filter((id) => !playerInfoMap.has(id))

    if (missingAssistIds.length > 0) {
      const { data: assistPlayers, error: assistError } = await client
        .from('players')
        .select('id, name, position, photo_url, team_id, team:teams(id, name, logo_url)')
        .in('id', missingAssistIds)

      if (assistError) {
        throw new Error(`No se pudieron obtener los datos de asistentes: ${assistError.message}`)
      }

      assistPlayers?.forEach((raw) => {
        const info = buildPlayerInfo(raw as SupabasePlayer)
        if (info) {
          playerInfoMap.set(info.id, mergePlayerInfo(playerInfoMap.get(info.id), info))
        }
      })
    }

    const accumulators = new Map<string, PlayerAccumulator>()
    const ensureAccumulator = (info: PlayerInfo) => {
      const current = accumulators.get(info.id)
      if (current) {
        current.info = mergePlayerInfo(current.info, info)
        return current
      }
      const accumulator: PlayerAccumulator = {
        info,
        goals: 0,
        assists: 0,
        saves: 0,
        yellowCards: 0,
        redCards: 0,
        goalsConceded: 0,
        matches: new Set<string>(),
      }
      accumulators.set(info.id, accumulator)
      return accumulator
    }

    const processedAssistKeys = new Set<string>()

    roundEvents.forEach((event) => {
      if (event.player_id) {
        const info = playerInfoMap.get(event.player_id)
        if (info) {
          const accumulator = ensureAccumulator(info)
          accumulator.matches.add(event.match_id)

          switch (event.event_type) {
            case 'goal':
              accumulator.goals += 1
              break
            case 'assist': {
              const assistKey = `${event.match_id}:${event.minute ?? ''}:${info.id}`
              if (!processedAssistKeys.has(assistKey)) {
                processedAssistKeys.add(assistKey)
                accumulator.assists += 1
              }
              break
            }
            case 'yellow_card':
              accumulator.yellowCards += 1
              break
            case 'red_card':
              accumulator.redCards += 1
              break
            case 'save':
              accumulator.saves += 1
              break
            default:
              break
          }
        }
      }

      if (event.event_type === 'goal' && event.assist_player_id) {
        const assistInfo = playerInfoMap.get(event.assist_player_id)
        if (!assistInfo) return
        const assistKey = `${event.match_id}:${event.minute ?? ''}:${assistInfo.id}`
        if (processedAssistKeys.has(assistKey)) return
        processedAssistKeys.add(assistKey)
        const assistAccumulator = ensureAccumulator(assistInfo)
        assistAccumulator.assists += 1
        assistAccumulator.matches.add(event.match_id)
      }
    })

    accumulators.forEach((accumulator) => {
      if (accumulator.info.position !== 'portero') return
      const teamId = accumulator.info.teamId
      if (!teamId) return
      accumulator.matches.forEach((matchId) => {
        const match = matchMap.get(matchId)
        if (!match) return
        if (match.home_team_id === teamId) {
          accumulator.goalsConceded += match.away_score ?? 0
        } else if (match.away_team_id === teamId) {
          accumulator.goalsConceded += match.home_score ?? 0
        }
      })
    })

    const performances = Array.from(accumulators.values())
      .map(toPerformance)
      .filter((value): value is IdealFivePlayerPerformance => Boolean(value))

    const byRole: Record<PlayerPosition, IdealFivePlayerPerformance[]> = {
      portero: [],
      ala: [],
      cierre: [],
      pivote: [],
    }

    performances.forEach((performance) => {
      byRole[performance.position].push(performance)
    });

    (Object.keys(byRole) as PlayerPosition[]).forEach((role: PlayerPosition) => {
      byRole[role].sort(byPerformance)
    })

    const idealFive = {
      portero: byRole.portero[0] ?? null,
      alas: byRole.ala.slice(0, 2),
      cierre: byRole.cierre[0] ?? null,
      pivote: byRole.pivote[0] ?? null,
    }

    const rankings: PositionRanking[] = (Object.entries(byRole) as [PlayerPosition, IdealFivePlayerPerformance[]][]).map(([role, players]) => ({
      role,
      players,
    }))

    results.push({
      roundKey: round.meta.key,
      roundLabel: round.meta.label,
      completedMatches: round.matches.length,
      totalMatches: round.matches.length,
      referenceDate: extractReferenceDate(round.matches),
      idealFive,
      rankings,
    })
  }

  return results
}

