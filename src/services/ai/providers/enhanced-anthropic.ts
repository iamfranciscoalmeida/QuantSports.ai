import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { EnhancedProviderConfig, QueryOptions, EnhancedAIResponse } from './enhanced-openai';

interface AnthropicMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AnthropicResponse {
  content: Array<{ text: string; type: string }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  model?: string;
}

export class EnhancedAnthropicProvider {
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
  }

  async query(prompt: string, options: QueryOptions = {}): Promise<EnhancedAIResponse> {
    const startTime = Date.now();
    const retryAttempts = options.maxRetries || this.config.retryAttempts || 3;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        this.usageStats.totalRequests++;

        const messages = this.buildAnthropicMessages(prompt, options);
        const response = await this.callAnthropicAPI(messages);

        const responseTime = Date.now() - startTime;
        const usage = this.extractUsageData(response);

        // Update usage statistics
        if (this.config.usageTracking) {
          this.updateUsageStats(usage, responseTime);
        }

        return {
          text: this.extractTextFromResponse(response),
          provider: 'anthropic',
          model: this.config.model || 'claude-3-sonnet-20240229',
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
      const response = await this.query(prompt, options);
      return this.simulateStreaming(response.text);
    }

    const messages = this.buildAnthropicMessages(prompt, options);
    
    try {
      const stream = await this.callAnthropicStreamAPI(messages);
      return this.processAnthropicStream(stream);
    } catch (error) {
      console.warn('Anthropic streaming failed, falling back to regular query:', error);
      const response = await this.query(prompt, options);
      return this.simulateStreaming(response.text);
    }
  }

  private buildAnthropicMessages(prompt: string, options: QueryOptions): AnthropicMessage[] {
    const messages: AnthropicMessage[] = [];

    // Add system message if intent is provided
    if (options.intent) {
      const systemMessage = this.getSystemMessage(options.intent);
      messages.push({ role: 'system', content: systemMessage });
    }

    // Add conversation history
    if (options.history && options.history.length > 0) {
      const convertedHistory = this.convertLangChainMessages(options.history);
      messages.push(...convertedHistory.slice(-6));
    }

    // Add current prompt with context
    const contextualPrompt = this.buildContextualPrompt(prompt, options);
    messages.push({ role: 'user', content: contextualPrompt });

    return messages;
  }

  private convertLangChainMessages(messages: BaseMessage[]): AnthropicMessage[] {
    return messages.map(msg => ({
      role: msg.constructor.name === 'HumanMessage' ? 'user' as const : 'assistant' as const,
      content: msg.content as string
    }));
  }

  private getSystemMessage(intent: string): string {
    const systemMessages = {
      code_generation: `You are Claude, an expert Python developer specializing in sports betting analysis. 
        Generate clean, production-ready Python code with comprehensive error handling and documentation.
        Focus on pandas, numpy, matplotlib, and seaborn for data analysis and visualization.
        Always explain your code choices and include usage examples.`,
      
      strategy_analysis: `You are Claude, a professional sports betting analyst with expertise in statistical analysis and strategy development.
        Provide detailed quantitative analysis with specific recommendations and thorough risk assessments.
        Always include probability estimates, confidence intervals, and expected value calculations where applicable.
        Focus on data-driven insights and mathematical foundations.`,
      
      team_analysis: `You are Claude, a football analytics expert with deep knowledge of team performance metrics and tactical analysis.
        Analyze team data comprehensively including current form, injury impacts, tactical considerations, historical performance, and head-to-head records.
        Provide actionable insights for betting decisions with statistical backing.`,
      
      pattern_discovery: `You are Claude, a data scientist specializing in pattern recognition and trend analysis in sports betting markets.
        Identify statistically significant trends using rigorous analytical methods.
        Provide evidence-based insights with confidence levels and practical applications.
        Focus on patterns that have mathematical significance and betting value.`,
      
      general_query: `You are Claude, an AI assistant for QuantSports.ai, specializing in sports betting analysis and strategy development.
        Provide helpful, accurate, and well-reasoned information while emphasizing responsible gambling practices.
        Focus on educational content and data-driven insights.`
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

  private async callAnthropicAPI(messages: AnthropicMessage[]): Promise<AnthropicResponse> {
    const endpoint = 'https://api.anthropic.com/v1/messages';
    
    const body = {
      model: this.config.model || 'claude-3-sonnet-20240229',
      max_tokens: this.config.maxTokens || 2000,
      temperature: this.config.temperature || 0.7,
      messages: messages.filter(m => m.role !== 'system'),
      system: messages.find(m => m.role === 'system')?.content
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
    }

    return await response.json();
  }

  private async callAnthropicStreamAPI(messages: AnthropicMessage[]): Promise<ReadableStream> {
    const endpoint = 'https://api.anthropic.com/v1/messages';
    
    const body = {
      model: this.config.model || 'claude-3-sonnet-20240229',
      max_tokens: this.config.maxTokens || 2000,
      temperature: this.config.temperature || 0.7,
      messages: messages.filter(m => m.role !== 'system'),
      system: messages.find(m => m.role === 'system')?.content,
      stream: true
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Anthropic Stream API Error ${response.status}: ${response.statusText}`);
    }

    return response.body!;
  }

  private async *processAnthropicStream(stream: ReadableStream): AsyncIterable<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content_block_delta' && data.delta?.text) {
                yield data.delta.text;
              }
            } catch (e) {
              // Skip malformed JSON
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private extractTextFromResponse(response: AnthropicResponse): string {
    if (response.content && response.content.length > 0) {
      return response.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('');
    }
    return '';
  }

  private extractUsageData(response: AnthropicResponse): {
    tokens: number;
    cost?: number;
    inputTokens?: number;
    outputTokens?: number;
  } {
    const usage = response.usage;
    
    const inputTokens = usage?.input_tokens || 0;
    const outputTokens = usage?.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;

    // Calculate cost based on current Anthropic pricing (approximate)
    const inputCost = inputTokens * 0.000003; // $3 per 1M tokens
    const outputCost = outputTokens * 0.000015; // $15 per 1M tokens
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
        await new Promise(resolve => setTimeout(resolve, 30)); // Slightly faster than OpenAI simulation
      }
    }

    return streamGenerator();
  }

  private generateStreamId(): string {
    return `anthropic_stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private enhanceError(error: Error, attempt: number): Error {
    let message = `Anthropic Provider Error (attempt ${attempt}): ${error.message}`;
    
    if (error.message.includes('429')) {
      message += ' - Rate limit exceeded. Consider implementing request throttling.';
    } else if (error.message.includes('401')) {
      message += ' - Authentication failed. Check your Anthropic API key.';
    } else if (error.message.includes('overloaded')) {
      message += ' - Service overloaded. Try again in a few moments.';
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
    return this.config.model || 'claude-3-sonnet-20240229';
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
      const testMessages: AnthropicMessage[] = [
        { role: 'user', content: 'Test connection - please respond with "OK"' }
      ];
      
      await this.callAnthropicAPI(testMessages);
      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 6000 ? 'healthy' : 'degraded',
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