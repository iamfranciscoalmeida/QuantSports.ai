export interface NotebookCell {
  id: string;
  type: "code" | "markdown";
  content: string;
  output?: string;
  error?: string;
  isRunning?: boolean;
  executionCount?: number;
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
