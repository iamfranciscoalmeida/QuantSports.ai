import { AIBettingAssistant } from '../aiBettingAssistant';
import { AICodeGenerator } from '../aiCodeGenerator';
import { SportsBettingService } from '../sportsBetting';
import { SupabaseMemory } from './memory/supabaseMemory';

export interface AIRequest {
  query: string;
  userId?: string;
  notebookId?: string;
  context?: Record<string, any>;
  provider?: 'openai' | 'anthropic' | 'local';
}

export interface AIResponse {
  text: string;
  data?: any;
  error?: string;
  provider?: string;
  model?: string;
  usage?: {
    tokens: number;
    cost?: number;
  };
}

export interface AISession {
  userId: string;
  notebookId?: string;
  messages: Array<{ role: string; content: string; timestamp: string }>;
  context: Record<string, any>;
  preferences: Record<string, any>;
}

/**
 * Simplified AI Orchestrator for QuantSports.ai
 * 
 * This serves as the unified entry point for all AI interactions,
 * providing intelligent routing, memory management, and fallback handling.
 */
export class AIOrchestrator {
  private memory: SupabaseMemory;
  private defaultProvider: string = 'openai';
  private retryAttempts: number = 3;

  constructor() {
    this.memory = new SupabaseMemory();
  }

  /**
   * Main entry point for all AI requests with intelligent routing
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    try {
      // Load session context and memory
      const session = await this.loadSession(request.userId, request.notebookId);
      
      // Route request to appropriate handler
      let response: AIResponse;
      
      if (this.isCodeGenerationRequest(request.query)) {
        response = await this.handleCodeGeneration(request, session);
      } else if (this.isStrategyAnalysisRequest(request.query)) {
        response = await this.handleStrategyAnalysis(request, session);
      } else {
        response = await this.handleGeneralQuery(request, session);
      }

      // Save conversation to memory
      await this.saveToMemory(session, request.query, response.text);

      return response;

    } catch (error) {
      console.error('AI Orchestrator Error:', error);
      return this.handleError(error as Error, request);
    }
  }

  /**
   * Determine if request is for code generation
   */
  private isCodeGenerationRequest(query: string): boolean {
    const codeKeywords = ['code', 'script', 'function', 'python', 'generate', 'write'];
    const lowerQuery = query.toLowerCase();
    return codeKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  /**
   * Determine if request is for strategy analysis
   */
  private isStrategyAnalysisRequest(query: string): boolean {
    const strategyKeywords = ['simulate', 'strategy', 'backtest', 'analyze', 'roi', 'performance'];
    const lowerQuery = query.toLowerCase();
    return strategyKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  /**
   * Handle code generation requests
   */
  private async handleCodeGeneration(request: AIRequest, session: AISession): Promise<AIResponse> {
    try {
      const codeRequest = {
        userQuery: request.query,
        targetLanguage: 'python' as const,
        cellHistory: [],
        chatHistory: [], // Simplified for now - can be enhanced later
        availableData: []
      };

      const result = await AICodeGenerator.generateCode(codeRequest);

      return {
        text: `## Generated Code

\`\`\`python
${result.code}
\`\`\`

### Explanation:
${result.explanation}

### Dependencies:
${result.dependencies.join(', ')}

### Estimated Runtime:
${result.estimatedRuntime}

✅ Code is ready to use in your notebook!`,
        data: {
          code: result.code,
          explanation: result.explanation,
          dependencies: result.dependencies
        },
        provider: 'openai',
        model: 'gpt-4'
      };
    } catch (error) {
      console.error('Code generation failed:', error);
      return this.getFallbackCodeResponse(request);
    }
  }

  /**
   * Handle strategy analysis requests
   */
  private async handleStrategyAnalysis(request: AIRequest, session: AISession): Promise<AIResponse> {
    try {
      const aiQuery = {
        query: request.query,
        context: { ...session.context, ...request.context }
      };

      const result = await AIBettingAssistant.processQuery(aiQuery);

      return {
        text: result.text,
        data: result.data,
        provider: 'openai',
        model: 'gpt-4'
      };
    } catch (error) {
      console.error('Strategy analysis failed:', error);
      return this.getFallbackStrategyResponse(request);
    }
  }

  /**
   * Handle general queries
   */
  private async handleGeneralQuery(request: AIRequest, session: AISession): Promise<AIResponse> {
    try {
      const aiQuery = {
        query: request.query,
        context: { ...session.context, ...request.context }
      };

      const result = await AIBettingAssistant.processQuery(aiQuery);

      return {
        text: result.text,
        data: result.data,
        provider: 'openai',
        model: 'gpt-4'
      };
    } catch (error) {
      console.error('General query failed:', error);
      return this.getFallbackGeneralResponse(request);
    }
  }

  /**
   * Load user session with context and memory
   */
  private async loadSession(userId?: string, notebookId?: string): Promise<AISession> {
    if (!userId) {
      return {
        userId: 'anonymous',
        notebookId,
        messages: [],
        context: {},
        preferences: {}
      };
    }

    try {
      const sessionData = await this.memory.getSession(userId, notebookId);
      
      if (sessionData) {
        // Convert LangChain messages to simple format
        const messages = sessionData.messages.map(msg => ({
          role: msg.constructor.name === 'AIMessage' ? 'assistant' : 'user',
          content: msg.content as string,
          timestamp: new Date().toISOString()
        }));

        return {
          userId: sessionData.userId,
          notebookId: sessionData.notebookId,
          messages,
          context: sessionData.context,
          preferences: sessionData.preferences
        };
      }

      return {
        userId,
        notebookId,
        messages: [],
        context: {},
        preferences: {}
      };
    } catch (error) {
      console.warn('Failed to load session, using default:', error);
      return {
        userId,
        notebookId,
        messages: [],
        context: {},
        preferences: {}
      };
    }
  }

  /**
   * Save conversation to persistent memory
   */
  private async saveToMemory(session: AISession, query: string, response: string): Promise<void> {
    try {
      session.messages.push(
        {
          role: 'user',
          content: query,
          timestamp: new Date().toISOString()
        },
        {
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString()
        }
      );

      // Keep only last 20 messages for performance
      if (session.messages.length > 20) {
        session.messages = session.messages.slice(-20);
      }

      // Convert to LangChain format for storage
      const langchainSession = {
        userId: session.userId,
        notebookId: session.notebookId,
        messages: [], // Will be populated by SupabaseMemory
        context: session.context,
        preferences: session.preferences
      };

      await this.memory.saveSession(langchainSession);
    } catch (error) {
      console.warn('Failed to save to memory:', error);
    }
  }

  /**
   * Handle errors with intelligent fallback
   */
  private handleError(error: Error, request: AIRequest): AIResponse {
    let fallbackText = "I'm experiencing technical difficulties, but I'm still here to help with your betting analysis. ";

    if (error.message.includes('quota') || error.message.includes('429')) {
      fallbackText += "I'm currently experiencing high demand. Here are some general insights while we wait:\n\n";
      fallbackText += this.getGeneralBettingInsights();
    } else if (error.message.includes('401') || error.message.includes('key')) {
      fallbackText += "There seems to be an authentication issue. Please check your API configuration.";
    } else {
      fallbackText += "Could you rephrase your question or try a simpler query?";
    }

    return {
      text: fallbackText,
      error: error.message,
      provider: 'fallback'
    };
  }

  /**
   * Fallback responses for different request types
   */
  private getFallbackCodeResponse(request: AIRequest): AIResponse {
    const basicCode = `import pandas as pd
import numpy as np

# Basic betting analysis template
def analyze_betting_data(matches_df):
    """
    Analyze betting data and calculate basic metrics
    """
    # Calculate win rates
    home_wins = matches_df['home_win'].sum()
    total_matches = len(matches_df)
    home_win_rate = (home_wins / total_matches) * 100
    
    print(f"Home win rate: {home_win_rate:.1f}%")
    
    return {
        'total_matches': total_matches,
        'home_win_rate': home_win_rate
    }

# Usage example:
# results = analyze_betting_data(your_matches_df)`;

    return {
      text: `## Generated Code (Fallback Mode)

\`\`\`python
${basicCode}
\`\`\`

### Note:
This is a basic template generated in offline mode. For more sophisticated code generation, please ensure your AI service is connected.

✅ Ready to use as a starting point!`,
      data: { code: basicCode },
      provider: 'fallback',
      error: 'AI service unavailable, using fallback'
    };
  }

  private getFallbackStrategyResponse(request: AIRequest): AIResponse {
    return {
      text: `## Strategy Analysis (Offline Mode)

I'm currently in offline mode, but I can provide some general strategy guidance:

### Key Betting Principles:
- **Bankroll Management:** Never bet more than 2-5% of your total bankroll
- **Value Betting:** Look for odds that underestimate true probability
- **Record Keeping:** Track all bets to identify profitable patterns

### Basic Strategy Framework:
1. Focus on leagues you know well
2. Analyze team form and head-to-head records
3. Consider home advantage (typically 0.3-0.5 goal advantage)
4. Monitor injury reports and team news

For detailed strategy simulation, please ensure your AI connection is active.`,
      provider: 'fallback',
      error: 'AI service unavailable, using general guidance'
    };
  }

  private getFallbackGeneralResponse(request: AIRequest): AIResponse {
    return {
      text: this.getGeneralBettingInsights(),
      provider: 'fallback',
      error: 'AI service unavailable, using general insights'
    };
  }

  private getGeneralBettingInsights(): string {
    return `## General Betting Insights

### Market Trends:
- **Home Advantage:** Most leagues show 45-50% home win rates
- **Over/Under:** Look for teams with consistent goal patterns
- **Both Teams to Score:** Higher probability in attacking leagues

### Value Opportunities:
- **Away underdogs** often provide better value than favorites
- **Live betting** can offer opportunities as odds adjust to match flow
- **Weather conditions** can significantly impact over/under markets

### Risk Management:
- Use proper **staking plans** (flat betting or Kelly Criterion)
- **Diversify** across multiple leagues and bet types
- Set **daily/weekly limits** to prevent chasing losses

Remember: Betting should be approached as investment, not gambling. Focus on long-term profitability rather than quick wins.`;
  }

  /**
   * Get provider status for health checks
   */
  getProviderStatus(): Record<string, boolean> {
    // Simple health check - in production, ping actual services
    return {
      openai: !!import.meta.env.VITE_OPENAI_API_KEY,
      supabase: !!import.meta.env.VITE_SUPABASE_URL,
      memory: true
    };
  }

  /**
   * Clear session memory for user
   */
  async clearSession(userId: string, notebookId?: string): Promise<void> {
    await this.memory.clearSession(userId, notebookId);
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, preferences: Record<string, any>): Promise<void> {
    await this.memory.updateUserPreferences(userId, preferences);
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(userId: string) {
    return await this.memory.getSessionAnalytics(userId);
  }
} 