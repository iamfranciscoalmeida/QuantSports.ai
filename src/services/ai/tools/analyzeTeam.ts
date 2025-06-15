import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { SportsBettingService } from '../../sportsBetting';

const AnalyzeTeamSchema = z.object({
  team_name: z.string().describe('Name of the team to analyze'),
  filters: z.object({
    season: z.string().optional().describe('Specific season to analyze'),
    venue: z.enum(['home', 'away', 'all']).optional().describe('Home/away/all matches'),
    opponent_type: z.enum(['top6', 'bottom6', 'mid_table', 'all']).optional().describe('Type of opponents'),
    date_from: z.string().optional().describe('Start date for analysis (YYYY-MM-DD)'),
    date_to: z.string().optional().describe('End date for analysis (YYYY-MM-DD)'),
    recent_matches: z.number().optional().describe('Number of recent matches to focus on')
  }).optional().describe('Filters to apply to the analysis'),
  analysis_type: z.enum(['performance', 'betting', 'form', 'comprehensive']).default('comprehensive').describe('Type of analysis to perform')
});

export class AnalyzeTeamTool extends StructuredTool {
  name = 'analyze_team';
  description = 'Perform comprehensive team analysis including performance metrics, betting statistics, and recent form';
  schema = AnalyzeTeamSchema;

  async _call(input: z.infer<typeof AnalyzeTeamSchema>): Promise<string> {
    const teamName = input.team_name;
    
    // Mock comprehensive team analysis
    return `## ${teamName} - Comprehensive Analysis

### Performance Overview
- **Total Matches:** 25
- **Home Win Rate:** 65.0%
- **Away Win Rate:** 40.0%
- **Overall Goal Difference:** +12

### Betting Performance
- **ROI as Favorite:** 8.5%
- **ROI as Underdog:** 15.2%
- **Home ROI:** 12.3%
- **Away ROI:** 5.8%

### Market Tendencies
- **Over 2.5 Goals:** 68.0%
- **Both Teams Score:** 72.0%
- **Clean Sheets:** 32.0%

### Current Form
WWLWD (Good)

### Key Strengths & Weaknesses
**Strengths:** Strong home fortress, Attacking threat
**Areas for Improvement:** Away record consistency

### Betting Strategy Recommendations
📈 **Back current form** - Team showing positive momentum
🏠 **Home specialist** - Strong value in home matches
⚽ **Goals markets** - Focus on over totals and BTTS`;
  }

  private normalizeTeamName(teamName: string): string {
    // Common team name variations
    const teamMappings: Record<string, string> = {
      'man utd': 'Manchester United',
      'man united': 'Manchester United',
      'man city': 'Manchester City',
      'manchester city': 'Manchester City',
      'tottenham': 'Tottenham Hotspur',
      'spurs': 'Tottenham Hotspur',
      'leicester': 'Leicester City',
      'newcastle': 'Newcastle United',
      'west ham': 'West Ham United',
      'brighton': 'Brighton & Hove Albion',
      'nottingham forest': 'Nottingham Forest',
      'nott\'m forest': 'Nottingham Forest',
      'sheffield utd': 'Sheffield United',
      'wolves': 'Wolverhampton Wanderers'
    };

    const normalized = teamName.toLowerCase();
    return teamMappings[normalized] || teamName;
  }

  private generatePerformanceAnalysis(teamData: any, teamName: string): string {
    const homeWinRate = teamData.home_record.wins / (teamData.home_record.wins + teamData.home_record.draws + teamData.home_record.losses) * 100;
    const awayWinRate = teamData.away_record.wins / (teamData.away_record.wins + teamData.away_record.draws + teamData.away_record.losses) * 100;
    
    const homeGoalsPerGame = teamData.home_record.goals_for / (teamData.home_record.wins + teamData.home_record.draws + teamData.home_record.losses);
    const awayGoalsPerGame = teamData.away_record.goals_for / (teamData.away_record.wins + teamData.away_record.draws + teamData.away_record.losses);

    return `## ${teamName} - Performance Analysis

### Overall Statistics
- **Total Matches Played:** ${teamData.matches_played}

### Home Performance
- **Record:** ${teamData.home_record.wins}W-${teamData.home_record.draws}D-${teamData.home_record.losses}L
- **Win Rate:** ${homeWinRate.toFixed(1)}%
- **Goals Scored:** ${teamData.home_record.goals_for} (${homeGoalsPerGame.toFixed(1)} per game)
- **Goals Conceded:** ${teamData.home_record.goals_against}
- **Goal Difference:** ${teamData.home_record.goals_for - teamData.home_record.goals_against}

### Away Performance
- **Record:** ${teamData.away_record.wins}W-${teamData.away_record.draws}D-${teamData.away_record.losses}L
- **Win Rate:** ${awayWinRate.toFixed(1)}%
- **Goals Scored:** ${teamData.away_record.goals_for} (${awayGoalsPerGame.toFixed(1)} per game)
- **Goals Conceded:** ${teamData.away_record.goals_against}
- **Goal Difference:** ${teamData.away_record.goals_for - teamData.away_record.goals_against}

### Key Insights
${this.generatePerformanceInsights(teamData, homeWinRate, awayWinRate)}`;
  }

  private generateBettingAnalysis(teamData: any, teamName: string): string {
    return `## ${teamName} - Betting Analysis

### Betting ROI Statistics
- **ROI as Favorite:** ${teamData.betting_stats.roi_as_favorite.toFixed(2)}%
- **ROI as Underdog:** ${teamData.betting_stats.roi_as_underdog.toFixed(2)}%
- **ROI at Home:** ${teamData.betting_stats.roi_home.toFixed(2)}%
- **ROI Away:** ${teamData.betting_stats.roi_away.toFixed(2)}%

### Market Performance
- **Over 2.5 Goals:** ${teamData.betting_stats.over_2_5_percentage.toFixed(1)}% of matches
- **Both Teams Score:** ${teamData.betting_stats.both_teams_score_percentage.toFixed(1)}% of matches
- **Clean Sheets:** ${teamData.betting_stats.clean_sheets} (${(teamData.betting_stats.clean_sheets / teamData.matches_played * 100).toFixed(1)}%)

### Betting Recommendations
${this.generateBettingRecommendations(teamData)}`;
  }

  private generateFormAnalysis(teamData: any, teamName: string, filters: any): string {
    // Simulate recent form analysis (in a real implementation, you'd analyze recent matches)
    const recentForm = this.calculateRecentForm(teamData);
    
    return `## ${teamName} - Current Form Analysis

### Recent Form (Last 6 Matches)
${recentForm.form_string} 

### Form Metrics
- **Points Per Game (Recent):** ${recentForm.points_per_game.toFixed(2)}
- **Goals For Per Game:** ${recentForm.goals_for_per_game.toFixed(1)}
- **Goals Against Per Game:** ${recentForm.goals_against_per_game.toFixed(1)}
- **Form Trend:** ${recentForm.trend}

### Upcoming Match Predictions
${this.generateFormPredictions(recentForm, teamName)}`;
  }

  private generateComprehensiveAnalysis(teamData: any, teamName: string, filters: any): string {
    const homeWinRate = teamData.home_record.wins / (teamData.home_record.wins + teamData.home_record.draws + teamData.home_record.losses) * 100;
    const awayWinRate = teamData.away_record.wins / (teamData.away_record.wins + teamData.away_record.draws + teamData.away_record.losses) * 100;
    const recentForm = this.calculateRecentForm(teamData);

    return `## ${teamName} - Comprehensive Analysis

### Performance Overview
- **Total Matches:** ${teamData.matches_played}
- **Home Win Rate:** ${homeWinRate.toFixed(1)}%
- **Away Win Rate:** ${awayWinRate.toFixed(1)}%
- **Overall Goal Difference:** ${(teamData.home_record.goals_for + teamData.away_record.goals_for) - (teamData.home_record.goals_against + teamData.away_record.goals_against)}

### Betting Performance
- **ROI as Favorite:** ${teamData.betting_stats.roi_as_favorite.toFixed(2)}%
- **ROI as Underdog:** ${teamData.betting_stats.roi_as_underdog.toFixed(2)}%
- **Home ROI:** ${teamData.betting_stats.roi_home.toFixed(2)}%
- **Away ROI:** ${teamData.betting_stats.roi_away.toFixed(2)}%

### Market Tendencies
- **Over 2.5 Goals:** ${teamData.betting_stats.over_2_5_percentage.toFixed(1)}%
- **Both Teams Score:** ${teamData.betting_stats.both_teams_score_percentage.toFixed(1)}%
- **Clean Sheets:** ${(teamData.betting_stats.clean_sheets / teamData.matches_played * 100).toFixed(1)}%

### Current Form
${recentForm.form_string} (${recentForm.trend})

### Key Strengths & Weaknesses
${this.generateStrengthsWeaknesses(teamData, homeWinRate, awayWinRate)}

### Betting Strategy Recommendations
${this.generateComprehensiveRecommendations(teamData, recentForm)}`;
  }

  private generatePerformanceInsights(teamData: any, homeWinRate: number, awayWinRate: number): string {
    const insights = [];

    if (homeWinRate - awayWinRate > 20) {
      insights.push('🏠 Strong home advantage - significantly better performance at home');
    } else if (awayWinRate - homeWinRate > 15) {
      insights.push('🛣️ Better away team - unusual strength on the road');
    }

    const homeGoalDiff = teamData.home_record.goals_for - teamData.home_record.goals_against;
    const awayGoalDiff = teamData.away_record.goals_for - teamData.away_record.goals_against;

    if (homeGoalDiff > 10) {
      insights.push('⚽ Solid home attacking record with good defensive stability');
    }

    if (awayGoalDiff < -5) {
      insights.push('🛡️ Struggles away from home, particularly defensively');
    }

    return insights.length > 0 ? insights.join('\n- ') : 'Balanced performance across all metrics';
  }

  private generateBettingRecommendations(teamData: any): string {
    const recommendations = [];

    if (teamData.betting_stats.roi_as_favorite > 5) {
      recommendations.push('✅ **Back when favorite** - Strong ROI when odds-on');
    }

    if (teamData.betting_stats.roi_as_underdog > 10) {
      recommendations.push('✅ **Value as underdog** - Excellent returns when underestimated');
    }

    if (teamData.betting_stats.over_2_5_percentage > 65) {
      recommendations.push('⚽ **Over 2.5 Goals** - High-scoring matches likely');
    }

    if (teamData.betting_stats.both_teams_score_percentage > 70) {
      recommendations.push('🎯 **Both Teams to Score** - Strong trend for both teams scoring');
    }

    if (teamData.betting_stats.clean_sheets / teamData.matches_played > 0.4) {
      recommendations.push('🛡️ **Clean Sheet bets** - Solid defensive record');
    }

    return recommendations.length > 0 ? recommendations.join('\n') : 'No clear betting advantages identified';
  }

  private calculateRecentForm(teamData: any): any {
    // Simulate recent form calculation (in real implementation, analyze last 6 matches)
    const totalMatches = teamData.matches_played;
    const recentMatches = Math.min(6, totalMatches);
    
    // Simulate form based on overall performance
    const homeWins = teamData.home_record.wins;
    const awayWins = teamData.away_record.wins;
    const totalWins = homeWins + awayWins;
    
    const winRate = totalWins / totalMatches;
    
    let form_string = '';
    let points = 0;
    
    // Generate simulated recent form
    for (let i = 0; i < recentMatches; i++) {
      const random = Math.random();
      if (random < winRate) {
        form_string += 'W';
        points += 3;
      } else if (random < winRate + 0.25) {
        form_string += 'D';
        points += 1;
      } else {
        form_string += 'L';
      }
    }

    const points_per_game = points / recentMatches;
    let trend = 'Stable';
    
    if (points_per_game > 2) trend = 'Excellent';
    else if (points_per_game > 1.5) trend = 'Good';
    else if (points_per_game > 1) trend = 'Average';
    else trend = 'Poor';

    return {
      form_string,
      points_per_game,
      goals_for_per_game: (teamData.home_record.goals_for + teamData.away_record.goals_for) / totalMatches,
      goals_against_per_game: (teamData.home_record.goals_against + teamData.away_record.goals_against) / totalMatches,
      trend
    };
  }

  private generateFormPredictions(recentForm: any, teamName: string): string {
    if (recentForm.trend === 'Excellent') {
      return `🔥 ${teamName} is in exceptional form. Consider backing them in upcoming matches, especially at home.`;
    } else if (recentForm.trend === 'Good') {
      return `📈 ${teamName} showing positive momentum. Good value for win/draw bets.`;
    } else if (recentForm.trend === 'Poor') {
      return `📉 ${teamName} struggling recently. Consider opposition bets or under goals markets.`;
    } else {
      return `⚖️ ${teamName} showing consistent but unremarkable form. Look for value in specific markets.`;
    }
  }

  private generateStrengthsWeaknesses(teamData: any, homeWinRate: number, awayWinRate: number): string {
    const strengths = [];
    const weaknesses = [];

    // Analyze strengths
    if (homeWinRate > 60) strengths.push('Strong home fortress');
    if (awayWinRate > 45) strengths.push('Good away form');
    if (teamData.betting_stats.over_2_5_percentage > 60) strengths.push('Attacking threat');
    if (teamData.betting_stats.clean_sheets / teamData.matches_played > 0.35) strengths.push('Defensive stability');

    // Analyze weaknesses
    if (homeWinRate < 40) weaknesses.push('Home ground struggles');
    if (awayWinRate < 30) weaknesses.push('Poor away record');
    if (teamData.betting_stats.over_2_5_percentage < 40) weaknesses.push('Low-scoring matches');
    if (teamData.betting_stats.clean_sheets / teamData.matches_played < 0.25) weaknesses.push('Defensive vulnerabilities');

    let result = '';
    if (strengths.length > 0) {
      result += `**Strengths:** ${strengths.join(', ')}\n`;
    }
    if (weaknesses.length > 0) {
      result += `**Areas for Improvement:** ${weaknesses.join(', ')}`;
    }

    return result || 'Balanced team with no clear standout strengths or weaknesses';
  }

  private generateComprehensiveRecommendations(teamData: any, recentForm: any): string {
    const recommendations = [];

    // Based on form
    if (recentForm.trend === 'Excellent') {
      recommendations.push('📈 **Back current form** - Team is peaking, consider win bets');
    } else if (recentForm.trend === 'Poor') {
      recommendations.push('📉 **Fade poor form** - Consider opposition or defensive markets');
    }

    // Based on venue
    const homeAdvantage = teamData.betting_stats.roi_home - teamData.betting_stats.roi_away;
    if (homeAdvantage > 10) {
      recommendations.push('🏠 **Home specialist** - Strong value in home matches');
    }

    // Based on market tendencies
    if (teamData.betting_stats.over_2_5_percentage > 65) {
      recommendations.push('⚽ **Goals markets** - Focus on over totals and BTTS');
    }

    // Based on underdog/favorite performance
    if (teamData.betting_stats.roi_as_underdog > teamData.betting_stats.roi_as_favorite) {
      recommendations.push('💎 **Underdog value** - Best returns when underestimated');
    }

    return recommendations.length > 0 ? recommendations.join('\n') : 'Monitor for specific match contexts and value opportunities';
  }
} 