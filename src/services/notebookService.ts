import {
  NotebookCell,
  AIRequest,
  AIResponse,
  CodeExecutionResult,
  SportsBettingContext,
  BettingFunction,
  BacktestRequest,
  BacktestResult,
  BacktestSummary,
  BetLogEntry,
  PnLPoint,
  PublishedNotebook,
  GalleryFilters,
  ForkNotebookRequest,
  Notebook,
} from "@/types/notebook";
import { supabase } from "@/lib/supabase";

// Mock Python execution service (replace with actual backend)
export class NotebookService {
  private static executionCount = 0;

  static async executeCode(code: string): Promise<CodeExecutionResult> {
    // Simulate code execution delay
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000),
    );

    this.executionCount++;

    // Mock execution results
    if (code.includes("error") || code.includes("raise")) {
      return {
        error: "NameError: name 'undefined_variable' is not defined",
        executionTime: 0.5,
      };
    }

    if (code.includes("print")) {
      const printMatch = code.match(/print\(['"](.+?)['"]\)/);
      const output = printMatch ? printMatch[1] : "Hello, World!";
      return {
        output,
        executionTime: 0.2,
      };
    }

    if (code.includes("import")) {
      return {
        output: "Modules imported successfully",
        executionTime: 0.8,
      };
    }

    // Default successful execution
    return {
      output: `Execution completed successfully [${this.executionCount}]`,
      executionTime: 0.3,
    };
  }

  static async getAICompletion(request: AIRequest): Promise<AIResponse> {
    // Mock AI completion (replace with actual OpenAI API call)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const { prompt, context } = request;

    // Mock AI responses based on prompt keywords
    if (
      prompt.toLowerCase().includes("plot") ||
      prompt.toLowerCase().includes("chart")
    ) {
      return {
        code: `import matplotlib.pyplot as plt
import numpy as np

# Generate sample data
x = np.linspace(0, 10, 100)
y = np.sin(x)

# Create plot
plt.figure(figsize=(10, 6))
plt.plot(x, y, 'b-', linewidth=2)
plt.title('Sine Wave')
plt.xlabel('X values')
plt.ylabel('Y values')
plt.grid(True)
plt.show()`,
        explanation: "Created a sine wave plot using matplotlib",
      };
    }

    if (
      prompt.toLowerCase().includes("data") ||
      prompt.toLowerCase().includes("pandas")
    ) {
      return {
        code: `import pandas as pd
import numpy as np

# Create sample dataset
data = {
    'date': pd.date_range('2024-01-01', periods=100),
    'price': np.random.randn(100).cumsum() + 100,
    'volume': np.random.randint(1000, 10000, 100)
}

df = pd.DataFrame(data)
print(df.head())
print(f"Dataset shape: {df.shape}")`,
        explanation:
          "Created a sample financial dataset with dates, prices, and volumes",
      };
    }

    if (
      prompt.toLowerCase().includes("strategy") ||
      prompt.toLowerCase().includes("trading")
    ) {
      return {
        code: `# Simple Moving Average Strategy
def calculate_sma(prices, window):
    return prices.rolling(window=window).mean()

def generate_signals(prices, short_window=20, long_window=50):
    signals = pd.DataFrame(index=prices.index)
    signals['price'] = prices
    signals['short_ma'] = calculate_sma(prices, short_window)
    signals['long_ma'] = calculate_sma(prices, long_window)
    
    # Generate buy/sell signals
    signals['signal'] = 0
    signals['signal'][short_window:] = np.where(
        signals['short_ma'][short_window:] > signals['long_ma'][short_window:], 1, 0
    )
    signals['positions'] = signals['signal'].diff()
    
    return signals

# Example usage
# signals = generate_signals(df['price'])
# print(signals.tail())`,
        explanation:
          "Created a simple moving average crossover trading strategy",
      };
    }

    // Sports betting specific responses
    if (
      prompt.toLowerCase().includes("expected value") ||
      prompt.toLowerCase().includes("ev")
    ) {
      return {
        code: `def expected_value(odds, win_probability):
    """
    Calculate expected value of a bet
    
    Args:
        odds: Decimal odds (e.g., 2.5 for +150)
        win_probability: Probability of winning (0-1)
    
    Returns:
        Expected value as percentage
    """
    return (odds * win_probability) - 1

# Example usage
odds = 2.5  # +150 odds
win_prob = 0.45  # 45% chance
ev = expected_value(odds, win_prob)
print(f"Expected Value: {ev:.2%}")

if ev > 0:
    print("✅ Positive EV - This is a value bet!")
else:
    print("❌ Negative EV - Avoid this bet")`,
        explanation: "Created an expected value calculator for sports betting",
      };
    }

    if (
      prompt.toLowerCase().includes("kelly") ||
      prompt.toLowerCase().includes("bet size")
    ) {
      return {
        code: `def kelly_criterion(odds, win_probability, bankroll):
    """
    Calculate optimal bet size using Kelly Criterion
    
    Args:
        odds: Decimal odds
        win_probability: Probability of winning (0-1)
        bankroll: Total bankroll
    
    Returns:
        Recommended bet size
    """
    b = odds - 1  # Net odds received
    p = win_probability
    q = 1 - p  # Probability of losing
    
    kelly_fraction = (b * p - q) / b
    
    # Cap at 25% of bankroll for safety
    kelly_fraction = min(kelly_fraction, 0.25)
    kelly_fraction = max(kelly_fraction, 0)  # No negative bets
    
    return bankroll * kelly_fraction

# Example usage
odds = 2.2  # +120 odds
win_prob = 0.5  # 50% chance
bankroll = 1000

bet_size = kelly_criterion(odds, win_prob, bankroll)
print(f"Recommended bet size: ${bet_size}")
print(f"That's {bet_size/bankroll} of your bankroll")`,
        explanation: "Implemented Kelly Criterion for optimal bet sizing",
      };
    }

    if (
      prompt.toLowerCase().includes("closing line") ||
      prompt.toLowerCase().includes("clv")
    ) {
      return {
        code: `def closing_line_value(opening_odds, closing_odds, bet_odds):
    """
    Calculate Closing Line Value (CLV)
    
    Args:
        opening_odds: Opening market odds
        closing_odds: Closing market odds  
        bet_odds: Odds you got your bet at
    
    Returns:
        CLV percentage
    """
    opening_prob = 1 / opening_odds
    closing_prob = 1 / closing_odds
    bet_prob = 1 / bet_odds
    
    clv = (closing_prob - bet_prob) / bet_prob
    return clv

# Example usage
opening = 2.0   # Even odds at open
closing = 1.8   # Moved to -125 at close
my_bet = 2.1    # I got +110

clv = closing_line_value(opening, closing, my_bet)
print(f"Closing Line Value: ${clv}")

if clv > 0:
    print("✅ Positive CLV - You beat the closing line!")
else:
    print("❌ Negative CLV - Market moved against you")`,
        explanation:
          "Created a Closing Line Value calculator to measure bet quality",
      };
    }

    // Default AI response
    return {
      code: `# AI-generated code based on your prompt
# ${prompt}

print("AI assistant is ready to help!")
print(f"Context cells: {len(context)}")

# Add your implementation here`,
      explanation: "Generated a code template based on your request",
    };
  }

  static getBettingFunctions(): BettingFunction[] {
    return [
      {
        name: "expected_value",
        description: "Calculate expected value of a bet",
        code: "expected_value(odds, win_probability)",
        category: "value",
      },
      {
        name: "kelly_criterion",
        description: "Calculate optimal bet size using Kelly Criterion",
        code: "kelly_criterion(odds, win_probability, bankroll)",
        category: "risk",
      },
      {
        name: "closing_line_value",
        description: "Calculate closing line value (CLV)",
        code: "closing_line_value(opening_odds, closing_odds, bet_odds)",
        category: "analysis",
      },
      {
        name: "implied_probability",
        description: "Convert odds to implied probability",
        code: "implied_probability(odds)",
        category: "analysis",
      },
      {
        name: "is_value_bet",
        description: "Determine if a bet has positive expected value",
        code: "is_value_bet(odds, true_probability)",
        category: "value",
      },
    ];
  }

  static getSampleSportsBettingContext(): SportsBettingContext {
    return {
      event: {
        team_home: "Lakers",
        team_away: "Warriors",
        sport: "Basketball",
        league: "NBA",
        start_time: new Date("2024-01-15T20:00:00Z"),
      },
      market: {
        type: "Moneyline",
        line: undefined,
        over_under: 225.5,
      },
      odds: {
        opening: 2.1,
        current: 1.95,
        closing: 1.9,
        implied_probability: 0.526,
      },
      indicators: {
        odds_drift: -0.15,
        closing_line_value: 0.08,
        market_efficiency: 0.92,
      },
    };
  }

  static async runBacktest(request: BacktestRequest): Promise<BacktestResult> {
    // Simulate backtest execution delay
    await new Promise((resolve) =>
      setTimeout(resolve, 3000 + Math.random() * 2000),
    );

    // Mock backtest results - in production this would call the Python backend
    const mockBetLog: BetLogEntry[] = [
      {
        id: "bet-1",
        event_id: "evt-1",
        event_name: "Lakers vs Warriors",
        market: "Moneyline",
        selection: "Lakers",
        odds: 2.1,
        stake: 50,
        outcome: "win",
        pnl: 55,
        date: "2024-01-15",
        league: "NBA",
        sport: "Basketball",
      },
      {
        id: "bet-2",
        event_id: "evt-2",
        event_name: "Celtics vs Heat",
        market: "Spread",
        selection: "Celtics -5.5",
        odds: 1.9,
        stake: 50,
        outcome: "loss",
        pnl: -50,
        date: "2024-01-16",
        league: "NBA",
        sport: "Basketball",
      },
      {
        id: "bet-3",
        event_id: "evt-3",
        event_name: "Nets vs 76ers",
        market: "Total Points",
        selection: "Over 215.5",
        odds: 2.0,
        stake: 50,
        outcome: "win",
        pnl: 50,
        date: "2024-01-17",
        league: "NBA",
        sport: "Basketball",
      },
    ];

    const mockPnLCurve: PnLPoint[] = [
      { date: "2024-01-15", cumulative_pnl: 55, bankroll: 1055, drawdown: 0 },
      { date: "2024-01-16", cumulative_pnl: 5, bankroll: 1005, drawdown: -4.7 },
      { date: "2024-01-17", cumulative_pnl: 55, bankroll: 1055, drawdown: 0 },
    ];

    const summary: BacktestSummary = {
      roi: 5.5,
      net_pnl: 55,
      win_rate: 66.7,
      max_drawdown: 4.7,
      sharpe_ratio: 1.2,
      total_bets: 3,
      winning_bets: 2,
      losing_bets: 1,
      avg_odds: 2.0,
      profit_factor: 2.1,
    };

    return {
      summary,
      bet_log: mockBetLog,
      pnl_curve: mockPnLCurve,
      charts: {
        pnl_chart: "mock_chart_data",
        drawdown_chart: "mock_chart_data",
        roi_chart: "mock_chart_data",
      },
      execution_time: 4.2,
      total_events: 150,
    };
  }

  static generateSampleStrategy(): string {
    return `class MyBettingStrategy:
    def __init__(self):
        self.bankroll = 1000
        self.min_odds = 1.5
        self.max_odds = 3.0
        self.stake_percentage = 0.05
    
    def initialize(self):
        """Initialize strategy parameters"""
        print("Strategy initialized with bankroll:", self.bankroll)
    
    def on_event(self, event, odds):
        """Main strategy logic - returns list of bets"""
        bets = []
        
        # Simple value betting strategy
        for market, market_odds in odds.items():
            for selection, odd_value in market_odds.items():
                # Calculate implied probability
                implied_prob = 1 / odd_value
                
                # Our estimated probability (mock)
                estimated_prob = self.estimate_probability(event, selection)
                
                # Check for value bet
                if estimated_prob > implied_prob and self.min_odds <= odd_value <= self.max_odds:
                    stake = self.bankroll * self.stake_percentage
                    
                    bets.append({
                        "market": market,
                        "selection": selection,
                        "odds": odd_value,
                        "stake": stake,
                        "confidence": estimated_prob - implied_prob
                    })
        
        return bets
    
    def estimate_probability(self, event, selection):
        """Estimate true probability - replace with your model"""
        # Mock probability estimation
        import random
        return random.uniform(0.3, 0.7)
    
    def update_bankroll(self, pnl):
        """Update bankroll after bet settlement"""
        self.bankroll += pnl`;
  }

  // Gallery API methods
  static async getPublishedNotebooks(
    filters: GalleryFilters = {},
  ): Promise<PublishedNotebook[]> {
    let query = supabase
      .from("published_notebooks")
      .select(
        `
        *,
        users!published_notebooks_author_id_fkey(display_name)
      `,
      )
      .eq("is_public", true);

    // Apply filters
    if (filters.sport) {
      query = query.eq("sport", filters.sport);
    }
    if (filters.min_roi !== undefined) {
      query = query.gte("roi", filters.min_roi);
    }
    if (filters.max_roi !== undefined) {
      query = query.lte("roi", filters.max_roi);
    }
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps("tags", filters.tags);
    }
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`,
      );
    }

    // Apply sorting
    const sortBy = filters.sort_by || "created_at";
    const sortOrder = filters.sort_order || "desc";
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch published notebooks: ${error.message}`);
    }

    return (data || []).map((item) => ({
      ...item,
      author_name: item.users?.display_name || "Anonymous",
    }));
  }

  static async getPublishedNotebook(
    slug: string,
  ): Promise<PublishedNotebook | null> {
    const { data, error } = await supabase
      .from("published_notebooks")
      .select(
        `
        *,
        users!published_notebooks_author_id_fkey(display_name)
      `,
      )
      .eq("slug", slug)
      .eq("is_public", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to fetch published notebook: ${error.message}`);
    }

    return {
      ...data,
      author_name: data.users?.display_name || "Anonymous",
    };
  }

  static async publishNotebook(
    notebook: Notebook,
    publishData: {
      sport: string;
      tags: string[];
      summary?: string;
      performance_data?: any;
    },
  ): Promise<PublishedNotebook> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User must be authenticated to publish notebooks");
    }

    // Generate slug from title
    const slug = notebook.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50);

    // Combine all code from cells
    const code = notebook.cells
      .filter((cell) => cell.type === "code")
      .map((cell) => cell.content)
      .join("\n\n");

    const publishedNotebook = {
      title: notebook.title,
      slug: `${slug}-${Date.now()}`, // Add timestamp to ensure uniqueness
      author_id: user.id,
      sport: publishData.sport,
      tags: publishData.tags,
      code,
      summary: publishData.summary,
      notebook_cells: notebook.cells,
      performance_data: publishData.performance_data || {},
      roi: publishData.performance_data?.metrics?.roi || 0,
      sharpe: publishData.performance_data?.metrics?.sharpe_ratio || 0,
    };

    const { data, error } = await supabase
      .from("published_notebooks")
      .insert(publishedNotebook)
      .select(
        `
        *,
        users!published_notebooks_author_id_fkey(display_name)
      `,
      )
      .single();

    if (error) {
      throw new Error(`Failed to publish notebook: ${error.message}`);
    }

    return {
      ...data,
      author_name: data.users?.display_name || "Anonymous",
    };
  }

  static async forkNotebook(request: ForkNotebookRequest): Promise<Notebook> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User must be authenticated to fork notebooks");
    }

    // Get the published notebook
    const publishedNotebook = await this.getPublishedNotebook(
      request.published_notebook_id,
    );
    if (!publishedNotebook) {
      throw new Error("Published notebook not found");
    }

    // Increment fork count
    await supabase
      .from("published_notebooks")
      .update({ fork_count: publishedNotebook.fork_count + 1 })
      .eq("id", publishedNotebook.id);

    // Create new notebook from published notebook
    const forkedNotebook: Notebook = {
      id: `notebook-${Date.now()}`,
      title: request.new_title || `${publishedNotebook.title} (Fork)`,
      cells: publishedNotebook.notebook_cells,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return forkedNotebook;
  }

  static async getSamplePublishedNotebooks(): Promise<PublishedNotebook[]> {
    // Mock data for development
    return [
      {
        id: "1",
        title: "NBA Over/Under Value Strategy",
        slug: "nba-over-under-value-strategy",
        author_id: "user1",
        author_name: "@quantace",
        sport: "basketball",
        tags: ["nba", "over-under", "value-betting", "kelly"],
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
        roi: 24.5,
        sharpe: 1.8,
        code: "def nba_over_under_strategy():\n    # Strategy implementation\n    pass",
        summary:
          "A profitable NBA over/under strategy using advanced statistical models and Kelly criterion for bet sizing.",
        is_public: true,
        fork_count: 23,
        notebook_cells: [],
        performance_data: {
          metrics: {
            roi: 24.5,
            sharpe_ratio: 1.8,
            win_rate: 67.3,
            max_drawdown: 8.2,
            total_bets: 156,
          },
          pnl_curve: [],
        },
      },
      {
        id: "2",
        title: "NFL Underdog Kelly Model",
        slug: "nfl-underdog-kelly-model",
        author_id: "user2",
        author_name: "@betbuilder",
        sport: "football",
        tags: ["nfl", "underdog", "kelly", "high-volatility"],
        created_at: "2024-01-10T15:30:00Z",
        updated_at: "2024-01-10T15:30:00Z",
        roi: 18.7,
        sharpe: 1.2,
        code: "def nfl_underdog_strategy():\n    # Strategy implementation\n    pass",
        summary:
          "High-risk, high-reward NFL underdog betting strategy with proper bankroll management.",
        is_public: true,
        fork_count: 15,
        notebook_cells: [],
        performance_data: {
          metrics: {
            roi: 18.7,
            sharpe_ratio: 1.2,
            win_rate: 45.2,
            max_drawdown: 15.3,
            total_bets: 89,
          },
          pnl_curve: [],
        },
      },
      {
        id: "3",
        title: "MLB Moneyline Arbitrage",
        slug: "mlb-moneyline-arbitrage",
        author_id: "user3",
        author_name: "@arbmaster",
        sport: "baseball",
        tags: ["mlb", "arbitrage", "low-risk", "statistical"],
        created_at: "2024-01-08T09:15:00Z",
        updated_at: "2024-01-08T09:15:00Z",
        roi: 12.3,
        sharpe: 2.1,
        code: "def mlb_arbitrage_strategy():\n    # Strategy implementation\n    pass",
        summary:
          "Low-risk MLB arbitrage opportunities using statistical analysis and market inefficiencies.",
        is_public: true,
        fork_count: 31,
        notebook_cells: [],
        performance_data: {
          metrics: {
            roi: 12.3,
            sharpe_ratio: 2.1,
            win_rate: 78.9,
            max_drawdown: 3.1,
            total_bets: 234,
          },
          pnl_curve: [],
        },
      },
    ];
  }
}
