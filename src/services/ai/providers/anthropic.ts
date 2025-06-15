import { AIResponse } from '../orchestrator';
import { ProviderConfig, QueryOptions } from './openai';

export class AnthropicProvider {
  private config: ProviderConfig;
  private apiKey: string;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.apiKey = config.apiKey;
  }

  async query(prompt: string, options: QueryOptions = {}): Promise<AIResponse> {
    try {
      // Using direct fetch since @langchain/anthropic might not be available
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-3-sonnet-20240229',
          max_tokens: this.config.maxTokens || 2000,
          temperature: this.config.temperature || 0.7,
          messages: [
            {
              role: 'user',
              content: this.buildPromptWithContext(prompt, options)
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        text: data.content[0]?.text || 'No response from Claude',
        provider: 'anthropic',
        model: this.config.model || 'claude-3-sonnet-20240229',
        usage: {
          tokens: data.usage?.input_tokens + data.usage?.output_tokens || 0
        }
      };
    } catch (error) {
      console.error('Anthropic Provider Error:', error);
      throw error;
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
        .slice(-6) // Last 3 exchanges
        .map(msg => `${msg.role || 'user'}: ${msg.content}`)
        .join('\n');
      
      contextualPrompt = `Recent conversation:\n${historyStr}\n\n${contextualPrompt}`;
    }

    return contextualPrompt;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  getModel(): string {
    return this.config.model || 'claude-3-sonnet-20240229';
  }

  async streamQuery(prompt: string, options: QueryOptions = {}): Promise<AsyncIterable<string>> {
    // For now, return a simple async generator that yields the full response
    // In a full implementation, you'd use the streaming API
    const response = await this.query(prompt, options);
    
    async function* generateTokens() {
      yield response.text;
    }

    return generateTokens();
  }
} 