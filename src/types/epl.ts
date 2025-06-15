export interface EPLMatch {
  match_id: number;
  date: string;
  league: string;
  season: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  market_odds: {
    "1": number;     // Home win
    "X": number;     // Draw
    "2": number;     // Away win
    "over_2.5": number;
    "under_2.5": number;
  };
  closing_odds: {
    "1": number;
    "X": number;
    "2": number;
    "over_2.5": number;
    "under_2.5": number;
  };
  xg: {
    home: number;
    away: number;
  };
  result: "H" | "D" | "A";  // Home, Draw, Away
  total_goals: number;
}

export interface MatchFilters {
  season?: string;
  team?: string;
  home_team?: string;
  away_team?: string;
  date_from?: string;
  date_to?: string;
  min_odds?: number;
  max_odds?: number;
  result?: "H" | "D" | "A";
}

export interface BettingStrategy {
  name: string;
  description: string;
  filters: MatchFilters;
  bet_type: "1" | "X" | "2" | "over_2.5" | "under_2.5";
  stake_amount?: number;
  stake_percentage?: number;
  conditions?: {
    min_odds?: number;
    max_odds?: number;
    odds_movement?: "up" | "down" | "any";
  };
}

export interface StrategyResult {
  strategy: BettingStrategy;
  matches: EPLMatch[];
  total_bets: number;
  winning_bets: number;
  losing_bets: number;
  total_staked: number;
  total_return: number;
  net_profit: number;
  roi: number;
  win_rate: number;
  avg_odds: number;
  profit_factor: number;
  max_winning_streak: number;
  max_losing_streak: number;
  bet_log: BetResult[];
  pnl_curve: PnLPoint[];
}

export interface BetResult {
  match_id: number;
  date: string;
  fixture: string;
  bet_type: string;
  odds: number;
  stake: number;
  result: "win" | "loss";
  pnl: number;
  cumulative_pnl: number;
}

export interface PnLPoint {
  date: string;
  cumulative_pnl: number;
  bankroll: number;
  bet_number: number;
}

export interface TeamAnalysis {
  team: string;
  matches_played: number;
  home_record: {
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
  };
  away_record: {
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
  };
  betting_stats: {
    roi_as_favorite: number;
    roi_as_underdog: number;
    roi_home: number;
    roi_away: number;
    over_2_5_rate: number;
    under_2_5_rate: number;
  };
}

export interface MarketSummary {
  market: string;
  total_matches: number;
  hit_rate: number;
  avg_odds: number;
  roi: number;
  profit_loss: number;
  max_odds: number;
  min_odds: number;
}

export interface AIBettingQuery {
  query: string;
  context?: {
    season?: string;
    team?: string;
    market?: string;
    timeframe?: string;
  };
}

export interface AIBettingResponse {
  text: string;
  data?: {
    strategy_result?: StrategyResult;
    team_analysis?: TeamAnalysis;
    market_summary?: MarketSummary;
    chart_data?: any;
    table_data?: any[];
    // Enhanced output analysis
    enhanced_analysis?: any;
    // New fields for AI integration
    generated_code?: string;
    explanation?: string;
    dependencies?: string[];
    original_code?: string;
    optimized_code?: string;
    analysis?: any;
    improvements?: string[];
    patterns?: any[];
    total_matches_analyzed?: number;
    filters_applied?: any;
    chart_config?: {
      type: string;
      data_type: string;
      metrics: string[];
    };
  };
  code?: string;
  explanation?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  data?: AIBettingResponse["data"];
  isStreaming?: boolean;
  hasError?: boolean;
} 