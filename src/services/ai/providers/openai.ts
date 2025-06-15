import { ChatOpenAI } from '@langchain/openai';
import { AIResponse } from '../orchestrator';

export interface ProviderConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface QueryOptions {
  context?: Record<string, any>;
  history?: any[];
  streaming?: boolean;
}

export class OpenAIProvider {
  public llm: ChatOpenAI;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.llm = new ChatOpenAI({
      apiKey: config.apiKey,
      model: config.model || 'gpt-4-turbo-preview',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 2000
    });
  }

  async query(prompt: string, options: QueryOptions = {}): Promise<AIResponse> {
    try {
      const response = await this.llm.invoke([
        {
          role: 'user',
          content: this.buildPromptWithContext(prompt, options)
        }
      ]);

      return {
        text: response.content as string,
        provider: 'openai',
        model: this.config.model || 'gpt-4-turbo-preview',
        usage: {
          tokens: response.usage_metadata?.total_tokens || 0
        }
      };
    } catch (error) {
      console.error('OpenAI Provider Error:', error);
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
    return !!this.config.apiKey;
  }

  getModel(): string {
    return this.config.model || 'gpt-4-turbo-preview';
  }

  async streamQuery(prompt: string, options: QueryOptions = {}): Promise<AsyncIterable<string>> {
    const stream = await this.llm.stream([
      {
        role: 'user',
        content: this.buildPromptWithContext(prompt, options)
      }
    ]);

    async function* generateTokens() {
      for await (const chunk of stream) {
        if (chunk.content) {
          yield chunk.content as string;
        }
      }
    }

    return generateTokens();
  }
} 