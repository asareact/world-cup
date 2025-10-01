// Example usage of the PotentialSuspensionsService
import { PotentialSuspensionsService } from '@/lib/suspensions/potential-suspensions-service'

// Example 1: Get potential suspensions for a specific match
async function checkMatchSuspensions(tournamentId: string, matchId: string) {
  const suspensionService = new PotentialSuspensionsService()
  
  try {
    const potentialSuspensions = await suspensionService.detectPotentialSuspensions(
      tournamentId, 
      matchId
    )
    
    console.log('Potential suspensions for match:', potentialSuspensions)
    
    // Display warnings in UI
    potentialSuspensions.forEach(suspension => {
      console.log(`⚠️ ${suspension.playerName} (${suspension.teamName}) - ${suspension.reason}`)
    })
    
    return potentialSuspensions
  } catch (error) {
    console.error('Error checking potential suspensions:', error)
    return []
  }
}

// Example 2: Get potential suspensions for all upcoming matches in a tournament
async function checkTournamentSuspensions(tournamentId: string) {
  const suspensionService = new PotentialSuspensionsService()
  
  try {
    const potentialSuspensions = await suspensionService.detectPotentialSuspensions(tournamentId)
    
    console.log('All potential suspensions in tournament:', potentialSuspensions)
    
    // Group by match for easier display
    const suspensionsByMatch: Record<string, typeof potentialSuspensions> = {}
    
    potentialSuspensions.forEach(suspension => {
      if (!suspensionsByMatch[suspension.matchId]) {
        suspensionsByMatch[suspension.matchId] = []
      }
      suspensionsByMatch[suspension.matchId].push(suspension)
    })
    
    // Display grouped results
    Object.entries(suspensionsByMatch).forEach(([matchId, suspensions]) => {
      console.log(`Match ${matchId} has ${suspensions.length} players at risk:`)
      suspensions.forEach(suspension => {
        console.log(`  - ${suspension.playerName} (${suspension.teamName})`)
      })
    })
    
    return potentialSuspensions
  } catch (error) {
    console.error('Error checking tournament suspensions:', error)
    return []
  }
}

// Example 3: Get detailed stats for a specific player
async function getPlayerSuspensionStats(playerId: string, tournamentId: string) {
  const suspensionService = new PotentialSuspensionsService()
  
  try {
    const stats = await suspensionService.getPlayerSuspensionStats(playerId, tournamentId)
    
    console.log('Player suspension stats:', stats)
    
    return stats
  } catch (error) {
    console.error('Error getting player suspension stats:', error)
    return null
  }
}

// Export examples for use in other modules
export {
  checkMatchSuspensions,
  checkTournamentSuspensions,
  getPlayerSuspensionStats
}