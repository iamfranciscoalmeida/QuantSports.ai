import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { EnhancedProviderConfig, QueryOptions, EnhancedAIResponse } from './enhanced-openai';

interface LocalLLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface LocalLLMResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model?: string;
}

export class EnhancedLocalLLMProvider {
  private config: EnhancedProviderConfig;
  private usageStats: {
    totalRequests: number;
    totalTokens: number;
    averageResponseTime: number;
    errorCount: number;
    fallbackCount: number;
  };
  private fallbackResponses: Map<string, string>;

  constructor(config: EnhancedProviderConfig) {
    this.config = config;
    this.usageStats = {
      totalRequests: 0,
      totalTokens: 0,
      averageResponseTime: 0,
      errorCount: 0,
      fallbackCount: 0
    };
    
    this.initializeFallbackResponses();
  }

  async query(prompt: string, options: QueryOptions = {}): Promise<EnhancedAIResponse> {
    const startTime = Date.now();
    
    try {
      this.usageStats.totalRequests++;

      // First try local LLM if available
      if (await this.isLocalLLMAvailable()) {
        const response = await this.queryLocalLLM(prompt, options);
        const responseTime = Date.now() - startTime;
        
        if (this.config.usageTracking) {
          this.updateUsageStats(response.usage || {}, responseTime);
        }

        return {
          text: response.choices[0]?.message?.content || '',
          provider: 'local',
          model: this.config.model || 'local-model',
          usage: this.extractUsageData(response),
          responseTime,
          streamId: options.streaming ? this.generateStreamId() : undefined
        };
      }

      // Fallback to intelligent response
      const fallbackResponse = this.generateFallbackResponse(prompt, options);
      this.usageStats.fallbackCount++;
      
      return {
        text: fallbackResponse,
        provider: 'local-fallback',
        model: 'fallback-assistant',
        responseTime: Date.now() - startTime,
        usage: { tokens: prompt.length + fallbackResponse.length }
      };

    } catch (error) {
      this.usageStats.errorCount++;
      
      // Always return fallback response on error
      const fallbackResponse = this.generateFallbackResponse(prompt, options);
      this.usageStats.fallbackCount++;
      
      return {
        text: fallbackResponse,
        provider: 'local-fallback',
        model: 'fallback-assistant',
        responseTime: Date.now() - startTime,
        usage: { tokens: prompt.length + fallbackResponse.length },
        error: `Local LLM failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async streamQuery(prompt: string, options: QueryOptions = {}): Promise<AsyncIterable<string>> {
    if (await this.isLocalLLMAvailable() && this.config.streaming) {
      try {
        return await this.streamLocalLLM(prompt, options);
      } catch (error) {
        console.warn('Local LLM streaming failed, using fallback:', error);
      }
    }

    // Fallback streaming
    const response = await this.query(prompt, options);
    return this.simulateStreaming(response.text);
  }

  private async isLocalLLMAvailable(): Promise<boolean> {
    try {
      const endpoint = this.config.endpoint || 'http://localhost:1234/v1';
      const response = await fetch(`${endpoint}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async queryLocalLLM(prompt: string, options: QueryOptions): Promise<LocalLLMResponse> {
    const endpoint = `${this.config.endpoint || 'http://localhost:1234/v1'}/chat/completions`;
    
    const messages = this.buildLocalLLMMessages(prompt, options);
    
    const body = {
      model: this.config.model || 'local-model',
      messages,
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens || 2000,
      stream: false
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`Local LLM Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  private async streamLocalLLM(prompt: string, options: QueryOptions): Promise<AsyncIterable<string>> {
    const endpoint = `${this.config.endpoint || 'http://localhost:1234/v1'}/chat/completions`;
    
    const messages = this.buildLocalLLMMessages(prompt, options);
    
    const body = {
      model: this.config.model || 'local-model',
      messages,
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens || 2000,
      stream: true
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Local LLM Stream Error ${response.status}: ${response.statusText}`);
    }

    return this.processLocalLLMStream(response.body!);
  }

  private buildLocalLLMMessages(prompt: string, options: QueryOptions): LocalLLMMessage[] {
    const messages: LocalLLMMessage[] = [];

    // Add system message based on intent
    if (options.intent) {
      messages.push({
        role: 'system',
        content: this.getSystemMessage(options.intent)
      });
    }

    // Add conversation history
    if (options.history && options.history.length > 0) {
      const convertedHistory = this.convertLangChainMessages(options.history);
      messages.push(...convertedHistory.slice(-4)); // Keep fewer messages for local models
    }

    // Add current prompt with context
    const contextualPrompt = this.buildContextualPrompt(prompt, options);
    messages.push({ role: 'user', content: contextualPrompt });

    return messages;
  }

  private convertLangChainMessages(messages: BaseMessage[]): LocalLLMMessage[] {
    return messages.map(msg => ({
      role: msg.constructor.name === 'HumanMessage' ? 'user' as const : 'assistant' as const,
      content: msg.content as string
    }));
  }

  private getSystemMessage(intent: string): string {
    const systemMessages = {
      code_generation: `You are a helpful Python developer specializing in sports betting analysis. 
        Generate clean, working code with proper error handling. Focus on pandas and matplotlib.`,
      
      strategy_analysis: `You are a sports betting analyst. Provide practical analysis and recommendations 
        based on statistical principles. Always mention risk management.`,
      
      team_analysis: `You are a football analyst. Analyze team performance using available data and 
        provide actionable insights for betting decisions.`,
      
      pattern_discovery: `You are a data analyst. Identify trends and patterns in sports data that 
        could be useful for betting strategies.`,
      
      general_query: `You are a helpful assistant for QuantSports.ai. Provide accurate information 
        about sports betting while promoting responsible gambling.`
    };

    return systemMessages[intent] || systemMessages.general_query;
  }

  private buildContextualPrompt(prompt: string, options: QueryOptions): string {
    let contextualPrompt = prompt;

    if (options.context && Object.keys(options.context).length > 0) {
      const relevantContext = Object.entries(options.context)
        .filter(([key, value]) => 
          value !== undefined && 
          value !== null && 
          key !== 'notebook_cells' // Skip large context items for local models
        )
        .slice(0, 3) // Limit context items
        .map(([key, value]) => `${key}: ${JSON.stringify(value).slice(0, 200)}`) // Truncate long values
        .join('\n');
      
      if (relevantContext) {
        contextualPrompt = `Context:\n${relevantContext}\n\nQuery: ${prompt}`;
      }
    }

    return contextualPrompt;
  }

  private async *processLocalLLMStream(stream: ReadableStream): AsyncIterable<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
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

  private extractUsageData(response: LocalLLMResponse): {
    tokens: number;
    inputTokens?: number;
    outputTokens?: number;
  } {
    const usage = response.usage;
    
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;
    const totalTokens = usage?.total_tokens || inputTokens + outputTokens;

    return {
      tokens: totalTokens,
      inputTokens,
      outputTokens
    };
  }

  private initializeFallbackResponses(): void {
    this.fallbackResponses = new Map([
      ['code', `# Python code for sports betting analysis
import pandas as pd
import numpy as np

# Load your data
# df = pd.read_csv('matches.csv')

# Example analysis
def analyze_team_performance(team_name):
    """Analyze team performance metrics"""
    # Your analysis logic here
    return f"Analysis for {team_name}"

# Remember to validate your data and handle errors
print("Code generated successfully!")
`],
      ['strategy', `## Betting Strategy Analysis

### Key Considerations:
1. **Value Betting**: Look for odds that don't reflect true probability
2. **Bankroll Management**: Use 1-3% of bankroll per bet
3. **Data Analysis**: Focus on recent form, head-to-head, and injuries

### Recommended Approach:
- Start with simple strategies (home/away analysis)
- Track all bets and calculate ROI
- Adjust based on performance

### Risk Management:
- Set daily/weekly limits  
- Never chase losses
- Consider market efficiency

*Remember: Past performance doesn't guarantee future results.*`],
      ['team', `## Team Analysis Framework

### Performance Metrics:
- **Recent Form**: Last 5-10 matches
- **Home/Away Split**: Venue-specific performance
- **Goal Statistics**: Scoring and conceding patterns
- **Head-to-Head**: Historical matchup results

### Key Factors:
1. **Injuries/Suspensions**: Impact on team strength
2. **Tactical Setup**: Formation and playing style
3. **Motivation**: League position, European qualification
4. **Squad Depth**: Rotation policy and fitness

### Analysis Tips:
- Weight recent matches more heavily
- Consider opposition strength
- Look for pattern breaks or trends`],
      ['pattern', `## Pattern Discovery in Sports Betting

### Common Patterns:
1. **Seasonal Trends**: Early/late season performance
2. **Venue Effects**: Home advantage variations
3. **Market Inefficiencies**: Odds discrepancies
4. **Time-based Patterns**: Weekend vs weekday performance

### Statistical Significance:
- Use sufficient sample sizes (30+ matches)
- Test patterns across multiple seasons
- Consider external factors (weather, schedule)

### Practical Applications:
- **Over/Under**: Team goal-scoring patterns
- **Both Teams to Score**: Defensive vulnerabilities
- **Handicap Betting**: Performance vs expectations

*Always validate patterns with out-of-sample testing.*`],
      ['general', `## QuantSports.ai - Your Sports Betting Assistant

I'm here to help with your sports betting analysis! While I may be running in offline mode, I can still provide:

### Available Services:
- **Strategy Development**: Creating and backtesting betting strategies
- **Team Analysis**: Performance metrics and insights
- **Code Generation**: Python scripts for data analysis
- **Pattern Recognition**: Identifying profitable trends

### Getting Started:
1. Ask specific questions about teams or strategies
2. Request code examples for data analysis
3. Explore betting concepts and methodologies

### Best Practices:
- Always bet responsibly
- Use proper bankroll management
- Keep detailed records
- Focus on long-term profitability

*How can I help you with your betting analysis today?*`]
    ]);
  }

  private generateFallbackResponse(prompt: string, options: QueryOptions): string {
    const lowerPrompt = prompt.toLowerCase();
    
    // Determine response type based on keywords
    if (lowerPrompt.includes('code') || lowerPrompt.includes('python') || lowerPrompt.includes('script')) {
      return this.fallbackResponses.get('code')!;
    }
    
    if (lowerPrompt.includes('strategy') || lowerPrompt.includes('simulate') || lowerPrompt.includes('backtest')) {
      return this.fallbackResponses.get('strategy')!;
    }
    
    if (lowerPrompt.includes('team') || lowerPrompt.includes('analyze') || 
        lowerPrompt.includes('arsenal') || lowerPrompt.includes('manchester')) {
      return this.fallbackResponses.get('team')!;
    }
    
    if (lowerPrompt.includes('pattern') || lowerPrompt.includes('trend') || lowerPrompt.includes('discover')) {
      return this.fallbackResponses.get('pattern')!;
    }
    
    // Default general response
    let response = this.fallbackResponses.get('general')!;
    
    // Add context-specific suggestions
    if (options.intent) {
      response += `\n\n**Detected Intent**: ${options.intent.replace('_', ' ')}\n`;
      response += `*I can provide more specific help once connected to the full AI system.*`;
    }
    
    return response;
  }

  private async simulateStreaming(text: string): Promise<AsyncIterable<string>> {
    async function* streamGenerator() {
      const words = text.split(' ');
      for (const word of words) {
        yield word + ' ';
        await new Promise(resolve => setTimeout(resolve, 20)); // Faster simulation
      }
    }

    return streamGenerator();
  }

  private generateStreamId(): string {
    return `local_stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateUsageStats(usage: any, responseTime: number): void {
    this.usageStats.totalTokens += usage.tokens || 0;
    
    // Update average response time
    const totalRequests = this.usageStats.totalRequests;
    this.usageStats.averageResponseTime = 
      (this.usageStats.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  isAvailable(): boolean {
    return true; // Always available due to fallback responses
  }

  getModel(): string {
    return this.config.model || 'local-model';
  }

  getUsageStats() {
    return { ...this.usageStats };
  }

  resetUsageStats(): void {
    this.usageStats = {
      totalRequests: 0,
      totalTokens: 0,
      averageResponseTime: 0,
      errorCount: 0,
      fallbackCount: 0
    };
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime?: number;
    error?: string;
    usingFallback?: boolean;
  }> {
    try {
      const isAvailable = await this.isLocalLLMAvailable();
      
      if (isAvailable) {
        const startTime = Date.now();
        await this.queryLocalLLM('Test', {});
        const responseTime = Date.now() - startTime;
        
        return {
          status: responseTime < 10000 ? 'healthy' : 'degraded',
          responseTime,
          usingFallback: false
        };
      } else {
        return {
          status: 'degraded',
          usingFallback: true,
          error: 'Local LLM not available, using fallback responses'
        };
      }
    } catch (error) {
      return {
        status: 'degraded',
        usingFallback: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 