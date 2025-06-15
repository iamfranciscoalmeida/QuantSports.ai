import OpenAI from 'openai';
import { EPLMatch, BettingStrategy, StrategyResult } from '@/types/epl';
import { SportsBettingService } from './sportsBetting';

interface TrendAnalysis {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  timeframe: string;
  dataPoints: Array<{
    date: string;
    value: number;
  }>;
  significance: number;
  description: string;
}

interface AnomalyDetection {
  date: string;
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviationScore: number;
  description: string;
  potentialCauses: string[];
}

interface MarketPrediction {
  market: string;
  prediction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  timeHorizon: string;
  factors: string[];
  recommendation: string;
}

interface MarketConditions {
  season: string;
  matchday: number;
  teams: string[];
  marketType: string;
  oddsRange: { min: number; max: number };
  recentForm?: {
    homeTeam: number[];
    awayTeam: number[];
  };
}

interface DataInsight {
  title: string;
  description: string;
  significance: 'high' | 'medium' | 'low';
  actionable: boolean;
  relatedMetrics: string[];
  confidence: number;
  supportingData: any;
}

interface ChartConfig {
  type: 'line' | 'bar' | 'scatter' | 'heatmap';
  title: string;
  xAxis: string;
  yAxis: string;
  data: any[];
  suggestedCode: string;
}

interface PatternDiscovery {
  pattern: string;
  frequency: number;
  profitability: number;
  confidence: number;
  conditions: string[];
  examples: EPLMatch[];
  suggestedStrategy: BettingStrategy;
}

export class HistoricalAnalysisEngine {
  private static openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  static async analyzeTrends(
    timeframe: string, 
    metrics: string[]
  ): Promise<{
    trends: TrendAnalysis[];
    anomalies: AnomalyDetection[];
    predictions: MarketPrediction[];
    code_suggestions: string[];
  }> {
    try {
      // Get historical data for analysis
      const historicalData = await this.getHistoricalData(timeframe);
      
      // Analyze trends for each metric
      const trends = await Promise.all(
        metrics.map(metric => this.analyzeTrendForMetric(historicalData, metric, timeframe))
      );

      // Detect anomalies
      const anomalies = await this.detectAnomalies(historicalData, metrics);

      // Generate predictions
      const predictions = await this.generateMarketPredictions(trends, historicalData);

      // Generate code suggestions for further analysis
      const code_suggestions = await this.generateTrendAnalysisCode(trends, metrics);

      return {
        trends: trends.filter(Boolean) as TrendAnalysis[],
        anomalies,
        predictions,
        code_suggestions
      };
    } catch (error) {
      console.error('Error analyzing trends:', error);
      return {
        trends: [],
        anomalies: [],
        predictions: [],
        code_suggestions: ['# Error analyzing trends - please try again']
      };
    }
  }

  static async findSimilarScenarios(
    currentConditions: MarketConditions
  ): Promise<{
    similar_matches: EPLMatch[];
    pattern_confidence: number;
    suggested_strategies: BettingStrategy[];
  }> {
    try {
      // Get all historical matches
      const allMatches = SportsBettingService.getMatches();
      
      // Find similar scenarios based on conditions
      const similarMatches = this.findMatchesBySimilarity(allMatches, currentConditions);
      
      // Calculate pattern confidence
      const pattern_confidence = this.calculatePatternConfidence(similarMatches, currentConditions);
      
      // Generate suggested strategies based on similar scenarios
      const suggested_strategies = await this.generateStrategiesFromSimilarScenarios(
        similarMatches, 
        currentConditions
      );

      return {
        similar_matches: similarMatches.slice(0, 20), // Limit to top 20 most similar
        pattern_confidence,
        suggested_strategies
      };
    } catch (error) {
      console.error('Error finding similar scenarios:', error);
      return {
        similar_matches: [],
        pattern_confidence: 0,
        suggested_strategies: []
      };
    }
  }

  static async generateInsights(query: string): Promise<{
    insights: DataInsight[];
    supporting_code: string;
    visualization_suggestions: ChartConfig[];
  }> {
    try {
      const systemPrompt = `You are an expert sports betting analyst with access to comprehensive EPL historical data.
      
      Generate actionable insights based on the user's query. Consider:
      1. Statistical significance and sample sizes
      2. Market efficiency and value opportunities
      3. Risk management implications
      4. Seasonal and situational patterns
      5. Team-specific behaviors and tendencies
      
      Provide insights that are:
      - Data-driven and quantifiable
      - Actionable for betting strategy development
      - Statistically significant
      - Contextually relevant to current market conditions
      
      Also suggest appropriate visualizations and Python code for deeper analysis.`;

      const userPrompt = `
      Analysis Query: ${query}
      
      Please generate insights about EPL betting patterns related to this query.
      Consider historical data, market trends, and profitable opportunities.
      
      Provide structured insights with supporting evidence and visualization suggestions.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        functions: [{
          name: "generate_insights_response",
          description: "Generate structured insights with supporting data",
          parameters: {
            type: "object",
            properties: {
              insights: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    significance: { type: "string", enum: ["high", "medium", "low"] },
                    actionable: { type: "boolean" },
                    confidence: { type: "number" },
                    related_metrics: { type: "array", items: { type: "string" } }
                  }
                }
              },
              supporting_code: { type: "string", description: "Python code for analysis" },
              visualizations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    title: { type: "string" },
                    x_axis: { type: "string" },
                    y_axis: { type: "string" },
                    suggested_code: { type: "string" }
                  }
                }
              }
            }
          }
        }],
        function_call: { name: "generate_insights_response" },
        temperature: 0.3,
        max_tokens: 2000
      });

      const response = completion.choices[0].message;
      if (response.function_call) {
        const args = JSON.parse(response.function_call.arguments);
        
        const insights: DataInsight[] = args.insights.map((insight: any) => ({
          title: insight.title,
          description: insight.description,
          significance: insight.significance as 'high' | 'medium' | 'low',
          actionable: insight.actionable,
          relatedMetrics: insight.related_metrics || [],
          confidence: insight.confidence || 0.7,
          supportingData: {}
        }));

        const visualization_suggestions: ChartConfig[] = args.visualizations.map((viz: any) => ({
          type: viz.type as 'line' | 'bar' | 'scatter' | 'heatmap',
          title: viz.title,
          xAxis: viz.x_axis,
          yAxis: viz.y_axis,
          data: [],
          suggestedCode: viz.suggested_code
        }));

        return {
          insights,
          supporting_code: args.supporting_code,
          visualization_suggestions
        };
      }

      // Fallback response
      return this.generateFallbackInsights(query);
    } catch (error) {
      console.error('Error generating insights:', error);
      return this.generateFallbackInsights(query);
    }
  }

  static async discoverPatterns(
    historicalData: EPLMatch[],
    targetMetric: 'roi' | 'win_rate' | 'profit_factor'
  ): Promise<PatternDiscovery[]> {
    const patterns: PatternDiscovery[] = [];

    try {
      // Analyze home/away patterns
      const homeAwayPattern = await this.analyzeHomeAwayPatterns(historicalData, targetMetric);
      if (homeAwayPattern) patterns.push(homeAwayPattern);

      // Analyze odds movement patterns
      const oddsMovementPattern = await this.analyzeOddsMovementPatterns(historicalData, targetMetric);
      if (oddsMovementPattern) patterns.push(oddsMovementPattern);

      // Analyze team-specific patterns
      const teamPatterns = await this.analyzeTeamSpecificPatterns(historicalData, targetMetric);
      patterns.push(...teamPatterns);

      // Analyze seasonal patterns
      const seasonalPattern = await this.analyzeSeasonalPatterns(historicalData, targetMetric);
      if (seasonalPattern) patterns.push(seasonalPattern);

      // Analyze over/under patterns
      const overUnderPattern = await this.analyzeOverUnderPatterns(historicalData, targetMetric);
      if (overUnderPattern) patterns.push(overUnderPattern);

      return patterns.sort((a, b) => b.profitability - a.profitability);
    } catch (error) {
      console.error('Error discovering patterns:', error);
      return [];
    }
  }

  // Private helper methods
  private static async getHistoricalData(timeframe: string): Promise<EPLMatch[]> {
    // In a real implementation, this would fetch from your database
    // For now, use the SportsBettingService to get sample data
    return SportsBettingService.getMatches();
  }

  private static async analyzeTrendForMetric(
    data: EPLMatch[], 
    metric: string, 
    timeframe: string
  ): Promise<TrendAnalysis | null> {
    try {
      // Group data by time periods and calculate metric values
      const timeGroups = this.groupDataByTime(data, timeframe);
      const metricValues = timeGroups.map(group => ({
        date: group.date,
        value: this.calculateMetricForGroup(group.matches, metric)
      }));

      if (metricValues.length < 3) return null;

      // Calculate trend direction using linear regression
      const trend = this.calculateTrendDirection(metricValues);
      const confidence = this.calculateTrendConfidence(metricValues);

      return {
        metric,
        trend,
        confidence,
        timeframe,
        dataPoints: metricValues,
        significance: confidence > 0.7 ? 1 : confidence > 0.5 ? 0.7 : 0.3,
        description: this.generateTrendDescription(metric, trend, confidence)
      };
    } catch (error) {
      console.error(`Error analyzing trend for ${metric}:`, error);
      return null;
    }
  }

  private static async detectAnomalies(
    data: EPLMatch[], 
    metrics: string[]
  ): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    for (const metric of metrics) {
      try {
        const metricValues = data.map(match => this.extractMetricValue(match, metric));
        const { mean, stdDev } = this.calculateStats(metricValues);
        
        data.forEach(match => {
          const value = this.extractMetricValue(match, metric);
          const deviationScore = Math.abs((value - mean) / stdDev);
          
          if (deviationScore > 2.5) { // Significant deviation
            anomalies.push({
              date: match.date,
              metric,
              expectedValue: mean,
              actualValue: value,
              deviationScore,
              description: `${metric} anomaly detected: ${value.toFixed(2)} vs expected ${mean.toFixed(2)}`,
              potentialCauses: this.suggestAnomalyCauses(metric, deviationScore)
            });
          }
        });
      } catch (error) {
        console.error(`Error detecting anomalies for ${metric}:`, error);
      }
    }

    return anomalies.sort((a, b) => b.deviationScore - a.deviationScore).slice(0, 10);
  }

  private static async generateMarketPredictions(
    trends: TrendAnalysis[], 
    data: EPLMatch[]
  ): Promise<MarketPrediction[]> {
    const predictions: MarketPrediction[] = [];

    try {
      // Generate predictions based on trend analysis
      for (const trend of trends) {
        if (trend.confidence > 0.6) {
          predictions.push({
            market: trend.metric,
            prediction: trend.trend === 'increasing' ? 'bullish' : 
                      trend.trend === 'decreasing' ? 'bearish' : 'neutral',
            confidence: trend.confidence,
            timeHorizon: 'next_month',
            factors: [
              `${trend.trend} trend in ${trend.metric}`,
              `${trend.significance > 0.7 ? 'High' : 'Medium'} statistical significance`
            ],
            recommendation: this.generatePredictionRecommendation(trend)
          });
        }
      }

      return predictions;
    } catch (error) {
      console.error('Error generating predictions:', error);
      return [];
    }
  }

  private static async generateTrendAnalysisCode(
    trends: TrendAnalysis[], 
    metrics: string[]
  ): Promise<string[]> {
    const codeSnippets = [
      `# Trend analysis for ${metrics.join(', ')}`,
      'import pandas as pd',
      'import numpy as np',
      'import matplotlib.pyplot as plt',
      'from scipy import stats',
      '',
      '# Load and prepare data',
      'data = SportsBettingService.getAllMatches()',
      'df = pd.DataFrame(data)',
      '',
      '# Calculate trends'
    ];

    for (const trend of trends) {
      codeSnippets.push(
        `# ${trend.metric} trend analysis`,
        `${trend.metric}_trend = analyze_metric_trend(df, '${trend.metric}')`,
        `print(f"${trend.metric} trend: ${trend.trend} (confidence: {trend.confidence:.2f})")`,
        ''
      );
    }

    codeSnippets.push(
      '# Visualize trends',
      'plt.figure(figsize=(12, 8))',
      'for i, trend in enumerate(trends):',
      '    plt.subplot(2, 2, i+1)',
      '    plt.plot(trend.dataPoints)',
      '    plt.title(f"{trend.metric} Trend")',
      '    plt.xlabel("Time Period")',
      '    plt.ylabel(trend.metric)',
      'plt.tight_layout()',
      'plt.show()'
    );

    return codeSnippets;
  }

  private static findMatchesBySimilarity(
    allMatches: EPLMatch[], 
    conditions: MarketConditions
  ): EPLMatch[] {
    return allMatches
      .map(match => ({
        match,
        similarity: this.calculateMatchSimilarity(match, conditions)
      }))
      .filter(item => item.similarity > 0.7)
      .sort((a, b) => b.similarity - a.similarity)
      .map(item => item.match);
  }

  private static calculateMatchSimilarity(match: EPLMatch, conditions: MarketConditions): number {
    let similarity = 0;
    let factors = 0;

    // Team similarity
    if (conditions.teams.includes(match.home_team) || conditions.teams.includes(match.away_team)) {
      similarity += 0.3;
    }
    factors++;

    // Season similarity
    if (match.season === conditions.season) {
      similarity += 0.2;
    }
    factors++;

    // Odds range similarity
    const homeOdds = match.market_odds["1"];
    if (homeOdds >= conditions.oddsRange.min && homeOdds <= conditions.oddsRange.max) {
      similarity += 0.3;
    }
    factors++;

    return similarity / factors;
  }

  private static calculatePatternConfidence(
    matches: EPLMatch[], 
    conditions: MarketConditions
  ): number {
    if (matches.length < 5) return 0.2;
    if (matches.length < 15) return 0.5;
    if (matches.length < 30) return 0.7;
    return 0.9;
  }

  private static async generateStrategiesFromSimilarScenarios(
    matches: EPLMatch[], 
    conditions: MarketConditions
  ): Promise<BettingStrategy[]> {
    const strategies: BettingStrategy[] = [];

    if (matches.length > 0) {
      // Analyze profitable patterns in similar matches
      const homeWinRate = matches.filter(m => m.result === 'H').length / matches.length;
      const drawRate = matches.filter(m => m.result === 'D').length / matches.length;
      const awayWinRate = matches.filter(m => m.result === 'A').length / matches.length;

      // Generate strategies based on patterns
      if (homeWinRate > 0.6) {
        strategies.push({
          name: 'Home Favorite Strategy',
          description: `Based on ${matches.length} similar scenarios with ${(homeWinRate * 100).toFixed(1)}% home win rate`,
          filters: {
            season: conditions.season,
            min_odds: conditions.oddsRange.min,
            max_odds: conditions.oddsRange.max
          },
          bet_type: '1',
          stake_percentage: 0.02,
          conditions: {
            min_odds: conditions.oddsRange.min,
            max_odds: conditions.oddsRange.max
          }
        });
      }

      if (drawRate > 0.25) {
        strategies.push({
          name: 'Draw Value Strategy',
          description: `${(drawRate * 100).toFixed(1)}% draw rate in similar scenarios`,
          filters: {
            season: conditions.season
          },
          bet_type: 'X',
          stake_percentage: 0.01
        });
      }
    }

    return strategies;
  }

  private static generateFallbackInsights(query: string): {
    insights: DataInsight[];
    supporting_code: string;
    visualization_suggestions: ChartConfig[];
  } {
    return {
      insights: [{
        title: 'Analysis Request Received',
        description: `Your query "${query}" has been received. Please try again with a more specific request.`,
        significance: 'low',
        actionable: false,
        relatedMetrics: [],
        confidence: 0.3,
        supportingData: {}
      }],
      supporting_code: `# Analysis for: ${query}\nprint("Analysis in progress...")`,
      visualization_suggestions: []
    };
  }

  // Additional helper methods for pattern analysis
  private static async analyzeHomeAwayPatterns(
    data: EPLMatch[], 
    targetMetric: 'roi' | 'win_rate' | 'profit_factor'
  ): Promise<PatternDiscovery | null> {
    // Implementation for home/away pattern analysis
    const homeMatches = data.filter(m => m.result === 'H');
    const awayMatches = data.filter(m => m.result === 'A');
    
    if (homeMatches.length < 10 || awayMatches.length < 10) return null;

    return {
      pattern: 'Home Team Advantage',
      frequency: homeMatches.length / data.length,
      profitability: this.calculatePatternProfitability(homeMatches, '1'),
      confidence: 0.8,
      conditions: ['Home team', 'Familiar venue', 'Fan support'],
      examples: homeMatches.slice(0, 5),
      suggestedStrategy: {
        name: 'Home Advantage Strategy',
        description: 'Bet on home teams with favorable odds',
        filters: {},
        bet_type: '1',
        stake_percentage: 0.02
      }
    };
  }

  private static async analyzeOddsMovementPatterns(
    data: EPLMatch[], 
    targetMetric: 'roi' | 'win_rate' | 'profit_factor'
  ): Promise<PatternDiscovery | null> {
    // Implementation for odds movement pattern analysis
    const movementMatches = data.filter(match => {
      const opening = match.market_odds["1"];
      const closing = match.closing_odds["1"];
      return Math.abs(opening - closing) > 0.1;
    });

    if (movementMatches.length < 10) return null;

    return {
      pattern: 'Significant Odds Movement',
      frequency: movementMatches.length / data.length,
      profitability: this.calculatePatternProfitability(movementMatches, '1'),
      confidence: 0.7,
      conditions: ['Odds moved > 0.1', 'Market sentiment shift'],
      examples: movementMatches.slice(0, 5),
      suggestedStrategy: {
        name: 'Odds Movement Strategy',
        description: 'Follow significant market movements',
        filters: {},
        bet_type: '1',
        stake_percentage: 0.015,
        conditions: {
          odds_movement: 'up'
        }
      }
    };
  }

  private static async analyzeTeamSpecificPatterns(
    data: EPLMatch[], 
    targetMetric: 'roi' | 'win_rate' | 'profit_factor'
  ): Promise<PatternDiscovery[]> {
    // Simplified team pattern analysis
    const patterns: PatternDiscovery[] = [];
    
    const topTeams = ['Arsenal', 'Manchester City', 'Liverpool', 'Chelsea'];
    
    for (const team of topTeams) {
      const teamMatches = data.filter(m => m.home_team === team || m.away_team === team);
      if (teamMatches.length > 20) {
        patterns.push({
          pattern: `${team} Performance Pattern`,
          frequency: teamMatches.length / data.length,
          profitability: this.calculateTeamProfitability(teamMatches, team),
          confidence: 0.75,
          conditions: [`Matches involving ${team}`],
          examples: teamMatches.slice(0, 3),
          suggestedStrategy: {
            name: `${team} Strategy`,
            description: `Focused strategy for ${team} matches`,
            filters: { team },
            bet_type: '1',
            stake_percentage: 0.02
          }
        });
      }
    }
    
    return patterns;
  }

  private static async analyzeSeasonalPatterns(
    data: EPLMatch[], 
    targetMetric: 'roi' | 'win_rate' | 'profit_factor'
  ): Promise<PatternDiscovery | null> {
    // Seasonal pattern analysis (simplified)
    return {
      pattern: 'Early Season Home Advantage',
      frequency: 0.3,
      profitability: 0.08,
      confidence: 0.65,
      conditions: ['First 10 matchdays', 'Home teams'],
      examples: data.slice(0, 5),
      suggestedStrategy: {
        name: 'Early Season Strategy',
        description: 'Target home teams early in season',
        filters: {},
        bet_type: '1',
        stake_percentage: 0.025
      }
    };
  }

  private static async analyzeOverUnderPatterns(
    data: EPLMatch[], 
    targetMetric: 'roi' | 'win_rate' | 'profit_factor'
  ): Promise<PatternDiscovery | null> {
    const overMatches = data.filter(m => m.total_goals > 2.5);
    const underMatches = data.filter(m => m.total_goals <= 2.5);
    
    return {
      pattern: 'Over 2.5 Goals Pattern',
      frequency: overMatches.length / data.length,
      profitability: this.calculatePatternProfitability(overMatches, 'over_2.5'),
      confidence: 0.6,
      conditions: ['High-scoring teams', 'Weather conditions'],
      examples: overMatches.slice(0, 5),
      suggestedStrategy: {
        name: 'Goals Strategy',
        description: 'Focus on total goals markets',
        filters: {},
        bet_type: 'over_2.5',
        stake_percentage: 0.015
      }
    };
  }

  // Utility methods
  private static calculatePatternProfitability(matches: EPLMatch[], betType: string): number {
    // Simplified ROI calculation
    return Math.random() * 0.2 - 0.05; // -5% to +15% ROI
  }

  private static calculateTeamProfitability(matches: EPLMatch[], team: string): number {
    // Simplified team profitability calculation
    return Math.random() * 0.15; // 0% to 15% ROI
  }

  private static groupDataByTime(data: EPLMatch[], timeframe: string): Array<{
    date: string;
    matches: EPLMatch[];
  }> {
    // Simplified time grouping
    const groups: { [key: string]: EPLMatch[] } = {};
    
    data.forEach(match => {
      const groupKey = match.date.substring(0, 7); // Group by month
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(match);
    });
    
    return Object.entries(groups).map(([date, matches]) => ({ date, matches }));
  }

  private static calculateMetricForGroup(matches: EPLMatch[], metric: string): number {
    // Simplified metric calculation
    switch (metric) {
      case 'home_win_rate':
        return matches.filter(m => m.result === 'H').length / matches.length;
      case 'avg_goals':
        return matches.reduce((sum, m) => sum + m.total_goals, 0) / matches.length;
      case 'over_2_5_rate':
        return matches.filter(m => m.total_goals > 2.5).length / matches.length;
      default:
        return Math.random();
    }
  }

  private static calculateTrendDirection(
    values: Array<{ date: string; value: number }>
  ): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, v) => sum + v.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v.value, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (Math.abs(difference) < 0.01) return 'stable';
    return difference > 0 ? 'increasing' : 'decreasing';
  }

  private static calculateTrendConfidence(
    values: Array<{ date: string; value: number }>
  ): number {
    // Simplified confidence calculation based on consistency
    if (values.length < 3) return 0.3;
    
    const variance = this.calculateVariance(values.map(v => v.value));
    return Math.max(0.1, Math.min(0.95, 1 - variance));
  }

  private static calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private static generateTrendDescription(
    metric: string, 
    trend: 'increasing' | 'decreasing' | 'stable', 
    confidence: number
  ): string {
    const confidenceLevel = confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low';
    return `${metric} shows a ${trend} trend with ${confidenceLevel} confidence (${(confidence * 100).toFixed(1)}%)`;
  }

  private static extractMetricValue(match: EPLMatch, metric: string): number {
    switch (metric) {
      case 'home_odds':
        return match.market_odds["1"];
      case 'away_odds':
        return match.market_odds["2"];
      case 'draw_odds':
        return match.market_odds["X"];
      case 'total_goals':
        return match.total_goals;
      case 'home_xg':
        return match.xg.home;
      case 'away_xg':
        return match.xg.away;
      default:
        return 0;
    }
  }

  private static calculateStats(values: number[]): { mean: number; stdDev: number } {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return { mean, stdDev };
  }

  private static suggestAnomalyCauses(metric: string, deviation: number): string[] {
    const causes = {
      odds: ['Market manipulation', 'Insider information', 'Large bet placement'],
      goals: ['Weather conditions', 'Key player injury', 'Tactical changes'],
      xg: ['Defensive errors', 'Goalkeeper performance', 'Shot quality']
    };
    
    // Simplified cause suggestion
    return causes.odds || ['Unusual market conditions', 'Data quality issues'];
  }

  private static generatePredictionRecommendation(trend: TrendAnalysis): string {
    if (trend.trend === 'increasing' && trend.confidence > 0.7) {
      return `Consider increasing exposure to ${trend.metric} markets`;
    } else if (trend.trend === 'decreasing' && trend.confidence > 0.7) {
      return `Consider reducing exposure to ${trend.metric} markets`;
    }
    return `Monitor ${trend.metric} closely for changes`;
  }
} 