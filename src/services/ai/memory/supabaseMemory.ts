import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AISession } from '../orchestrator';
import { BaseMessage, AIMessage, HumanMessage } from '@langchain/core/messages';

export interface AISessionRecord {
  id?: string;
  user_id: string;
  notebook_id?: string;
  context: Record<string, any>;
  preferences: Record<string, any>;
  messages: Array<{ role: string; content: string; timestamp: string }>;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseMemory {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Get or create session for user
   */
  async getSession(userId: string, notebookId?: string): Promise<AISession | null> {
    try {
      const { data, error } = await this.supabase
        .from('ai_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('notebook_id', notebookId || null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No session found, return null to create new
          return null;
        }
        throw error;
      }

      if (!data) return null;

      // Convert stored messages back to LangChain format
      const messages: BaseMessage[] = data.messages.map((msg: any) => {
        if (msg.role === 'assistant') {
          return new AIMessage(msg.content);
        } else {
          return new HumanMessage(msg.content);
        }
      });

      return {
        userId: data.user_id,
        notebookId: data.notebook_id,
        messages,
        context: data.context || {},
        preferences: data.preferences || {}
      };
    } catch (error) {
      console.error('Failed to get session from Supabase:', error);
      return null;
    }
  }

  /**
   * Save session to Supabase
   */
  async saveSession(session: AISession): Promise<void> {
    try {
      // Convert LangChain messages to storable format
      const storableMessages = session.messages.map(msg => ({
        role: msg.constructor.name === 'AIMessage' ? 'assistant' : 'user',
        content: msg.content as string,
        timestamp: new Date().toISOString()
      }));

      const sessionRecord: Partial<AISessionRecord> = {
        user_id: session.userId,
        notebook_id: session.notebookId,
        context: session.context,
        preferences: session.preferences,
        messages: storableMessages,
        updated_at: new Date().toISOString()
      };

      // Try to update existing session first
      const { data: existingData } = await this.supabase
        .from('ai_sessions')
        .select('id')
        .eq('user_id', session.userId)
        .eq('notebook_id', session.notebookId || null)
        .single();

      if (existingData) {
        // Update existing session
        const { error } = await this.supabase
          .from('ai_sessions')
          .update(sessionRecord)
          .eq('id', existingData.id);

        if (error) throw error;
      } else {
        // Create new session
        const { error } = await this.supabase
          .from('ai_sessions')
          .insert({
            ...sessionRecord,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Failed to save session to Supabase:', error);
      // Don't throw - memory saving should be non-blocking
    }
  }

  /**
   * Clear session for user
   */
  async clearSession(userId: string, notebookId?: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_sessions')
        .delete()
        .eq('user_id', userId)
        .eq('notebook_id', notebookId || null);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Get user preferences across all sessions
   */
  async getUserPreferences(userId: string): Promise<Record<string, any>> {
    try {
      const { data, error } = await this.supabase
        .from('ai_sessions')
        .select('preferences')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return {};
      
      return data.preferences || {};
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {};
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: Record<string, any>): Promise<void> {
    try {
      // Get all sessions for user and update preferences
      const { data: sessions } = await this.supabase
        .from('ai_sessions')
        .select('id, preferences')
        .eq('user_id', userId);

      if (sessions && sessions.length > 0) {
        // Update all sessions with merged preferences
        const updates = sessions.map(session => ({
          id: session.id,
          preferences: { ...session.preferences, ...preferences },
          updated_at: new Date().toISOString()
        }));

        for (const update of updates) {
          await this.supabase
            .from('ai_sessions')
            .update({
              preferences: update.preferences,
              updated_at: update.updated_at
            })
            .eq('id', update.id);
        }
      }
    } catch (error) {
      console.error('Failed to update user preferences:', error);
    }
  }

  /**
   * Get conversation history for analysis
   */
  async getConversationHistory(userId: string, limit: number = 50): Promise<Array<{ role: string; content: string; timestamp: string }>> {
    try {
      const { data, error } = await this.supabase
        .from('ai_sessions')
        .select('messages')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(5); // Last 5 sessions

      if (error) throw error;

      const allMessages: Array<{ role: string; content: string; timestamp: string }> = [];
      
      data?.forEach(session => {
        if (session.messages && Array.isArray(session.messages)) {
          allMessages.push(...session.messages);
        }
      });

      // Sort by timestamp and return latest
      return allMessages
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      return [];
    }
  }

  /**
   * Search conversations by content
   */
  async searchConversations(userId: string, query: string): Promise<Array<{ 
    content: string; 
    role: string; 
    timestamp: string; 
    notebookId?: string;
  }>> {
    try {
      const { data, error } = await this.supabase
        .from('ai_sessions')
        .select('messages, notebook_id')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const results: Array<{ content: string; role: string; timestamp: string; notebookId?: string }> = [];
      const searchTerms = query.toLowerCase().split(' ');

      data?.forEach(session => {
        if (session.messages && Array.isArray(session.messages)) {
          session.messages.forEach((msg: any) => {
            const content = msg.content.toLowerCase();
            const hasAllTerms = searchTerms.every(term => content.includes(term));
            
            if (hasAllTerms) {
              results.push({
                content: msg.content,
                role: msg.role,
                timestamp: msg.timestamp,
                notebookId: session.notebook_id
              });
            }
          });
        }
      });

      return results.slice(0, 20); // Limit results
    } catch (error) {
      console.error('Failed to search conversations:', error);
      return [];
    }
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(userId: string): Promise<{
    totalSessions: number;
    totalMessages: number;
    averageMessagesPerSession: number;
    mostActiveNotebook?: string;
    recentActivity: Array<{ date: string; messageCount: number }>;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('ai_sessions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const totalSessions = data?.length || 0;
      let totalMessages = 0;
      const notebookActivity: Record<string, number> = {};
      const dailyActivity: Record<string, number> = {};

      data?.forEach(session => {
        const messageCount = session.messages?.length || 0;
        totalMessages += messageCount;

        if (session.notebook_id) {
          notebookActivity[session.notebook_id] = (notebookActivity[session.notebook_id] || 0) + messageCount;
        }

        // Track daily activity
        if (session.updated_at) {
          const date = new Date(session.updated_at).toISOString().split('T')[0];
          dailyActivity[date] = (dailyActivity[date] || 0) + messageCount;
        }
      });

      const mostActiveNotebook = Object.entries(notebookActivity)
        .sort(([,a], [,b]) => b - a)[0]?.[0];

      const recentActivity = Object.entries(dailyActivity)
        .map(([date, messageCount]) => ({ date, messageCount }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 7); // Last 7 days

      return {
        totalSessions,
        totalMessages,
        averageMessagesPerSession: totalSessions > 0 ? totalMessages / totalSessions : 0,
        mostActiveNotebook,
        recentActivity
      };
    } catch (error) {
      console.error('Failed to get session analytics:', error);
      return {
        totalSessions: 0,
        totalMessages: 0,
        averageMessagesPerSession: 0,
        recentActivity: []
      };
    }
  }
} 