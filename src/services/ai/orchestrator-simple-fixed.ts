import { SupabaseMemory } from './memory/supabaseMemory';

/**
 * Simplified AI Orchestrator with robust error handling
 * This version is designed to work reliably even when Supabase is not properly configured
 */
export interface SimpleAIRequest {
  query: string;
  userId?: string;
  notebookId?: string;  
  context?: Record<string, any>;
  provider?: 'openai' | 'anthropic' | 'local';
  streaming?: boolean;
}

export interface SimpleAIResponse {
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

export class SimpleAIOrchestrator {
  private memory: any;
  private memoryAvailable: boolean = false;

  constructor() {
    this.initializeMemory();
  }

  /**
   * Initialize memory with graceful fallback
   */
  private initializeMemory(): void {
    try {
      this.memory = new SupabaseMemory();
      this.memoryAvailable = true;
      console.log('✅ Simple AI Orchestrator - Memory system initialized');
    } catch (error) {
      console.warn('⚠️ Simple AI Orchestrator - Memory unavailable, using fallback:', error.message);
      this.memory = null;
      this.memoryAvailable = false;
    }
  }

  /**
   * Process AI request with robust error handling
   */
  async processRequest(request: SimpleAIRequest): Promise<SimpleAIResponse | AsyncIterable<string>> {
    const startTime = Date.now();
    
    try {
      // Load context if memory is available
      let conversationHistory: any[] = [];
      if (this.memoryAvailable && this.memory && request.userId) {
        try {
          conversationHistory = await this.memory.getConversationHistory?.(request.userId, request.notebookId) || [];
        } catch (error) {
          console.warn('Memory fetch failed, continuing without history:', error.message);
          this.memoryAvailable = false; // Disable memory for this session
        }
      }

      // Determine which provider to use
      const provider = this.selectProvider(request.provider);
      
      // Generate response based on provider
      let response: SimpleAIResponse;

      switch (provider) {
        case 'openai':
          response = await this.processWithOpenAI(request, conversationHistory);
          break;
        case 'anthropic':
          response = await this.processWithAnthropic(request, conversationHistory);
          break;
        case 'local':
          response = await this.processWithLocal(request, conversationHistory);
          break;
        default:
          response = await this.processFallback(request);
      }

      // Add execution time
      response.executionTime = Date.now() - startTime;
      response.provider = provider;

      // Save to memory if available
      if (this.memoryAvailable && this.memory && request.userId) {
        try {
          await this.memory.addToConversationHistory?.(request.userId, request.notebookId || 'default', {
            role: 'user',
            content: request.query,
            timestamp: new Date().toISOString()
          });
          
          await this.memory.addToConversationHistory?.(request.userId, request.notebookId || 'default', {
            role: 'assistant',
            content: response.text,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.warn('Failed to save conversation:', error.message);
        }
      }

      // Handle streaming if requested
      if (request.streaming) {
        return this.createStreamingResponse(response.text);
      }

      return response;

    } catch (error) {
      console.error('Simple AI Orchestrator Error:', error);
      
      const executionTime = Date.now() - startTime;
      return this.handleError(error as Error, request, executionTime);
    }
  }

  /**
   * Select the best available provider
   */
  private selectProvider(requested?: string): string {
    // Check what's available
    const hasOpenAI = !!import.meta.env.VITE_OPENAI_API_KEY;
    const hasAnthropic = !!import.meta.env.VITE_ANTHROPIC_API_KEY;
    const hasLocal = !!import.meta.env.VITE_LOCAL_LLM_ENDPOINT;

    // If specific provider requested and available, use it
    if (requested === 'openai' && hasOpenAI) return 'openai';
    if (requested === 'anthropic' && hasAnthropic) return 'anthropic';
    if (requested === 'local' && hasLocal) return 'local';

    // Auto-select best available
    if (hasOpenAI) return 'openai';
    if (hasAnthropic) return 'anthropic';
    if (hasLocal) return 'local';

    return 'fallback';
  }

  /**
   * Process with OpenAI
   */
  private async processWithOpenAI(request: SimpleAIRequest, history: any[]): Promise<SimpleAIResponse> {
    try {
      // Import OpenAI dynamically to avoid initialization errors
      const { OpenAI } = await import('openai');
      
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });

      const messages = [
        {
          role: 'system' as const,
          content: this.getSystemMessage(request.context)
        },
        ...history.slice(-6).map((msg: any) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: request.query
        }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        max_tokens: 2000
      });

      return {
        text: completion.choices[0]?.message?.content || 'No response generated',
        usage: {
          tokens: completion.usage?.total_tokens || 0,
          cost: (completion.usage?.total_tokens || 0) * 0.00003 // Rough estimate
        }
      };

    } catch (error) {
      throw new Error(`OpenAI Error: ${error.message}`);
    }
  }

  /**
   * Process with Anthropic
   */
  private async processWithAnthropic(request: SimpleAIRequest, history: any[]): Promise<SimpleAIResponse> {
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
          max_tokens: 2000,
          temperature: 0.7,
          system: this.getSystemMessage(request.context),
          messages: [
            ...history.slice(-6).map((msg: any) => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: request.query
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        text: data.content?.[0]?.text || 'No response generated',
        usage: {
          tokens: data.usage?.input_tokens + data.usage?.output_tokens || 0
        }
      };

    } catch (error) {
      throw new Error(`Anthropic Error: ${error.message}`);
    }
  }

  /**
   * Process with Local LLM
   */
  private async processWithLocal(request: SimpleAIRequest, history: any[]): Promise<SimpleAIResponse> {
    try {
      const endpoint = import.meta.env.VITE_LOCAL_LLM_ENDPOINT || 'http://localhost:1234/v1';
      
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'local-model',
          messages: [
            {
              role: 'system',
              content: this.getSystemMessage(request.context)
            },
            ...history.slice(-4).map((msg: any) => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: request.query
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`Local LLM Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        text: data.choices?.[0]?.message?.content || 'No response generated',
        usage: {
          tokens: 0 // Local doesn't track tokens
        }
      };

    } catch (error) {
      throw new Error(`Local LLM Error: ${error.message}`);
    }
  }

  /**
   * Fallback response when no providers are available
   */
  private async processFallback(request: SimpleAIRequest): Promise<SimpleAIResponse> {
    const query = request.query.toLowerCase();
    
    let fallbackResponse = "I'm currently operating in fallback mode due to AI service limitations. ";
    
    // Context-specific fallback responses
    if (query.includes('strategy') || query.includes('betting')) {
      fallbackResponse += `

**Betting Strategy Guidance:**
• Focus on value betting - look for odds that underestimate true probability
• Use bankroll management - never bet more than 2-5% on a single bet
• Track your bets and analyze performance over time
• Consider factors like team form, injuries, and historical matchups

**Analysis Approach:**
• Collect historical data for your sport of interest
• Calculate expected value for different betting scenarios
• Use statistical measures like ROI and win rate
• Test strategies on historical data before using real money

For detailed analysis and code generation, you'll need to configure an AI provider (OpenAI, Anthropic, or Local LLM).`;
    } else if (query.includes('code') || query.includes('python')) {
      fallbackResponse += `

**Code Guidance:**
• Use pandas for data manipulation
• matplotlib/seaborn for visualization  
• numpy for statistical calculations
• Consider using libraries like scikit-learn for machine learning

**Getting Started:**
\`\`\`python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Load your betting data
df = pd.read_csv('betting_data.csv')

# Basic analysis
roi = (df['winnings'] - df['stake']).sum() / df['stake'].sum()
win_rate = df['result'].value_counts(normalize=True)['win']
\`\`\`

For advanced code generation, configure an AI provider in your .env file.`;
    } else {
      fallbackResponse += `

**Available Resources:**
• Basic betting concepts and terminology
• General strategy guidance
• Historical data analysis approaches
• Risk management principles

**To unlock full capabilities:**
• Add VITE_OPENAI_API_KEY to .env for GPT-4 analysis
• Add VITE_ANTHROPIC_API_KEY for Claude analysis  
• Set VITE_LOCAL_LLM_ENDPOINT for local AI

I can provide general guidance, but detailed analysis requires AI provider configuration.`;
    }

    return {
      text: fallbackResponse,
      usage: { tokens: 0 }
    };
  }

  /**
   * Get system message based on context
   */
  private getSystemMessage(context?: Record<string, any>): string {
    const baseMessage = `You are an expert sports betting analyst and Python developer. You help users analyze betting data, develop strategies, and generate code for sports betting analysis.

Focus on:
- Providing accurate statistical analysis
- Generating clean, working Python code
- Explaining betting concepts clearly
- Emphasizing responsible gambling practices

Always include risk warnings and promote responsible betting.`;

    if (context?.conversation_type === 'betting_analysis') {
      return baseMessage + `\n\nContext: This is a betting analysis conversation focusing on sports data and strategy development.`;
    }

    if (context?.notebook_cells) {
      return baseMessage + `\n\nContext: This is a notebook environment. User is working on data analysis and code development. Previous cells context available.`;
    }

    return baseMessage;
  }

  /**
   * Create streaming response
   */
  private async *createStreamingResponse(text: string): AsyncIterable<string> {
    const words = text.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const chunk = i === 0 ? words[i] : ' ' + words[i];
      yield chunk;
      
      // Add a small delay for realistic streaming effect
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  }

  /**
   * Handle errors gracefully  
   */
  private handleError(error: Error, request: SimpleAIRequest, executionTime: number): SimpleAIResponse {
    console.error('Simple AI Orchestrator Error:', error);

    let errorMessage = "I encountered a technical difficulty. ";
    
    if (error.message.includes('fetch')) {
      errorMessage += "This appears to be a network connectivity issue. Please check your internet connection and try again.";
    } else if (error.message.includes('API')) {
      errorMessage += "There seems to be an issue with the AI service. This could be due to rate limiting, quota exceeded, or service unavailability.";
    } else if (error.message.includes('Supabase') || error.message.includes('406')) {
      errorMessage += "The database connection is unavailable, but I can still help with analysis. Some features like conversation history may be limited.";
    } else {
      errorMessage += "Please try rephrasing your question or contact support if the issue persists.";
    }

    errorMessage += "\n\n**What I can still help with:**\n• General betting analysis guidance\n• Basic code examples\n• Strategy concepts and best practices\n• Risk management principles";

    return {
      text: errorMessage,
      error: error.message,
      executionTime,
      usage: { tokens: 0 }
    };
  }

  /**
   * Get system status
   */
  getSystemStatus(): Record<string, any> {
    return {
      memory: this.memoryAvailable,
      providers: {
        openai: !!import.meta.env.VITE_OPENAI_API_KEY,
        anthropic: !!import.meta.env.VITE_ANTHROPIC_API_KEY,
        local: !!import.meta.env.VITE_LOCAL_LLM_ENDPOINT
      },
      fallback: true
    };
  }

  /**
   * Clear session if memory is available
   */
  async clearSession(userId: string, notebookId?: string): Promise<void> {
    if (this.memoryAvailable && this.memory) {
      try {
        await this.memory.clearSession?.(userId, notebookId || 'default');
      } catch (error) {
        console.warn('Failed to clear session:', error.message);
      }
    }
  }
} 