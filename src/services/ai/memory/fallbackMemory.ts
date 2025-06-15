import { AIMemoryInterface, SessionMemory, UserPreferences } from './types';

/**
 * Fallback Memory System - Works without database
 * Provides basic memory functionality using localStorage and in-memory storage
 */
export class FallbackMemory implements AIMemoryInterface {
  private sessions: Map<string, any> = new Map();
  private preferences: Map<string, UserPreferences> = new Map();

  async getSessionMemory(userId: string, sessionId?: string): Promise<SessionMemory | null> {
    try {
      // Try localStorage first
      const storageKey = `ai_session_${userId}_${sessionId || 'default'}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        return JSON.parse(stored);
      }

      // Fallback to in-memory
      const memoryKey = `${userId}_${sessionId || 'default'}`;
      return this.sessions.get(memoryKey) || null;
    } catch (error) {
      console.log('Fallback memory: localStorage unavailable, using in-memory');
      const memoryKey = `${userId}_${sessionId || 'default'}`;
      return this.sessions.get(memoryKey) || null;
    }
  }

  async saveSessionMemory(userId: string, memory: SessionMemory): Promise<void> {
    try {
      // Try localStorage first
      const storageKey = `ai_session_${userId}_${memory.session_id || 'default'}`;
      localStorage.setItem(storageKey, JSON.stringify(memory));
    } catch (error) {
      console.log('Fallback memory: localStorage unavailable, using in-memory');
    }

    // Always save to in-memory as backup
    const memoryKey = `${userId}_${memory.session_id || 'default'}`;
    this.sessions.set(memoryKey, memory);
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      // Try localStorage first
      const storageKey = `ai_preferences_${userId}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        return JSON.parse(stored);
      }

      // Fallback to in-memory
      return this.preferences.get(userId) || null;
    } catch (error) {
      console.log('Fallback memory: localStorage unavailable, using in-memory');
      return this.preferences.get(userId) || null;
    }
  }

  async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    try {
      // Try localStorage first
      const storageKey = `ai_preferences_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch (error) {
      console.log('Fallback memory: localStorage unavailable, using in-memory');
    }

    // Always save to in-memory as backup
    this.preferences.set(userId, preferences);
  }

  async getConversationHistory(userId: string, sessionId?: string, limit: number = 10): Promise<any[]> {
    const memory = await this.getSessionMemory(userId, sessionId);
    if (!memory?.conversation_history) {
      return [];
    }

    return memory.conversation_history.slice(-limit);
  }

  async addToConversationHistory(userId: string, sessionId: string, message: any): Promise<void> {
    let memory = await this.getSessionMemory(userId, sessionId);
    
    if (!memory) {
      memory = {
        user_id: userId,
        session_id: sessionId,
        conversation_history: [],
        context: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    // Add message to history
    memory.conversation_history = memory.conversation_history || [];
    memory.conversation_history.push({
      ...message,
      timestamp: new Date().toISOString()
    });

    // Keep only last 50 messages to prevent memory bloat
    if (memory.conversation_history.length > 50) {
      memory.conversation_history = memory.conversation_history.slice(-50);
    }

    memory.updated_at = new Date().toISOString();
    await this.saveSessionMemory(userId, memory);
  }

  async updateContext(userId: string, sessionId: string, context: Record<string, any>): Promise<void> {
    let memory = await this.getSessionMemory(userId, sessionId);
    
    if (!memory) {
      memory = {
        user_id: userId,
        session_id: sessionId,
        conversation_history: [],
        context: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    // Merge context
    memory.context = { ...memory.context, ...context };
    memory.updated_at = new Date().toISOString();
    
    await this.saveSessionMemory(userId, memory);
  }

  async clearSession(userId: string, sessionId: string): Promise<void> {
    try {
      // Clear from localStorage
      const storageKey = `ai_session_${userId}_${sessionId}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.log('Fallback memory: localStorage unavailable');
    }

    // Clear from in-memory
    const memoryKey = `${userId}_${sessionId}`;
    this.sessions.delete(memoryKey);
  }

  async getAnalytics(userId: string): Promise<any> {
    // Simple analytics from localStorage/memory
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(`ai_session_${userId}`));
      const sessionCount = keys.length;
      
      return {
        total_sessions: sessionCount,
        total_messages: 0, // Would need to calculate from all sessions
        avg_session_length: 0,
        most_used_tools: [],
        created_at: new Date().toISOString()
      };
    } catch (error) {
      return {
        total_sessions: this.sessions.size,
        total_messages: 0,
        avg_session_length: 0,
        most_used_tools: [],
        created_at: new Date().toISOString()
      };
    }
  }
} 