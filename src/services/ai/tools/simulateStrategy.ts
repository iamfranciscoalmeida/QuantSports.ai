import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { SportsBettingService } from '../../sportsBetting';
import { BettingStrategy } from '@/types/epl';

const SimulateStrategySchema = z.object({
  name: z.string().describe('Name of the betting strategy'),
  description: z.string().describe('Description of what the strategy does'),
  bet_type: z.enum(['home_win', 'away_win', 'draw', 'over_2_5', 'under_2_5', 'both_teams_score']).describe('Type of bet to place'),
  filters: z.object({
    teams: z.array(z.string()).optional().describe('Specific teams to include'),
    exclude_teams: z.array(z.string()).optional().describe('Teams to exclude'),
    min_odds: z.number().optional().describe('Minimum odds threshold'),
    max_odds: z.number().optional().describe('Maximum odds threshold'),
    venue: z.enum(['home', 'away', 'all']).optional().describe('Venue filter'),
    season: z.string().optional().describe('Season filter'),
    date_from: z.string().optional().describe('Start date filter (YYYY-MM-DD)'),
    date_to: z.string().optional().describe('End date filter (YYYY-MM-DD)')
  }).optional().describe('Filters to apply to the strategy'),
  stake_amount: z.number().optional().describe('Fixed stake amount per bet'),
  stake_percentage: z.number().optional().describe('Percentage of bankroll to stake per bet'),
  conditions: z.array(z.object({
    field: z.string().describe('Field to check (e.g., recent_form, goals_scored)'),
    operator: z.enum(['>', '<', '>=', '<=', '==', '!=']).describe('Comparison operator'),
    value: z.union([z.string(), z.number()]).describe('Value to compare against')
  })).optional().describe('Additional conditions for the strategy')
});

export class SimulateStrategyTool extends StructuredTool {
  name = 'simulate_strategy';
  description = 'Simulate a betting strategy against historical data to calculate ROI, win rate, and other performance metrics';
  schema = SimulateStrategySchema;

  async _call(input: z.infer<typeof SimulateStrategySchema>): Promise<string> {
    try {
      const strategy: BettingStrategy = {
        name: input.name,
        description: input.description,
        bet_type: input.bet_type,
        filters: input.filters || {},
        stake_amount: input.stake_amount,
        stake_percentage: input.stake_percentage,
        conditions: input.conditions || []
      };

      const result = SportsBettingService.simulateStrategy(strategy);

      const summary = `## Strategy Simulation: ${strategy.name}

**Performance Summary:**
- Total Bets: ${result.total_bets}
- Win Rate: ${result.win_rate.toFixed(1)}%
- ROI: ${result.roi.toFixed(2)}%
- Net P&L: ${result.net_profit > 0 ? '+' : ''}${result.net_profit.toFixed(2)}
- Average Odds: ${result.avg_odds.toFixed(2)}
- Profit Factor: ${result.profit_factor.toFixed(2)}

**Betting Details:**
- Winning Bets: ${result.winning_bets}
- Losing Bets: ${result.losing_bets}
- Total Staked: £${result.total_staked.toFixed(2)}
- Total Return: £${result.total_return.toFixed(2)}

**Risk Analysis:**
- Max Winning Streak: ${result.max_winning_streak}
- Max Losing Streak: ${result.max_losing_streak}
- Largest Win: £${result.largest_win?.toFixed(2) || '0.00'}
- Largest Loss: £${result.largest_loss?.toFixed(2) || '0.00'}

**Recommendation:** ${this.getRecommendation(result)}

*Note: This simulation is based on historical data and past performance does not guarantee future results.*`;

      return summary;
    } catch (error) {
      console.error('Strategy simulation error:', error);
      return `I encountered an error while simulating the strategy "${input.name}". Please check your strategy parameters and try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private getRecommendation(result: any): string {
    if (result.roi > 10) {
      return "✅ Excellent strategy with strong positive ROI. Consider implementing with proper bankroll management.";
    } else if (result.roi > 5) {
      return "✅ Good strategy with positive returns. Monitor performance and adjust stake sizes accordingly.";
    } else if (result.roi > 0) {
      return "⚠️ Marginally profitable strategy. Consider optimizing filters or reducing stake sizes.";
    } else if (result.roi > -5) {
      return "⚠️ Strategy shows small losses. Review and refine the selection criteria.";
    } else {
      return "❌ Strategy shows significant losses. Major revision needed before implementation.";
    }
  }
}

// Additional utility functions for strategy analysis
export const validateStrategyParameters = (strategy: Partial<BettingStrategy>): string[] => {
  const errors: string[] = [];

  if (!strategy.name || strategy.name.trim() === '') {
    errors.push('Strategy name is required');
  }

  if (!strategy.bet_type) {
    errors.push('Bet type is required');
  }

  if (strategy.stake_amount && strategy.stake_percentage) {
    errors.push('Cannot specify both stake_amount and stake_percentage');
  }

  if (!strategy.stake_amount && !strategy.stake_percentage) {
    errors.push('Must specify either stake_amount or stake_percentage');
  }

  if (strategy.stake_amount && strategy.stake_amount <= 0) {
    errors.push('Stake amount must be positive');
  }

  if (strategy.stake_percentage && (strategy.stake_percentage <= 0 || strategy.stake_percentage > 100)) {
    errors.push('Stake percentage must be between 0 and 100');
  }

  if (strategy.filters?.min_odds && strategy.filters?.max_odds) {
    if (strategy.filters.min_odds >= strategy.filters.max_odds) {
      errors.push('Minimum odds must be less than maximum odds');
    }
  }

  return errors;
};

export const suggestStrategyImprovements = (result: any): string[] => {
  const suggestions: string[] = [];

  if (result.win_rate < 40) {
    suggestions.push('Consider tightening selection criteria to improve win rate');
  }

  if (result.max_losing_streak > 8) {
    suggestions.push('High losing streak detected - consider implementing stop-loss rules');
  }

  if (result.avg_odds < 1.5) {
    suggestions.push('Average odds are low - look for higher value opportunities');
  }

  if (result.avg_odds > 3.0) {
    suggestions.push('High average odds suggest high-risk bets - consider more conservative selections');
  }

  if (result.total_bets < 20) {
    suggestions.push('Limited sample size - extend date range for more reliable results');
  }

  if (result.profit_factor < 1.1 && result.profit_factor > 0.9) {
    suggestions.push('Strategy is break-even - fine-tune filters to improve edge');
  }

  return suggestions;
}; 