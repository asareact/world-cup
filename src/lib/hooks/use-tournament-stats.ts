// src/lib/hooks/use-tournament-stats.ts (Mejorado)
import { useState, useEffect } from 'react'
import { MatchEvent } from '@/lib/database'
import { supabase } from '@/lib/supabase'

interface TournamentStats {
  totalGoals: number
  totalAssists: number
  totalYellowCards: number
  totalRedCards: number
  totalOwnGoals: number
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
  matchEvents: MatchEvent[]
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

        // Obtenemos todos los IDs de partidos del torneo
        const { data: matches, error: matchesError } = await supabase
          .from('matches')
          .select('id')
          .eq('tournament_id', tournamentId)

        if (matchesError) throw matchesError

        const matchIds = matches?.map(match => match.id) || []

        // Si no hay partidos, retornamos estadísticas vacías
        if (matchIds.length === 0) {
          setStats({
            totalGoals: 0,
            totalAssists: 0,
            totalYellowCards: 0,
            totalRedCards: 0,
            totalOwnGoals: 0,
            topScorers: [],
            topAssists: [],
            topCards: [],
            matchEvents: []
          })
          return
        }

        // Obtenemos todos los eventos de los partidos del torneo
        const { data: events, error: eventsError } = await supabase
          .from('match_events')
          .select(`
            id, match_id, player_id, team_id, event_type, minute, description, assist_player_id, created_at,
            player:players!match_events_player_id_fkey(name, photo_url, team_id),
            team:teams!match_events_team_id_fkey(name)
          `)
          .in('match_id', matchIds)
          .order('created_at', { ascending: false })

        if (eventsError) throw eventsError

        // Procesamos las estadísticas
        let totalGoals = 0
        let totalAssists = 0
        let totalYellowCards = 0
        let totalRedCards = 0
        let totalOwnGoals = 0

        // Contadores por jugador para diferentes estadísticas
        const goalCount: Record<string, { count: number, team_name: string, team_id: string, player_name: string, player_photo_url?: string | null }> = {}
        const assistCount: Record<string, { count: number, team_name: string, team_id: string, player_name: string, player_photo_url?: string | null }> = {}
        const cardCount: Record<string, { yellow: number, red: number, team_name: string, team_id: string, player_name: string, player_photo_url?: string | null }> = {}

        events?.forEach(event => {
          if (!event) return
          
          const playerId = event.player_id
          const playerName = event.player?.name || 'Jugador desconocido'
          const teamName = event.team?.name || 'Equipo desconocido'
          const playerPhoto = event.player?.photo_url
          const teamId = event.team_id || ''

          switch (event.event_type) {
            case 'goal':
              totalGoals++
              if (playerId && goalCount[playerId]) {
                goalCount[playerId].count += 1
              } else if (playerId) {
                goalCount[playerId] = { 
                  count: 1, 
                  team_name: teamName, 
                  team_id: teamId, 
                  player_name: playerName,
                  player_photo_url: playerPhoto
                }
              }
              break
            case 'own_goal':
              totalOwnGoals++
              if (playerId && goalCount[playerId]) {
                goalCount[playerId].count += 1
              } else if (playerId) {
                goalCount[playerId] = { 
                  count: 1, 
                  team_name: teamName, 
                  team_id: teamId, 
                  player_name: playerName,
                  player_photo_url: playerPhoto
                }
              }
              break
            case 'assist':
              totalAssists++
              if (playerId && assistCount[playerId]) {
                assistCount[playerId].count += 1
              } else if (playerId) {
                assistCount[playerId] = { 
                  count: 1, 
                  team_name: teamName, 
                  team_id: teamId, 
                  player_name: playerName,
                  player_photo_url: playerPhoto
                }
              }
              break
            case 'yellow_card':
              totalYellowCards++
              if (playerId && cardCount[playerId]) {
                cardCount[playerId].yellow += 1
              } else if (playerId) {
                cardCount[playerId] = { 
                  yellow: 1, 
                  red: 0,
                  team_name: teamName, 
                  team_id: teamId, 
                  player_name: playerName,
                  player_photo_url: playerPhoto
                }
              }
              break
            case 'red_card':
              totalRedCards++
              if (playerId && cardCount[playerId]) {
                cardCount[playerId].red += 1
              } else if (playerId) {
                cardCount[playerId] = { 
                  yellow: 0, 
                  red: 1,
                  team_name: teamName, 
                  team_id: teamId, 
                  player_name: playerName,
                  player_photo_url: playerPhoto
                }
              }
              break
          }
          
          // Tambien contamos asistencias cuando se registra un gol con asistencia
          if (event.event_type === 'goal' && event.assist_player_id) {
            // Obtenemos el nombre del jugador que asistió
            const assistEvent = events.find(e => 
              e && 
              e.player_id === event.assist_player_id && 
              e.match_id === event.match_id && 
              e.minute === event.minute
            )
            if (assistEvent) {
              const assistPlayerId = event.assist_player_id
              const assistPlayerName = assistEvent.player?.name || 'Jugador desconocido'
              const assistTeamName = assistEvent.team?.name || 'Equipo desconocido'
              const assistPhoto = assistEvent.player?.photo_url
              const assistTeamId = assistEvent.team_id || ''
              
              if (assistCount[assistPlayerId]) {
                assistCount[assistPlayerId].count += 1
              } else {
                assistCount[assistPlayerId] = { 
                  count: 1, 
                  team_name: assistTeamName, 
                  team_id: assistTeamId, 
                  player_name: assistPlayerName,
                  player_photo_url: assistPhoto
                }
              }
              
              totalAssists++
            }
          }
        })

        // Convertir contadores a arrays ordenados
        const topScorers = Object.entries(goalCount)
          .map(([player_id, data]) => ({
            player_id,
            player_name: data.player_name,
            team_name: data.team_name,
            team_id: data.team_id,
            goals: data.count,
            player_photo_url: data.player_photo_url
          }))
          .sort((a, b) => b.goals - a.goals)
          .slice(0, 10)

        const topAssists = Object.entries(assistCount)
          .map(([player_id, data]) => ({
            player_id,
            player_name: data.player_name,
            team_name: data.team_name,
            team_id: data.team_id,
            assists: data.count,
            player_photo_url: data.player_photo_url
          }))
          .sort((a, b) => b.assists - a.assists)
          .slice(0, 10)

        const topCards = Object.entries(cardCount)
          .map(([player_id, data]) => ({
            player_id,
            player_name: data.player_name,
            team_name: data.team_name,
            team_id: data.team_id,
            yellow_cards: data.yellow,
            red_cards: data.red,
            player_photo_url: data.player_photo_url
          }))
          .sort((a, b) => (b.yellow_cards + b.red_cards * 3) - (a.yellow_cards + a.red_cards * 3)) // Red cards weigh more
          .slice(0, 10)

        setStats({
          totalGoals,
          totalAssists,
          totalYellowCards,
          totalRedCards,
          totalOwnGoals,
          topScorers,
          topAssists,
          topCards,
          matchEvents: events || []
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

  return { stats, loading, error, refetch: () => fetchTournamentStats(tournamentId, setStats, setLoading, setError) }
}

async function fetchTournamentStats(
  tournamentId: string, 
  setStats: React.Dispatch<React.SetStateAction<TournamentStats | null>>, 
  setLoading: React.Dispatch<React.SetStateAction<boolean>>, 
  setError: React.Dispatch<React.SetStateAction<string | null>>
) {
  try {
    setLoading(true)
    setError(null)

    // Obtenemos todos los IDs de partidos del torneo
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id')
      .eq('tournament_id', tournamentId)

    if (matchesError) throw matchesError

    const matchIds = matches?.map(match => match.id) || []

    // Si no hay partidos, retornamos estadísticas vacías
    if (matchIds.length === 0) {
      setStats({
        totalGoals: 0,
        totalAssists: 0,
        totalYellowCards: 0,
        totalRedCards: 0,
        totalOwnGoals: 0,
        topScorers: [],
        topAssists: [],
        topCards: [],
        matchEvents: []
      })
      return
    }

    // Obtenemos todos los eventos de los partidos del torneo
    const { data: events, error: eventsError } = await supabase
      .from('match_events')
      .select(`
        id, match_id, player_id, team_id, event_type, minute, description, assist_player_id, created_at,
        player:players!match_events_player_id_fkey(name, photo_url, team_id),
        assist_player:players!match_events_assist_player_id_fkey(name, photo_url, team_id),
        team:teams!match_events_team_id_fkey(name)
      `)
      .in('match_id', matchIds)
      .order('created_at', { ascending: false })

    if (eventsError) throw eventsError

    // Procesamos las estadísticas
    let totalGoals = 0
    let totalAssists = 0
    let totalYellowCards = 0
    let totalRedCards = 0
    let totalOwnGoals = 0

    // Contadores por jugador para diferentes estadísticas
    const goalCount: Record<string, { count: number, team_name: string, team_id: string, player_name: string, player_photo_url?: string | null }> = {}
    const assistCount: Record<string, { count: number, team_name: string, team_id: string, player_name: string, player_photo_url?: string | null }> = {}
    const cardCount: Record<string, { yellow: number, red: number, team_name: string, team_id: string, player_name: string, player_photo_url?: string | null }> = {}

    events?.forEach(event => {
      if (!event) return
      
      const playerId = event.player_id
      const playerName = event.player?.name || 'Jugador desconocido'
      const teamName = event.team?.name || 'Equipo desconocido'
      const playerPhoto = event.player?.photo_url
      const teamId = event.team_id || ''

      switch (event.event_type) {
        case 'goal':
          totalGoals++
          if (playerId && goalCount[playerId]) {
            goalCount[playerId].count += 1
          } else if (playerId) {
            goalCount[playerId] = { 
              count: 1, 
              team_name: teamName, 
              team_id, 
              player_name: playerName,
              player_photo_url: playerPhoto
            }
          }
          break
        case 'own_goal':
          totalOwnGoals++
          if (playerId && goalCount[playerId]) {
            goalCount[playerId].count += 1
          } else if (playerId) {
            goalCount[playerId] = { 
              count: 1, 
              team_name: teamName, 
              team_id, 
              player_name: playerName,
              player_photo_url: playerPhoto
            }
          }
          break
        case 'assist':
          totalAssists++
          if (playerId && assistCount[playerId]) {
            assistCount[playerId].count += 1
          } else if (playerId) {
            assistCount[playerId] = { 
              count: 1, 
              team_name: teamName, 
              team_id, 
              player_name: playerName,
              player_photo_url: playerPhoto
            }
          }
          break
        case 'yellow_card':
          totalYellowCards++
          if (playerId && cardCount[playerId]) {
            cardCount[playerId].yellow += 1
          } else if (playerId) {
            cardCount[playerId] = { 
              yellow: 1, 
              red: 0,
              team_name: teamName, 
              team_id, 
              player_name: playerName,
              player_photo_url: playerPhoto
            }
          }
          break
        case 'red_card':
          totalRedCards++
          if (playerId && cardCount[playerId]) {
            cardCount[playerId].red += 1
          } else if (playerId) {
            cardCount[playerId] = { 
              yellow: 0, 
              red: 1,
              team_name: teamName, 
              team_id, 
              player_name: playerName,
              player_photo_url: playerPhoto
            }
          }
          break
      }
      
      // Tambien contamos asistencias cuando se registra un gol con asistencia
      if (event.event_type === 'goal' && event.assist_player_id) {
        const assistPlayerId = event.assist_player_id
        const existingAssist = events.find(e => 
          e && 
          e.player_id === assistPlayerId && 
          e.match_id === event.match_id && 
          e.minute === event.minute && 
          e.event_type === 'assist'
        )
        
        if (!existingAssist) {
          // Buscamos información del jugador que asistió
          const assistPlayerEvent = events.find(e => e && e.player_id === assistPlayerId)
          if (assistPlayerEvent) {
            const assistPlayerName = assistPlayerEvent.player?.name || 'Jugador desconocido'
            const assistTeamName = assistPlayerEvent.team?.name || 'Equipo desconocido'
            const assistPhoto = assistPlayerEvent.player?.photo_url
            const assistTeamId = assistPlayerEvent.team_id || ''
            
            if (assistCount[assistPlayerId]) {
              assistCount[assistPlayerId].count += 1
            } else {
              assistCount[assistPlayerId] = { 
                count: 1, 
                team_name: assistTeamName, 
                team_id: assistTeamId, 
                player_name: assistPlayerName,
                player_photo_url: assistPhoto
              }
            }
            
            totalAssists++
          }
        }
      }
    })

    // Convertir contadores a arrays ordenados
    const topScorers = Object.entries(goalCount)
      .map(([player_id, data]) => ({
        player_id,
        player_name: data.player_name,
        team_name: data.team_name,
        team_id: data.team_id,
        goals: data.count,
        player_photo_url: data.player_photo_url
      }))
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10)

    const topAssists = Object.entries(assistCount)
      .map(([player_id, data]) => ({
        player_id,
        player_name: data.player_name,
        team_name: data.team_name,
        team_id: data.team_id,
        assists: data.count,
        player_photo_url: data.player_photo_url
      }))
      .sort((a, b) => b.assists - a.assists)
      .slice(0, 10)

    const topCards = Object.entries(cardCount)
      .map(([player_id, data]) => ({
        player_id,
        player_name: data.player_name,
        team_name: data.team_name,
        team_id: data.team_id,
        yellow_cards: data.yellow,
        red_cards: data.red,
        player_photo_url: data.player_photo_url
      }))
      .sort((a, b) => (b.yellow_cards + b.red_cards * 3) - (a.yellow_cards + a.red_cards * 3)) // Red cards weigh more
      .slice(0, 10)

    setStats({
      totalGoals,
      totalAssists,
      totalYellowCards,
      totalRedCards,
      totalOwnGoals,
      topScorers,
      topAssists,
      topCards,
      matchEvents: events || []
    })
  } catch (err) {
    console.error('Error refetching tournament stats:', err)
    setError(err instanceof Error ? err.message : 'Error desconocido')
  } finally {
    setLoading(false)
  }
}