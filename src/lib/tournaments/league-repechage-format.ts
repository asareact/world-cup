const generatePlanId = () => {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID()
  }
  return `plan_${Math.random().toString(36).slice(2, 10)}`
}

export type TieBreakerRule = 'extra_time' | 'penalties'

export interface TeamStanding {
  id: string
  name: string
  points: number
  wins?: number
  draws?: number
  losses?: number
  goalsFor?: number
  goalsAgainst?: number
  goalDifference?: number
  rank?: number
}

export interface RepechageMatchPlan {
  id: string
  label: string
  home: TeamStanding | null
  away: TeamStanding | null
  legs: number
  tieBreaker: TieBreakerRule[]
  note?: string
}

export interface RepechagePlan {
  participants: TeamStanding[]
  matches: RepechageMatchPlan[]
  autoQualified: TeamStanding[]
  notes: string[]
}

export interface QuarterFinalSeedRule {
  matchId?: string
  secondaryMatchId?: string
  description?: string
}

export interface QuarterFinalSeed {
  seed: number
  source: 'direct' | 'repechageWinner' | 'autoQualified'
  team?: TeamStanding
  placeholder?: string
  rules?: QuarterFinalSeedRule
}

export interface MatchParticipantReference {
  type: 'seed' | 'conditionalSeed' | 'matchWinner' | 'matchLoser'
  seed?: number
  matchId?: string
  description: string
  conditionalSeedRule?: QuarterFinalSeedRule
}

export interface KnockoutMatchPlan {
  id: string
  label: string
  legs: number
  tieBreaker: TieBreakerRule[]
  home: MatchParticipantReference
  away: MatchParticipantReference
}

export interface KnockoutPlan {
  quarterFinals: KnockoutMatchPlan[]
  semiFinals: KnockoutMatchPlan[]
  final: KnockoutMatchPlan
  thirdPlace: KnockoutMatchPlan
}

export interface LeagueFormatPlan {
  directQualifiers: TeamStanding[]
  repechage: RepechagePlan
  eliminated: TeamStanding[]
  quarterFinalSeeds: QuarterFinalSeed[]
  knockout: KnockoutPlan
  notes: string[]
}

export interface LeagueFormatOptions {
  minimumTeams?: number
  maximumTeams?: number
}

const DEFAULT_MIN_TEAMS = 9
const DEFAULT_MAX_TEAMS = 14
const DIRECT_SLOTS = 6
const DESIRED_REPECHAGE_SLOTS = 4
const BASE_ELIMINATED_SLOTS = 3
const DEFAULT_REPECHAGE_TIEBREAKER: TieBreakerRule[] = ['extra_time', 'penalties']

function calculateGoalDifference(entry: TeamStanding): number {
  if (typeof entry.goalDifference === 'number') return entry.goalDifference
  const goalsFor = entry.goalsFor ?? 0
  const goalsAgainst = entry.goalsAgainst ?? 0
  return goalsFor - goalsAgainst
}

function sortStandings(standings: TeamStanding[]): TeamStanding[] {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points

    const goalDiffComparison = calculateGoalDifference(b) - calculateGoalDifference(a)
    if (goalDiffComparison !== 0) return goalDiffComparison

    const goalsForComparison = (b.goalsFor ?? 0) - (a.goalsFor ?? 0)
    if (goalsForComparison !== 0) return goalsForComparison

    const winsComparison = (b.wins ?? 0) - (a.wins ?? 0)
    if (winsComparison !== 0) return winsComparison

    return a.name.localeCompare(b.name)
  })
}

function validateTeamCount(standings: TeamStanding[], options?: LeagueFormatOptions) {
  const minTeams = options?.minimumTeams ?? DEFAULT_MIN_TEAMS
  const maxTeams = options?.maximumTeams ?? DEFAULT_MAX_TEAMS

  if (standings.length < minTeams || standings.length > maxTeams) {
    throw new Error(`El formato admite entre ${minTeams} y ${maxTeams} equipos. Actualmente hay ${standings.length}.`)
  }

  if (standings.length < DIRECT_SLOTS + 2) {
    throw new Error('Se necesitan al menos 8 equipos para garantizar la fase final de ocho cupos.')
  }
}

function determineRepechageSize(remainingTeams: number): number {
  if (remainingTeams <= 0) return 0

  const baseSize = Math.min(DESIRED_REPECHAGE_SLOTS, Math.max(0, remainingTeams - BASE_ELIMINATED_SLOTS))

  if (remainingTeams >= 4 && baseSize === 0) {
    return 4
  }

  if (remainingTeams >= 2 && baseSize < 2) {
    return Math.min(2, remainingTeams)
  }

  return Math.min(baseSize, remainingTeams)
}

function createRepechagePlan(participants: TeamStanding[]): RepechagePlan {
  const matches: RepechageMatchPlan[] = []
  const autoQualified: TeamStanding[] = []
  const notes: string[] = []

  if (participants.length >= 4) {
    const [rank7, rank8, rank9, rank10] = participants
    const matchAId = generatePlanId()
    const matchBId = generatePlanId()

    matches.push(
      {
        id: matchAId,
        label: 'Repechaje A',
        home: rank7 ?? null,
        away: rank10 ?? null,
        legs: 2,
        tieBreaker: DEFAULT_REPECHAGE_TIEBREAKER,
        note: 'Serie ida y vuelta; si el global termina igualado se disputa tiempo extra y penales.',
      },
      {
        id: matchBId,
        label: 'Repechaje B',
        home: rank8 ?? null,
        away: rank9 ?? null,
        legs: 2,
        tieBreaker: DEFAULT_REPECHAGE_TIEBREAKER,
        note: 'Serie ida y vuelta; si el global termina igualado se disputa tiempo extra y penales.',
      },
    )
  } else if (participants.length === 3) {
    autoQualified.push(participants[0])
    matches.push({
      id: generatePlanId(),
      label: 'Repechaje unico',
      home: participants[1] ?? null,
      away: participants[2] ?? null,
      legs: 2,
      tieBreaker: DEFAULT_REPECHAGE_TIEBREAKER,
      note: 'Serie ida y vuelta; en caso de empate global se juega tiempo extra y penales.',
    })
    notes.push('Como solo hay tres equipos en repechaje, el mejor clasificado obtiene pase directo a cuartos de final.')
  } else if (participants.length === 2) {
    autoQualified.push(...participants)
    notes.push('Los dos equipos del repechaje avanzan automáticamente a cuartos; se puede disputar un partido para definir el orden de siembra.')
  } else if (participants.length === 1) {
    autoQualified.push(participants[0])
    notes.push('El único equipo en repechaje avanza sin jugar; se libera un cupo adicional en cuartos.')
  }

  return {
    participants,
    matches,
    autoQualified,
    notes,
  }
}

function buildQuarterFinalSeeds(
  direct: TeamStanding[],
  repechagePlan: RepechagePlan,
): QuarterFinalSeed[] {
  const seeds: QuarterFinalSeed[] = []

  direct.forEach((team, index) => {
    seeds.push({
      seed: index + 1,
      source: 'direct',
      team,
    })
  })

  // Seeds 7 y 8
  const seedSlots: Record<number, QuarterFinalSeed | undefined> = {}

  if (repechagePlan.autoQualified.length >= 2) {
    seedSlots[7] = { seed: 7, source: 'autoQualified', team: repechagePlan.autoQualified[0] }
    seedSlots[8] = { seed: 8, source: 'autoQualified', team: repechagePlan.autoQualified[1] }
  } else if (repechagePlan.autoQualified.length === 1) {
    seedSlots[7] = { seed: 7, source: 'autoQualified', team: repechagePlan.autoQualified[0] }
  }

  const remainingSeeds = [7, 8].filter(seed => !seedSlots[seed])
  const matches = repechagePlan.matches

  remainingSeeds.forEach((seedNumber, index) => {
    const match = matches[index] ?? matches[matches.length - 1] ?? null
    seedSlots[seedNumber] = {
      seed: seedNumber,
      source: 'repechageWinner',
      placeholder: match ? `Ganador ${match.label}` : 'Plaza pendiente de repechaje',
      rules: match
        ? {
            matchId: match.id,
            description: match.note,
          }
        : undefined,
    }
  })

  if (matches.length >= 2 && !seedSlots[7]?.team) {
    seedSlots[7] = {
      seed: 7,
      source: seedSlots[7]?.source ?? 'repechageWinner',
      placeholder: 'Plaza 7 (según Repechaje A/B)',
      rules: {
        matchId: matches[0].id,
        secondaryMatchId: matches[1].id,
        description: 'Si en Repechaje A avanza el puesto 7 mantiene la plaza 7; si avanza el puesto 10, la plaza 7 es para el ganador de Repechaje B.',
      },
    }
  }

  if (matches.length >= 2 && !seedSlots[8]?.team) {
    seedSlots[8] = {
      seed: 8,
      source: seedSlots[8]?.source ?? 'repechageWinner',
      placeholder: 'Plaza 8 (según Repechaje A/B)',
      rules: {
        matchId: matches[0].id,
        secondaryMatchId: matches[1].id,
        description: 'La plaza restante entre los ganadores del repechaje ocupará el puesto 8.',
      },
    }
  }

  seeds.push(...[seedSlots[7], seedSlots[8]].filter((entry): entry is QuarterFinalSeed => Boolean(entry)))
  seeds.sort((a, b) => a.seed - b.seed)
  return seeds
}

function createParticipantRef(
  seedNumber: number,
  seedInfo: QuarterFinalSeed | undefined,
): MatchParticipantReference {
  if (!seedInfo) {
    return { type: 'seed', seed: seedNumber, description: `Plaza ${seedNumber}` }
  }

  if (seedInfo.team) {
    return {
      type: 'seed',
      seed: seedNumber,
      description: `${seedInfo.team.name}`,
    }
  }

  if (seedInfo.rules) {
    return {
      type: 'conditionalSeed',
      seed: seedNumber,
      description: seedInfo.placeholder ?? `Plaza ${seedNumber}`,
      conditionalSeedRule: seedInfo.rules,
    }
  }

  return {
    type: 'seed',
    seed: seedNumber,
    description: seedInfo.placeholder ?? `Plaza ${seedNumber}`,
  }
}

export function evaluateLeagueRepechageFormat(
  standings: TeamStanding[],
  options?: LeagueFormatOptions,
): LeagueFormatPlan {
  validateTeamCount(standings, options)

  const rankedStandings = sortStandings(standings).map((team, index) => ({
    ...team,
    rank: index + 1,
  }))

  const direct = rankedStandings.slice(0, Math.min(DIRECT_SLOTS, rankedStandings.length))
  const remaining = rankedStandings.slice(direct.length)

  const repechageSize = determineRepechageSize(remaining.length)
  const repechageCandidates = remaining.slice(0, repechageSize)
  const repechagePlan = createRepechagePlan(repechageCandidates)

  const eliminated = remaining.slice(repechageCandidates.length)
  const quarterFinalSeeds = buildQuarterFinalSeeds(direct, repechagePlan)

  const seedMap = new Map<number, QuarterFinalSeed>()
  quarterFinalSeeds.forEach(seed => seedMap.set(seed.seed, seed))

  const quarterFinals: KnockoutMatchPlan[] = [
    {
      id: generatePlanId(),
      label: 'Cuartos A',
      legs: 2,
      tieBreaker: DEFAULT_REPECHAGE_TIEBREAKER,
      home: createParticipantRef(1, seedMap.get(1)),
      away: createParticipantRef(8, seedMap.get(8)),
    },
    {
      id: generatePlanId(),
      label: 'Cuartos B',
      legs: 2,
      tieBreaker: DEFAULT_REPECHAGE_TIEBREAKER,
      home: createParticipantRef(2, seedMap.get(2)),
      away: createParticipantRef(7, seedMap.get(7)),
    },
    {
      id: generatePlanId(),
      label: 'Cuartos C',
      legs: 2,
      tieBreaker: DEFAULT_REPECHAGE_TIEBREAKER,
      home: createParticipantRef(3, seedMap.get(3)),
      away: createParticipantRef(6, seedMap.get(6)),
    },
    {
      id: generatePlanId(),
      label: 'Cuartos D',
      legs: 2,
      tieBreaker: DEFAULT_REPECHAGE_TIEBREAKER,
      home: createParticipantRef(4, seedMap.get(4)),
      away: createParticipantRef(5, seedMap.get(5)),
    },
  ]

  const semiFinals: KnockoutMatchPlan[] = [
    {
      id: generatePlanId(),
      label: 'Semifinal 1',
      legs: 2,
      tieBreaker: DEFAULT_REPECHAGE_TIEBREAKER,
      home: { type: 'matchWinner', matchId: quarterFinals[0].id, description: 'Ganador Cuartos A' },
      away: { type: 'matchWinner', matchId: quarterFinals[3].id, description: 'Ganador Cuartos D' },
    },
    {
      id: generatePlanId(),
      label: 'Semifinal 2',
      legs: 2,
      tieBreaker: DEFAULT_REPECHAGE_TIEBREAKER,
      home: { type: 'matchWinner', matchId: quarterFinals[1].id, description: 'Ganador Cuartos B' },
      away: { type: 'matchWinner', matchId: quarterFinals[2].id, description: 'Ganador Cuartos C' },
    },
  ]

  const finalMatch: KnockoutMatchPlan = {
    id: generatePlanId(),
    label: 'Final',
    legs: 1,
    tieBreaker: DEFAULT_REPECHAGE_TIEBREAKER,
    home: { type: 'matchWinner', matchId: semiFinals[0].id, description: 'Ganador Semifinal 1' },
    away: { type: 'matchWinner', matchId: semiFinals[1].id, description: 'Ganador Semifinal 2' },
  }

  const thirdPlaceMatch: KnockoutMatchPlan = {
    id: generatePlanId(),
    label: 'Tercer Lugar',
    legs: 1,
    tieBreaker: DEFAULT_REPECHAGE_TIEBREAKER,
    home: { type: 'matchLoser', matchId: semiFinals[0].id, description: 'Perdedor Semifinal 1' },
    away: { type: 'matchLoser', matchId: semiFinals[1].id, description: 'Perdedor Semifinal 2' },
  }

  const notes: string[] = []

  if (eliminated.length < BASE_ELIMINATED_SLOTS) {
    notes.push('El numero de equipos eliminados directamente es menor a 3 debido a la cantidad total de participantes.')
  } else if (eliminated.length > BASE_ELIMINATED_SLOTS) {
    notes.push('Se eliminan mas de 3 equipos por exceder el maximo ideal de participantes. Es recomendable ajustar el cupo total.')
  }

  if (repechagePlan.participants.length < DESIRED_REPECHAGE_SLOTS) {
    notes.push('El repechaje se adapta al numero de equipos disponible. Puede haber pases automaticos a cuartos.')
  }

  notes.push('Las series de repechaje y cuartos/semifinales se disputan a doble partido. Si hay empate global se juega tiempo extra y penales.')
  notes.push('La final y el tercer lugar son a partido unico con desempate mediante tiempo extra y penales si fuera necesario.')
  notes.push('Los ocho clasificados a cuartos se sortean para emparejar los cruces, manteniendo los seis cupos directos y los dos provenientes del repechaje.')

  return {
    directQualifiers: direct,
    repechage: repechagePlan,
    eliminated,
    quarterFinalSeeds,
    knockout: {
      quarterFinals,
      semiFinals,
      final: finalMatch,
      thirdPlace: thirdPlaceMatch,
    },
    notes,
  }
}
