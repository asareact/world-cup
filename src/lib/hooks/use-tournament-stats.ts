import { useState, useEffect } from 'react'
import { MatchEvent } from '@/lib/database'
import { supabase } from '@/lib/supabase'

interface TournamentStats {
  totalGoals: number
  totalAssists: number
  totalYellowCards: number
  totalRedCards: number
  totalOwnGoals: number
  totalSaves: number
  topScorers: Array<{
    player_id: string
    player_name: string
    team_name: string
    team_id: string
    goals: number
    player_photo_url?: string | null
  }>
  topAssists: Array<{
    player_id: string
    player_name: string
    team_name: string
    team_id: string
    assists: number
    player_photo_url?: string | null
  }>
  topCards: Array<{
    player_id: string
    player_name: string
    team_name: string
    team_id: string
    yellow_cards: number
    red_cards: number
    player_photo_url?: string | null
  }>
  topGoalkeepers: Array<{
    player_id: string
    player_name: string
    team_name: string
    team_id: string
    saves: number
    goals_conceded: number
    player_photo_url?: string | null
  }>
  matchEvents: MatchEvent[]
}

interface PlayerInfo {
  player_name: string
  team_name: string
  team_id: string
  player_photo_url: string | null
}

const DEFAULT_PLAYER: PlayerInfo = {
  player_name: 'Jugador desconocido',
  team_name: 'Equipo desconocido',
  team_id: '',
  player_photo_url: null,
}

export function useTournamentStats(tournamentId: string) {
  const [stats, setStats] = useState<TournamentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tournamentId) return

    const fetchTournamentStats = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: matches, error: matchesError } = await supabase
          .from('matches')
          .select('id, home_team_id, away_team_id, home_score, away_score')
          .eq('tournament_id', tournamentId)

        if (matchesError) throw matchesError

        const matchIds = matches?.map(match => match.id) || []

        if (matchIds.length === 0) {
          setStats({
            totalGoals: 0,
            totalAssists: 0,
            totalYellowCards: 0,
            totalRedCards: 0,
            totalOwnGoals: 0,
            totalSaves: 0,
            topScorers: [],
            topAssists: [],
            topCards: [],
            topGoalkeepers: [],
            matchEvents: [],
          })
          return
        }

        const matchScoreMap = new Map<string, { home_team_id: string | null; away_team_id: string | null; home_score: number; away_score: number }>()
        matches?.forEach(match => {
          matchScoreMap.set(match.id, {
            home_team_id: match.home_team_id ?? null,
            away_team_id: match.away_team_id ?? null,
            home_score: match.home_score ?? 0,
            away_score: match.away_score ?? 0,
          })
        })

        const { data: events, error: eventsError } = await supabase
          .from('match_events')
          .select(`
            id,
            match_id,
            player_id,
            team_id,
            event_type,
            minute,
            description,
            assist_player_id,
            event_subtype,
            created_at,
            player:players!match_events_player_id_fkey(name, photo_url, team_id, teams(name)),
            team:teams!match_events_team_id_fkey(name)
          `)
          .in('match_id', matchIds)
          .order('created_at', { ascending: false })

        if (eventsError) throw eventsError

        const playerInfoMap = new Map<string, PlayerInfo>()
        const assistIdsToFetch = new Set<string>()

        const registerInfo = (playerId: string | null | undefined, info: PlayerInfo) => {
          if (!playerId) return
          if (!playerInfoMap.has(playerId)) {
            playerInfoMap.set(playerId, info)
          }
        }

        events?.forEach(event => {
          if (!event) return

          const rawPlayer = Array.isArray(event.player) ? event.player[0] : event.player
          const rawTeam = Array.isArray(event.team) ? event.team[0] : event.team

          const playerInfo: PlayerInfo = {
            player_name: rawPlayer?.name || DEFAULT_PLAYER.player_name,
            team_name: rawTeam?.name || (rawPlayer?.teams && Array.isArray(rawPlayer.teams) ? rawPlayer.teams[0]?.name : null) || DEFAULT_PLAYER.team_name,
            team_id: event.team_id || rawPlayer?.team_id || DEFAULT_PLAYER.team_id,
            player_photo_url: rawPlayer?.photo_url ?? null,
          }

          registerInfo(event.player_id, playerInfo)

          if (event.assist_player_id && !playerInfoMap.has(event.assist_player_id)) {
            assistIdsToFetch.add(event.assist_player_id)
          }
        })

        if (assistIdsToFetch.size > 0) {
          const { data: assistPlayers, error: assistError } = await supabase
            .from('players')
            .select('id, name, photo_url, team_id, team:teams(name)')
            .in('id', Array.from(assistIdsToFetch))

          if (assistError) throw assistError

          assistPlayers?.forEach(player => {
            if (!player || !player.id) return
            const teamData = Array.isArray(player.team) ? player.team[0] : player.team
            registerInfo(player.id, {
              player_name: player.name || DEFAULT_PLAYER.player_name,
              team_name: teamData?.name || DEFAULT_PLAYER.team_name,
              team_id: player.team_id || DEFAULT_PLAYER.team_id,
              player_photo_url: player.photo_url ?? null,
            })
          })
        }

        const goalCount: Record<string, { count: number; info: PlayerInfo }> = {}
        const assistCount: Record<string, { count: number; info: PlayerInfo }> = {}
        const cardCount: Record<string, { yellow: number; red: number; info: PlayerInfo }> = {}
        const goalkeeperStats: Record<string, { saves: number; goals_conceded: number; info: PlayerInfo }> = {}
        const processedAssistKeys = new Set<string>()
        const goalkeepersByMatchTeam = new Map<string, Set<string>>()

        let totalGoals = 0
        let totalAssists = 0
        let totalYellowCards = 0
        let totalRedCards = 0
        let totalOwnGoals = 0
        let totalSaves = 0

        events?.forEach(event => {
          if (!event) return

          const playerId = event.player_id
          const info = (playerId ? playerInfoMap.get(playerId) : null) ?? DEFAULT_PLAYER

          const incrementGoal = () => {
            if (!playerId) return
            if (!goalCount[playerId]) {
              goalCount[playerId] = { count: 0, info }
            }
            goalCount[playerId].count += 1
          }

          switch (event.event_type) {
            case 'goal': {
              totalGoals += 1
              incrementGoal()

              if (event.assist_player_id) {
                const assistKey = `${event.match_id ?? ''}:${event.minute ?? ''}:${event.assist_player_id}`
                if (!processedAssistKeys.has(assistKey)) {
                  processedAssistKeys.add(assistKey)
                  const assistInfo = playerInfoMap.get(event.assist_player_id) ?? DEFAULT_PLAYER
                  if (!assistCount[event.assist_player_id]) {
                    assistCount[event.assist_player_id] = { count: 0, info: assistInfo }
                  }
                  assistCount[event.assist_player_id].count += 1
                  totalAssists += 1
                }
              }
              break
            }
            case 'own_goal': {
              totalGoals += 1
              totalOwnGoals += 1
              break
            }
            case 'assist': {
              if (!playerId) break
              const assistKey = `${event.match_id ?? ''}:${event.minute ?? ''}:${playerId}`
              if (!processedAssistKeys.has(assistKey)) {
                processedAssistKeys.add(assistKey)
                if (!assistCount[playerId]) {
                  assistCount[playerId] = { count: 0, info }
                }
                assistCount[playerId].count += 1
                totalAssists += 1
              }
              break
            }
            case 'yellow_card': {
              if (playerId) {
                if (!cardCount[playerId]) {
                  cardCount[playerId] = { yellow: 0, red: 0, info }
                }
                cardCount[playerId].yellow += 1
              }
              totalYellowCards += 1
              break
            }
            case 'red_card': {
              if (playerId) {
                if (!cardCount[playerId]) {
                  cardCount[playerId] = { yellow: 0, red: 0, info }
                }
                cardCount[playerId].red += 1
              }
              totalRedCards += 1
              break
            }
            case 'save': {
              if (!playerId) break
              if (!goalkeeperStats[playerId]) {
                goalkeeperStats[playerId] = { saves: 0, goals_conceded: 0, info }
              }
              goalkeeperStats[playerId].saves += 1
              totalSaves += 1

              if (event.match_id && event.team_id) {
                const key = `${event.match_id}:${event.team_id}`
                const keepers = goalkeepersByMatchTeam.get(key) ?? new Set<string>()
                keepers.add(playerId)
                goalkeepersByMatchTeam.set(key, keepers)
              }
              break
            }
            default:
              break
          }
        })

        goalkeepersByMatchTeam.forEach((keepers, key) => {
          const [matchId, teamId] = key.split(':')
          const match = matchScoreMap.get(matchId)
          if (!match) return

          let goalsConceded = 0
          if (teamId === (match.home_team_id ?? '')) {
            goalsConceded = match.away_score ?? 0
          } else if (teamId === (match.away_team_id ?? '')) {
            goalsConceded = match.home_score ?? 0
          } else {
            goalsConceded = 0
          }

          keepers.forEach(playerId => {
            const keeper = goalkeeperStats[playerId]
            if (!keeper) return
            keeper.goals_conceded += goalsConceded
          })
        })

        const topScorers = Object.entries(goalCount)
          .map(([player_id, data]) => ({
            player_id,
            player_name: data.info.player_name,
            team_name: data.info.team_name,
            team_id: data.info.team_id,
            goals: data.count,
            player_photo_url: data.info.player_photo_url,
          }))
          .sort((a, b) => b.goals - a.goals || a.player_name.localeCompare(b.player_name))
          .slice(0, 10)

        const topAssists = Object.entries(assistCount)
          .map(([player_id, data]) => ({
            player_id,
            player_name: data.info.player_name,
            team_name: data.info.team_name,
            team_id: data.info.team_id,
            assists: data.count,
            player_photo_url: data.info.player_photo_url,
          }))
          .sort((a, b) => b.assists - a.assists || a.player_name.localeCompare(b.player_name))
          .slice(0, 10)

        const topCards = Object.entries(cardCount)
          .map(([player_id, data]) => ({
            player_id,
            player_name: data.info.player_name,
            team_name: data.info.team_name,
            team_id: data.info.team_id,
            yellow_cards: data.yellow,
            red_cards: data.red,
            player_photo_url: data.info.player_photo_url,
          }))
          .sort((a, b) => {
            if (b.red_cards !== a.red_cards) return b.red_cards - a.red_cards
            if (b.yellow_cards !== a.yellow_cards) return b.yellow_cards - a.yellow_cards
            return a.player_name.localeCompare(b.player_name)
          })
          .slice(0, 10)

        const topGoalkeepers = Object.entries(goalkeeperStats)
          .map(([player_id, data]) => ({
            player_id,
            player_name: data.info.player_name,
            team_name: data.info.team_name,
            team_id: data.info.team_id,
            saves: data.saves,
            goals_conceded: data.goals_conceded,
            player_photo_url: data.info.player_photo_url,
          }))
          .filter(keeper => keeper.saves > 0)
          .sort((a, b) => {
            if (b.saves !== a.saves) return b.saves - a.saves
            if (a.goals_conceded !== b.goals_conceded) return a.goals_conceded - b.goals_conceded
            return a.player_name.localeCompare(b.player_name)
          })
          .slice(0, 10)

        setStats({
          totalGoals,
          totalAssists,
          totalYellowCards,
          totalRedCards,
          totalOwnGoals,
          totalSaves,
          topScorers,
          topAssists,
          topCards,
          topGoalkeepers,
          matchEvents: events || [],
        })
      } catch (err) {
        console.error('Error fetching tournament stats:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchTournamentStats()
  }, [tournamentId])

  return { stats, loading, error }
}
