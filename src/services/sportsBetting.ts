import { 
  EPLMatch, 
  MatchFilters, 
  BettingStrategy, 
  StrategyResult, 
  TeamAnalysis, 
  MarketSummary, 
  BetResult,
  PnLPoint 
} from '@/types/epl';
import eplData from '@/data/epl_dataset.json';

export class SportsBettingService {
  private static matches: EPLMatch[] = eplData as EPLMatch[];

  /**
   * Get matches based on filters
   */
  static getMatches(filters: MatchFilters = {}): EPLMatch[] {
    return this.matches.filter(match => {
      if (filters.season && match.season !== filters.season) return false;
      if (filters.team && match.home_team !== filters.team && match.away_team !== filters.team) return false;
      if (filters.home_team && match.home_team !== filters.home_team) return false;
      if (filters.away_team && match.away_team !== filters.away_team) return false;
      if (filters.date_from && match.date < filters.date_from) return false;
      if (filters.date_to && match.date > filters.date_to) return false;
      if (filters.result && match.result !== filters.result) return false;
      return true;
    });
  }

  /**
   * Get match statistics for a specific match
   */
  static getMatchStats(matchId: number): EPLMatch | null {
    return this.matches.find(match => match.match_id === matchId) || null;
  }

  /**
   * Simulate a betting strategy
   */
  static simulateStrategy(strategy: BettingStrategy): StrategyResult {
    const matches = this.getMatches(strategy.filters);
    const betLog: BetResult[] = [];
    const pnlCurve: PnLPoint[] = [];
    
    let totalStaked = 0;
    let totalReturn = 0;
    let winningBets = 0;
    let losingBets = 0;
    let cumulativePnL = 0;
    let currentBankroll = 10000; // Starting bankroll
    let currentStreak = 0;
    let maxWinningStreak = 0;
    let maxLosingStreak = 0;
    let lastStreakType: 'win' | 'loss' | null = null;

    matches.forEach((match, index) => {
      const betType = strategy.bet_type;
      let odds: number;
      let isWin: boolean;
      
      // Get odds for the bet type
      switch (betType) {
        case '1':
          odds = match.market_odds['1'];
          isWin = match.result === 'H';
          break;
        case 'X':
          odds = match.market_odds['X'];
          isWin = match.result === 'D';
          break;
        case '2':
          odds = match.market_odds['2'];
          isWin = match.result === 'A';
          break;
        case 'over_2.5':
          odds = match.market_odds['over_2.5'];
          isWin = match.total_goals > 2.5;
          break;
        case 'under_2.5':
          odds = match.market_odds['under_2.5'];
          isWin = match.total_goals < 2.5;
          break;
        default:
          return;
      }

      // Apply conditions if specified
      if (strategy.conditions) {
        if (strategy.conditions.min_odds && odds < strategy.conditions.min_odds) return;
        if (strategy.conditions.max_odds && odds > strategy.conditions.max_odds) return;
        
        if (strategy.conditions.odds_movement) {
          const closingOdds = match.closing_odds[betType as keyof typeof match.closing_odds];
          const movement = closingOdds - odds;
          
          if (strategy.conditions.odds_movement === 'up' && movement <= 0) return;
          if (strategy.conditions.odds_movement === 'down' && movement >= 0) return;
        }
      }

      // Calculate stake
      const stake = strategy.stake_amount || 
                   (strategy.stake_percentage ? currentBankroll * (strategy.stake_percentage / 100) : 100);

      // Calculate result
      const pnl = isWin ? (odds - 1) * stake : -stake;
      totalStaked += stake;
      totalReturn += isWin ? odds * stake : 0;
      cumulativePnL += pnl;
      currentBankroll += pnl;

      if (isWin) {
        winningBets++;
        if (lastStreakType === 'win') {
          currentStreak++;
        } else {
          currentStreak = 1;
          lastStreakType = 'win';
        }
        maxWinningStreak = Math.max(maxWinningStreak, currentStreak);
      } else {
        losingBets++;
        if (lastStreakType === 'loss') {
          currentStreak++;
        } else {
          currentStreak = 1;
          lastStreakType = 'loss';
        }
        maxLosingStreak = Math.max(maxLosingStreak, currentStreak);
      }

      // Add to bet log
      betLog.push({
        match_id: match.match_id,
        date: match.date,
        fixture: `${match.home_team} vs ${match.away_team}`,
        bet_type: betType,
        odds,
        stake,
        result: isWin ? 'win' : 'loss',
        pnl,
        cumulative_pnl: cumulativePnL
      });

      // Add to P&L curve
      pnlCurve.push({
        date: match.date,
        cumulative_pnl: cumulativePnL,
        bankroll: currentBankroll,
        bet_number: index + 1
      });
    });

    const totalBets = winningBets + losingBets;
    const netProfit = totalReturn - totalStaked;
    const roi = totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0;
    const winRate = totalBets > 0 ? (winningBets / totalBets) * 100 : 0;
    const avgOdds = betLog.length > 0 ? betLog.reduce((sum, bet) => sum + bet.odds, 0) / betLog.length : 0;
    const profitFactor = losingBets > 0 ? (totalReturn - totalStaked + Math.abs(netProfit)) / Math.abs(netProfit) : 0;

    return {
      strategy,
      matches: matches.slice(0, betLog.length),
      total_bets: totalBets,
      winning_bets: winningBets,
      losing_bets: losingBets,
      total_staked: totalStaked,
      total_return: totalReturn,
      net_profit: netProfit,
      roi,
      win_rate: winRate,
      avg_odds: avgOdds,
      profit_factor: profitFactor,
      max_winning_streak: maxWinningStreak,
      max_losing_streak: maxLosingStreak,
      bet_log: betLog,
      pnl_curve: pnlCurve
    };
  }

  /**
   * Get team ROI analysis
   */
  static getTeamROI(teamName: string, filters: MatchFilters = {}): TeamAnalysis {
    const teamFilters = { ...filters, team: teamName };
    const matches = this.getMatches(teamFilters);
    
    const homeMatches = matches.filter(m => m.home_team === teamName);
    const awayMatches = matches.filter(m => m.away_team === teamName);
    
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
    const favoriteMatches = matches.filter(m => {
      const homeOdds = m.market_odds['1'];
      const awayOdds = m.market_odds['2'];
      return (m.home_team === teamName && homeOdds < awayOdds) || 
             (m.away_team === teamName && awayOdds < homeOdds);
    });

    const underdogMatches = matches.filter(m => {
      const homeOdds = m.market_odds['1'];
      const awayOdds = m.market_odds['2'];
      return (m.home_team === teamName && homeOdds > awayOdds) || 
             (m.away_team === teamName && awayOdds > homeOdds);
    });

    const roiAsFavorite = this.calculateROI(favoriteMatches, teamName);
    const roiAsUnderdog = this.calculateROI(underdogMatches, teamName);
    const roiHome = this.calculateROI(homeMatches, teamName, 'home');
    const roiAway = this.calculateROI(awayMatches, teamName, 'away');

    const over25Rate = (matches.filter(m => m.total_goals > 2.5).length / matches.length) * 100;
    const under25Rate = (matches.filter(m => m.total_goals < 2.5).length / matches.length) * 100;

    return {
      team: teamName,
      matches_played: matches.length,
      home_record: homeRecord,
      away_record: awayRecord,
      betting_stats: {
        roi_as_favorite: roiAsFavorite,
        roi_as_underdog: roiAsUnderdog,
        roi_home: roiHome,
        roi_away: roiAway,
        over_2_5_rate: over25Rate,
        under_2_5_rate: under25Rate
      }
    };
  }

  /**
   * Get market summary statistics
   */
  static getMarketSummary(market: '1' | 'X' | '2' | 'over_2.5' | 'under_2.5', filters: MatchFilters = {}): MarketSummary {
    const matches = this.getMatches(filters);
    
    let hits = 0;
    let totalOdds = 0;
    let totalStaked = 0;
    let totalReturn = 0;
    let maxOdds = 0;
    let minOdds = Infinity;

    matches.forEach(match => {
      const odds = match.market_odds[market];
      const stake = 100; // Standard stake for analysis
      
      let isHit = false;
      switch (market) {
        case '1':
          isHit = match.result === 'H';
          break;
        case 'X':
          isHit = match.result === 'D';
          break;
        case '2':
          isHit = match.result === 'A';
          break;
        case 'over_2.5':
          isHit = match.total_goals > 2.5;
          break;
        case 'under_2.5':
          isHit = match.total_goals < 2.5;
          break;
      }

      if (isHit) hits++;
      totalOdds += odds;
      totalStaked += stake;
      totalReturn += isHit ? odds * stake : 0;
      maxOdds = Math.max(maxOdds, odds);
      minOdds = Math.min(minOdds, odds);
    });

    const hitRate = matches.length > 0 ? (hits / matches.length) * 100 : 0;
    const avgOdds = matches.length > 0 ? totalOdds / matches.length : 0;
    const profitLoss = totalReturn - totalStaked;
    const roi = totalStaked > 0 ? (profitLoss / totalStaked) * 100 : 0;

    return {
      market,
      total_matches: matches.length,
      hit_rate: hitRate,
      avg_odds: avgOdds,
      roi,
      profit_loss: profitLoss,
      max_odds: maxOdds,
      min_odds: minOdds === Infinity ? 0 : minOdds
    };
  }

  /**
   * Get top performing teams by metric
   */
  static getTopPerformingTeams(metric: 'roi' | 'win_rate' | 'goals', filters: MatchFilters = {}): Array<{team: string, value: number}> {
    const teams = this.getAllTeams();
    const teamStats = teams.map(team => {
      const analysis = this.getTeamROI(team, filters);
      let value = 0;
      
      switch (metric) {
        case 'roi':
          value = (analysis.betting_stats.roi_home + analysis.betting_stats.roi_away) / 2;
          break;
        case 'win_rate':
          const totalWins = analysis.home_record.wins + analysis.away_record.wins;
          value = (totalWins / analysis.matches_played) * 100;
          break;
        case 'goals':
          const totalGoals = analysis.home_record.goals_for + analysis.away_record.goals_for;
          value = totalGoals / analysis.matches_played;
          break;
      }
      
      return { team, value };
    }).sort((a, b) => b.value - a.value);

    return teamStats.slice(0, 10);
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
   * Get all unique teams from the dataset
   */
  private static getAllTeams(): string[] {
    const teams = new Set<string>();
    this.matches.forEach(match => {
      teams.add(match.home_team);
      teams.add(match.away_team);
    });
    return Array.from(teams);
  }

  /**
   * Aggregate statistics for multiple filters
   */
  static aggregateStats(filters: MatchFilters = {}): {
    total_matches: number;
    home_wins: number;
    draws: number;
    away_wins: number;
    avg_goals: number;
    over_2_5_rate: number;
    under_2_5_rate: number;
  } {
    const matches = this.getMatches(filters);
    
    return {
      total_matches: matches.length,
      home_wins: matches.filter(m => m.result === 'H').length,
      draws: matches.filter(m => m.result === 'D').length,
      away_wins: matches.filter(m => m.result === 'A').length,
      avg_goals: matches.length > 0 ? matches.reduce((sum, m) => sum + m.total_goals, 0) / matches.length : 0,
      over_2_5_rate: matches.length > 0 ? (matches.filter(m => m.total_goals > 2.5).length / matches.length) * 100 : 0,
      under_2_5_rate: matches.length > 0 ? (matches.filter(m => m.total_goals < 2.5).length / matches.length) * 100 : 0
    };
  }
} 