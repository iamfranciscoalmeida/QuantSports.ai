import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

import { SupabaseMemory } from './memory/supabaseMemory';
import { EnhancedOpenAIProvider } from './providers/enhanced-openai';
import { EnhancedAnthropicProvider } from './providers/enhanced-anthropic';
import { EnhancedLocalLLMProvider } from './providers/enhanced-local';
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
  streaming?: boolean;
  toolChain?: string[]; // For explicit tool chaining
}

export interface AIResponse {
  text: string;
  data?: any;
  error?: string;
  provider?: string;
  model?: string;
  toolsUsed?: string[];
  executionTime?: number;
  usage?: {
    tokens: number;
    cost?: number;
  };
  streamId?: string; // For streaming responses
}

export interface AISession {
  userId: string;
  notebookId?: string;
  messages: BaseMessage[];
  context: Record<string, any>;
  preferences: Record<string, any>;
  metadata: {
    totalInteractions: number;
    lastActive: string;
    preferredProvider?: string;
    toolUsageStats: Record<string, number>;
  };
}

export interface ToolResult {
  toolName: string;
  result: string;
  executionTime: number;
  success: boolean;
  error?: string;
}

// Intent classification schema
const IntentClassificationSchema = z.object({
  intent: z.enum(['code_generation', 'strategy_analysis', 'team_analysis', 'pattern_discovery', 'general_query']),
  confidence: z.number().min(0).max(1),
  parameters: z.record(z.any()).optional(),
  suggestedTools: z.array(z.string()).optional(),
  reasoning: z.string().optional()
});

type IntentClassification = z.infer<typeof IntentClassificationSchema>;

/**
 * Enhanced AI Orchestrator for QuantSports.ai
 * 
 * Provides intelligent routing, tool chaining, streaming responses,
 * and comprehensive error handling with real data integration.
 */
export class EnhancedAIOrchestrator {
  private memory: any; // AIMemoryInterface
  private providers: Map<string, any>;
  private tools: Map<string, any>;
  private defaultProvider: string = 'openai';
  private retryAttempts: number = 3;
  private intentClassifier: RunnableSequence;
  private toolChains: Map<string, string[]>;
  private performanceMetrics: Map<string, any>;

  constructor() {
    this.providers = new Map();
    this.tools = new Map();
    this.toolChains = new Map();
    this.performanceMetrics = new Map();
    
    this.initializeMemoryWithFallback();
    this.initializeProviders();
    this.initializeTools();
    this.initializeIntentClassifier();
    this.initializeToolChains();
  }

  /**
   * Initialize memory system with automatic fallback
   */
  private initializeMemoryWithFallback(): void {
    try {
      this.memory = new SupabaseMemory();
      console.log('✅ Enhanced AI Orchestrator - Supabase memory initialized');
    } catch (error) {
      console.warn('⚠️ Enhanced AI Orchestrator - Supabase memory failed, using fallback:', error.message);
      
      // Use a simple in-memory fallback
      this.memory = {
        getSession: () => Promise.resolve(null),
        saveSession: () => Promise.resolve(),
        updateUserPreferences: () => Promise.resolve(),
        getConversationHistory: () => Promise.resolve([]),
        addToConversationHistory: () => Promise.resolve(),
        clearSession: () => Promise.resolve()
      };
      console.log('✅ Enhanced AI Orchestrator - Simple fallback memory initialized');
    }
  }

  /**
   * Initialize enhanced AI providers with streaming and monitoring
   */
  private initializeProviders(): void {
    try {
      // Enhanced OpenAI Provider
      this.providers.set('openai', new EnhancedOpenAIProvider({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        streaming: true,
        usageTracking: true
      }));

      // Enhanced Anthropic Provider
      if (import.meta.env.VITE_ANTHROPIC_API_KEY) {
        this.providers.set('anthropic', new EnhancedAnthropicProvider({
          apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
          model: 'claude-3-sonnet-20240229',
          temperature: 0.7,
          streaming: true,
          usageTracking: true
        }));
      }

      // Enhanced Local LLM Provider
      this.providers.set('local', new EnhancedLocalLLMProvider({
        endpoint: import.meta.env.VITE_LOCAL_LLM_ENDPOINT || 'http://localhost:1234/v1',
        model: 'local-model',
        streaming: true
      }));
    } catch (error) {
      console.error('Failed to initialize AI providers:', error);
    }
  }

  /**
   * Initialize enhanced tools with real data connections
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
   * Initialize intent classification system
   */
  private initializeIntentClassifier(): void {
    const intentPrompt = ChatPromptTemplate.fromTemplate(`
      Analyze the user query and classify the intent. Consider the context and determine what the user wants to accomplish.

      User Query: {query}
      Context: {context}

      Classify the intent as one of:
      - code_generation: User wants Python/SQL code generated
      - strategy_analysis: User wants betting strategy simulation or analysis
      - team_analysis: User wants team performance analysis
      - pattern_discovery: User wants to discover trends/patterns in data
      - general_query: General betting questions or conversations

      Return a JSON object with:
      - intent: the classified intent
      - confidence: confidence score (0-1)
      - parameters: extracted parameters for the intent
      - suggestedTools: array of tool names that should be used
      - reasoning: brief explanation of the classification

      Respond with valid JSON only.
    `);

    const llm = new ChatOpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      model: 'gpt-4-turbo-preview',
      temperature: 0.1
    });

    this.intentClassifier = RunnableSequence.from([
      intentPrompt,
      llm,
      new JsonOutputParser()
    ]);
  }

  /**
   * Initialize predefined tool chains for complex workflows
   */
  private initializeToolChains(): void {
    this.toolChains.set('full_team_analysis', [
      'analyze_team',
      'discover_patterns',
      'generate_code'
    ]);

    this.toolChains.set('strategy_development', [
      'analyze_team',
      'discover_patterns',
      'simulate_strategy'
    ]);

    this.toolChains.set('comprehensive_analysis', [
      'analyze_team',
      'discover_patterns',
      'simulate_strategy',
      'generate_code'
    ]);
  }

  /**
   * Main entry point with enhanced routing and streaming support
   */
  async processRequest(request: AIRequest): Promise<AIResponse | AsyncIterable<string>> {
    const startTime = Date.now();
    
    try {
      // Load session context and memory
      const session = await this.loadSession(request.userId, request.notebookId);
      
      // Update session metadata
      this.updateSessionMetadata(session);

      // Classify intent for intelligent routing
      const intent = await this.classifyIntent(request.query, {
        ...session.context,
        ...request.context
      });

      // Route to appropriate handler based on intent
      let response: AIResponse;

      if (request.toolChain) {
        // Explicit tool chain execution
        response = await this.executeToolChain(request.toolChain, request, session);
      } else if (intent.suggestedTools && intent.suggestedTools.length > 0) {
        // Tool-based execution
        response = await this.executeTools(intent.suggestedTools, request, session, intent);
      } else {
        // Direct provider execution
        response = await this.executeDirectProvider(request, session, intent);
      }

      // Add execution metrics
      response.executionTime = Date.now() - startTime;
      response.toolsUsed = response.toolsUsed || [];

      // Save conversation to memory
      await this.saveToMemory(session, request.query, response.text, {
        intent: intent.intent,
        toolsUsed: response.toolsUsed,
        executionTime: response.executionTime,
        provider: response.provider
      });

      // Update performance metrics
      this.updatePerformanceMetrics(response);

      // Return streaming response if requested
      if (request.streaming && response.streamId) {
        return this.createStreamingResponse(response);
      }

      return response;

    } catch (error) {
      console.error('AI Orchestrator Error:', error);
      
      const executionTime = Date.now() - startTime;
      return this.handleError(error as Error, request, executionTime);
    }
  }

  /**
   * Classify user intent using LangChain
   */
  private async classifyIntent(query: string, context: Record<string, any>): Promise<IntentClassification> {
    try {
      const result = await this.intentClassifier.invoke({
        query,
        context: JSON.stringify(context, null, 2)
      });

      // Validate and parse the result
      return IntentClassificationSchema.parse(result);
    } catch (error) {
      console.warn('Intent classification failed, using fallback:', error);
      
      // Fallback intent classification
      return this.fallbackIntentClassification(query);
    }
  }

  /**
   * Fallback intent classification using simple keyword matching
   */
  private fallbackIntentClassification(query: string): IntentClassification {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('code') || lowerQuery.includes('python') || lowerQuery.includes('script')) {
      return {
        intent: 'code_generation',
        confidence: 0.8,
        suggestedTools: ['generate_code']
      };
    }
    
    if (lowerQuery.includes('simulate') || lowerQuery.includes('strategy') || lowerQuery.includes('backtest')) {
      return {
        intent: 'strategy_analysis',
        confidence: 0.8,
        suggestedTools: ['simulate_strategy']
      };
    }
    
    if (lowerQuery.includes('analyze') && (lowerQuery.includes('team') || lowerQuery.includes('arsenal') || lowerQuery.includes('manchester'))) {
      return {
        intent: 'team_analysis',
        confidence: 0.8,
        suggestedTools: ['analyze_team']
      };
    }
    
    if (lowerQuery.includes('pattern') || lowerQuery.includes('trend') || lowerQuery.includes('discover')) {
      return {
        intent: 'pattern_discovery',
        confidence: 0.8,
        suggestedTools: ['discover_patterns']
      };
    }
    
    return {
      intent: 'general_query',
      confidence: 0.6,
      suggestedTools: []
    };
  }

  /**
   * Execute a chain of tools in sequence
   */
  private async executeToolChain(toolChain: string[], request: AIRequest, session: AISession): Promise<AIResponse> {
    const results: ToolResult[] = [];
    let context = { ...session.context, ...request.context };
    let finalResponse = '';

    for (const toolName of toolChain) {
      const tool = this.tools.get(toolName);
      if (!tool) {
        console.warn(`Tool ${toolName} not found, skipping`);
        continue;
      }

      try {
        const startTime = Date.now();
        const toolParams = this.extractToolParameters(request.query, toolName, context);
        const result = await tool.invoke(toolParams);
        const executionTime = Date.now() - startTime;

        results.push({
          toolName,
          result,
          executionTime,
          success: true
        });

        // Add result to context for next tool
        context[`${toolName}_result`] = result;
        finalResponse += `\n\n## ${toolName.replace('_', ' ').toUpperCase()} Results:\n${result}`;

      } catch (error) {
        results.push({
          toolName,
          result: '',
          executionTime: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      text: `# Tool Chain Execution Results\n${finalResponse}`,
      data: { toolResults: results, context },
      provider: 'tool-chain',
      toolsUsed: toolChain,
      model: 'multi-tool-chain'
    };
  }

  /**
   * Execute suggested tools based on intent
   */
  private async executeTools(suggestedTools: string[], request: AIRequest, session: AISession, intent: IntentClassification): Promise<AIResponse> {
    const tool = this.tools.get(suggestedTools[0]); // Use first suggested tool
    
    if (!tool) {
      return this.executeDirectProvider(request, session, intent);
    }

    try {
      const startTime = Date.now();
      const toolParams = this.extractToolParameters(request.query, suggestedTools[0], {
        ...session.context,
        ...request.context,
        intent: intent.intent,
        confidence: intent.confidence
      });

      const result = await tool.invoke(toolParams);
      const executionTime = Date.now() - startTime;

      return {
        text: result,
        data: { 
          toolResult: result, 
          intent,
          parameters: toolParams 
        },
        provider: 'ai-tool',
        model: suggestedTools[0],
        toolsUsed: [suggestedTools[0]],
        executionTime
      };
    } catch (error) {
      console.error(`Tool ${suggestedTools[0]} execution failed:`, error);
      return this.executeDirectProvider(request, session, intent);
    }
  }

  /**
   * Execute direct provider when no tools are needed
   */
  private async executeDirectProvider(request: AIRequest, session: AISession, intent: IntentClassification): Promise<AIResponse> {
    const providerKey = request.provider || this.selectOptimalProvider(intent, session);
    const provider = this.providers.get(providerKey);
    
    if (!provider) {
      throw new Error(`Provider ${providerKey} not available`);
    }

    // Enhanced prompt with intent context
    const enhancedQuery = this.enhanceQueryWithContext(request.query, session, intent);
    
    const response = await provider.query(enhancedQuery, {
      context: { ...session.context, ...request.context },
      history: session.messages.slice(-6),
      streaming: request.streaming,
      intent: intent.intent
    });

    return {
      ...response,
      provider: providerKey,
      toolsUsed: []
    };
  }

  /**
   * Select optimal provider based on intent and session history
   */
  private selectOptimalProvider(intent: IntentClassification, session: AISession): string {
    // Use session preferences if available
    if (session.preferences.preferredProvider && 
        this.providers.has(session.preferences.preferredProvider)) {
      return session.preferences.preferredProvider;
    }

    // Select based on intent
    switch (intent.intent) {
      case 'code_generation':
        return 'openai'; // GPT-4 excels at code generation
      case 'strategy_analysis':
        return 'anthropic'; // Claude good for analytical thinking
      case 'pattern_discovery':
        return 'openai'; // GPT-4 good for pattern recognition
      default:
        return this.defaultProvider;
    }
  }

  /**
   * Enhance query with session context and intent
   */
  private enhanceQueryWithContext(query: string, session: AISession, intent: IntentClassification): string {
    let enhancedQuery = query;

    // Add context from previous interactions
    if (session.messages.length > 0) {
      const recentContext = session.messages
        .slice(-4)
        .map(msg => `${msg.constructor.name === 'HumanMessage' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');
      
      enhancedQuery = `Recent conversation context:\n${recentContext}\n\nCurrent query: ${query}`;
    }

    // Add intent-specific enhancements
    if (intent.intent !== 'general_query') {
      enhancedQuery += `\n\nNote: This query is classified as ${intent.intent} with ${(intent.confidence * 100).toFixed(0)}% confidence.`;
    }

    // Add session context
    if (Object.keys(session.context).length > 0) {
      enhancedQuery += `\n\nSession context: ${JSON.stringify(session.context)}`;
    }

    return enhancedQuery;
  }

  /**
   * Extract parameters for specific tools
   */
  private extractToolParameters(query: string, toolName: string, context: Record<string, any>): any {
    const lowerQuery = query.toLowerCase();

    switch (toolName) {
      case 'simulate_strategy':
        return this.extractStrategyParams(query, context);
      case 'analyze_team':
        return this.extractTeamParams(query, context);
      case 'generate_code':
        return this.extractCodeParams(query, context);
      case 'discover_patterns':
        return this.extractPatternParams(query, context);
      default:
        return { query, context };
    }
  }

  private extractStrategyParams(query: string, context: Record<string, any>): any {
    const lowerQuery = query.toLowerCase();
    
    let betType = 'home_win';
    if (lowerQuery.includes('over')) betType = 'over_2_5';
    else if (lowerQuery.includes('under')) betType = 'under_2_5';
    else if (lowerQuery.includes('draw')) betType = 'draw';
    else if (lowerQuery.includes('away')) betType = 'away_win';
    
    // Extract odds range
    const oddsMatch = query.match(/odds?\s+([\d.]+)(?:\s*-\s*([\d.]+))?/i);
    const minOdds = oddsMatch ? parseFloat(oddsMatch[1]) : undefined;
    const maxOdds = oddsMatch && oddsMatch[2] ? parseFloat(oddsMatch[2]) : undefined;

    // Extract team names
    const teams = this.extractTeamNames(query);

    return {
      name: `AI Generated Strategy - ${new Date().toISOString().split('T')[0]}`,
      description: `Strategy based on: ${query}`,
      bet_type: betType,
      stake_percentage: 2,
      filters: {
        teams: teams.length > 0 ? teams : undefined,
        min_odds: minOdds,
        max_odds: maxOdds,
        venue: lowerQuery.includes('home') ? 'home' : lowerQuery.includes('away') ? 'away' : 'all'
      }
    };
  }

  private extractTeamParams(query: string, context: Record<string, any>): any {
    const teamName = this.extractTeamNames(query)[0] || 'Arsenal';
    
    return {
      team_name: teamName,
      analysis_type: 'comprehensive'
    };
  }

  private extractCodeParams(query: string, context: Record<string, any>): any {
    return {
      query,
      language: 'python',
      context: {
        current_notebook_cells: context.notebook_cells || [],
        available_data: context.available_data || ['matches', 'teams', 'odds'],
        user_preferences: context.user_preferences || {}
      }
    };
  }

  private extractPatternParams(query: string, context: Record<string, any>): any {
    const lowerQuery = query.toLowerCase();
    
    let patternType = 'market_trends';
    if (lowerQuery.includes('season')) patternType = 'seasonal';
    else if (lowerQuery.includes('team')) patternType = 'team_based';
    else if (lowerQuery.includes('value')) patternType = 'value_opportunities';

    return {
      pattern_type: patternType,
      timeframe: 'current_season',
      focus_area: query
    };
  }

  private extractTeamNames(query: string): string[] {
    const teams = [
      'Arsenal', 'Manchester United', 'Manchester City', 'Liverpool', 
      'Chelsea', 'Tottenham Hotspur', 'Newcastle United', 'Brighton',
      'West Ham United', 'Aston Villa', 'Crystal Palace', 'Fulham',
      'Brentford', 'Wolves', 'Everton', 'Nottingham Forest',
      'Burnley', 'Sheffield United', 'Luton Town', 'Bournemouth'
    ];
    
    const lowerQuery = query.toLowerCase();
    const foundTeams = teams.filter(team => {
      const lowerTeam = team.toLowerCase();
      return lowerQuery.includes(lowerTeam) || 
             (team.includes('Manchester') && lowerQuery.includes('man')) ||
             (team === 'Tottenham Hotspur' && lowerQuery.includes('spurs'));
    });

    return foundTeams;
  }

  /**
   * Create streaming response iterator
   */
  private async createStreamingResponse(response: AIResponse): Promise<AsyncIterable<string>> {
    const provider = this.providers.get(response.provider || this.defaultProvider);
    
    if (provider && provider.streamQuery) {
      return provider.streamQuery(response.text);
    }

    // Fallback: simulate streaming by chunking response
    async function* simulateStreaming() {
      const words = response.text.split(' ');
      for (const word of words) {
        yield word + ' ';
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return simulateStreaming();
  }

  /**
   * Load enhanced session with metadata
   */
  private async loadSession(userId?: string, notebookId?: string): Promise<AISession> {
    if (!userId) {
      return {
        userId: 'anonymous',
        notebookId,
        messages: [],
        context: {},
        preferences: {},
        metadata: {
          totalInteractions: 0,
          lastActive: new Date().toISOString(),
          toolUsageStats: {}
        }
      };
    }

    try {
      const sessionData = await this.memory.getSession(userId, notebookId);
      
      if (sessionData) {
        return {
          ...sessionData,
          metadata: {
            totalInteractions: sessionData.context.totalInteractions || 0,
            lastActive: new Date().toISOString(),
            preferredProvider: sessionData.preferences.preferredProvider,
            toolUsageStats: sessionData.context.toolUsageStats || {}
          }
        };
      }

      return {
        userId,
        notebookId,
        messages: [],
        context: {},
        preferences: {},
        metadata: {
          totalInteractions: 0,
          lastActive: new Date().toISOString(),
          toolUsageStats: {}
        }
      };
    } catch (error) {
      console.warn('Failed to load session, using default:', error);
      return {
        userId,
        notebookId,
        messages: [],
        context: {},
        preferences: {},
        metadata: {
          totalInteractions: 0,
          lastActive: new Date().toISOString(),
          toolUsageStats: {}
        }
      };
    }
  }

  /**
   * Update session metadata with usage stats
   */
  private updateSessionMetadata(session: AISession): void {
    session.metadata.totalInteractions += 1;
    session.metadata.lastActive = new Date().toISOString();
  }

  /**
   * Save enhanced conversation to memory
   */
  private async saveToMemory(
    session: AISession, 
    query: string, 
    response: string, 
    metadata: {
      intent: string;
      toolsUsed: string[];
      executionTime: number;
      provider?: string;
    }
  ): Promise<void> {
    try {
      session.messages.push(
        new HumanMessage(query),
        new AIMessage(response)
      );

      // Update tool usage stats
      metadata.toolsUsed.forEach(tool => {
        session.metadata.toolUsageStats[tool] = (session.metadata.toolUsageStats[tool] || 0) + 1;
      });

      // Keep only last 20 messages for performance
      if (session.messages.length > 20) {
        session.messages = session.messages.slice(-20);
      }

      // Update context with metadata
      session.context = {
        ...session.context,
        totalInteractions: session.metadata.totalInteractions,
        toolUsageStats: session.metadata.toolUsageStats,
        lastIntent: metadata.intent,
        lastExecutionTime: metadata.executionTime,
        lastProvider: metadata.provider
      };

      await this.memory.saveSession(session);
    } catch (error) {
      console.warn('Failed to save to memory:', error);
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(response: AIResponse): void {
    const provider = response.provider || 'unknown';
    
    if (!this.performanceMetrics.has(provider)) {
      this.performanceMetrics.set(provider, {
        totalRequests: 0,
        totalExecutionTime: 0,
        successRate: 0,
        averageResponseTime: 0,
        errors: 0
      });
    }

    const metrics = this.performanceMetrics.get(provider);
    metrics.totalRequests += 1;
    metrics.totalExecutionTime += response.executionTime || 0;
    
    if (response.error) {
      metrics.errors += 1;
    }
    
    metrics.successRate = ((metrics.totalRequests - metrics.errors) / metrics.totalRequests) * 100;
    metrics.averageResponseTime = metrics.totalExecutionTime / metrics.totalRequests;
  }

  /**
   * Enhanced error handling with detailed metrics
   */
  private handleError(error: Error, request: AIRequest, executionTime: number): AIResponse {
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
      provider: 'fallback',
      executionTime,
      toolsUsed: []
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
   * Get comprehensive system status
   */
  getSystemStatus(): {
    providers: Record<string, boolean>;
    tools: Record<string, boolean>;
    performance: Record<string, any>;
    memory: boolean;
  } {
    const providerStatus: Record<string, boolean> = {};
    for (const [key, provider] of this.providers) {
      try {
        providerStatus[key] = provider.isAvailable();
      } catch {
        providerStatus[key] = false;
      }
    }

    const toolStatus: Record<string, boolean> = {};
    for (const [key] of this.tools) {
      toolStatus[key] = true; // Tools are always available locally
    }

    return {
      providers: providerStatus,
      tools: toolStatus,
      performance: Object.fromEntries(this.performanceMetrics),
      memory: true
    };
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics(): Record<string, any> {
    return Object.fromEntries(this.performanceMetrics);
  }

  /**
   * Clear session memory
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