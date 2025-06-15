import { AIResponse } from '../orchestrator';
import { ProviderConfig, QueryOptions } from './openai';

export interface LocalLLMConfig {
  endpoint: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class LocalLLMProvider {
  private config: LocalLLMConfig;

  constructor(config: LocalLLMConfig) {
    this.config = config;
  }

  async query(prompt: string, options: QueryOptions = {}): Promise<AIResponse> {
    try {
      // Try OpenAI-compatible endpoint first (LM Studio, etc.)
      const response = await fetch(`${this.config.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer not-needed' // Some local servers expect this
        },
        body: JSON.stringify({
          model: this.config.model || 'local-model',
          messages: [
            {
              role: 'system',
              content: 'You are an expert AI assistant for sports betting analysis.'
            },
            {
              role: 'user',
              content: this.buildPromptWithContext(prompt, options)
            }
          ],
          temperature: this.config.temperature || 0.7,
          max_tokens: this.config.maxTokens || 2000
        })
      });

      if (!response.ok) {
        // Fallback to Ollama API format
        return this.queryOllama(prompt, options);
      }

      const data = await response.json();
      
      return {
        text: data.choices[0]?.message?.content || 'No response from local LLM',
        provider: 'local',
        model: this.config.model || 'local-model',
        usage: {
          tokens: data.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      console.error('Local LLM Provider Error:', error);
      // Return fallback response instead of throwing
      return this.getFallbackResponse(prompt);
    }
  }

  private async queryOllama(prompt: string, options: QueryOptions): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.config.endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model || 'llama2',
          prompt: this.buildPromptWithContext(prompt, options),
          stream: false,
          options: {
            temperature: this.config.temperature || 0.7,
            num_predict: this.config.maxTokens || 2000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        text: data.response || 'No response from Ollama',
        provider: 'local',
        model: this.config.model || 'llama2',
        usage: {
          tokens: 0 // Ollama doesn't always provide token counts
        }
      };
    } catch (error) {
      console.error('Ollama Provider Error:', error);
      return this.getFallbackResponse(prompt);
    }
  }

  private buildPromptWithContext(prompt: string, options: QueryOptions): string {
    let contextualPrompt = prompt;

    if (options.context) {
      const contextStr = Object.entries(options.context)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n');
      
      contextualPrompt = `Context:\n${contextStr}\n\nQuery: ${prompt}`;
    }

    if (options.history && options.history.length > 0) {
      const historyStr = options.history
        .slice(-4) // Fewer for local models
        .map(msg => `${msg.role || 'user'}: ${msg.content}`)
        .join('\n');
      
      contextualPrompt = `Recent conversation:\n${historyStr}\n\n${contextualPrompt}`;
    }

    return contextualPrompt;
  }

  private getFallbackResponse(prompt: string): AIResponse {
    // Generate basic mock responses for common betting queries
    const lowerPrompt = prompt.toLowerCase();
    
    let fallbackText = "I'm currently in offline mode. ";
    
    if (lowerPrompt.includes('strategy')) {
      fallbackText += "Here's a basic betting strategy to consider: Focus on home teams with strong recent form, especially when facing teams with poor away records. Always manage your bankroll with proper staking.";
    } else if (lowerPrompt.includes('team') || lowerPrompt.includes('analysis')) {
      fallbackText += "For team analysis, consider recent form, head-to-head records, injuries, and home/away performance. Historical data shows home advantage is significant in most leagues.";
    } else if (lowerPrompt.includes('pattern') || lowerPrompt.includes('trend')) {
      fallbackText += "Common betting patterns include: home team advantage, over/under trends based on weather and team styles, and value in underdog bets against public favorites.";
    } else {
      fallbackText += "I can help with betting strategy analysis, team performance insights, and pattern discovery when online. Please check your connection to access full AI capabilities.";
    }
    
    return {
      text: fallbackText,
      provider: 'local-fallback',
      model: 'offline-mode',
      error: 'Local LLM unavailable, using fallback response'
    };
  }

  isAvailable(): boolean {
    // For now, assume local LLM might be available
    // In production, you'd ping the endpoint to check
    return true;
  }

  getModel(): string {
    return this.config.model || 'local-model';
  }

  async streamQuery(prompt: string, options: QueryOptions = {}): Promise<AsyncIterable<string>> {
    // For local models, implement basic streaming
    const response = await this.query(prompt, options);
    
    async function* generateTokens() {
      // Simulate streaming by yielding words
      const words = response.text.split(' ');
      for (const word of words) {
        yield word + ' ';
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for streaming effect
      }
    }

    return generateTokens();
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/health`, {
        method: 'GET',
        timeout: 5000
      } as any);
      return response.ok;
    } catch {
      try {
        // Try Ollama health check
        const response = await fetch(`${this.config.endpoint}/api/tags`, {
          method: 'GET',
          timeout: 5000
        } as any);
        return response.ok;
      } catch {
        return false;
      }
    }
  }
} 