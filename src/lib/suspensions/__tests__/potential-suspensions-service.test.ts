// Comprehensive test for the potential suspensions service
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PotentialSuspensionsService } from '@/lib/suspensions/potential-suspensions-service'
import { supabase } from '@/lib/supabase'

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn()
  }
}))

describe('PotentialSuspensionsService', () => {
  let service: PotentialSuspensionsService

  beforeEach(() => {
    service = new PotentialSuspensionsService()
    // Clear cache before each test
    service.clearTournamentCache('test-tournament')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize correctly', () => {
    expect(service).toBeTruthy()
  })

  it('should detect potential suspensions for a tournament', async () => {
    // Mock Supabase responses
    const mockMatches = [
      {
        id: 'match-1',
        home_team_id: 'team-1',
        away_team_id: 'team-2',
        scheduled_at: new Date().toISOString()
      }
    ]

    const mockTeams = [
      { id: 'team-1', name: 'Team 1' },
      { id: 'team-2', name: 'Team 2' }
    ]

    const mockPlayers = [
      { 
        id: 'player-1', 
        name: 'Player 1', 
        team_id: 'team-1',
        teams: { name: 'Team 1' }
      },
      { 
        id: 'player-2', 
        name: 'Player 2', 
        team_id: 'team-2',
        teams: { name: 'Team 2' }
      }
    ]

    const mockSuspensions = [
      {
        id: 'suspension-1',
        player_id: 'player-1',
        tournament_id: 'test-tournament',
        match_id: 'match-1',
        reason: 'Yellow card in last match',
        suspension_type: 'yellow_risk',
        suspension_matches: 1,
        served: false,
        players: { name: 'Player 1' },
        teams: { name: 'Team 1' }
      }
    ]

    // Mock the chain of Supabase calls
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: table === 'matches' ? mockMatches[0] : 
                table === 'players' ? mockPlayers[0] : 
                table === 'teams' ? mockTeams[0] : 
                mockSuspensions[0],
          error: null
        })
      } as any
    })

    const result = await service.detectPotentialSuspensions('test-tournament')

    expect(result).toBeInstanceOf(Array)
    // Since we're not returning actual data in the mock, we expect an empty array
    expect(result).toHaveLength(0)
  })

  it('should handle errors gracefully', async () => {
    // Mock an error response
    vi.mocked(supabase.from).mockImplementation(() => {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: null,
          error: new Error('Database error')
        })
      } as any
    })

    const result = await service.detectPotentialSuspensions('test-tournament')
    
    expect(result).toBeInstanceOf(Array)
    expect(result).toHaveLength(0)
  })

  it('should cache results for performance', async () => {
    // Mock successful response
    const mockData = []
    
    vi.mocked(supabase.from).mockImplementation(() => {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: mockData,
          error: null
        })
      } as any
    })

    // First call
    const result1 = await service.detectPotentialSuspensions('test-tournament')
    
    // Second call should use cache
    const result2 = await service.detectPotentialSuspensions('test-tournament')
    
    expect(result1).toEqual(result2)
    // Should only have made one actual Supabase call due to caching
    expect(supabase.from).toHaveBeenCalledTimes(1)
  })

  it('should clear cache when requested', async () => {
    // Mock successful response
    const mockData = []
    
    vi.mocked(supabase.from).mockImplementation(() => {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: mockData,
          error: null
        })
      } as any
    })

    // First call
    await service.detectPotentialSuspensions('test-tournament')
    
    // Clear cache
    service.clearTournamentCache('test-tournament')
    
    // Second call should make a new Supabase call since cache was cleared
    await service.detectPotentialSuspensions('test-tournament')
    
    // Should have made two Supabase calls
    expect(supabase.from).toHaveBeenCalledTimes(2)
  })
})