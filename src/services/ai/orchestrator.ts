import { ChatOpenAI } from '@langchain/openai';
import { StructuredTool } from '@langchain/core/tools';
import { AIMessage, HumanMessage, BaseMessage } from '@langchain/core/messages';

import { SupabaseMemory } from './memory/supabaseMemory';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { LocalLLMProvider } from './providers/localLLM';
import { SimulateStrategyTool } from './tools/simulateStrategy';
import { GenerateCodeTool } from './tools/generateCode';
import { AnalyzeTeamTool } from './tools/analyzeTeam';
import { DiscoverPatternsTool } from './tools/discoverPatterns';

export interface AIRequest {
  query: string;
  userId?: string;
  notebookId?: string;
  context?: Record<string, any>;
  provider?: 'openai' | 'anthropic' | 'local';
  model?: string;
  streaming?: boolean;
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
  messages: BaseMessage[];
  context: Record<string, any>;
  preferences: Record<string, any>;
}

export class AIOrchestrator {
  private memory: SupabaseMemory;
  private providers: Map<string, any>;
  private tools: Map<string, StructuredTool>;
  private defaultProvider: string = 'openai';
  private retryAttempts: number = 3;

  constructor() {
    this.memory = new SupabaseMemory();
    this.providers = new Map();
    this.tools = new Map();
    
    this.initializeProviders();
    this.initializeTools();
  }

  /**
   * Initialize AI providers with fallback chain
   */
  private initializeProviders(): void {
    try {
      // OpenAI Provider
      this.providers.set('openai', new OpenAIProvider({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        model: 'gpt-4-turbo-preview',
        temperature: 0.7
      }));

      // Anthropic Provider
      if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
        this.providers.set('anthropic', new AnthropicProvider({
          apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
          model: 'claude-3-sonnet-20240229',
          temperature: 0.7
        }));
      }

      // Local LLM Provider (for offline mode)
      this.providers.set('local', new LocalLLMProvider({
        endpoint: import.meta.env.VITE_LOCAL_LLM_ENDPOINT || 'http://localhost:1234/v1'
      }));
    } catch (error) {
      console.error('Failed to initialize AI providers:', error);
    }
  }

  /**
   * Initialize LangChain tools for specific AI capabilities
   */
  private initializeTools(): void {
    const toolInstances = [
      new SimulateStrategyTool(),
      new GenerateCodeTool(),
      new AnalyzeTeamTool(),
      new DiscoverPatternsTool()
    ];
    
    toolInstances.forEach(tool => {
      this.tools.set(tool.name, tool);
    });
  }

  /**
   * Route request to appropriate tool based on content
   */
  private async routeToTool(query: string, context?: Record<string, any>): Promise<string> {
    const lowerQuery = query.toLowerCase();
    
    // Strategy simulation keywords
    if (lowerQuery.includes('simulate') || lowerQuery.includes('backtest') || 
        lowerQuery.includes('strategy') && (lowerQuery.includes('test') || lowerQuery.includes('run'))) {
             const tool = this.tools.get('simulate_strategy');
       if (tool) {
         // Extract strategy parameters from query (simplified)
         const params = this.extractStrategyParams(query);
         return await tool.invoke(params);
       }
    }
    
    // Code generation keywords
    if (lowerQuery.includes('code') || lowerQuery.includes('script') || 
        lowerQuery.includes('function') || lowerQuery.includes('python')) {
      const tool = this.tools.get('generate_code');
      if (tool) {
                 return await tool.invoke({ 
           query: query,
           language: 'python',
           context: context 
         });
      }
    }
    
    // Team analysis keywords
    if (lowerQuery.includes('analyze') && (lowerQuery.includes('team') || 
        lowerQuery.includes('arsenal') || lowerQuery.includes('manchester') || 
        lowerQuery.includes('liverpool') || lowerQuery.includes('chelsea'))) {
      const tool = this.tools.get('analyze_team');
      if (tool) {
        const teamName = this.extractTeamName(query);
        return await tool._call({ 
          team_name: teamName,
          analysis_type: 'comprehensive' 
        });
      }
    }
    
    // Pattern discovery keywords
    if (lowerQuery.includes('pattern') || lowerQuery.includes('trend') || 
        lowerQuery.includes('discover') || lowerQuery.includes('insight')) {
      const tool = this.tools.get('discover_patterns');
      if (tool) {
        return await tool._call({ 
          pattern_type: 'market_trends',
          timeframe: 'current_season' 
        });
      }
    }
    
    // No specific tool matched, return general response
    return null;
  }
  
  private extractStrategyParams(query: string): any {
    // Simple parameter extraction (in production, use more sophisticated parsing)
    const lowerQuery = query.toLowerCase();
    
    let betType = 'home_win';
    if (lowerQuery.includes('over')) betType = 'over_2_5';
    else if (lowerQuery.includes('under')) betType = 'under_2_5';
    else if (lowerQuery.includes('draw')) betType = 'draw';
    else if (lowerQuery.includes('away')) betType = 'away_win';
    
    return {
      name: 'AI Generated Strategy',
      description: 'Strategy based on user query',
      bet_type: betType,
      stake_percentage: 2
    };
  }
  
  private extractTeamName(query: string): string {
    // Simple team name extraction
    const teams = ['Arsenal', 'Manchester United', 'Manchester City', 'Liverpool', 'Chelsea', 'Tottenham'];
    const lowerQuery = query.toLowerCase();
    
    for (const team of teams) {
      if (lowerQuery.includes(team.toLowerCase()) || 
          (team.includes('Manchester') && lowerQuery.includes('man'))) {
        return team;
      }
    }
    
    return 'Arsenal'; // Default fallback
  }

  /**
   * Main entry point for all AI requests with intelligent routing
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    try {
      // Load session context and memory
      const session = await this.loadSession(request.userId, request.notebookId);
      
      // Try to route to specific tool first
      const toolResponse = await this.routeToTool(request.query, {
        ...session.context,
        ...request.context
      });
      
      if (toolResponse) {
        // Save conversation to memory
        await this.saveToMemory(session, request.query, toolResponse);
        
        return {
          text: toolResponse,
          provider: 'ai-tool',
          model: 'specialized-tool'
        };
      }

      // Fallback to direct provider
      return this.fallbackToDirectProvider(request, session);

    } catch (error) {
      console.error('AI Orchestrator Error:', error);
      
      // Attempt fallback with different provider
      return this.handleError(error as Error, request);
    }
  }

  /**
   * Route requests to appropriate specialized agent
   */
  private routeRequest(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    // Strategy-related keywords
    if (lowerQuery.includes('strategy') || lowerQuery.includes('simulate') || 
        lowerQuery.includes('backtest') || lowerQuery.includes('code')) {
      return 'strategy';
    }
    
    // Pattern discovery keywords  
    if (lowerQuery.includes('pattern') || lowerQuery.includes('trend') ||
        lowerQuery.includes('discover') || lowerQuery.includes('insight')) {
      return 'patterns';
    }
    
    // Default to strategy agent
    return 'strategy';
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
      return sessionData || {
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
        new HumanMessage(query),
        new AIMessage(response)
      );

      // Keep only last 20 messages for performance
      if (session.messages.length > 20) {
        session.messages = session.messages.slice(-20);
      }

      await this.memory.saveSession(session);
    } catch (error) {
      console.warn('Failed to save to memory:', error);
    }
  }

  /**
   * Execute with retry logic and provider fallback
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof Error && 
            (error.message.includes('401') || error.message.includes('403'))) {
          throw error;
        }
        
        // Wait before retry with exponential backoff
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Fallback to direct provider when agent fails
   */
  private async fallbackToDirectProvider(request: AIRequest, session: AISession): Promise<AIResponse> {
    const providerKey = request.provider || this.defaultProvider;
    const provider = this.providers.get(providerKey);
    
    if (!provider) {
      throw new Error(`Provider ${providerKey} not available`);
    }
    
    const response = await provider.query(request.query, {
      context: session.context,
      history: session.messages.slice(-6) // Last 3 exchanges
    });
    
    await this.saveToMemory(session, request.query, response.text);
    
    return response;
  }

  /**
   * Handle errors with intelligent fallback
   */
  private async handleError(error: Error, request: AIRequest): Promise<AIResponse> {
    // Try alternative providers
    const fallbackProviders = ['anthropic', 'local'].filter(p => 
      p !== request.provider && this.providers.has(p)
    );
    
    for (const providerKey of fallbackProviders) {
      try {
        const provider = this.providers.get(providerKey);
        const response = await provider.query(request.query);
        
        return {
          ...response,
          provider: providerKey,
          error: `Primary provider failed, used ${providerKey} as fallback`
        };
      } catch (fallbackError) {
        console.warn(`Fallback provider ${providerKey} also failed:`, fallbackError);
      }
    }
    
    // Final fallback - return helpful error message
    return {
      text: this.getErrorFallbackMessage(error),
      error: error.message,
      provider: 'fallback'
    };
  }

  /**
   * Get system prompt for agents
   */
  private getSystemPrompt(): string {
    return `You are an expert AI assistant for QuantSports.ai, specializing in sports betting analysis and strategy development.

Your capabilities include:
- Generating and simulating betting strategies
- Analyzing team performance and historical data
- Creating Python code for data analysis
- Discovering patterns and trends in betting data
- Providing actionable insights for profitable betting

Always provide detailed explanations and practical next steps. When generating code, ensure it's production-ready and well-documented.

Available tools: ${this.tools.map(t => t.name).join(', ')}

Current context will be provided in each request.`;
  }

  /**
   * Generate helpful error fallback message
   */
  private getErrorFallbackMessage(error: Error): string {
    if (error.message.includes('quota') || error.message.includes('429')) {
      return "I'm currently experiencing high demand. Please try again in a few minutes, or I can provide some general betting insights while we wait.";
    }
    
    if (error.message.includes('401') || error.message.includes('key')) {
      return "There seems to be an authentication issue. Please check your API configuration or contact support.";
    }
    
    return "I'm experiencing technical difficulties, but I'm still here to help with your betting analysis. Could you rephrase your question or try a simpler query?";
  }

  /**
   * Set preferred provider for future requests
   */
  setDefaultProvider(provider: 'openai' | 'anthropic' | 'local'): void {
    if (this.providers.has(provider)) {
      this.defaultProvider = provider;
    }
  }

  /**
   * Get available providers and their status
   */
  getProviderStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    
    for (const [key, provider] of this.providers) {
      try {
        status[key] = provider.isAvailable();
      } catch {
        status[key] = false;
      }
    }
    
    return status;
  }

  /**
   * Clear session memory for user
   */
  async clearSession(userId: string, notebookId?: string): Promise<void> {
    await this.memory.clearSession(userId, notebookId);
  }
} 