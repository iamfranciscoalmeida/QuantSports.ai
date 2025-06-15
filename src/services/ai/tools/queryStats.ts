import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { DatabaseSportsBettingService } from '../../sportsBettingDatabase';
import { SportsBettingService } from '../../sportsBetting';

const QueryStatsSchema = z.object({
  team: z.string().optional().describe('Team name to analyze'),
  metric: z.enum([
    'goals_average', 'goals_home', 'goals_away', 
    'win_rate', 'home_win_rate', 'away_win_rate',
    'roi', 'roi_home', 'roi_away',
    'over_under', 'clean_sheets', 'form',
    'general_stats', 'performance'
  ]).describe('Type of statistic to calculate'),
  venue: z.enum(['home', 'away', 'all']).optional().describe('Venue filter'),
  season: z.string().optional().describe('Season filter (e.g., 2023-24)'),
  timeframe: z.string().optional().describe('Time period (e.g., last_season, current_season)')
});

export class QueryStatssTool extends StructuredTool {
  name = 'query_stats';
  description = 'Query any sports betting statistic for teams - goals, win rates, ROI, over/under rates, etc.';
  schema = QueryStatsSchema;

  async _call(input: z.infer<typeof QueryStatsSchema>): Promise<string> {
    try {
      const { team, metric, venue, season } = input;

      // If no team specified, return aggregate stats
      if (!team) {
        return this.getAggregateStats(metric, { season, venue });
      }

      // Debug: Check what's actually in the database
      console.log(`🔍 Debugging database content for ${team}...`);
      const dbStatus = await DatabaseSportsBettingService.getConnectionStatus();
      console.log(`📊 Database status:`, dbStatus);
      
      // If it's Chelsea, let's see what seasons are available for them
      if (team.toLowerCase() === 'chelsea') {
        console.log(`🔍 Checking what Chelsea data is available in database...`);
      }

      // Get team-specific stats
      console.log(`🔍 Getting team data for: "${team}" with season: "${season}"`);
      const teamData = await this.getTeamData(team, { season });
      
      console.log(`📊 Team data result: ${teamData?.matches_played || 0} matches found`);
      
      if (!teamData || teamData.matches_played === 0) {
        // Check if team exists in static data by trying without season filter
        console.log(`🔍 Trying ${team} without season filter...`);
        const fallbackData = await this.getTeamData(team, { season: undefined });
        
        if (!fallbackData || fallbackData.matches_played === 0) {
          return `❌ **No Data Available**

I couldn't find any match data for **${team}** in our database or static data files.

**Available teams to try:** Arsenal, Manchester City, Liverpool, Manchester United, Tottenham, Brighton, West Ham

**Suggestion:** Check the spelling or try one of the teams listed above.`;
        } else {
          return `⚠️ **No Recent Season Data**

I found **${fallbackData.matches_played}** historical matches for **${team}**, but no data for the ${season || 'current'} season.

**Available historical data:**
${this.formatTeamStats(fallbackData, metric, venue, team)}

*Note: This is from our historical dataset. For current season data, the database needs to be updated.*`;
        }
      }

      return this.formatTeamStats(teamData, metric, venue, team);

    } catch (error) {
      console.error('QueryStats tool error:', error);
      return `❌ **Error Getting Statistics**

I encountered an error while fetching the requested statistics: ${error instanceof Error ? error.message : 'Unknown error'}

Please try rephrasing your question or specify a different team name.`;
    }
  }

  private async getTeamData(team: string, filters: any) {
    try {
      // Try database first since it's populated
      console.log(`🔍 Querying database for ${team} with filters:`, filters);
      const dbResult = await DatabaseSportsBettingService.getTeamROI(team, filters);
      
      // Check if database returned meaningful data
      if (dbResult && dbResult.matches_played > 0) {
        console.log(`✅ Found ${dbResult.matches_played} matches for ${team} in database`);
        return dbResult;
      } else {
        console.log(`⚠️ Database returned 0 matches for ${team}, trying without season filter`);
        // Try without season filter
        const dbResultNoSeason = await DatabaseSportsBettingService.getTeamROI(team, {});
        
        if (dbResultNoSeason && dbResultNoSeason.matches_played > 0) {
          console.log(`✅ Found ${dbResultNoSeason.matches_played} matches for ${team} without season filter`);
          return dbResultNoSeason;
        } else {
          console.log(`⚠️ Database still returned 0 matches, falling back to static data`);
          // Fallback to static data
          return SportsBettingService.getTeamROI(team, filters);
        }
      }
    } catch (error) {
      console.warn('Database query failed, trying static data:', error);
      // Fallback to static data
      return SportsBettingService.getTeamROI(team, filters);
    }
  }

  private formatTeamStats(data: any, metric: string, venue?: string, teamName?: string): string {
    const team = teamName || data.team;
    
    switch (metric) {
      case 'goals_average':
      case 'goals_home':
      case 'goals_away':
        return this.formatGoalStats(data, venue, team);
        
      case 'win_rate':
      case 'home_win_rate':
      case 'away_win_rate':
        return this.formatWinRateStats(data, venue, team);
        
      case 'roi':
      case 'roi_home':
      case 'roi_away':
        return this.formatROIStats(data, venue, team);
        
      case 'over_under':
        return this.formatOverUnderStats(data, team);
        
      case 'general_stats':
      case 'performance':
      default:
        return this.formatGeneralStats(data, team);
    }
  }

  private formatGoalStats(data: any, venue?: string, team?: string): string {
    const homeGoalsPerGame = data.home_record.goals_for / (data.home_record.wins + data.home_record.draws + data.home_record.losses);
    const awayGoalsPerGame = data.away_record.goals_for / (data.away_record.wins + data.away_record.draws + data.away_record.losses);
    const overallGoalsPerGame = (data.home_record.goals_for + data.away_record.goals_for) / data.matches_played;

    const homeGoalsAgainstPerGame = data.home_record.goals_against / (data.home_record.wins + data.home_record.draws + data.home_record.losses);
    const awayGoalsAgainstPerGame = data.away_record.goals_against / (data.away_record.wins + data.away_record.draws + data.away_record.losses);

    if (venue === 'home') {
      return `⚽ **${team} - Home Goals Analysis**

**Goals Scored at Home:**
- Average: **${homeGoalsPerGame.toFixed(2)} goals per game**
- Total: ${data.home_record.goals_for} goals in ${data.home_record.wins + data.home_record.draws + data.home_record.losses} home matches

**Goals Conceded at Home:**
- Average: **${homeGoalsAgainstPerGame.toFixed(2)} goals per game**
- Total: ${data.home_record.goals_against} goals conceded

**Home Goal Difference:** ${(homeGoalsPerGame - homeGoalsAgainstPerGame).toFixed(2)} per game`;
    }

    if (venue === 'away') {
      return `⚽ **${team} - Away Goals Analysis**

**Goals Scored Away:**
- Average: **${awayGoalsPerGame.toFixed(2)} goals per game**
- Total: ${data.away_record.goals_for} goals in ${data.away_record.wins + data.away_record.draws + data.away_record.losses} away matches

**Goals Conceded Away:**
- Average: **${awayGoalsAgainstPerGame.toFixed(2)} goals per game**
- Total: ${data.away_record.goals_against} goals conceded

**Away Goal Difference:** ${(awayGoalsPerGame - awayGoalsAgainstPerGame).toFixed(2)} per game`;
    }

    return `⚽ **${team} - Complete Goals Analysis**

**Overall Averages:**
- **Total goals per game:** ${overallGoalsPerGame.toFixed(2)}
- **Goals scored per game:** ${((data.home_record.goals_for + data.away_record.goals_for) / data.matches_played).toFixed(2)}
- **Goals conceded per game:** ${((data.home_record.goals_against + data.away_record.goals_against) / data.matches_played).toFixed(2)}

**Home Performance:**
- **Goals scored:** ${homeGoalsPerGame.toFixed(2)} per game (${data.home_record.goals_for} total)
- **Goals conceded:** ${homeGoalsAgainstPerGame.toFixed(2)} per game

**Away Performance:**
- **Goals scored:** ${awayGoalsPerGame.toFixed(2)} per game (${data.away_record.goals_for} total)
- **Goals conceded:** ${awayGoalsAgainstPerGame.toFixed(2)} per game

**Key Insight:** ${homeGoalsPerGame > awayGoalsPerGame ? 
  `${team} scores ${(homeGoalsPerGame - awayGoalsPerGame).toFixed(2)} more goals per game at home` :
  `${team} scores ${(awayGoalsPerGame - homeGoalsPerGame).toFixed(2)} more goals per game away`}

**Over/Under 2.5 Goals:** ${data.betting_stats.over_2_5_rate.toFixed(1)}% of matches`;
  }

  private formatWinRateStats(data: any, venue?: string, team?: string): string {
    const homeWinRate = (data.home_record.wins / (data.home_record.wins + data.home_record.draws + data.home_record.losses)) * 100;
    const awayWinRate = (data.away_record.wins / (data.away_record.wins + data.away_record.draws + data.away_record.losses)) * 100;
    const overallWinRate = ((data.home_record.wins + data.away_record.wins) / data.matches_played) * 100;

    return `📊 **${team} - Win Rate Analysis**

**Overall Win Rate:** ${overallWinRate.toFixed(1)}%

**Home Win Rate:** ${homeWinRate.toFixed(1)}%
- Record: ${data.home_record.wins}W-${data.home_record.draws}D-${data.home_record.losses}L

**Away Win Rate:** ${awayWinRate.toFixed(1)}%
- Record: ${data.away_record.wins}W-${data.away_record.draws}D-${data.away_record.losses}L

**Home Advantage:** ${homeWinRate > awayWinRate ? 
  `Strong (+${(homeWinRate - awayWinRate).toFixed(1)}% better at home)` :
  `Weak (${(awayWinRate - homeWinRate).toFixed(1)}% better away)`}`;
  }

  private formatROIStats(data: any, venue?: string, team?: string): string {
    return `💰 **${team} - Betting ROI Analysis**

**Home ROI:** ${data.betting_stats.roi_home.toFixed(2)}%
**Away ROI:** ${data.betting_stats.roi_away.toFixed(2)}%

**Betting Performance:**
${data.betting_stats.roi_home > 0 ? '✅' : '❌'} Home betting: ${data.betting_stats.roi_home > 0 ? 'Profitable' : 'Losing'}
${data.betting_stats.roi_away > 0 ? '✅' : '❌'} Away betting: ${data.betting_stats.roi_away > 0 ? 'Profitable' : 'Losing'}

**Best Betting Opportunity:** ${Math.abs(data.betting_stats.roi_home) > Math.abs(data.betting_stats.roi_away) ? 
  `Home games (${data.betting_stats.roi_home.toFixed(2)}% ROI)` :
  `Away games (${data.betting_stats.roi_away.toFixed(2)}% ROI)`}`;
  }

  private formatOverUnderStats(data: any, team?: string): string {
    return `🎯 **${team} - Over/Under Analysis**

**Over 2.5 Goals:** ${data.betting_stats.over_2_5_rate.toFixed(1)}%
**Under 2.5 Goals:** ${data.betting_stats.under_2_5_rate.toFixed(1)}%

**Betting Tendency:** ${data.betting_stats.over_2_5_rate > 50 ? 
  `High-scoring (${data.betting_stats.over_2_5_rate.toFixed(1)}% over 2.5)` :
  `Low-scoring (${data.betting_stats.under_2_5_rate.toFixed(1)}% under 2.5)`}

**Total Matches Analyzed:** ${data.matches_played}`;
  }

  private formatGeneralStats(data: any, team?: string): string {
    const homeGoalsPerGame = data.home_record.goals_for / (data.home_record.wins + data.home_record.draws + data.home_record.losses);
    const awayGoalsPerGame = data.away_record.goals_for / (data.away_record.wins + data.away_record.draws + data.away_record.losses);
    const homeWinRate = (data.home_record.wins / (data.home_record.wins + data.home_record.draws + data.home_record.losses)) * 100;
    const awayWinRate = (data.away_record.wins / (data.away_record.wins + data.away_record.draws + data.away_record.losses)) * 100;

    return `📈 **${team} - Complete Performance Summary**

**Match Record:**
- Total Matches: ${data.matches_played}
- Home: ${data.home_record.wins}W-${data.home_record.draws}D-${data.home_record.losses}L (${homeWinRate.toFixed(1)}%)
- Away: ${data.away_record.wins}W-${data.away_record.draws}D-${data.away_record.losses}L (${awayWinRate.toFixed(1)}%)

**Goal Scoring:**
- Home: ${homeGoalsPerGame.toFixed(2)} goals per game
- Away: ${awayGoalsPerGame.toFixed(2)} goals per game

**Betting Markets:**
- Over 2.5 Goals: ${data.betting_stats.over_2_5_rate.toFixed(1)}%
- Home ROI: ${data.betting_stats.roi_home.toFixed(2)}%
- Away ROI: ${data.betting_stats.roi_away.toFixed(2)}%`;
  }

  private getAggregateStats(metric: string, filters: any): string {
    const stats = SportsBettingService.aggregateStats(filters);
    
    return `📊 **Premier League ${metric.replace('_', ' ').toUpperCase()} Statistics**

**Overall Season Stats:**
- Total Matches: ${stats.total_matches}
- Average Goals per Game: ${stats.avg_goals.toFixed(2)}
- Home Win Rate: ${((stats.home_wins / stats.total_matches) * 100).toFixed(1)}%
- Over 2.5 Goals: ${stats.over_2_5_rate.toFixed(1)}%

**League Trends:**
${stats.home_wins > stats.away_wins ? '🏠 Home advantage evident' : '✈️ Away teams performing well'}
${stats.over_2_5_rate > 50 ? '⚽ High-scoring league' : '🛡️ Defensively strong league'}`;
  }
} 