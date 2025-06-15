import { supabase } from './supabase'

// Types
export interface Match {
  id: number
  match_id: string
  date: string
  home_team: string
  away_team: string
  result_home?: number
  result_away?: number
  odds_opening?: {
    '1': number
    'X': number
    '2': number
  }
  odds_closing?: {
    '1': number
    'X': number
    '2': number
  }
  xg?: {
    home: number
    away: number
  }
  market: string
  league: string
  season: string
  created_at: string
  updated_at: string
}

export interface MatchFilters {
  team?: string
  season?: string
  from_date?: string
  to_date?: string
  limit?: number
  offset?: number
}

export interface BettingStrategy {
  team?: string
  side?: 'home' | 'away' | 'both'
  season?: string
  stake?: number
  min_odds?: number
  max_odds?: number
}

export interface ROICalculation {
  total_matches: number
  total_stake: number
  total_winnings: number
  net_profit: number
  roi_percentage: number
  win_rate: number
  wins: number
  losses: number
  avg_odds: number
}

export interface TeamStats {
  total_matches: number
  home_matches: number
  away_matches: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  win_rate: number
  points: number
}

/**
 * Get matches with optional filters
 */
export async function getMatches(filters: MatchFilters = {}): Promise<Match[]> {
  let query = supabase
    .from('matches')
    .select('*')
    .order('date', { ascending: false })

  // Apply filters
  if (filters.team) {
    query = query.or(`home_team.eq.${filters.team},away_team.eq.${filters.team}`)
  }

  if (filters.season) {
    query = query.eq('season', filters.season)
  }

  if (filters.from_date) {
    query = query.gte('date', filters.from_date)
  }

  if (filters.to_date) {
    query = query.lte('date', filters.to_date)
  }

  if (filters.limit) {
    const offset = filters.offset || 0
    query = query.range(offset, offset + filters.limit - 1)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch matches: ${error.message}`)
  }

  return data || []
}

/**
 * Get team statistics
 */
export async function getTeamStats(team: string, season?: string): Promise<TeamStats> {
  const filters: MatchFilters = { team }
  if (season) filters.season = season

  const matches = await getMatches(filters)

  const stats: TeamStats = {
    total_matches: matches.length,
    home_matches: matches.filter(m => m.home_team === team).length,
    away_matches: matches.filter(m => m.away_team === team).length,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    win_rate: 0,
    points: 0
  }

  for (const match of matches) {
    if (match.result_home === null || match.result_away === null) continue

    const isHome = match.home_team === team
    const teamGoals = isHome ? match.result_home : match.result_away
    const opponentGoals = isHome ? match.result_away : match.result_home

    stats.goals_for += teamGoals
    stats.goals_against += opponentGoals

    if (teamGoals > opponentGoals) {
      stats.wins++
      stats.points += 3
    } else if (teamGoals === opponentGoals) {
      stats.draws++
      stats.points += 1
    } else {
      stats.losses++
    }
  }

  stats.win_rate = stats.total_matches > 0 ? (stats.wins / stats.total_matches) * 100 : 0

  return stats
}

/**
 * Calculate ROI for a betting strategy
 */
export async function calculateROI(strategy: BettingStrategy): Promise<ROICalculation> {
  const filters: MatchFilters = {}
  
  if (strategy.team) filters.team = strategy.team
  if (strategy.season) filters.season = strategy.season

  const matches = await getMatches(filters)

  const calculation: ROICalculation = {
    total_matches: 0,
    total_stake: 0,
    total_winnings: 0,
    net_profit: 0,
    roi_percentage: 0,
    win_rate: 0,
    wins: 0,
    losses: 0,
    avg_odds: 0
  }

  let totalOdds = 0
  let validBets = 0

  for (const match of matches) {
    // Skip matches without complete data
    if (!match.result_home || !match.result_away || !match.odds_closing) {
      continue
    }

    const isHomeTeam = match.home_team === strategy.team
    const isAwayTeam = match.away_team === strategy.team

    // Determine if we should bet on this match
    let shouldBet = false
    let betSide: '1' | '2' | null = null
    let betOdds = 0

    if (strategy.side === 'home' && isHomeTeam) {
      shouldBet = true
      betSide = '1'
      betOdds = match.odds_closing['1']
    } else if (strategy.side === 'away' && isAwayTeam) {
      shouldBet = true
      betSide = '2'
      betOdds = match.odds_closing['2']
    } else if (strategy.side === 'both') {
      if (isHomeTeam) {
        shouldBet = true
        betSide = '1'
        betOdds = match.odds_closing['1']
      } else if (isAwayTeam) {
        shouldBet = true
        betSide = '2'
        betOdds = match.odds_closing['2']
      }
    }

    // Apply odds filters
    if (shouldBet && strategy.min_odds && betOdds < strategy.min_odds) {
      shouldBet = false
    }
    if (shouldBet && strategy.max_odds && betOdds > strategy.max_odds) {
      shouldBet = false
    }

    if (!shouldBet || !betSide) continue

    validBets++
    const stake = strategy.stake || 10

    // Determine if bet won
    let betWon = false
    if (betSide === '1' && match.result_home > match.result_away) {
      betWon = true
    } else if (betSide === '2' && match.result_away > match.result_home) {
      betWon = true
    }

    // Calculate returns
    calculation.total_stake += stake
    totalOdds += betOdds

    if (betWon) {
      calculation.total_winnings += stake * betOdds
      calculation.wins++
    } else {
      calculation.losses++
    }
  }

  // Finalize calculations
  calculation.total_matches = validBets
  calculation.net_profit = calculation.total_winnings - calculation.total_stake
  calculation.roi_percentage = calculation.total_stake > 0 
    ? (calculation.net_profit / calculation.total_stake) * 100 
    : 0
  calculation.win_rate = validBets > 0 ? (calculation.wins / validBets) * 100 : 0
  calculation.avg_odds = validBets > 0 ? totalOdds / validBets : 0

  return calculation
}

/**
 * Simulate a naive betting strategy
 */
export async function simulateNaiveStrategy(
  filters: MatchFilters,
  stake: number = 100
): Promise<{
  matches: Match[]
  total_profit: number
  roi: ROICalculation
}> {
  const matches = await getMatches(filters)
  
  // Simple strategy: always bet on the home team
  const strategy: BettingStrategy = {
    team: filters.team,
    side: 'home',
    season: filters.season,
    stake
  }

  const roi = await calculateROI(strategy)

  return {
    matches,
    total_profit: roi.net_profit,
    roi
  }
}

/**
 * Get available seasons
 */
export async function getAvailableSeasons(): Promise<string[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('season')
    .order('season', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch seasons: ${error.message}`)
  }

  // Remove duplicates
  const seasons = [...new Set(data?.map(d => d.season as string) || [])]
  return seasons
}

/**
 * Get available teams
 */
export async function getAvailableTeams(season?: string): Promise<string[]> {
  let query = supabase
    .from('matches')
    .select('home_team, away_team')

  if (season) {
    query = query.eq('season', season)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch teams: ${error.message}`)
  }

  const teams = new Set<string>()
  data?.forEach(match => {
    teams.add(match.home_team)
    teams.add(match.away_team)
  })

  return Array.from(teams).sort()
}

/**
 * Get recent matches for a team
 */
export async function getRecentMatches(team: string, limit: number = 10): Promise<Match[]> {
  return getMatches({
    team,
    limit
  })
}

/**
 * Get head-to-head record between two teams
 */
export async function getHeadToHead(team1: string, team2: string): Promise<{
  matches: Match[]
  team1_wins: number
  team2_wins: number
  draws: number
}> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`and(home_team.eq.${team1},away_team.eq.${team2}),and(home_team.eq.${team2},away_team.eq.${team1})`)
    .order('date', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch head-to-head: ${error.message}`)
  }

  const matches = data || []
  let team1_wins = 0
  let team2_wins = 0
  let draws = 0

  matches.forEach(match => {
    if (match.result_home === null || match.result_away === null) return

    const team1IsHome = match.home_team === team1
    const team1Goals = team1IsHome ? match.result_home : match.result_away
    const team2Goals = team1IsHome ? match.result_away : match.result_home

    if (team1Goals > team2Goals) {
      team1_wins++
    } else if (team2Goals > team1Goals) {
      team2_wins++
    } else {
      draws++
    }
  })

  return {
    matches,
    team1_wins,
    team2_wins,
    draws
  }
}