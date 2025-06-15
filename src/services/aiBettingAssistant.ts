 import OpenAI from 'openai';
import { SportsBettingService } from './sportsBetting';
import { DatabaseSportsBettingService } from './sportsBettingDatabase';
import { AICodeGenerator } from './aiCodeGenerator';
import { HistoricalAnalysisEngine } from './historicalAnalysisEngine';
import { 
  AIBettingQuery, 
  AIBettingResponse, 
  BettingStrategy, 
  MatchFilters 
} from '@/types/epl';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export class AIBettingAssistant {
  private static conversationHistory: Array<{ role: 'user' | 'assistant', content: string }> = [];

  /**
   * Main function to process natural language betting queries
   */
  static async processQuery(query: AIBettingQuery): Promise<AIBettingResponse> {
    try {
      // Add to conversation history
      this.conversationHistory.push({ role: 'user', content: query.query });
      
      // Keep only last 10 interactions for context
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt()
          },
          ...this.conversationHistory
        ],
        functions: this.getFunctionDefinitions(),
        function_call: "auto",
        temperature: 0.7,
        max_tokens: 1500
      });

      const response = completion.choices[0].message;
      
      // Handle function calls
      if (response.function_call) {
        const functionResult = await this.executeFunctionCall(
          response.function_call.name,
          JSON.parse(response.function_call.arguments)
        );
        
        this.conversationHistory.push({ 
          role: 'assistant', 
          content: functionResult.text 
        });
        
        return functionResult;
      }
      
      // Handle regular text response
      const textResponse = response.content || "I'm sorry, I couldn't process your request.";
      this.conversationHistory.push({ role: 'assistant', content: textResponse });
      
      return {
        text: textResponse
      };
      
    } catch (error) {
      console.error('AI Betting Assistant Error:', error);
      return {
        text: "I'm experiencing technical difficulties. Please try again later.",
      };
    }
  }

  /**
   * Execute function calls based on AI decision
   */
  private static async executeFunctionCall(functionName: string, args: any): Promise<AIBettingResponse> {
    switch (functionName) {
      case 'simulate_strategy':
        return this.handleStrategySimulation(args);
      case 'get_team_roi':
        return await this.handleTeamROI(args);
      case 'get_market_summary':
        return this.handleMarketSummary(args);
      case 'get_top_performing_teams':
        return await this.handleTopPerformingTeams(args);
      case 'aggregate_stats':
        return this.handleAggregateStats(args);
      case 'generate_strategy_code':
        return this.handleCodeGeneration(args);
      case 'analyze_code_performance':
        return this.handleCodeAnalysis(args);
      case 'discover_betting_patterns':
        return this.handlePatternDiscovery(args);
      case 'create_data_visualization':
        return this.handleVisualizationGeneration(args);
      default:
        return {
          text: `Function ${functionName} is not implemented yet.`
        };
    }
  }

  /**
   * Handle strategy simulation
   */
  private static handleStrategySimulation(args: any): AIBettingResponse {
    try {
      const strategy: BettingStrategy = {
        name: args.name || 'Custom Strategy',
        description: args.description || 'AI Generated Strategy',
        filters: args.filters || {},
        bet_type: args.bet_type,
        stake_amount: args.stake_amount,
        stake_percentage: args.stake_percentage,
        conditions: args.conditions
      };

      const result = SportsBettingService.simulateStrategy(strategy);
      
      const text = `## Strategy Simulation Results: ${strategy.name}

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
- Total Staked: ${result.total_staked.toFixed(2)}
- Total Return: ${result.total_return.toFixed(2)}

**Streaks:**
- Max Winning Streak: ${result.max_winning_streak}
- Max Losing Streak: ${result.max_losing_streak}

${result.roi > 0 ? '✅ This strategy shows positive returns!' : '❌ This strategy shows negative returns.'}`;

      return {
        text,
        data: {
          strategy_result: result,
          chart_data: {
            pnl_curve: result.pnl_curve,
            bet_distribution: {
              wins: result.winning_bets,
              losses: result.losing_bets
            }
          },
          table_data: result.bet_log.slice(0, 20) // Show first 20 bets
        }
      };
    } catch (error) {
      return {
        text: "Sorry, I couldn't simulate that strategy. Please check your parameters and try again."
      };
    }
  }

  /**
   * Handle team ROI analysis with database fallback - Enhanced Version
   */
  private static async handleTeamROI(args: any): Promise<AIBettingResponse> {
    try {
      console.log(`🎯 Processing team ROI request for: ${args.team_name}`);
      
      // Try database first
      const dbStatus = await DatabaseSportsBettingService.getConnectionStatus();
      let analysis;
      let dataSource = 'unknown';
      
      if (dbStatus.connected && dbStatus.matchCount > 50) {
        console.log(`🎯 Using database with ${dbStatus.matchCount} matches`);
        analysis = await DatabaseSportsBettingService.getTeamROI(args.team_name, args.filters || {});
        dataSource = 'database';
      } else {
        console.log('📁 Falling back to JSON file');
        analysis = SportsBettingService.getTeamROI(args.team_name, args.filters || {});
        dataSource = 'json_fallback';
      }
      
      // Import and use the enhanced formatter
      const { EnhancedOutputFormatter } = await import('./enhancedOutputFormatter');
      const enhancedResponse = EnhancedOutputFormatter.formatTeamAnalysis(analysis, args.team_name);
      const formattedText = EnhancedOutputFormatter.formatAsMarkdown(enhancedResponse);
      
      // Add data source indicator at the top
      const dataSourceIndicator = dataSource === 'database' 
        ? `📊 **Data Source:** Live Database (${dbStatus.matchCount} total matches)\n\n`
        : `📁 **Data Source:** Static Dataset (Limited to 10 matches)\n\n`;
      
      return {
        text: dataSourceIndicator + formattedText,
        data: {
          team_analysis: analysis,
          enhanced_analysis: enhancedResponse,
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
            },
            visualizations: enhancedResponse.visualizations
          }
        }
      };
    } catch (error) {
      return {
        text: `Sorry, I couldn't find betting analysis for "${args.team_name}". Please check the team name and try again.`
      };
    }
  }

  /**
   * Handle market summary
   */
  private static handleMarketSummary(args: any): AIBettingResponse {
    try {
      const summary = SportsBettingService.getMarketSummary(args.market, args.filters || {});
      
      const text = `## Market Analysis: ${this.getMarketDisplayName(summary.market)}

**Market Performance:**
- Total Matches: ${summary.total_matches}
- Hit Rate: ${summary.hit_rate.toFixed(1)}%
- Average Odds: ${summary.avg_odds.toFixed(2)}
- ROI: ${summary.roi.toFixed(2)}%
- Profit/Loss: ${summary.profit_loss > 0 ? '+' : ''}${summary.profit_loss.toFixed(2)}

**Odds Range:**
- Highest Odds: ${summary.max_odds.toFixed(2)}
- Lowest Odds: ${summary.min_odds.toFixed(2)}

${summary.roi > 0 ? 
  `✅ The ${this.getMarketDisplayName(summary.market)} market shows positive returns with a ${summary.hit_rate.toFixed(1)}% hit rate!` :
  `❌ The ${this.getMarketDisplayName(summary.market)} market shows negative returns despite a ${summary.hit_rate.toFixed(1)}% hit rate.`}`;

      return {
        text,
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
    } catch (error) {
      return {
        text: "Sorry, I couldn't analyze that market. Please check your parameters and try again."
      };
    }
  }

  /**
   * Handle top performing teams with database fallback
   */
  private static async handleTopPerformingTeams(args: any): Promise<AIBettingResponse> {
    try {
      console.log(`🎯 Processing top performing teams request for metric: ${args.metric}`);
      
      // Try database first
      const dbStatus = await DatabaseSportsBettingService.getConnectionStatus();
      let teams;
      let dataSource = 'unknown';
      
      if (dbStatus.connected && dbStatus.matchCount > 50) {
        console.log(`🎯 Using database with ${dbStatus.matchCount} matches`);
        teams = await DatabaseSportsBettingService.getTopPerformingTeams(
          args.metric || 'roi',
          args.filters || {}
        );
        dataSource = 'database';
      } else {
        console.log('📁 Falling back to JSON file');
        teams = SportsBettingService.getTopPerformingTeams(args.metric, args.filters || {});
        dataSource = 'json_fallback';
      }
      
      const metricDisplay = args.metric === 'roi' ? 'ROI' : 
                           args.metric === 'win_rate' ? 'Win Rate' : 'Goals per Game';
      const unit = args.metric === 'roi' ? '%' : args.metric === 'win_rate' ? '%' : '';
      
      const dataSourceIndicator = dataSource === 'database' 
        ? `📊 **Data Source:** Live Database (${dbStatus.matchCount} total matches)`
        : `📁 **Data Source:** Static Dataset (Limited to 10 matches)`;
      
      let text = `## Top Performing Teams by ${metricDisplay}\n\n${dataSourceIndicator}\n\n`;
      
      teams.forEach((team, index) => {
        text += `${index + 1}. **${team.team}**: ${team.value.toFixed(2)}${unit}\n`;
      });

      text += `\n🏆 ${teams[0]?.team} leads with ${teams[0]?.value.toFixed(2)}${unit}!`;

      return {
        text,
        data: {
          table_data: teams.map((team, index) => ({
            rank: index + 1,
            team: team.team,
            [args.metric]: team.value.toFixed(2) + unit
          })),
          chart_data: {
            top_teams: teams.slice(0, 5).map(team => ({
              team: team.team,
              value: team.value
            }))
          }
        }
      };
    } catch (error) {
      return {
        text: "Sorry, I couldn't get the top performing teams. Please try again."
      };
    }
  }

  /**
   * Handle aggregate statistics
   */
  private static handleAggregateStats(args: any): AIBettingResponse {
    try {
      const stats = SportsBettingService.aggregateStats(args.filters || {});
      
      const text = `## EPL Statistics Summary

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
  '✈️ Away teams are performing surprisingly well!'}`;

      return {
        text,
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
    } catch (error) {
      return {
        text: "Sorry, I couldn't get the aggregate statistics. Please try again."
      };
    }
  }

  /**
   * Get system prompt for the AI assistant
   */
  private static getSystemPrompt(): string {
    return `You are a smart betting analyst assistant specializing in Premier League (EPL) data analysis. You have access to historical match data including odds, results, and team performance metrics.

Your role is to:
1. Answer natural language questions about EPL betting strategies and statistics
2. Use function calls to retrieve and analyze data when appropriate
3. Provide clear, actionable insights with specific numbers and percentages
4. Explain betting concepts when needed
5. Only answer questions you have data for - don't make up statistics

Available functions:
- simulate_strategy: Test betting strategies with specific parameters
- get_team_roi: Analyze team performance and ROI in different scenarios  
- get_market_summary: Get statistics for specific betting markets (1, X, 2, over/under 2.5)
- get_top_performing_teams: Rank teams by different metrics
- aggregate_stats: Get overall EPL statistics

When users ask about strategies, P&L, ROI, or team performance, use the appropriate function calls. Always provide context and explain what the numbers mean for betting decisions.

Be conversational but professional, and always include relevant warnings about responsible gambling when discussing betting strategies.`;
  }

  /**
   * Define available functions for OpenAI
   */
  private static getFunctionDefinitions() {
    return [
      {
        name: "simulate_strategy",
        description: "Simulate a betting strategy on historical EPL data",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Strategy name" },
            description: { type: "string", description: "Strategy description" },
            bet_type: { 
              type: "string", 
              enum: ["1", "X", "2", "over_2.5", "under_2.5"],
              description: "Type of bet: 1=home win, X=draw, 2=away win, over_2.5, under_2.5" 
            },
            filters: {
              type: "object",
              properties: {
                season: { type: "string" },
                team: { type: "string" },
                home_team: { type: "string" },
                away_team: { type: "string" },
                date_from: { type: "string" },
                date_to: { type: "string" }
              }
            },
            stake_amount: { type: "number", description: "Fixed stake amount" },
            stake_percentage: { type: "number", description: "Percentage of bankroll to stake" },
            conditions: {
              type: "object",
              properties: {
                min_odds: { type: "number" },
                max_odds: { type: "number" },
                odds_movement: { type: "string", enum: ["up", "down", "any"] }
              }
            }
          },
          required: ["bet_type"]
        }
      },
      {
        name: "get_team_roi",
        description: "Get detailed ROI analysis for a specific team",
        parameters: {
          type: "object",
          properties: {
            team_name: { type: "string", description: "Name of the team to analyze" },
            filters: {
              type: "object",
              properties: {
                season: { type: "string" },
                date_from: { type: "string" },
                date_to: { type: "string" }
              }
            }
          },
          required: ["team_name"]
        }
      },
      {
        name: "get_market_summary",
        description: "Get summary statistics for a betting market",
        parameters: {
          type: "object",
          properties: {
            market: { 
              type: "string", 
              enum: ["1", "X", "2", "over_2.5", "under_2.5"],
              description: "Betting market to analyze" 
            },
            filters: {
              type: "object",
              properties: {
                season: { type: "string" },
                team: { type: "string" },
                date_from: { type: "string" },
                date_to: { type: "string" }
              }
            }
          },
          required: ["market"]
        }
      },
      {
        name: "get_top_performing_teams",
        description: "Get top performing teams by a specific metric",
        parameters: {
          type: "object",
          properties: {
            metric: { 
              type: "string", 
              enum: ["roi", "win_rate", "goals"],
              description: "Metric to rank teams by" 
            },
            filters: {
              type: "object",
              properties: {
                season: { type: "string" },
                date_from: { type: "string" },
                date_to: { type: "string" }
              }
            }
          },
          required: ["metric"]
        }
      },
      {
        name: "aggregate_stats",
        description: "Get aggregate statistics for EPL matches",
        parameters: {
          type: "object",
          properties: {
            filters: {
              type: "object",
              properties: {
                season: { type: "string" },
                team: { type: "string" },
                date_from: { type: "string" },
                date_to: { type: "string" }
              }
            }
          }
        }
      },
      {
        name: "generate_strategy_code",
        description: "Generate Python code for a custom betting strategy",
        parameters: {
          type: "object",
          properties: {
            strategy_description: { type: "string", description: "Natural language description of strategy" },
            target_market: { type: "string", description: "Betting market to target" },
            risk_parameters: { 
              type: "object", 
              description: "Risk management parameters",
              properties: {
                max_stake: { type: "number" },
                max_drawdown: { type: "number" },
                kelly_fraction: { type: "number" }
              }
            },
            historical_period: { type: "string", description: "Historical period to analyze" }
          },
          required: ["strategy_description"]
        }
      },
      {
        name: "analyze_code_performance",
        description: "Analyze existing strategy code and suggest improvements",
        parameters: {
          type: "object",
          properties: {
            code: { type: "string", description: "Strategy code to analyze" },
            performance_metrics: { 
              type: "object", 
              description: "Historical performance metrics",
              properties: {
                roi: { type: "number" },
                win_rate: { type: "number" },
                max_drawdown: { type: "number" },
                sharpe_ratio: { type: "number" }
              }
            }
          },
          required: ["code"]
        }
      },
      {
        name: "discover_betting_patterns",
        description: "Analyze historical data to discover profitable betting patterns",
        parameters: {
          type: "object",
          properties: {
            timeframe: { type: "string", description: "Time period to analyze" },
            minimum_roi: { type: "number", description: "Minimum ROI threshold" },
            market_types: { 
              type: "array", 
              items: { type: "string" },
              description: "Markets to analyze"
            },
            team_filters: { 
              type: "array", 
              items: { type: "string" },
              description: "Teams to focus on"
            }
          }
        }
      },
      {
        name: "create_data_visualization",
        description: "Generate code for data visualization based on analysis results",
        parameters: {
          type: "object",
          properties: {
            data_type: { type: "string", description: "Type of data to visualize" },
            chart_type: { 
              type: "string", 
              enum: ["line", "bar", "scatter", "heatmap"],
              description: "Type of chart to create" 
            },
            metrics: { 
              type: "array", 
              items: { type: "string" },
              description: "Metrics to include in visualization"
            }
          },
          required: ["data_type", "chart_type"]
        }
      }
    ];
  }

  /**
   * Handle code generation requests
   */
  private static async handleCodeGeneration(args: any): Promise<AIBettingResponse> {
    try {
      const request = {
        userQuery: args.strategy_description,
        cellHistory: [],
        chatHistory: [],
        targetLanguage: 'python' as const
      };

      const response = await AICodeGenerator.generateCode(request);
      
      const text = `## Generated Strategy Code: ${args.strategy_description}

**Explanation:**
${response.explanation}

**Dependencies Required:**
${response.dependencies.map(dep => `- ${dep}`).join('\n')}

**Estimated Runtime:** ${response.estimatedRuntime}

**Related Functions to Explore:**
${response.relatedFunctions.map(func => `- ${func}`).join('\n')}

Copy the code below into a notebook cell to start testing your strategy:`;

      return {
        text,
        code: response.code,
        data: {
          chart_data: {
            generated_code: response.code,
            explanation: response.explanation,
            dependencies: response.dependencies
          },
          table_data: response.suggestedNextCells
        }
      };
    } catch (error) {
      return {
        text: "Sorry, I couldn't generate the strategy code at this time. Please try rephrasing your strategy description.",
        code: "# Error generating code - please try again"
      };
    }
  }

  /**
   * Handle code analysis requests
   */
  private static async handleCodeAnalysis(args: any): Promise<AIBettingResponse> {
    try {
      const request = {
        userQuery: "Analyze this betting strategy code",
        cellHistory: [],
        chatHistory: [],
        targetLanguage: 'python' as const
      };

      const optimization = await AICodeGenerator.optimizeCode(args.code, request);
      const explanation = await AICodeGenerator.explainCode(args.code);
      
      const text = `## Code Analysis Results

**Code Explanation:**
${explanation.explanation}

**Key Steps:**
${explanation.stepByStep.map((step, i) => `${i+1}. ${step}`).join('\n')}

**Assumptions:**
${explanation.assumptions.map(assumption => `- ${assumption}`).join('\n')}

**Optimization Suggestions:**
${optimization.improvements.map(improvement => `- ${improvement}`).join('\n')}

**Performance Gains:** ${optimization.performanceGains}

**Potential Limitations:**
${explanation.limitations.map(limitation => `- ${limitation}`).join('\n')}`;

      return {
        text,
        code: optimization.optimizedCode,
        data: {
          original_code: args.code,
          optimized_code: optimization.optimizedCode,
          analysis: explanation,
          improvements: optimization.improvements
        }
      };
    } catch (error) {
      return {
        text: "Sorry, I couldn't analyze the code at this time. Please ensure the code is valid Python.",
      };
    }
  }

  /**
   * Handle pattern discovery requests
   */
  private static async handlePatternDiscovery(args: any): Promise<AIBettingResponse> {
    try {
      const historicalData = SportsBettingService.getMatches();
      
      // Apply filters if provided
      let filteredData = historicalData;
      if (args.team_filters && args.team_filters.length > 0) {
        filteredData = historicalData.filter(match => 
          args.team_filters.includes(match.home_team) || 
          args.team_filters.includes(match.away_team)
        );
      }

      const patterns = await HistoricalAnalysisEngine.discoverPatterns(
        filteredData, 
        'roi'
      );

      const profitablePatterns = patterns.filter(p => 
        p.profitability > (args.minimum_roi || 0.05)
      );

      const text = `## Discovered Betting Patterns

Found ${profitablePatterns.length} profitable patterns meeting your criteria:

${profitablePatterns.map((pattern, i) => `
**${i+1}. ${pattern.pattern}**
- Frequency: ${(pattern.frequency * 100).toFixed(1)}% of matches
- Profitability: ${(pattern.profitability * 100).toFixed(2)}% ROI
- Confidence: ${(pattern.confidence * 100).toFixed(1)}%
- Conditions: ${pattern.conditions.join(', ')}
- Sample Size: ${pattern.examples.length} examples

*Suggested Strategy:* ${pattern.suggestedStrategy.description}
`).join('\n')}

${profitablePatterns.length === 0 ? 
  '❌ No patterns met your profitability threshold. Try lowering the minimum ROI or expanding the timeframe.' : 
  '✅ These patterns show historical profitability but past performance does not guarantee future results.'}`;

      return {
        text,
        data: {
          patterns: profitablePatterns,
          total_matches_analyzed: filteredData.length,
          filters_applied: args
        }
      };
    } catch (error) {
      return {
        text: "Sorry, I couldn't discover patterns at this time. Please try adjusting your parameters.",
      };
    }
  }

  /**
   * Handle visualization generation requests
   */
  private static async handleVisualizationGeneration(args: any): Promise<AIBettingResponse> {
    try {
      const chartTypes = {
        'line': 'Time series analysis',
        'bar': 'Comparative analysis',
        'scatter': 'Correlation analysis',
        'heatmap': 'Pattern visualization'
      };

      const code = this.generateVisualizationCode(args.data_type, args.chart_type, args.metrics);
      
      const text = `## ${chartTypes[args.chart_type as keyof typeof chartTypes]} Visualization

Generated code for creating a ${args.chart_type} chart to visualize ${args.data_type}.

**Metrics included:** ${args.metrics?.join(', ') || 'Standard metrics'}

**Chart type:** ${args.chart_type.charAt(0).toUpperCase() + args.chart_type.slice(1)}

Copy the code below into a notebook cell to create your visualization:`;

      return {
        text,
        code,
        data: {
          chart_config: {
            type: args.chart_type,
            data_type: args.data_type,
            metrics: args.metrics
          }
        }
      };
    } catch (error) {
      return {
        text: "Sorry, I couldn't generate the visualization code. Please check your parameters.",
        code: "# Error generating visualization code"
      };
    }
  }

  /**
   * Generate visualization code based on parameters
   */
  private static generateVisualizationCode(dataType: string, chartType: string, metrics: string[]): string {
    const baseImports = `import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import seaborn as sns
from SportsBettingService import getAllMatches

# Load data
matches = getAllMatches()
df = pd.DataFrame(matches)

`;

    switch (chartType) {
      case 'line':
        return baseImports + `# Time series line chart
df['date'] = pd.to_datetime(df['date'])
df = df.sort_values('date')

plt.figure(figsize=(12, 6))
${metrics?.map(metric => `plt.plot(df['date'], df['${metric}'], label='${metric}')`).join('\n') || "plt.plot(df['date'], df['total_goals'], label='Goals per Match')"}
plt.title('${dataType} Trends Over Time')
plt.xlabel('Date')
plt.ylabel('Value')
plt.legend()
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()`;

      case 'bar':
        return baseImports + `# Bar chart comparison
${metrics?.length ? 
  `metrics = ${JSON.stringify(metrics)}
values = [df[metric].mean() for metric in metrics]
plt.figure(figsize=(10, 6))
plt.bar(metrics, values)
plt.title('${dataType} Comparison')
plt.ylabel('Average Value')` :
  `team_performance = df.groupby('home_team')['total_goals'].mean().sort_values(ascending=False).head(10)
plt.figure(figsize=(12, 6))
team_performance.plot(kind='bar')
plt.title('${dataType} by Team')
plt.ylabel('Average Goals')`}
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()`;

      case 'scatter':
        return baseImports + `# Scatter plot for correlation analysis
plt.figure(figsize=(10, 8))
${metrics?.length >= 2 ? 
  `plt.scatter(df['${metrics[0]}'], df['${metrics[1]}'], alpha=0.6)
plt.xlabel('${metrics[0]}')
plt.ylabel('${metrics[1]}')
plt.title('${dataType}: ${metrics[0]} vs ${metrics[1]}')` :
  `plt.scatter(df['market_odds.1'], df['total_goals'], alpha=0.6)
plt.xlabel('Home Win Odds')
plt.ylabel('Total Goals')
plt.title('${dataType}: Odds vs Goals')`}
plt.tight_layout()
plt.show()`;

      case 'heatmap':
        return baseImports + `# Heatmap visualization
correlation_data = df[${JSON.stringify(metrics || ['market_odds.1', 'market_odds.X', 'market_odds.2', 'total_goals'])}].corr()

plt.figure(figsize=(10, 8))
sns.heatmap(correlation_data, annot=True, cmap='coolwarm', center=0)
plt.title('${dataType} Correlation Heatmap')
plt.tight_layout()
plt.show()`;

      default:
        return baseImports + `# Basic visualization
plt.figure(figsize=(10, 6))
df['total_goals'].hist(bins=20)
plt.title('${dataType} Distribution')
plt.xlabel('Value')
plt.ylabel('Frequency')
plt.show()`;
    }
  }

  /**
   * Helper to get display name for markets
   */
  private static getMarketDisplayName(market: string): string {
    const displayNames: Record<string, string> = {
      '1': 'Home Win',
      'X': 'Draw',
      '2': 'Away Win',
      'over_2.5': 'Over 2.5 Goals',
      'under_2.5': 'Under 2.5 Goals'
    };
    return displayNames[market] || market;
  }

  /**
   * Clear conversation history
   */
  static clearHistory(): void {
    this.conversationHistory = [];
  }
} 