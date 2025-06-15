/**
 * Fixed AI Orchestrator that handles database connection issues gracefully
 * This version uses the simple orchestrator when the enhanced version encounters Supabase errors
 * Now includes database connection status and intelligent data source selection
 */

export interface AIRequest {
  query: string;
  userId?: string;
  notebookId?: string;
  context?: Record<string, any>;
  provider?: 'openai' | 'anthropic' | 'local';
  streaming?: boolean;
}

export interface AIResponse {
  text: string;
  data?: any;
  error?: string;
  provider?: string;
  executionTime?: number;
  usage?: {
    tokens: number;
    cost?: number;
  };
}

/**
 * Robust AI Orchestrator that degrades gracefully
 */
export class FixedAIOrchestrator {
  private enhancedOrchestrator: any = null;
  private simpleOrchestrator: any = null;
  private useEnhanced: boolean = true;

  constructor() {
    this.initializeOrchestrators();
  }

  /**
   * Initialize orchestrators with fallback strategy
   */
  private async initializeOrchestrators(): Promise<void> {
    try {
      // Try to initialize enhanced orchestrator
      const { EnhancedAIOrchestrator } = await import('./orchestrator-enhanced');
      this.enhancedOrchestrator = new EnhancedAIOrchestrator();
      console.log('✅ Fixed AI Orchestrator - Enhanced version loaded');
    } catch (error) {
      console.warn('⚠️ Fixed AI Orchestrator - Enhanced version failed, using simple:', error.message);
      this.useEnhanced = false;
    }

    // Always initialize simple orchestrator as backup
    try {
      const { AIOrchestrator } = await import('./orchestrator-simple');
      this.simpleOrchestrator = new AIOrchestrator();
      console.log('✅ Fixed AI Orchestrator - Simple version ready as backup');
    } catch (error) {
      console.warn('⚠️ Fixed AI Orchestrator - Could not initialize simple orchestrator, using minimal fallback:', error.message);
      this.simpleOrchestrator = null;
    }
  }

  /**
   * Process request with automatic fallback
   */
  async processRequest(request: AIRequest): Promise<AIResponse | AsyncIterable<string>> {
    console.log('🔍 Fixed AI Orchestrator - Processing request:', request.query);
    
    // Check if this is a stats query that we can handle directly with our tools
    if (this.isStatsQuery(request.query)) {
      console.log('📊 Detected stats query, attempting direct stats handling...');
      try {
        const statsResponse = await this.handleStatsQuery(request);
        if (statsResponse) {
          return statsResponse;
        }
      } catch (error) {
        console.log('⚠️ Direct stats handling failed, continuing with normal flow:', error.message);
      }
    }
    
    // Try enhanced orchestrator first if available
    if (this.useEnhanced && this.enhancedOrchestrator) {
      try {
        console.log('🧠 Trying Enhanced AI Orchestrator...');
        
        // Check database status first
        const dbStatus = await this.checkDatabaseStatus();
        console.log(`📊 Database Status: ${dbStatus.connected ? 'Connected' : 'Disconnected'} (${dbStatus.matchCount} matches)`);
        
        // Intelligently analyze the query to build appropriate context
        const intelligentContext = this.buildIntelligentContext(request.query, request.context);
        
        const enhancedRequest = {
          ...request,
          context: {
            ...request.context,
            ...intelligentContext,
            database_status: dbStatus
          }
        };
        
        console.log('📊 Enhanced request context:', enhancedRequest.context);
        const response = await this.enhancedOrchestrator.processRequest(enhancedRequest);
        console.log('✅ Enhanced AI Orchestrator succeeded');
        return response;
      } catch (error) {
        console.warn('⚠️ Enhanced orchestrator failed, falling back to simple:', error.message);
        console.error('Full enhanced error:', error);
        
        // If it's a Supabase error, disable enhanced for this session
        if (error.message.includes('Supabase') || error.message.includes('406') || error.message.includes('Not Acceptable')) {
          this.useEnhanced = false;
          console.log('🔄 Disabled enhanced orchestrator due to database issues');
        }
      }
    }

    // Fall back to simple orchestrator if available
    if (this.simpleOrchestrator) {
      try {
        console.log('🔄 Trying Simple AI Orchestrator...');
        const response = await this.simpleOrchestrator.processRequest(request);
        console.log('✅ Simple AI Orchestrator succeeded');
        return response;
      } catch (error) {
        console.error('⚠️ Simple orchestrator also failed:', error.message);
        console.error('Full simple error:', error);
        
        // Check if it's an API key issue
        if (error.message.includes('API key') || error.message.includes('401') || error.message.includes('403')) {
          return this.createFallbackResponse(request, new Error('API key configuration needed'));
        }
        
        return this.createFallbackResponse(request, error as Error);
      }
    }

    // Ultimate fallback - try direct AI call before giving up
    console.log('🔄 Trying direct AI call as ultimate fallback...');
    try {
      const directResponse = await this.processDirectAI(request);
      console.log('✅ Direct AI call succeeded');
      return directResponse;
    } catch (error) {
      console.log('⚠️ Direct AI also failed, using static fallback');
      return this.createFallbackResponse(request, error as Error);
    }
  }

  /**
   * Create a basic fallback response
   */
  private createFallbackResponse(request: AIRequest, error: Error): AIResponse {
    const query = request.query.toLowerCase();
    
    // Check what's actually available
    const hasOpenAI = !!import.meta.env.VITE_OPENAI_API_KEY;
    const hasAnthropic = !!import.meta.env.VITE_ANTHROPIC_API_KEY;
    const hasLocal = !!import.meta.env.VITE_LOCAL_LLM_ENDPOINT;
    
    let fallbackText = "";
    
    // If no API keys are configured, that's likely the issue
    if (!hasOpenAI && !hasAnthropic && !hasLocal) {
      fallbackText = `🔑 **AI Configuration Needed**

I need an AI provider to give you intelligent responses. Currently no API keys are configured.

**To enable AI responses:**
1. **OpenAI (Recommended)**: Add \`VITE_OPENAI_API_KEY\` to your .env file
2. **Anthropic**: Add \`VITE_ANTHROPIC_API_KEY\` to your .env file  
3. **Local LLM**: Set \`VITE_LOCAL_LLM_ENDPOINT\` (e.g., http://localhost:1234/v1)

**In the meantime, I can provide:**`;
    } else {
      fallbackText = `⚠️ **AI System Issue**

The AI system encountered an error: ${error.message}

**What I can still help with:**`;
    }
    
    // Provide context-specific guidance
    if (query.includes('strategy') || query.includes('betting')) {
      fallbackText += `

**Betting Strategy Basics:**
• **Value Betting**: Look for bets where the odds are higher than the true probability suggests
• **Bankroll Management**: Never risk more than 1-5% of your total bankroll on a single bet
• **Record Keeping**: Track all your bets to analyze performance over time
• **Research**: Study team form, injuries, head-to-head records, and other relevant factors

**Key Metrics to Track:**
• ROI (Return on Investment)
• Win Rate
• Average Odds
• Longest Winning/Losing Streaks

The database connection is currently unavailable, which limits some advanced features, but these fundamentals will help guide your strategy development.`;

    } else if (query.includes('code') || query.includes('python')) {
      fallbackText += `

**Basic Code Structure for Betting Analysis:**

\`\`\`python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Load data
df = pd.read_csv('your_betting_data.csv')

# Calculate basic metrics
total_bets = len(df)
wins = len(df[df['result'] == 'win'])
win_rate = wins / total_bets
roi = (df['profit'].sum() / df['stake'].sum()) * 100

print(f"Win Rate: {win_rate:.2%}")
print(f"ROI: {roi:.2f}%")
\`\`\`

For more advanced code generation and analysis, the AI database connection needs to be restored.`;

    } else {
      fallbackText += `

**I can still help you with:**
• General betting concepts and strategy guidance  
• Basic statistical analysis approaches
• Code structure and methodology advice
• Risk management principles

**Current Technical Issue:**
The AI database connection is experiencing issues (Error: ${error.message}). This limits access to conversation history and advanced features, but I can still provide general guidance.

**To resolve:** Check your Supabase configuration or try again in a few moments.`;
    }

    return {
      text: fallbackText,
      error: error.message,
      provider: 'fallback',
      executionTime: 0,
      usage: { tokens: 0 }
    };
  }

  /**
   * Get system status
   */
  getSystemStatus(): Record<string, any> {
    const status = {
      enhanced_available: this.useEnhanced && !!this.enhancedOrchestrator,
      simple_available: !!this.simpleOrchestrator,
      current_mode: this.useEnhanced ? 'enhanced' : (this.simpleOrchestrator ? 'simple' : 'fallback'),
      providers: {
        openai: !!import.meta.env.VITE_OPENAI_API_KEY,
        anthropic: !!import.meta.env.VITE_ANTHROPIC_API_KEY,
        local: !!import.meta.env.VITE_LOCAL_LLM_ENDPOINT
      },
      fallback_always_available: true
    };

    console.log('🔍 Fixed AI Orchestrator Status:', status);
    return status;
  }

  /**
   * Re-enable enhanced orchestrator (for retry attempts)
   */
  enableEnhanced(): void {
    this.useEnhanced = true;
    console.log('🔄 Re-enabled enhanced orchestrator for retry');
  }

  /**
   * Check database connection status
   */
  private async checkDatabaseStatus(): Promise<{ connected: boolean; matchCount: number; error?: string }> {
    try {
      const { DatabaseSportsBettingService } = await import('../sportsBettingDatabase');
      const status = await DatabaseSportsBettingService.getConnectionStatus();
      return {
        connected: status.connected,
        matchCount: status.matchCount,
        error: status.error
      };
    } catch (error) {
      return {
        connected: false,
        matchCount: 0,
        error: error instanceof Error ? error.message : 'Database service unavailable'
      };
    }
  }

  /**
   * Check if query is asking for specific statistics
   */
  private isStatsQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('goals') || lowerQuery.includes('average') || lowerQuery.includes('goal') ||
           lowerQuery.includes('win rate') || lowerQuery.includes('roi') || lowerQuery.includes('over') ||
           lowerQuery.includes('under') || lowerQuery.includes('stats') || lowerQuery.includes('statistics') ||
           lowerQuery.includes('performance') || lowerQuery.includes('scored') || lowerQuery.includes('conceded');
  }

  /**
   * Handle stats queries directly using our tools
   */
  private async handleStatsQuery(request: AIRequest): Promise<AIResponse | null> {
    try {
      const { QueryStatssTool } = await import('./tools/queryStats');
      const queryStatsTool = new QueryStatssTool();
      
      // Extract parameters from the query
      const params = this.extractStatsParameters(request.query);
      
      console.log('📊 Stats query parameters:', params);
      
      // Call the tool
      const result = await queryStatsTool._call(params);
      
      return {
        text: result,
        provider: 'direct-stats-tool',
        executionTime: 0,
        usage: { tokens: 0 },
        data: { 
          tool_used: 'query_stats',
          parameters: params 
        }
      };
    } catch (error) {
      console.error('Stats query handling failed:', error);
      return null;
    }
  }

  /**
   * Extract parameters for stats queries
   */
  private extractStatsParameters(query: string): any {
    const lowerQuery = query.toLowerCase();
    
    // Extract team name
    const teams = [
      'Arsenal', 'Manchester United', 'Manchester City', 'Liverpool', 
      'Chelsea', 'Tottenham', 'Newcastle', 'Brighton',
      'West Ham', 'Aston Villa', 'Crystal Palace', 'Fulham',
      'Brentford', 'Wolves', 'Everton', 'Nottingham Forest',
      'Burnley', 'Sheffield United', 'Luton Town', 'Bournemouth'
    ];
    
    const foundTeam = teams.find(team => 
      lowerQuery.includes(team.toLowerCase()) ||
      (team.includes('Manchester') && lowerQuery.includes('man')) ||
      (team === 'Tottenham' && lowerQuery.includes('spurs'))
    );
    
    // Determine metric type
    let metric = 'general_stats';
    if (lowerQuery.includes('goals') || lowerQuery.includes('goal') || lowerQuery.includes('scored') || lowerQuery.includes('conceded')) {
      metric = 'goals_average';
    } else if (lowerQuery.includes('win rate') || lowerQuery.includes('wins')) {
      metric = 'win_rate';
    } else if (lowerQuery.includes('roi') || lowerQuery.includes('return')) {
      metric = 'roi';
    } else if (lowerQuery.includes('over') || lowerQuery.includes('under')) {
      metric = 'over_under';
    }
    
    // Determine venue
    let venue = 'all';
    if (lowerQuery.includes('home') && !lowerQuery.includes('away')) {
      venue = 'home';
    } else if (lowerQuery.includes('away') && !lowerQuery.includes('home')) {
      venue = 'away';
    }
    
    return {
      team: foundTeam,
      metric,
      venue,
      season: '2023-24', // This matches the static data season format
      timeframe: 'last_season'
    };
  }

  /**
   * Build intelligent context based on query analysis
   */
  private buildIntelligentContext(query: string, existingContext?: Record<string, any>): Record<string, any> {
    const lowerQuery = query.toLowerCase();
    const context: Record<string, any> = {
      domain: 'sports_betting',
      expected_analysis: 'real_data_analysis',
      use_betting_tools: true
    };

    // Detect sport
    if (lowerQuery.includes('football') || lowerQuery.includes('soccer') || 
        lowerQuery.includes('premier league') || lowerQuery.includes('epl') ||
        lowerQuery.includes('arsenal') || lowerQuery.includes('chelsea') || 
        lowerQuery.includes('manchester') || lowerQuery.includes('liverpool') ||
        lowerQuery.includes('tottenham') || lowerQuery.includes('goals')) {
      context.sport = 'football';
    } else if (lowerQuery.includes('basketball') || lowerQuery.includes('nba') || 
               lowerQuery.includes('lakers') || lowerQuery.includes('warriors')) {
      context.sport = 'basketball';
    } else if (lowerQuery.includes('tennis') || lowerQuery.includes('wimbledon') ||
               lowerQuery.includes('djokovic') || lowerQuery.includes('nadal')) {
      context.sport = 'tennis';
    } else if (lowerQuery.includes('baseball') || lowerQuery.includes('mlb')) {
      context.sport = 'baseball';
    }

    // Detect league (more specific)
    if (lowerQuery.includes('premier league') || lowerQuery.includes('epl')) {
      context.league = 'premier_league';
    } else if (lowerQuery.includes('champions league') || lowerQuery.includes('ucl')) {
      context.league = 'champions_league';
    } else if (lowerQuery.includes('nba')) {
      context.league = 'nba';
    } else if (lowerQuery.includes('mlb')) {
      context.league = 'mlb';
    }

    // Detect analysis type
    if (lowerQuery.includes('strategy') || lowerQuery.includes('betting strategy')) {
      context.analysis_type = 'strategy_analysis';
    } else if (lowerQuery.includes('team') || lowerQuery.includes('arsenal') || 
               lowerQuery.includes('performance') || lowerQuery.includes('home games')) {
      context.analysis_type = 'team_analysis';
    } else if (lowerQuery.includes('market') || lowerQuery.includes('odds') ||
               lowerQuery.includes('over') || lowerQuery.includes('under')) {
      context.analysis_type = 'market_analysis';
    } else if (lowerQuery.includes('pattern') || lowerQuery.includes('trend') ||
               lowerQuery.includes('discover') || lowerQuery.includes('find')) {
      context.analysis_type = 'pattern_discovery';
    } else if (lowerQuery.includes('code') || lowerQuery.includes('python') ||
               lowerQuery.includes('script') || lowerQuery.includes('generate')) {
      context.analysis_type = 'code_generation';
    }

    // Detect specific teams
    const teams = ['arsenal', 'chelsea', 'manchester united', 'manchester city', 'liverpool', 
                   'tottenham', 'brighton', 'newcastle', 'aston villa', 'west ham'];
    const detectedTeam = teams.find(team => lowerQuery.includes(team));
    if (detectedTeam) {
      context.target_team = detectedTeam;
    }

    // Detect time period
    if (lowerQuery.includes('this season') || lowerQuery.includes('current season')) {
      context.time_period = 'current_season';
    } else if (lowerQuery.includes('last season') || lowerQuery.includes('previous season')) {
      context.time_period = 'last_season';
    } else if (lowerQuery.includes('last year') || lowerQuery.includes('this year')) {
      context.time_period = 'year';
    } else if (lowerQuery.includes('recent') || lowerQuery.includes('lately')) {
      context.time_period = 'recent';
    }

    // Detect venue
    if (lowerQuery.includes('home') && !lowerQuery.includes('away')) {
      context.venue = 'home';
    } else if (lowerQuery.includes('away') && !lowerQuery.includes('home')) {
      context.venue = 'away';
    }

    // Detect bet types
    if (lowerQuery.includes('over') || lowerQuery.includes('goals')) {
      context.bet_types = ['over_under', 'goals'];
    } else if (lowerQuery.includes('win') || lowerQuery.includes('victory')) {
      context.bet_types = ['match_winner'];
    } else if (lowerQuery.includes('draw')) {
      context.bet_types = ['draw'];
    }

    // Set intelligent defaults if sport detected but no league
    if (context.sport === 'football' && !context.league) {
      context.league = 'premier_league'; // Default to EPL for football queries
    }

    console.log('🧠 Intelligent context built:', context);
    return context;
  }

  /**
   * Direct AI processing with betting database integration
   */
  private async processDirectAI(request: AIRequest): Promise<AIResponse> {
    console.log('🔗 Attempting direct AI call with intelligent betting data integration...');
    
    // Build intelligent context first
    const intelligentContext = this.buildIntelligentContext(request.query, request.context);
    console.log('🧠 Using intelligent context:', intelligentContext);
    
    // Check for OpenAI API key
    if (import.meta.env.VITE_OPENAI_API_KEY) {
      try {
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({
          apiKey: import.meta.env.VITE_OPENAI_API_KEY,
          dangerouslyAllowBrowser: true
        });

        // Try to get actual betting data based on intelligent context
        let contextData = '';
        
        if (intelligentContext.analysis_type === 'team_analysis' && intelligentContext.target_team) {
          try {
            console.log(`🔍 DEBUG: Detected team analysis for ${intelligentContext.target_team}`);
            console.log(`🔍 DEBUG: Context:`, intelligentContext);
            
            // First, let's check what teams are actually available in the database
            try {
              const { SportsBettingService } = await import('../sportsBetting');
              const availableTeams = SportsBettingService.getTopPerformingTeams('roi', {});
              console.log('🔍 DEBUG: Available teams in database:', availableTeams.map(t => t.team));
              
              // Check if our target team exists in a different format
              const targetTeam = intelligentContext.target_team.toLowerCase();
              const matchingTeam = availableTeams.find(t => 
                t.team.toLowerCase().includes(targetTeam) || 
                targetTeam.includes(t.team.toLowerCase())
              );
              
              if (matchingTeam) {
                console.log(`🔍 DEBUG: Found matching team: ${matchingTeam.team} for query: ${targetTeam}`);
                intelligentContext.target_team = matchingTeam.team; // Use the correct team name
              } else {
                console.log(`🔍 DEBUG: No matching team found for: ${targetTeam}`);
                console.log(`🔍 DEBUG: Available teams: ${availableTeams.slice(0, 5).map(t => t.team).join(', ')}`);
              }
            } catch (error) {
              console.log('🔍 DEBUG: Could not check available teams:', error.message);
            }
            
            // Import and use the betting assistant to get real data
            console.log('🔍 DEBUG: Attempting to import AIBettingAssistant...');
            const { AIBettingAssistant } = await import('../aiBettingAssistant');
            
            console.log('🔍 DEBUG: AIBettingAssistant imported:', !!AIBettingAssistant);
            
            // Build dynamic query based on context
            let dataQuery = `${intelligentContext.target_team} analysis`;
            if (intelligentContext.venue) {
              dataQuery += ` for ${intelligentContext.venue} games`;
            }
            if (intelligentContext.time_period) {
              dataQuery += ` for ${intelligentContext.time_period}`;
            }
            if (intelligentContext.sport && intelligentContext.league) {
              dataQuery += ` in ${intelligentContext.sport} ${intelligentContext.league}`;
            }
            
            console.log(`🏈 Attempting to get real ${intelligentContext.target_team} data from betting database...`);
            console.log(`📊 Query: ${dataQuery}`);
            
            const bettingData = await AIBettingAssistant.processQuery({
              query: dataQuery
            });
            
            console.log('🔍 DEBUG: Betting data response:', bettingData);
            
            // Check if we got real data or just empty/zero data
            const hasRealData = bettingData && bettingData.data && 
              bettingData.data.team_analysis && 
              bettingData.data.team_analysis.matches_played > 0;
            
            if (hasRealData) {
              contextData = `\n\nREAL BETTING DATA FOR ${intelligentContext.target_team.toUpperCase()}:\n${JSON.stringify(bettingData.data, null, 2)}`;
              console.log('✅ Retrieved real betting data for analysis');
            } else if (bettingData && bettingData.text && bettingData.text.trim() && !bettingData.text.includes('technical difficulties')) {
              // Check if the text shows zero data (no matches played)
              if (bettingData.text.includes('Matches Played: 0') || bettingData.text.includes('Overall Performance:**\n- Matches Played: 0')) {
                console.log('⚠️ Team exists but has no match data');
                
                // Try a team that definitely has data (Arsenal) as a fallback example
                try {
                  console.log('🔄 Trying Arsenal as example since Chelsea has no data...');
                  const arsenalData = await AIBettingAssistant.processQuery({
                    query: `Arsenal analysis for ${intelligentContext.venue || 'all'} games`
                  });
                  
                  if (arsenalData && arsenalData.data && arsenalData.data.team_analysis && arsenalData.data.team_analysis.matches_played > 0) {
                    contextData = `\n\nNOTE: ${intelligentContext.target_team.toUpperCase()} has no data in the database. Here's an example with ARSENAL data to show what analysis would look like:\n\n${JSON.stringify(arsenalData.data, null, 2)}`;
                    console.log('✅ Retrieved Arsenal data as example');
                  } else {
                    contextData = `\n\nNote: ${intelligentContext.target_team.toUpperCase()} exists in database but has no match records. Database may need more recent data.`;
                  }
                } catch (fallbackError) {
                  console.log('⚠️ Arsenal fallback also failed:', fallbackError.message);
                  contextData = `\n\nNote: ${intelligentContext.target_team.toUpperCase()} exists in database but has no match records.`;
                }
              } else {
                // Use the text response which contains the analysis
                contextData = `\n\nREAL BETTING ANALYSIS FOR ${intelligentContext.target_team.toUpperCase()}:\n${bettingData.text}`;
                console.log('✅ Retrieved betting analysis response');
              }
            } else {
              console.log('⚠️ No useful data found in betting response');
              contextData = `\n\nNote: No specific betting data found for ${intelligentContext.target_team} ${intelligentContext.venue || ''} games.`;
            }
          } catch (error) {
            console.log('⚠️ Could not retrieve betting data:', error);
            console.log('⚠️ Error details:', error.message, error.stack);
            contextData = `\n\nNote: Real betting database data for ${intelligentContext.target_team} temporarily unavailable (${error.message}).`;
          }
        } else if (intelligentContext.analysis_type === 'strategy_analysis') {
          contextData = `\n\nSTRATEGY ANALYSIS CONTEXT:\n- Sport: ${intelligentContext.sport || 'general'}\n- League: ${intelligentContext.league || 'general'}\n- Focus: Strategic betting approach`;
        } else if (intelligentContext.analysis_type === 'market_analysis') {
          contextData = `\n\nMARKET ANALYSIS CONTEXT:\n- Sport: ${intelligentContext.sport || 'general'}\n- League: ${intelligentContext.league || 'general'}\n- Bet types: ${intelligentContext.bet_types?.join(', ') || 'general market analysis'}`;
        }

        // Build dynamic system prompt based on intelligent context
        let systemPrompt = `You are an expert sports betting analyst with access to real ${intelligentContext.sport || 'sports'} betting data`;
        
        if (intelligentContext.league) {
          systemPrompt += ` from ${intelligentContext.league.replace('_', ' ').toUpperCase()}`;
        }
        
        systemPrompt += `. 

IMPORTANT INSTRUCTIONS:
- Analysis Type: ${intelligentContext.analysis_type || 'general_analysis'}`;
        
        if (intelligentContext.target_team) {
          systemPrompt += `
- Focus Team: ${intelligentContext.target_team.toUpperCase()}`;
        }
        
        if (intelligentContext.venue) {
          systemPrompt += `
- Venue Focus: ${intelligentContext.venue.toUpperCase()} games specifically`;
        }
        
        if (intelligentContext.time_period) {
          systemPrompt += `
- Time Period: ${intelligentContext.time_period.replace('_', ' ')}`;
        }
        
        systemPrompt += `
- Use any provided real data to give concrete statistics and insights
- Generate specific recommendations based on actual performance data
- Include ROI analysis, win rates, and betting profitability metrics when possible
- Always promote responsible gambling practices
- Be specific and data-driven rather than giving generic advice

CRITICAL INSTRUCTIONS FOR DATA HANDLING:

1. If you see "NOTE: [TEAM] has no data in the database. Here's an example with ARSENAL data..." - this means:
   - The requested team exists but has no match records
   - Arsenal data is provided as an example of what the analysis would look like
   - You should explain this clearly and use the Arsenal data to demonstrate the analysis format
   - Mention that the same type of analysis would be available for the requested team once data is added

2. If the provided data shows all zeros (0 matches played, 0% ROI, etc.):
   - Acknowledge that the team exists in the database but has no match data
   - Explain that this likely means the database needs more recent data
   - Do NOT give a generic framework - be specific about the data limitation

3. If real data with actual numbers is provided, analyze it thoroughly with specific insights.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: request.query + contextData
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        });

        const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
        
        return {
          text: response,
          provider: 'openai-direct-with-data',
          executionTime: 0,
          usage: {
            tokens: completion.usage?.total_tokens || 0
          }
        };
      } catch (error) {
        console.log('Direct OpenAI with data failed:', error.message);
        throw error;
      }
    }

    // Check for Anthropic API key
    if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            temperature: 0.7,
            system: 'You are a helpful AI assistant for sports betting analysis. Be concise and promote responsible gambling.',
            messages: [
              {
                role: 'user',
                content: request.query
              }
            ]
          })
        });

        if (!response.ok) {
          throw new Error(`Anthropic API Error: ${response.status}`);
        }

        const data = await response.json();
        
        return {
          text: data.content?.[0]?.text || 'I apologize, but I could not generate a response.',
          provider: 'anthropic-direct',
          executionTime: 0,
          usage: {
            tokens: data.usage?.input_tokens + data.usage?.output_tokens || 0
          }
        };
      } catch (error) {
        console.log('Direct Anthropic failed:', error.message);
        throw error;
      }
    }

    throw new Error('No API keys configured for direct AI access');
  }

  /**
   * Clear session if possible
   */
  async clearSession(userId: string, notebookId?: string): Promise<void> {
    try {
      if (this.useEnhanced && this.enhancedOrchestrator) {
        await this.enhancedOrchestrator.clearSession(userId, notebookId);
      } else if (this.simpleOrchestrator) {
        await this.simpleOrchestrator.clearSession(userId, notebookId);
      }
    } catch (error) {
      console.warn('Failed to clear session:', error.message);
    }
  }
} 