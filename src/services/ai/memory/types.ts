export interface SessionMemory {
  user_id: string;
  session_id: string;
  conversation_history: ConversationMessage[];
  context: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UserPreferences {
  user_id: string;
  language?: string;
  ai_provider_preference?: 'openai' | 'anthropic' | 'local' | 'auto';
  sports_interests?: string[];
  analysis_depth?: 'basic' | 'detailed' | 'expert';
  notification_settings?: Record<string, boolean>;
  ui_preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AIMemoryInterface {
  getSessionMemory(userId: string, sessionId?: string): Promise<SessionMemory | null>;
  saveSessionMemory(userId: string, memory: SessionMemory): Promise<void>;
  getUserPreferences(userId: string): Promise<UserPreferences | null>;
  saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void>;
  getConversationHistory(userId: string, sessionId?: string, limit?: number): Promise<ConversationMessage[]>;
  addToConversationHistory(userId: string, sessionId: string, message: ConversationMessage): Promise<void>;
  updateContext(userId: string, sessionId: string, context: Record<string, any>): Promise<void>;
  clearSession(userId: string, sessionId: string): Promise<void>;
  getAnalytics(userId: string): Promise<any>;
} 