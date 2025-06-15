import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ROICalculation {
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

interface BettingStrategy {
  team?: string
  side?: 'home' | 'away' | 'both'
  season?: string
  stake?: number
  min_odds?: number
  max_odds?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Parse request body or query params
    let strategy: BettingStrategy
    if (req.method === 'POST') {
      strategy = await req.json()
    } else {
      const url = new URL(req.url)
      strategy = {
        team: url.searchParams.get('team') || undefined,
        side: url.searchParams.get('side') as 'home' | 'away' | 'both' || 'both',
        season: url.searchParams.get('season') || undefined,
        stake: parseFloat(url.searchParams.get('stake') || '10'),
        min_odds: parseFloat(url.searchParams.get('min_odds') || '1.0'),
        max_odds: parseFloat(url.searchParams.get('max_odds') || '10.0'),
      }
    }

    // Build query for matches
    let query = supabaseClient
      .from('matches')
      .select('*')
      .not('result_home', 'is', null)
      .not('result_away', 'is', null)
      .not('odds_closing', 'is', null)

    // Apply filters
    if (strategy.team && strategy.side !== 'both') {
      if (strategy.side === 'home') {
        query = query.eq('home_team', strategy.team)
      } else {
        query = query.eq('away_team', strategy.team)
      }
    } else if (strategy.team) {
      query = query.or(`home_team.eq.${strategy.team},away_team.eq.${strategy.team}`)
    }

    if (strategy.season) {
      query = query.eq('season', strategy.season)
    }

    const { data: matches, error } = await query

    if (error) throw error

    // Calculate ROI
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

    if (!matches || matches.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: calculation,
          strategy
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    let totalOdds = 0
    let validBets = 0

    for (const match of matches) {
      const isHomeTeam = match.home_team === strategy.team
      const isAwayTeam = match.away_team === strategy.team
      
      // Determine if we should bet on this match based on strategy
      let shouldBet = false
      let betSide: '1' | 'X' | '2' | null = null
      let betOdds = 0

      if (strategy.side === 'home' && isHomeTeam) {
        shouldBet = true
        betSide = '1'
        betOdds = match.odds_closing?.['1'] || 0
      } else if (strategy.side === 'away' && isAwayTeam) {
        shouldBet = true
        betSide = '2'
        betOdds = match.odds_closing?.['2'] || 0
      } else if (strategy.side === 'both') {
        if (isHomeTeam) {
          shouldBet = true
          betSide = '1'
          betOdds = match.odds_closing?.['1'] || 0
        } else if (isAwayTeam) {
          shouldBet = true
          betSide = '2'
          betOdds = match.odds_closing?.['2'] || 0
        }
      }

      // Apply odds filters
      if (shouldBet && (betOdds < (strategy.min_odds || 0) || betOdds > (strategy.max_odds || 100))) {
        shouldBet = false
      }

      if (!shouldBet || !betSide || betOdds === 0) continue

      validBets++
      const stake = strategy.stake || 10

      // Determine if bet won
      const homeScore = match.result_home
      const awayScore = match.result_away
      let betWon = false

      if (betSide === '1' && homeScore > awayScore) betWon = true
      else if (betSide === '2' && awayScore > homeScore) betWon = true
      else if (betSide === 'X' && homeScore === awayScore) betWon = true

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

    return new Response(
      JSON.stringify({
        success: true,
        data: calculation,
        strategy
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})