import { NextResponse } from 'next/server'
import { db, Match } from '@/lib/database'
import { createClient } from '@/lib/supabase/server'

// Helper function to generate proper round-robin pairings (similar to the frontend)
const generateRoundRobinPairings = (teams: { id: string; name: string }[]): { round: number; matches: [string, string][] }[] => {
  if (!Array.isArray(teams) || teams.length < 2) return []
  
  const rounds: { round: number; matches: [string, string][] }[] = [];
  const teamList = [...teams]; // Copy array to avoid mutating original
  const isOdd = teamList.length % 2 === 1;
  
  // If odd number of teams, add a "bye" placeholder
  if (isOdd) {
    teamList.push({ id: 'bye', name: 'BYE' });
  }
  
  const n = teamList.length;
  const numRounds = n - 1;
  
  for (let round = 0; round < numRounds; round++) {
    const roundMatches: [string, string][] = [];
    
    // Fix first position (team at index 0) and rotate others
    for (let i = 0; i < n / 2; i++) {
      const team1 = teamList[i];
      const team2 = teamList[n - 1 - i];
      
      // If either team is BYE, skip this match (it's a bye)
      if (team1.id !== 'bye' && team2.id !== 'bye') {
        // Alternate home/away to ensure fairness
        const homeId = round % 2 === 0 ? team1.id : team2.id;
        const awayId = round % 2 === 0 ? team2.id : team1.id;
        roundMatches.push([homeId, awayId]);
      }
    }
    
    rounds.push({
      round: round + 1,
      matches: roundMatches
    });
    
    // Rotate teams for next round (keep first position fixed)
    const firstTeam = teamList[0];
    const rotatedTeams = [firstTeam, teamList[n - 1], ...teamList.slice(1, n - 1)];
    teamList.splice(0, n, ...rotatedTeams);
  }
  
  return rounds;
};

// Spanish days mapping
const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Time slots for matches
const timeSlots = ['20:00', '21:00', '22:00']

// Helper function to format date with timezone
const formatDateWithTimezone = (date: Date, timeZone?: string): string => {
  // Default to Cuba's timezone if none provided for Cuban application
  const tz = timeZone || 'America/Havana';
  if (tz) {
    return date.toLocaleDateString('en-CA', { timeZone: tz });
  }
  return date.toISOString().split('T')[0];
}

// Helper function to get day of week in timezone
const getDayOfWeekWithTimezone = (date: Date, timeZone?: string): number => {
  // Default to Cuba's timezone if none provided for Cuban application
  const tz = timeZone || 'America/Havana';
  if (tz) {
    // Use Intl.DateTimeFormat to get the day of the week in the specific timezone
    return new Date(date.toLocaleString('en-US', { timeZone: tz })).getDay();
  }
  return date.getDay();
}

// PUT /api/tournaments/[id]/schedule - Generate and save tournament schedule
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // Get the tournament to check ownership
    const tournament = await db.getTournament(id)
    
    // Check if user is the creator
    if (tournament.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      )
    }

    // Parse the request body
    const body = await request.json()
    // Default to Cuba timezone if none provided for Cuban application
    const { teams, startDate: startDateParam, leagueTimeZone = 'America/Havana' } = body
    
    // Validate input
    if (!teams || !Array.isArray(teams) || teams.length < 3) {
      return NextResponse.json(
        { error: `Tournament requires at least 3 teams. Only ${teams?.length || 0} teams provided.` }, 
        { status: 400 }
      )
    }

    // Validate team structure
    for (const team of teams) {
      if (!team.id || !team.name) {
        return NextResponse.json(
          { error: 'Each team must have an id and name' }, 
          { status: 400 }
        )
      }
    }
    
    // Clear existing matches for this tournament
    await db.deleteMatchesForTournament(id)
    
    // Generate round-robin pairings
    const roundPairings = generateRoundRobinPairings(teams)
    
    // Start from next Monday or provided startDate, considering timezone
    const scheduleStart = startDateParam ? new Date(startDateParam) : new Date()
    const nextMonday = new Date(scheduleStart)
    
    if (!startDateParam) {
      // Always start from the next Monday to ensure we have future dates for scheduling
      const currentDay = nextMonday.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      let daysToAdd;
      if (currentDay === 0) { // Sunday
        daysToAdd = 1; // Next day is Monday
      } else if (currentDay === 1) { // Monday
        daysToAdd = 7; // Next Monday is in 7 days
      } else { // Tuesday-Saturday
        daysToAdd = (8 - currentDay) % 7; // How many days until next Monday (e.g., Tue(2) -> Mon(1) = 6 days)
      }
      nextMonday.setDate(nextMonday.getDate() + daysToAdd);
    } else {
      // If startDate is provided and is not a Monday, adjust to the following Monday
      const providedDay = nextMonday.getDay();
      if (providedDay !== 1) { // If provided day is not Monday
        let daysToAdd;
        if (providedDay === 0) { // Sunday
          daysToAdd = 1; // Next day is Monday
        } else { // Tuesday-Saturday
          daysToAdd = (8 - providedDay) % 7; // How many days until next Monday
        }
        nextMonday.setDate(nextMonday.getDate() + daysToAdd);
      }
    }
    
    // Generate matches with proper scheduling
    const matchesToCreate: Omit<Match, 'id' | 'created_at' | 'updated_at'>[] = []
    
    // Process each round, ensuring all matches from the same round are scheduled contiguously
    let globalDayOffset = 0; // Track day offset across all matches to ensure proper progression
    const scheduledTimes: Record<string, Set<string>> = {}; // Track scheduled times per date to avoid duplicates during generation

    for (const roundData of roundPairings) {
      const { round, matches } = roundData
      
      // Schedule all matches for this round contiguously
      for (const [homeId, awayId] of matches) {
        // Find the next available time slot (Monday-Thursday, 20:00/21:00/22:00)
        let dayOffset = globalDayOffset; // Start searching from where we left off
        
        while (true) {
          const scheduleDate = new Date(nextMonday)
          scheduleDate.setDate(nextMonday.getDate() + dayOffset)
          
          // Only schedule on Monday-Thursday (0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday)
          // Default to Cuba timezone for Cuban application
          const timezoneForDay = leagueTimeZone || 'America/Havana';
          const dayOfWeek = getDayOfWeekWithTimezone(scheduleDate, timezoneForDay)
          if (dayOfWeek < 1 || dayOfWeek > 4) { // Only allow Monday(1) to Thursday(4), exclude Sunday(0), Friday(5), Saturday(6)
            dayOffset++
            continue
          }
          
          // Format date according to timezone if provided, defaulting to Cuba for Cuban application
          const timezoneForDate = leagueTimeZone || 'America/Havana';
          const dateStr = formatDateWithTimezone(scheduleDate, timezoneForDate)
          
          // Get existing matches for this date to see available slots
          // Using range query instead of like for timestamp fields
          // Respect timezone for date range queries
          const startDateTime = new Date(`${dateStr}T00:00:00`);
          const endDateTime = new Date(`${dateStr}T23:59:59`);
          
          const { data: existingMatchesForDate, error: matchError } = await supabase
            .from('matches')
            .select('scheduled_at')
            .eq('tournament_id', id)
            .gte('scheduled_at', startDateTime.toISOString())
            .lt('scheduled_at', endDateTime.toISOString());
          
          if (matchError) {
            console.error('Error fetching existing matches:', matchError)
            throw matchError
          }
          
          // Find an available time slot
          let availableTimeSlot: string | null = null
          let availableTime = '';
          
          for (const time of timeSlots) {
            // Check if this time slot is already taken in the database
            const timeSlotTakenFromDB = existingMatchesForDate?.some(
              (match: { scheduled_at: string }) => {
                if (!match.scheduled_at) return false;
                // Extract date and time from the scheduled_at field for comparison
                const scheduledDate = match.scheduled_at.split('T')[0];
                const scheduledTime = match.scheduled_at.split('T')[1]?.substring(0, 5); // Get HH:MM
                return scheduledDate === dateStr && scheduledTime === time;
              }
            )
            
            // Also check if this time slot is already scheduled in our current generation run
            const dateKey = dateStr;
            if (!scheduledTimes[dateKey]) {
              scheduledTimes[dateKey] = new Set();
            }
            const timeSlotTakenFromGeneration = scheduledTimes[dateKey].has(time);
            
            if (!timeSlotTakenFromDB && !timeSlotTakenFromGeneration) {
              // This time slot is available
              availableTime = time;
              // Mark it as taken for subsequent matches in this generation
              scheduledTimes[dateKey].add(availableTime);
              
              // Ensure the time is properly set for Cuban timezone
              // Create the datetime and convert to ISO for database storage
              const timezoneForTime = leagueTimeZone || 'America/Havana';
              const dateForTime = new Date(`${dateStr}T${time}:00`);
              availableTimeSlot = dateForTime.toISOString();
              break
            }
          }
          
          if (availableTimeSlot) {
            // Add the match with the available time slot
            matchesToCreate.push({
              tournament_id: id,
              home_team_id: homeId,
              away_team_id: awayId,
              scheduled_at: availableTimeSlot,
              venue: 'Por definir',
              round_name: `Jornada ${round}`,
              status: 'scheduled',
              home_score: 0,
              away_score: 0,
              winner_team_id: null,
              notes: null,
            })
            
            // Update global offset to continue from the current day/next available slot
            globalDayOffset = dayOffset;
            break
          } else {
            // No available slots in this day, move to next day
            dayOffset++
          }
        }
      }
    }
    
    // Save all matches to the database
    if (matchesToCreate.length > 0) {
      try {
        const savedMatches = await db.createMatches(matchesToCreate);
        return NextResponse.json({ 
          message: 'Schedule generated and saved successfully', 
          tournamentId: id,
          matchesCreated: savedMatches.length,
          rounds: roundPairings.length,
          roundPairings: roundPairings.map(rp => rp.round) // Return the rounds created
        });
      } catch (createError) {
        console.error('Error creating matches:', createError);
        throw createError;
      }
    } else {
      return NextResponse.json({ 
        message: 'No matches were created', 
        tournamentId: id,
        matchesCreated: 0
      })
    }
  } catch (error) {
    console.error('Error generating schedule:', error)
    return NextResponse.json(
      { error: 'Failed to generate schedule' }, 
      { status: 500 }
    )
  }
}