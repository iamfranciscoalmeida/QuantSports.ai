import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';

export interface EnhancedProviderConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
  usageTracking?: boolean;
  retryAttempts?: number;
  endpoint?: string; // For local LLM providers
}

export interface QueryOptions {
  context?: Record<string, any>;
  history?: BaseMessage[];
  streaming?: boolean;
  intent?: string;
  maxRetries?: number;
}

export interface EnhancedAIResponse {
  text: string;
  provider: string;
  model: string;
  usage?: {
    tokens: number;
    cost?: number;
    inputTokens?: number;
    outputTokens?: number;
  };
  responseTime: number;
  streamId?: string;
  error?: string; // For error handling
}

export class EnhancedOpenAIProvider {
  public llm: ChatOpenAI;
  private config: EnhancedProviderConfig;
  private usageStats: {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageResponseTime: number;
    errorCount: number;
  };

  constructor(config: EnhancedProviderConfig) {
    this.config = config;
    this.usageStats = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageResponseTime: 0,
      errorCount: 0
    };

    this.llm = new ChatOpenAI({
      apiKey: config.apiKey,
      model: config.model || 'gpt-4-turbo-preview',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 2000,
      streaming: config.streaming || false
    });
  }

  async query(prompt: string, options: QueryOptions = {}): Promise<EnhancedAIResponse> {
    const startTime = Date.now();
    const retryAttempts = options.maxRetries || this.config.retryAttempts || 3;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        this.usageStats.totalRequests++;

        const messages = this.buildMessages(prompt, options);
        const response = await this.llm.invoke(messages);

        const responseTime = Date.now() - startTime;
        const usage = this.extractUsageData(response);

        // Update usage statistics
        if (this.config.usageTracking) {
          this.updateUsageStats(usage, responseTime);
        }

        return {
          text: response.content as string,
          provider: 'openai',
          model: this.config.model || 'gpt-4-turbo-preview',
          usage,
          responseTime,
          streamId: options.streaming ? this.generateStreamId() : undefined
        };

      } catch (error) {
        this.usageStats.errorCount++;
        
        if (attempt === retryAttempts) {
          throw this.enhanceError(error as Error, attempt);
        }

        // Wait before retry with exponential backoff
        await this.wait(Math.pow(2, attempt) * 1000);
      }
    }

    throw new Error('Max retry attempts exceeded');
  }

  async streamQuery(prompt: string, options: QueryOptions = {}): Promise<AsyncIterable<string>> {
    if (!this.config.streaming) {
      // Fallback to regular query and simulate streaming
      const response = await this.query(prompt, options);
      return this.simulateStreaming(response.text);
    }

    const messages = this.buildMessages(prompt, options);
    const stream = await this.llm.stream(messages);

    async function* processStream() {
      for await (const chunk of stream) {
        if (chunk.content) {
          yield chunk.content as string;
        }
      }
    }

    return processStream();
  }

  private buildMessages(prompt: string, options: QueryOptions): BaseMessage[] {
    const messages: BaseMessage[] = [];

    // Add system message based on intent
    if (options.intent) {
      const systemMessage = this.getSystemMessage(options.intent);
      messages.push(new HumanMessage(systemMessage));
    }

    // Add conversation history
    if (options.history && options.history.length > 0) {
      messages.push(...options.history.slice(-6)); // Last 3 exchanges
    }

    // Add current prompt with context
    const contextualPrompt = this.buildContextualPrompt(prompt, options);
    messages.push(new HumanMessage(contextualPrompt));

    return messages;
  }

  private getSystemMessage(intent: string): string {
    const systemMessages = {
      code_generation: `You are an expert Python developer specializing in sports betting analysis. 
        Generate clean, production-ready code with proper error handling and documentation.
        Focus on pandas, numpy, and matplotlib for data analysis and visualization.`,
      
      strategy_analysis: `You are a professional sports betting analyst with expertise in statistical analysis and strategy development.
        Provide detailed analysis with specific recommendations and risk assessments.
        Always include probability estimates and confidence intervals where possible.`,
      
      team_analysis: `You are a football analytics expert with deep knowledge of team performance metrics.
        Analyze team data comprehensively including form, injuries, tactical considerations, and historical performance.
        Provide actionable insights for betting decisions.`,
      
      pattern_discovery: `You are a data scientist specializing in pattern recognition in sports betting markets.
        Identify statistically significant trends and provide evidence-based insights.
        Focus on actionable patterns that can be exploited for profitable betting.`,
      
      general_query: `You are an AI assistant for QuantSports.ai, specializing in sports betting analysis and strategy development.
        Provide helpful, accurate information while emphasizing responsible gambling practices.`
    };

    return systemMessages[intent] || systemMessages.general_query;
  }

  private buildContextualPrompt(prompt: string, options: QueryOptions): string {
    let contextualPrompt = prompt;

    if (options.context && Object.keys(options.context).length > 0) {
      const contextStr = Object.entries(options.context)
        .filter(([key, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n');
      
      if (contextStr) {
        contextualPrompt = `Context:\n${contextStr}\n\nQuery: ${prompt}`;
      }
    }

    return contextualPrompt;
  }

  private extractUsageData(response: any): {
    tokens: number;
    cost?: number;
    inputTokens?: number;
    outputTokens?: number;
  } {
    const usage = response.usage_metadata || response.usage || {};
    
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    const totalTokens = usage.total_tokens || inputTokens + outputTokens;

    // Calculate cost based on current OpenAI pricing (approximate)
    const inputCost = inputTokens * 0.00001; // $0.01 per 1K tokens
    const outputCost = outputTokens * 0.00003; // $0.03 per 1K tokens
    const totalCost = inputCost + outputCost;

    return {
      tokens: totalTokens,
      cost: totalCost,
      inputTokens,
      outputTokens
    };
  }

  private updateUsageStats(usage: any, responseTime: number): void {
    this.usageStats.totalTokens += usage.tokens || 0;
    this.usageStats.totalCost += usage.cost || 0;
    
    // Update average response time
    const totalRequests = this.usageStats.totalRequests;
    this.usageStats.averageResponseTime = 
      (this.usageStats.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  private async simulateStreaming(text: string): Promise<AsyncIterable<string>> {
    async function* streamGenerator() {
      const words = text.split(' ');
      for (const word of words) {
        yield word + ' ';
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return streamGenerator();
  }

  private generateStreamId(): string {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private enhanceError(error: Error, attempt: number): Error {
    let message = `OpenAI Provider Error (attempt ${attempt}): ${error.message}`;
    
    if (error.message.includes('429')) {
      message += ' - Rate limit exceeded. Consider upgrading your plan or implementing request throttling.';
    } else if (error.message.includes('401')) {
      message += ' - Authentication failed. Check your API key.';
    } else if (error.message.includes('quota')) {
      message += ' - Quota exceeded. Check your OpenAI usage limits.';
    }

    const enhancedError = new Error(message);
    enhancedError.stack = error.stack;
    return enhancedError;
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isAvailable(): boolean {
    return !!this.config.apiKey;
  }

  getModel(): string {
    return this.config.model || 'gpt-4-turbo-preview';
  }

  getUsageStats() {
    return { ...this.usageStats };
  }

  resetUsageStats(): void {
    this.usageStats = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageResponseTime: 0,
      errorCount: 0
    };
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      await this.llm.invoke([new HumanMessage('Test connection')]);
      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 5000 ? 'healthy' : 'degraded',
        responseTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 