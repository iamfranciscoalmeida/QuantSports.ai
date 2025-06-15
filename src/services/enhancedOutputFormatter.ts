import { EnhancedAIResponse, EnhancedInsight, ActionableRecommendation } from '../types/ai-output';

export class EnhancedOutputFormatter {
  /**
   * Format team analysis into enhanced output
   */
  static formatTeamAnalysis(analysis: any, teamName: string): EnhancedAIResponse {
    const homeROI = analysis.betting_stats.roi_home;
    const awayROI = analysis.betting_stats.roi_away;
    const totalMatches = analysis.matches_played;
    
    // Calculate overall win rate
    const totalWins = analysis.home_record.wins + analysis.away_record.wins;
    const winRate = (totalWins / totalMatches) * 100;
    
    // Determine confidence based on sample size and consistency
    const confidence = this.calculateConfidence(totalMatches, homeROI, awayROI);
    
    return {
      executiveSummary: {
        keyFindings: this.generateKeyFindings(analysis, teamName),
        primaryRecommendation: this.generatePrimaryRecommendation(analysis, teamName),
        riskAssessment: this.assessRisk(analysis),
        confidenceScore: confidence
      },
      
      insights: this.generateInsights(analysis, teamName),
      recommendations: this.generateRecommendations(analysis, teamName),
      visualizations: this.generateVisualizationData(analysis, teamName),
      
      riskAnalysis: {
        factors: this.identifyRiskFactors(analysis),
        mitigation: this.suggestRiskMitigation(analysis),
        maxDrawdown: this.estimateMaxDrawdown(analysis),
        volatility: this.calculateVolatility(analysis)
      },
      
      performanceContext: {
        historicalComparison: this.getHistoricalContext(analysis, teamName),
        marketContext: this.getMarketContext(analysis, teamName)
      },
      
      rawData: analysis
    };
  }

  /**
   * Generate executive summary key findings
   */
  private static generateKeyFindings(analysis: any, teamName: string): string[] {
    const findings = [];
    
    // Home advantage analysis
    const homeAdvantage = analysis.betting_stats.roi_home - analysis.betting_stats.roi_away;
    if (Math.abs(homeAdvantage) > 15) {
      findings.push(`${homeAdvantage > 0 ? 'Strong' : 'Weak'} home advantage: ${Math.abs(homeAdvantage).toFixed(1)}% ROI difference`);
    }
    
    // Goal scoring tendency
    if (analysis.betting_stats.over_2_5_rate > 65) {
      findings.push(`High-scoring matches: ${analysis.betting_stats.over_2_5_rate.toFixed(0)}% exceed 2.5 goals`);
    } else if (analysis.betting_stats.over_2_5_rate < 40) {
      findings.push(`Low-scoring matches: Only ${analysis.betting_stats.over_2_5_rate.toFixed(0)}% exceed 2.5 goals`);
    }
    
    // Underdog vs Favorite performance
    const underdogAdvantage = analysis.betting_stats.roi_as_underdog - analysis.betting_stats.roi_as_favorite;
    if (underdogAdvantage > 20) {
      findings.push(`Underestimated by market: ${underdogAdvantage.toFixed(1)}% better ROI as underdog`);
    }
    
    return findings.slice(0, 3); // Keep top 3 findings
  }

  /**
   * Generate primary recommendation
   */
  private static generatePrimaryRecommendation(analysis: any, teamName: string): string {
    const homeROI = analysis.betting_stats.roi_home;
    const awayROI = analysis.betting_stats.roi_away;
    const underdogROI = analysis.betting_stats.roi_as_underdog;
    
    if (homeROI > 25 && homeROI > awayROI + 15) {
      return `Focus on ${teamName} home matches - consistently profitable with ${homeROI.toFixed(1)}% ROI`;
    } else if (underdogROI > 30) {
      return `Target ${teamName} when underdog - market undervalues with ${underdogROI.toFixed(1)}% ROI`;
    } else if (Math.max(homeROI, awayROI, underdogROI) < 10) {
      return `Avoid ${teamName} betting - poor profitability across all scenarios`;
    } else {
      return `Selective betting on ${teamName} - focus on specific match contexts`;
    }
  }

  /**
   * Generate enhanced insights with metadata
   */
  private static generateInsights(analysis: any, teamName: string): EnhancedInsight[] {
    const insights: EnhancedInsight[] = [];
    
    // Home Performance Insight
    insights.push({
      title: "Home ROI",
      value: `${analysis.betting_stats.roi_home.toFixed(1)}%`,
      trend: analysis.betting_stats.roi_home > 0 ? 'up' : 'down',
      confidence: this.calculateInsightConfidence(analysis.home_record.wins + analysis.home_record.draws + analysis.home_record.losses),
      importance: Math.abs(analysis.betting_stats.roi_home) > 20 ? 'high' : 'medium',
      context: `Based on ${analysis.home_record.wins + analysis.home_record.draws + analysis.home_record.losses} home matches`,
      benchmark: "League average: ~5%"
    });
    
    // Away Performance Insight
    insights.push({
      title: "Away ROI",
      value: `${analysis.betting_stats.roi_away.toFixed(1)}%`,
      trend: analysis.betting_stats.roi_away > 0 ? 'up' : 'down',
      confidence: this.calculateInsightConfidence(analysis.away_record.wins + analysis.away_record.draws + analysis.away_record.losses),
      importance: Math.abs(analysis.betting_stats.roi_away) > 20 ? 'high' : 'medium',
      context: `Based on ${analysis.away_record.wins + analysis.away_record.draws + analysis.away_record.losses} away matches`,
      benchmark: "League average: ~2%"
    });
    
    // Goal Analysis Insight
    insights.push({
      title: "Over 2.5 Goals Rate",
      value: `${analysis.betting_stats.over_2_5_rate.toFixed(0)}%`,
      trend: analysis.betting_stats.over_2_5_rate > 50 ? 'up' : 'down',
      confidence: this.calculateInsightConfidence(analysis.matches_played),
      importance: Math.abs(analysis.betting_stats.over_2_5_rate - 50) > 15 ? 'high' : 'low',
      context: `Deviation from 50/50 expectation`,
      benchmark: "League average: ~52%"
    });
    
    return insights;
  }

  /**
   * Generate actionable recommendations
   */
  private static generateRecommendations(analysis: any, teamName: string): ActionableRecommendation[] {
    const recommendations: ActionableRecommendation[] = [];
    
    // Home betting recommendation
    if (analysis.betting_stats.roi_home > 15) {
      recommendations.push({
        action: `Back ${teamName} to win at home`,
        confidence: this.calculateRecommendationConfidence(analysis.betting_stats.roi_home, analysis.home_record.wins + analysis.home_record.draws + analysis.home_record.losses),
        expectedROI: analysis.betting_stats.roi_home,
        riskLevel: analysis.betting_stats.roi_home > 30 ? 'medium' : 'low',
        timeframe: 'Next 5 home matches',
        conditions: [
          'Home advantage active',
          'No key player injuries',
          'Competitive odds available'
        ],
        stakeSuggestion: analysis.betting_stats.roi_home > 25 ? 3 : 2
      });
    }
    
    // Goals betting recommendation
    if (Math.abs(analysis.betting_stats.over_2_5_rate - 50) > 15) {
      const isOver = analysis.betting_stats.over_2_5_rate > 50;
      recommendations.push({
        action: `Bet ${isOver ? 'Over' : 'Under'} 2.5 Goals in ${teamName} matches`,
        confidence: 70,
        expectedROI: Math.abs(analysis.betting_stats.over_2_5_rate - 50) * 0.8, // Simplified calculation
        riskLevel: 'medium',
        timeframe: 'Next 10 matches',
        conditions: [
          `Historical rate: ${analysis.betting_stats.over_2_5_rate.toFixed(0)}%`,
          'Similar opposition strength'
        ],
        stakeSuggestion: 1.5
      });
    }
    
    return recommendations;
  }

  /**
   * Generate visualization data
   */
  private static generateVisualizationData(analysis: any, teamName: string): any[] {
    return [
      {
        type: 'bar',
        title: 'ROI Comparison',
        data: [
          { category: 'Home', value: analysis.betting_stats.roi_home },
          { category: 'Away', value: analysis.betting_stats.roi_away },
          { category: 'As Favorite', value: analysis.betting_stats.roi_as_favorite },
          { category: 'As Underdog', value: analysis.betting_stats.roi_as_underdog }
        ],
        description: 'Profitability across different scenarios'
      },
      {
        type: 'pie',
        title: 'Home vs Away Performance',
        data: [
          { label: 'Home Wins', value: analysis.home_record.wins },
          { label: 'Home Draws', value: analysis.home_record.draws },
          { label: 'Home Losses', value: analysis.home_record.losses },
          { label: 'Away Wins', value: analysis.away_record.wins },
          { label: 'Away Draws', value: analysis.away_record.draws },
          { label: 'Away Losses', value: analysis.away_record.losses }
        ],
        description: 'Win/Draw/Loss distribution by venue'
      }
    ];
  }

  /**
   * Calculate confidence based on sample size and consistency
   */
  private static calculateConfidence(matches: number, homeROI: number, awayROI: number): number {
    const sampleSizeScore = Math.min(matches / 20, 1) * 40; // Max 40 points for sample size
    const consistencyScore = Math.max(0, 60 - Math.abs(homeROI - awayROI)); // Penalty for inconsistency
    
    return Math.round(sampleSizeScore + consistencyScore);
  }

  /**
   * Calculate insight confidence
   */
  private static calculateInsightConfidence(sampleSize: number): number {
    if (sampleSize >= 20) return 85;
    if (sampleSize >= 10) return 70;
    if (sampleSize >= 5) return 55;
    return 40;
  }

  /**
   * Calculate recommendation confidence
   */
  private static calculateRecommendationConfidence(roi: number, sampleSize: number): number {
    const roiScore = Math.min(Math.abs(roi) / 30, 1) * 50;
    const sampleScore = Math.min(sampleSize / 15, 1) * 50;
    
    return Math.round(roiScore + sampleScore);
  }

  /**
   * Assess overall risk level
   */
  private static assessRisk(analysis: any): 'low' | 'medium' | 'high' {
    const volatility = Math.abs(analysis.betting_stats.roi_home - analysis.betting_stats.roi_away);
    
    if (volatility > 30) return 'high';
    if (volatility > 15) return 'medium';
    return 'low';
  }

  /**
   * Identify risk factors
   */
  private static identifyRiskFactors(analysis: any): string[] {
    const factors = [];
    
    if (analysis.matches_played < 10) {
      factors.push('Limited sample size - results may not be reliable');
    }
    
    const volatility = Math.abs(analysis.betting_stats.roi_home - analysis.betting_stats.roi_away);
    if (volatility > 25) {
      factors.push('High performance variance between home and away');
    }
    
    if (Math.max(analysis.betting_stats.roi_home, analysis.betting_stats.roi_away) > 40) {
      factors.push('Exceptionally high ROI may not be sustainable');
    }
    
    return factors;
  }

  /**
   * Suggest risk mitigation strategies
   */
  private static suggestRiskMitigation(analysis: any): string[] {
    return [
      'Start with smaller stake sizes',
      'Monitor performance over next 10 matches',
      'Avoid betting when key players are injured',
      'Consider team news and recent form changes'
    ];
  }

  /**
   * Estimate maximum drawdown
   */
  private static estimateMaxDrawdown(analysis: any): number {
    // Simplified estimation based on volatility
    const volatility = Math.abs(analysis.betting_stats.roi_home - analysis.betting_stats.roi_away);
    return Math.min(volatility * 0.8, 35); // Cap at 35%
  }

  /**
   * Calculate volatility score
   */
  private static calculateVolatility(analysis: any): number {
    return Math.abs(analysis.betting_stats.roi_home - analysis.betting_stats.roi_away) / 10;
  }

  /**
   * Get historical context
   */
  private static getHistoricalContext(analysis: any, teamName: string): string {
    const avgROI = (analysis.betting_stats.roi_home + analysis.betting_stats.roi_away) / 2;
    
    if (avgROI > 20) {
      return `${teamName} shows exceptional betting value - top 10% of teams historically`;
    } else if (avgROI > 10) {
      return `${teamName} shows good betting value - above average performance`;
    } else if (avgROI > 0) {
      return `${teamName} shows modest betting value - slightly profitable`;
    } else {
      return `${teamName} shows poor betting value - below average performance`;
    }
  }

  /**
   * Get market context
   */
  private static getMarketContext(analysis: any, teamName: string): string {
    const underdogAdvantage = analysis.betting_stats.roi_as_underdog - analysis.betting_stats.roi_as_favorite;
    
    if (underdogAdvantage > 15) {
      return `Market consistently undervalues ${teamName} - opportunity for contrarian betting`;
    } else if (underdogAdvantage < -15) {
      return `Market accurately prices ${teamName} - limited value when underdog`;
    } else {
      return `Market pricing appears efficient for ${teamName}`;
    }
  }

  /**
   * Format output as markdown with enhanced structure
   */
  static formatAsMarkdown(response: EnhancedAIResponse): string {
    let output = '';
    
    // Executive Summary
    output += `# 🎯 Executive Summary\n\n`;
    output += `**Confidence Score: ${response.executiveSummary.confidenceScore}%** | `;
    output += `**Risk Level: ${response.executiveSummary.riskAssessment.toUpperCase()}**\n\n`;
    
    output += `## 🔍 Key Findings\n`;
    response.executiveSummary.keyFindings.forEach(finding => {
      output += `- ${finding}\n`;
    });
    
    output += `\n## 💡 Primary Recommendation\n`;
    output += `${response.executiveSummary.primaryRecommendation}\n\n`;
    
    // Core Insights
    output += `# 📊 Performance Insights\n\n`;
    output += `| Metric | Value | Confidence | Trend | Context |\n`;
    output += `|--------|-------|------------|-------|----------|\n`;
    
    response.insights.forEach(insight => {
      const trendIcon = insight.trend === 'up' ? '📈' : insight.trend === 'down' ? '📉' : '➡️';
      output += `| ${insight.title} | **${insight.value}** | ${insight.confidence}% | ${trendIcon} | ${insight.context} |\n`;
    });
    
    // Actionable Recommendations
    output += `\n# 🎯 Actionable Recommendations\n\n`;
    response.recommendations.forEach((rec, index) => {
      const riskColor = rec.riskLevel === 'high' ? '🔴' : rec.riskLevel === 'medium' ? '🟡' : '🟢';
      output += `## ${index + 1}. ${rec.action}\n`;
      output += `- **Expected ROI:** ${rec.expectedROI.toFixed(1)}%\n`;
      output += `- **Confidence:** ${rec.confidence}%\n`;
      output += `- **Risk Level:** ${riskColor} ${rec.riskLevel.toUpperCase()}\n`;
      output += `- **Timeframe:** ${rec.timeframe}\n`;
      output += `- **Suggested Stake:** ${rec.stakeSuggestion}% of bankroll\n`;
      output += `- **Conditions:**\n`;
      rec.conditions.forEach(condition => {
        output += `  - ${condition}\n`;
      });
      output += `\n`;
    });
    
    // Risk Analysis
    output += `# ⚠️ Risk Analysis\n\n`;
    output += `**Max Drawdown:** ${response.riskAnalysis.maxDrawdown.toFixed(1)}%\n`;
    output += `**Volatility Score:** ${response.riskAnalysis.volatility.toFixed(1)}/10\n\n`;
    
    output += `## Risk Factors\n`;
    response.riskAnalysis.factors.forEach(factor => {
      output += `- ${factor}\n`;
    });
    
    output += `\n## Risk Mitigation\n`;
    response.riskAnalysis.mitigation.forEach(mitigation => {
      output += `- ${mitigation}\n`;
    });
    
    // Performance Context
    output += `\n# 📈 Performance Context\n\n`;
    output += `**Historical:** ${response.performanceContext.historicalComparison}\n\n`;
    output += `**Market:** ${response.performanceContext.marketContext}\n\n`;
    
    // Footer
    output += `---\n`;
    output += `*Analysis based on historical data. Past performance does not guarantee future results. Always practice responsible gambling.*`;
    
    return output;
  }
} 