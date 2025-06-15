import { SportsBettingService } from './sportsBetting';
import { 
  AIBettingQuery, 
  AIBettingResponse, 
  BettingStrategy 
} from '@/types/epl';

export class DemoService {
  /**
   * Demo responses for common queries without requiring OpenAI API
   */
  static async processQuery(query: AIBettingQuery): Promise<AIBettingResponse> {
    const lowercaseQuery = query.query.toLowerCase();

    // Arsenal ROI analysis
    if (lowercaseQuery.includes('arsenal') && (lowercaseQuery.includes('roi') || lowercaseQuery.includes('performance'))) {
      const analysis = SportsBettingService.getTeamROI('Arsenal');
      
      return {
        text: `## Arsenal - Betting Analysis

**Overall Performance:**
- Matches Played: ${analysis.matches_played}

**Home Record:**
- Wins: ${analysis.home_record.wins}
- Draws: ${analysis.home_record.draws}
- Losses: ${analysis.home_record.losses}
- Goals For: ${analysis.home_record.goals_for}
- Goals Against: ${analysis.home_record.goals_against}

**Away Record:**
- Wins: ${analysis.away_record.wins}
- Draws: ${analysis.away_record.draws}
- Losses: ${analysis.away_record.losses}
- Goals For: ${analysis.away_record.goals_for}
- Goals Against: ${analysis.away_record.goals_against}

**Betting Statistics:**
- ROI as Favorite: ${analysis.betting_stats.roi_as_favorite.toFixed(2)}%
- ROI as Underdog: ${analysis.betting_stats.roi_as_underdog.toFixed(2)}%
- ROI at Home: ${analysis.betting_stats.roi_home.toFixed(2)}%
- ROI Away: ${analysis.betting_stats.roi_away.toFixed(2)}%

${analysis.betting_stats.roi_as_underdog > analysis.betting_stats.roi_as_favorite ? 
  '📈 Arsenal performs better as an underdog!' : 
  '📉 Arsenal performs better as a favorite.'}`,
        data: {
          team_analysis: analysis,
          chart_data: {
            performance_comparison: {
              home_wins: analysis.home_record.wins,
              home_draws: analysis.home_record.draws,
              home_losses: analysis.home_record.losses,
              away_wins: analysis.away_record.wins,
              away_draws: analysis.away_record.draws,
              away_losses: analysis.away_record.losses
            },
            roi_comparison: {
              favorite: analysis.betting_stats.roi_as_favorite,
              underdog: analysis.betting_stats.roi_as_underdog,
              home: analysis.betting_stats.roi_home,
              away: analysis.betting_stats.roi_away
            }
          }
        }
      };
    }

    // Home team strategy simulation
    if (lowercaseQuery.includes('home team') && (lowercaseQuery.includes('$100') || lowercaseQuery.includes('bet'))) {
      const strategy: BettingStrategy = {
        name: 'Home Team Strategy',
        description: 'Bet $100 on all home teams',
        bet_type: '1',
        filters: {},
        stake_amount: 100
      };

      const result = SportsBettingService.simulateStrategy(strategy);
      
      return {
        text: `## Home Team Strategy Results

**Performance Summary:**
- Total Bets: ${result.total_bets}
- Win Rate: ${result.win_rate.toFixed(1)}%
- ROI: ${result.roi.toFixed(2)}%
- Net P&L: ${result.net_profit > 0 ? '+' : ''}$${result.net_profit.toFixed(2)}
- Average Odds: ${result.avg_odds.toFixed(2)}

**Betting Details:**
- Winning Bets: ${result.winning_bets}
- Losing Bets: ${result.losing_bets}
- Total Staked: $${result.total_staked.toFixed(2)}
- Total Return: $${result.total_return.toFixed(2)}

${result.roi > 0 ? '✅ This strategy shows positive returns!' : '❌ This strategy shows negative returns.'}

Home teams have a decent advantage in the Premier League, but betting on all home teams indiscriminately may not be the most profitable approach.`,
        data: {
          strategy_result: result,
          chart_data: {
            pnl_curve: result.pnl_curve,
            bet_distribution: {
              wins: result.winning_bets,
              losses: result.losing_bets
            }
          },
          table_data: result.bet_log.slice(0, 10)
        }
      };
    }

    // Over 2.5 goals market analysis
    if (lowercaseQuery.includes('over') && lowercaseQuery.includes('2.5')) {
      const summary = SportsBettingService.getMarketSummary('over_2.5');
      
      return {
        text: `## Over 2.5 Goals Market Analysis

**Market Performance:**
- Total Matches: ${summary.total_matches}
- Hit Rate: ${summary.hit_rate.toFixed(1)}%
- Average Odds: ${summary.avg_odds.toFixed(2)}
- ROI: ${summary.roi.toFixed(2)}%
- Profit/Loss: ${summary.profit_loss > 0 ? '+' : ''}$${summary.profit_loss.toFixed(2)}

**Odds Range:**
- Highest Odds: ${summary.max_odds.toFixed(2)}
- Lowest Odds: ${summary.min_odds.toFixed(2)}

${summary.roi > 0 ? 
  `✅ The Over 2.5 Goals market shows positive returns with a ${summary.hit_rate.toFixed(1)}% hit rate!` :
  `❌ The Over 2.5 Goals market shows negative returns despite a ${summary.hit_rate.toFixed(1)}% hit rate.`}

This market tends to be quite popular among bettors, so finding value requires careful analysis of team form and playing styles.`,
        data: {
          market_summary: summary,
          chart_data: {
            market_performance: {
              hit_rate: summary.hit_rate,
              miss_rate: 100 - summary.hit_rate
            }
          }
        }
      };
    }

    // Top performing teams query
    if (lowercaseQuery.includes('top') && (lowercaseQuery.includes('teams') || lowercaseQuery.includes('underdog'))) {
      const teams = SportsBettingService.getTopPerformingTeams('roi');
      
      let text = `## Top Performing Teams by ROI\n\n`;
      
      teams.forEach((team, index) => {
        text += `${index + 1}. **${team.team}**: ${team.value.toFixed(2)}%\n`;
      });

      text += `\n🏆 ${teams[0]?.team} leads with ${teams[0]?.value.toFixed(2)}% ROI!`;

      return {
        text,
        data: {
          table_data: teams.map((team, index) => ({
            rank: index + 1,
            team: team.team,
            roi: team.value.toFixed(2) + '%'
          })),
          chart_data: {
            top_teams: teams.slice(0, 5).map(team => ({
              team: team.team,
              value: team.value
            }))
          }
        }
      };
    }

    // EPL stats summary
    if (lowercaseQuery.includes('epl') || lowercaseQuery.includes('premier league') || lowercaseQuery.includes('statistics')) {
      const stats = SportsBettingService.aggregateStats();
      
      return {
        text: `## EPL Statistics Summary

**Match Results:**
- Total Matches: ${stats.total_matches}
- Home Wins: ${stats.home_wins} (${((stats.home_wins / stats.total_matches) * 100).toFixed(1)}%)
- Draws: ${stats.draws} (${((stats.draws / stats.total_matches) * 100).toFixed(1)}%)
- Away Wins: ${stats.away_wins} (${((stats.away_wins / stats.total_matches) * 100).toFixed(1)}%)

**Goal Statistics:**
- Average Goals per Game: ${stats.avg_goals.toFixed(2)}
- Over 2.5 Rate: ${stats.over_2_5_rate.toFixed(1)}%
- Under 2.5 Rate: ${stats.under_2_5_rate.toFixed(1)}%

${stats.home_wins > stats.away_wins ? 
  '🏠 Home advantage is evident in this dataset!' :
  '✈️ Away teams are performing surprisingly well!'}

This data shows the typical patterns you'd expect in Premier League football.`,
        data: {
          chart_data: {
            results_distribution: {
              home_wins: stats.home_wins,
              draws: stats.draws,
              away_wins: stats.away_wins
            },
            goals_distribution: {
              over_2_5: stats.over_2_5_rate,
              under_2_5: stats.under_2_5_rate
            }
          }
        }
      };
    }

    // Generate a strategy based on closing odds
    if (lowercaseQuery.includes('strategy') && (lowercaseQuery.includes('odds') || lowercaseQuery.includes('closing'))) {
      return {
        text: `## AI Generated Strategy: Closing Line Value

Here's a simple strategy that looks for value by comparing opening and closing odds:

**Strategy Concept:**
- Bet on markets where closing odds have increased (indicating sharp money went the other way)
- Focus on Over 2.5 goals when odds drift upward
- Use 3% of bankroll per bet

**Implementation:**
\`\`\`python
def closing_line_value_strategy(matches, bankroll=10000):
    bets = []
    for match in matches:
        opening_over = match['market_odds']['over_2.5']
        closing_over = match['closing_odds']['over_2.5']
        
        # If closing odds are higher than opening (market moved against over)
        if closing_over > opening_over and closing_over > 1.8:
            stake = bankroll * 0.03
            bets.append({
                'match': f"{match['home_team']} vs {match['away_team']}",
                'bet': 'Over 2.5',
                'odds': opening_over,
                'stake': stake
            })
    
    return bets
\`\`\`

This strategy exploits market inefficiencies by following closing line value principles.`,
        code: `def closing_line_value_strategy(matches, bankroll=10000):
    """
    Closing Line Value Strategy for Over 2.5 Goals
    
    Bets on Over 2.5 when closing odds are higher than opening odds,
    indicating the market moved against this outcome.
    """
    bets = []
    total_profit = 0
    
    for match in matches:
        opening_over = match['market_odds']['over_2.5']
        closing_over = match['closing_odds']['over_2.5']
        
        # Check if closing odds drifted up (value opportunity)
        if closing_over > opening_over and closing_over > 1.8:
            stake = bankroll * 0.03  # 3% of bankroll
            
            # Check actual result
            is_win = match['total_goals'] > 2.5
            pnl = (opening_over - 1) * stake if is_win else -stake
            total_profit += pnl
            
            bets.append({
                'match': f"{match['home_team']} vs {match['away_team']}",
                'bet_type': 'Over 2.5',
                'odds': opening_over,
                'stake': stake,
                'result': 'WIN' if is_win else 'LOSS',
                'pnl': pnl
            })
    
    return {
        'bets': bets,
        'total_profit': total_profit,
        'roi': (total_profit / sum(bet['stake'] for bet in bets)) * 100 if bets else 0
    }

# Example usage:
# result = closing_line_value_strategy(epl_matches)
# print(f"Strategy ROI: {result['roi']:.2f}%")`
      };
    }

    // Default response
    return {
      text: `I can help you analyze EPL betting data! Here are some things you can ask me:

**Try these queries:**
- "Show me Arsenal's ROI analysis"
- "What would my P&L be if I bet $100 on all home teams?"
- "How profitable is the over 2.5 goals market?"
- "Which teams have the best ROI?"
- "Generate a strategy based on closing odds"

I have access to Premier League match data with odds, results, and team performance metrics. Ask me anything!`
    };
  }
} 