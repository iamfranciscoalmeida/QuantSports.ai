import { createClient } from '@supabase/supabase-js';
import { 
  EPLMatch, 
  MatchFilters, 
  TeamAnalysis, 
  MarketSummary
} from '@/types/epl';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export class DatabaseSportsBettingService {
  /**
   * Get database connection status and statistics
   */
  static async getConnectionStatus(): Promise<{ 
    connected: boolean; 
    matchCount: number; 
    teams: string[]; 
    latestSeason: string;
    error?: string;
  }> {
    try {
      console.log('🔍 Testing database connection...');
      
      // Test connection and get match count
      const { count, error: countError } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Database connection error:', countError);
        return { 
          connected: false, 
          matchCount: 0, 
          teams: [], 
          latestSeason: '',
          error: countError.message 
        };
      }

      console.log(`🎯 Database connected with ${count} matches`);

      // Get sample teams and seasons
      const { data: metaData, error: metaError } = await supabase
        .from('matches')
        .select('season, home_team, away_team')
        .limit(50);

      if (metaError) {
        return { 
          connected: true, 
          matchCount: count || 0, 
          teams: [], 
          latestSeason: '',
          error: metaError.message 
        };
      }

      // Extract metadata
      const teams = new Set<string>();
      const seasons = new Set<string>();

      (metaData || []).forEach(match => {
        teams.add(match.home_team);
        teams.add(match.away_team);
        seasons.add(match.season);
      });

      const latestSeason = Array.from(seasons).sort().pop() || '';

      return { 
        connected: true, 
        matchCount: count || 0, 
        teams: Array.from(teams).slice(0, 10), // First 10 teams
        latestSeason
      };
    } catch (error) {
      console.error('Database connection failed:', error);
      return { 
        connected: false, 
        matchCount: 0, 
        teams: [], 
        latestSeason: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Find exact team name in database using fuzzy matching
   */
  private static async findExactTeamName(searchName: string): Promise<string | null> {
    try {
      // Get all unique team names from database
      const { data, error } = await supabase
        .from('matches')
        .select('home_team, away_team')
        .limit(200);

      if (error) {
        console.error('Error fetching teams for fuzzy matching:', error);
        return null;
      }

      const teams = new Set<string>();
      (data || []).forEach(match => {
        teams.add(match.home_team);
        teams.add(match.away_team);
      });

      const teamList = Array.from(teams);
      
      // Try exact match first
      const exactMatch = teamList.find(team => 
        team.toLowerCase() === searchName.toLowerCase()
      );
      if (exactMatch) return exactMatch;

      // Try partial match (team name contains search term)
      const partialMatch = teamList.find(team => 
        team.toLowerCase().includes(searchName.toLowerCase()) ||
        searchName.toLowerCase().includes(team.toLowerCase())
      );
      if (partialMatch) return partialMatch;

      // Try fuzzy matching (remove common suffixes)
      const normalizedSearch = searchName.toLowerCase()
        .replace(/\s*(fc|football club)\s*$/i, '')
        .trim();
      
      const fuzzyMatch = teamList.find(team => {
        const normalizedTeam = team.toLowerCase()
          .replace(/\s*(fc|football club)\s*$/i, '')
          .trim();
        return normalizedTeam === normalizedSearch ||
               normalizedTeam.includes(normalizedSearch) ||
               normalizedSearch.includes(normalizedTeam);
      });

      return fuzzyMatch || null;
    } catch (error) {
      console.error('Error in fuzzy team matching:', error);
      return null;
    }
  }

  /**
   * Get team ROI analysis from database
   */
  static async getTeamROI(teamName: string, filters: MatchFilters = {}): Promise<TeamAnalysis> {
    try {
      console.log(`🔍 Fetching ${teamName} data from database...`);
      
      // First, find the exact team name in the database using fuzzy matching
      const exactTeamName = await DatabaseSportsBettingService.findExactTeamName(teamName);
      console.log(`🎯 Mapped "${teamName}" to "${exactTeamName}"`);
      
      if (!exactTeamName) {
        console.log(`❌ No team found matching "${teamName}"`);
        // Return empty analysis
        return {
          team: teamName,
          matches_played: 0,
          home_record: { wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0 },
          away_record: { wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0 },
          betting_stats: {
            roi_as_favorite: 0,
            roi_as_underdog: 0,
            roi_home: 0,
            roi_away: 0,
            over_2_5_rate: 0,
            under_2_5_rate: 0
          }
        };
      }
      
      // Build query with exact team name - try different approach
      console.log(`🔍 Building query for team: "${exactTeamName}"`);
      
      // Try using filter instead of or
      let query = supabase
        .from('matches')
        .select('*')
        .filter('home_team', 'eq', exactTeamName)
        .order('date', { ascending: false });

      // Apply filters
      if (filters.season) {
        console.log(`🔍 Adding season filter: ${filters.season}`);
        query = query.eq('season', filters.season);
      }

      console.log(`🔍 Executing home team query for "${exactTeamName}"...`);
      const { data: homeData, error: homeError } = await query;
      
      if (homeError) {
        console.error('Home team query error:', homeError);
        throw new Error(`Home team query failed: ${homeError.message}`);
      }

      // Query for away matches
      let awayQuery = supabase
        .from('matches')
        .select('*')
        .filter('away_team', 'eq', exactTeamName)
        .order('date', { ascending: false });

      if (filters.season) {
        awayQuery = awayQuery.eq('season', filters.season);
      }

      console.log(`🔍 Executing away team query for "${exactTeamName}"...`);
      const { data: awayData, error: awayError } = await awayQuery;
      
      if (awayError) {
        console.error('Away team query error:', awayError);
        throw new Error(`Away team query failed: ${awayError.message}`);
      }

      // Combine results and remove duplicates
      const allMatches = [...(homeData || []), ...(awayData || [])];
      const uniqueMatches = allMatches.filter((match, index, self) => 
        index === self.findIndex(m => m.id === match.id)
      );
      
      const data = uniqueMatches;

      console.log(`📊 Found ${data?.length || 0} matches for ${teamName}`);

      // Transform database format to EPLMatch format and calculate analysis
      const matches = (data || []).map(DatabaseSportsBettingService.transformDatabaseMatch);
      
      const homeMatches = matches.filter(m => m.home_team === exactTeamName);
      const awayMatches = matches.filter(m => m.away_team === exactTeamName);
      
      // Calculate home record
      const homeRecord = {
        wins: homeMatches.filter(m => m.result === 'H').length,
        draws: homeMatches.filter(m => m.result === 'D').length,
        losses: homeMatches.filter(m => m.result === 'A').length,
        goals_for: homeMatches.reduce((sum, m) => sum + m.home_score, 0),
        goals_against: homeMatches.reduce((sum, m) => sum + m.away_score, 0)
      };

      // Calculate away record
      const awayRecord = {
        wins: awayMatches.filter(m => m.result === 'A').length,
        draws: awayMatches.filter(m => m.result === 'D').length,
        losses: awayMatches.filter(m => m.result === 'H').length,
        goals_for: awayMatches.reduce((sum, m) => sum + m.away_score, 0),
        goals_against: awayMatches.reduce((sum, m) => sum + m.home_score, 0)
      };

      // Calculate betting stats
      const roiHome = DatabaseSportsBettingService.calculateROI(homeMatches, exactTeamName, 'home');
      const roiAway = DatabaseSportsBettingService.calculateROI(awayMatches, exactTeamName, 'away');

      const over25Rate = matches.length > 0 ? (matches.filter(m => m.total_goals > 2.5).length / matches.length) * 100 : 0;
      const under25Rate = matches.length > 0 ? (matches.filter(m => m.total_goals < 2.5).length / matches.length) * 100 : 0;

      return {
        team: teamName,
        matches_played: matches.length,
        home_record: homeRecord,
        away_record: awayRecord,
        betting_stats: {
          roi_as_favorite: 0, // Simplified for now
          roi_as_underdog: 0, // Simplified for now
          roi_home: roiHome,
          roi_away: roiAway,
          over_2_5_rate: over25Rate,
          under_2_5_rate: under25Rate
        }
      };
    } catch (error) {
      console.error(`Failed to get team ROI for ${teamName}:`, error);
      throw error;
    }
  }

  /**
   * Transform database match format to EPLMatch interface
   */
  private static transformDatabaseMatch(dbMatch: any): EPLMatch {
    // Handle odds data - database stores as JSONB
    const defaultOdds = {
      "1": 2.0,
      "X": 3.0,
      "2": 3.5,
      "over_2.5": 1.8,
      "under_2.5": 2.0
    };

    const openingOdds = dbMatch.odds_opening || defaultOdds;

    return {
      match_id: parseInt(dbMatch.match_id) || dbMatch.id,
      date: dbMatch.date,
      league: dbMatch.league || 'Premier League',
      season: dbMatch.season,
      home_team: dbMatch.home_team,
      away_team: dbMatch.away_team,
      home_score: dbMatch.result_home || 0,
      away_score: dbMatch.result_away || 0,
      market_odds: openingOdds,
      closing_odds: openingOdds,
      xg: dbMatch.xg || { home: 1.0, away: 1.0 },
      result: DatabaseSportsBettingService.determineResult(dbMatch.result_home, dbMatch.result_away),
      total_goals: (dbMatch.result_home || 0) + (dbMatch.result_away || 0)
    };
  }

  /**
   * Determine match result (H/D/A) from scores
   */
  private static determineResult(homeScore: number, awayScore: number): "H" | "D" | "A" {
    if (homeScore > awayScore) return "H";
    if (homeScore < awayScore) return "A";
    return "D";
  }

  /**
   * Helper method to calculate ROI for a set of matches
   */
  private static calculateROI(matches: EPLMatch[], teamName: string, venue?: 'home' | 'away'): number {
    if (matches.length === 0) return 0;
    
    let totalStaked = 0;
    let totalReturn = 0;
    
    matches.forEach(match => {
      const stake = 100;
      let odds: number;
      let isWin: boolean;
      
      if (venue === 'home' || (!venue && match.home_team === teamName)) {
        odds = match.market_odds['1'];
        isWin = match.result === 'H';
      } else {
        odds = match.market_odds['2'];
        isWin = match.result === 'A';
      }
      
      totalStaked += stake;
      totalReturn += isWin ? odds * stake : 0;
    });
    
    return totalStaked > 0 ? ((totalReturn - totalStaked) / totalStaked) * 100 : 0;
  }

  /**
   * Get top performing teams by metric from database
   */
  static async getTopPerformingTeams(metric: 'roi' | 'win_rate' | 'goals', filters: MatchFilters = {}): Promise<Array<{team: string, value: number}>> {
    try {
      // Get all teams from database
      const { data, error } = await supabase
        .from('matches')
        .select('home_team, away_team')
        .limit(200);

      if (error) {
        throw new Error(`Failed to fetch teams: ${error.message}`);
      }

      const teams = new Set<string>();
      (data || []).forEach(match => {
        teams.add(match.home_team);
        teams.add(match.away_team);
      });

      const teamStats = [];
      const teamList = Array.from(teams).slice(0, 10); // Limit for performance

      for (const team of teamList) {
        try {
          const analysis = await DatabaseSportsBettingService.getTeamROI(team, filters);
          let value = 0;
          
          switch (metric) {
            case 'roi':
              value = (analysis.betting_stats.roi_home + analysis.betting_stats.roi_away) / 2;
              break;
            case 'win_rate':
              const totalWins = analysis.home_record.wins + analysis.away_record.wins;
              value = analysis.matches_played > 0 ? (totalWins / analysis.matches_played) * 100 : 0;
              break;
            case 'goals':
              const totalGoals = analysis.home_record.goals_for + analysis.away_record.goals_for;
              value = analysis.matches_played > 0 ? totalGoals / analysis.matches_played : 0;
              break;
          }
          
          teamStats.push({ team, value });
        } catch (error) {
          console.warn(`Failed to get stats for team ${team}:`, error);
          // Continue with other teams
        }
      }

      return teamStats.sort((a, b) => b.value - a.value);
    } catch (error) {
      console.error('Failed to get top performing teams:', error);
      throw error;
    }
  }
} 