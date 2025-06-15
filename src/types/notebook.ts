export interface NotebookCell {
  id: string;
  type: "code" | "markdown";
  content: string;
  output?: string;
  error?: string;
  isRunning?: boolean;
  executionCount?: number;
  backtestResult?: BacktestResult;
  isBacktesting?: boolean;
}

export interface Notebook {
  id: string;
  title: string;
  cells: NotebookCell[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIRequest {
  prompt: string;
  context: string[];
  cellId: string;
}

export interface AIResponse {
  code: string;
  explanation?: string;
}

export interface CodeExecutionResult {
  output?: string;
  error?: string;
  executionTime?: number;
}

export interface SportsBettingContext {
  event: {
    team_home: string;
    team_away: string;
    sport: string;
    league: string;
    start_time: Date;
  };
  market: {
    type: string;
    line?: number;
    over_under?: number;
  };
  odds: {
    opening: number;
    current: number;
    closing?: number;
    implied_probability: number;
  };
  indicators: {
    odds_drift: number;
    closing_line_value: number;
    market_efficiency: number;
  };
}

export interface BettingFunction {
  name: string;
  description: string;
  code: string;
  category: "value" | "risk" | "analysis" | "strategy";
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  cellId?: string;
}

export interface TerminalTab {
  id: string;
  name: string;
  content: string[];
  active: boolean;
}

export interface BacktestRequest {
  code: string;
  settings: BacktestSettings;
}

export interface BacktestSettings {
  initial_bankroll: number;
  commission: number;
  stake_model: "flat" | "percentage" | "kelly";
  start_date: string;
  end_date: string;
  max_stake?: number;
  min_stake?: number;
}

export interface BacktestResult {
  summary: BacktestSummary;
  bet_log: BetLogEntry[];
  pnl_curve: PnLPoint[];
  charts: BacktestCharts;
  execution_time: number;
  total_events: number;
}

export interface BacktestSummary {
  roi: number;
  net_pnl: number;
  win_rate: number;
  max_drawdown: number;
  sharpe_ratio: number;
  total_bets: number;
  winning_bets: number;
  losing_bets: number;
  avg_odds: number;
  profit_factor: number;
}

export interface BetLogEntry {
  id: string;
  event_id: string;
  event_name: string;
  market: string;
  selection: string;
  odds: number;
  stake: number;
  outcome: "win" | "loss" | "void";
  pnl: number;
  date: string;
  league: string;
  sport: string;
}

export interface PnLPoint {
  date: string;
  cumulative_pnl: number;
  bankroll: number;
  drawdown: number;
}

export interface BacktestCharts {
  pnl_chart: string; // base64 encoded chart or JSON data
  drawdown_chart: string;
  roi_chart: string;
}

export interface BacktestExecution {
  id: string;
  status: "running" | "completed" | "failed";
  progress: number;
  start_time: Date;
  end_time?: Date;
  result?: BacktestResult;
  error?: string;
}

export interface PublishedNotebook {
  id: string;
  title: string;
  slug: string;
  author_id: string;
  author_name?: string;
  sport: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  roi: number;
  sharpe: number;
  code: string;
  summary?: string;
  is_public: boolean;
  fork_count: number;
  notebook_cells: NotebookCell[];
  performance_data: {
    pnl_curve?: PnLPoint[];
    metrics?: BacktestSummary;
    chart_preview?: string;
  };
}

export interface GalleryFilters {
  sport?: string;
  min_roi?: number;
  max_roi?: number;
  tags?: string[];
  author?: string;
  search?: string;
  sort_by?: "created_at" | "roi" | "fork_count" | "sharpe";
  sort_order?: "asc" | "desc";
}

export interface ForkNotebookRequest {
  published_notebook_id: string;
  new_title?: string;
}
