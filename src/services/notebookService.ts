import {
  NotebookCell,
  AIRequest,
  AIResponse,
  CodeExecutionResult,
  SportsBettingContext,
  BettingFunction,
} from "@/types/notebook";

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
print(f"Recommended bet size: ${bet_size:.2f}")
print(f"That's {bet_size/bankroll:.1%} of your bankroll")`,
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
print(f"Closing Line Value: {clv:.2%}")

if clv > 0:
    print("✅ Positive CLV - You beat the closing line!")
else:
    print("❌ Negative CLV - Market moved against you")`,
        explanation: "Created a Closing Line Value calculator to measure bet quality",
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
}
