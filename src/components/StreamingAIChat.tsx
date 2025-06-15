import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Zap, Activity, AlertCircle, CheckCircle, Loader2, Settings, BarChart3 } from 'lucide-react';
import { EnhancedAIOrchestrator, AIRequest, AIResponse } from '../services/ai/orchestrator-enhanced';
import { MarkdownRenderer } from './MarkdownRenderer';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  toolsUsed?: string[];
  provider?: string;
  executionTime?: number;
  streaming?: boolean;
  error?: string;
}

interface ProviderStatus {
  name: string;
  available: boolean;
  responseTime?: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
}

export const StreamingAIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [orchestrator] = useState(() => new EnhancedAIOrchestrator());
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic' | 'local'>('openai');
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load system status on mount
    loadSystemStatus();
    
    // Add welcome message
    setMessages([{
      id: '1',
      content: `# 🚀 Welcome to Enhanced AI Assistant

I'm your upgraded AI assistant with access to multiple providers and specialized tools for sports betting analysis. Here's what's new:

## ✨ **New Capabilities**
- **🔄 Real-time streaming** - Watch responses appear in real-time
- **🎯 Intelligent routing** - Automatically select the best AI provider
- **🛠️ Specialized tools** - Strategy simulation, team analysis, code generation
- **💾 Persistent memory** - I remember our conversation context
- **📊 Performance monitoring** - Track AI system health and usage

## 🎮 **Try These Examples**
- "Simulate a home win strategy for Arsenal"
- "Analyze Liverpool's recent performance" 
- "Generate Python code to calculate team form"
- "Discover patterns in over 2.5 goals markets"
- "What's the status of all AI providers?"

*Ready to help with your betting analysis! What would you like to explore?*`,
      isUser: false,
      timestamp: new Date(),
      provider: 'system'
    }]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSystemStatus = async () => {
    try {
      const systemStatus = orchestrator.getSystemStatus();
      const statuses: ProviderStatus[] = [];

      for (const [providerName, isAvailable] of Object.entries(systemStatus.providers)) {
        statuses.push({
          name: providerName,
          available: isAvailable,
          status: isAvailable ? 'healthy' : 'unhealthy'
        });
      }

      setProviderStatuses(statuses);
    } catch (error) {
      console.warn('Failed to load system status:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // Create AI request
    const request: AIRequest = {
      query: userMessage.content,
      userId: 'demo-user',
      provider: selectedProvider,
      streaming: streamingEnabled,
      context: {
        conversation_length: messages.length,
        last_provider: messages[messages.length - 1]?.provider,
        user_preferences: {
          streaming: streamingEnabled,
          preferred_provider: selectedProvider
        }
      }
    };

    try {
      const response = await orchestrator.processRequest(request);

      if (streamingEnabled && typeof response !== 'string' && Symbol.asyncIterator in response) {
        // Handle streaming response
        await handleStreamingResponse(response as AsyncIterable<string>, userMessage.id);
      } else {
        // Handle regular response
        const aiResponse = response as AIResponse;
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiResponse.text,
          isUser: false,
          timestamp: new Date(),
          toolsUsed: aiResponse.toolsUsed,
          provider: aiResponse.provider,
          executionTime: aiResponse.executionTime,
          error: aiResponse.error
        };

        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `❌ **Error**: ${error instanceof Error ? error.message : 'Unknown error occurred'}

I'm still here to help! Try:
- Rephrasing your question
- Using simpler terms
- Asking about a different topic`,
        isUser: false,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'error-handler'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
      setCurrentStreamId(null);
    }
  };

  const handleStreamingResponse = async (stream: AsyncIterable<string>, requestId: string) => {
    const streamId = `stream-${Date.now()}`;
    setCurrentStreamId(streamId);

    // Create initial streaming message
    const streamingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      isUser: false,
      timestamp: new Date(),
      streaming: true,
      provider: selectedProvider
    };

    setMessages(prev => [...prev, streamingMessage]);

    let fullContent = '';
    const startTime = Date.now();

    try {
      for await (const chunk of stream) {
        if (currentStreamId !== streamId) break; // Stop if new request started
        
        fullContent += chunk;
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === streamingMessage.id 
              ? { ...msg, content: fullContent }
              : msg
          )
        );

        // Small delay to make streaming visible
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Mark streaming as complete
      const executionTime = Date.now() - startTime;
      setMessages(prev => 
        prev.map(msg => 
          msg.id === streamingMessage.id 
            ? { ...msg, streaming: false, executionTime }
            : msg
        )
      );

    } catch (error) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === streamingMessage.id 
            ? { 
                ...msg, 
                streaming: false, 
                error: error instanceof Error ? error.message : 'Streaming error',
                content: fullContent || '❌ Streaming interrupted'
              }
            : msg
        )
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getProviderIcon = (provider?: string) => {
    switch (provider) {
      case 'openai': return '🤖';
      case 'anthropic': return '🧠';
      case 'local': return '💻';
      case 'system': return '⚙️';
      case 'error-handler': return '🚨';
      default: return '🤖';
    }
  };

  const getStatusColor = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'unhealthy': return 'text-red-500';
    }
  };

  const getProviderStatusIndicator = (available: boolean) => {
    return available ? (
      <CheckCircle className="w-3 h-3 text-green-500" />
    ) : (
      <AlertCircle className="w-3 h-3 text-red-500" />
    );
  };

  const exampleQueries = [
    "Simulate a betting strategy for Arsenal home games",
    "Analyze Manchester City's recent form",
    "Generate code to calculate team statistics",
    "Find patterns in under 2.5 goals markets",
    "What's the system status?"
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Enhanced AI Assistant</h1>
            </div>
            <div className="flex items-center space-x-2">
              {providerStatuses.map(status => (
                <div key={status.name} className="flex items-center space-x-1">
                  {getProviderStatusIndicator(status.available)}
                  <span className={`text-sm font-medium ${getStatusColor(status.status)}`}>
                    {status.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Provider:</span>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
                disabled={isStreaming}
              >
                <option value="openai">OpenAI (GPT-4)</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="local">Local LLM</option>
              </select>
            </div>

            <button
              onClick={() => setStreamingEnabled(!streamingEnabled)}
              className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
                streamingEnabled 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              disabled={isStreaming}
            >
              <Activity className="w-4 h-4" />
              <span>{streamingEnabled ? 'Streaming ON' : 'Streaming OFF'}</span>
            </button>

            <button
              onClick={() => setShowSystemInfo(!showSystemInfo)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showSystemInfo && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {providerStatuses.map(status => (
                <div key={status.name} className="flex items-center justify-between">
                  <span className="font-medium">{status.name}:</span>
                  <span className={getStatusColor(status.status)}>
                    {status.status}
                    {status.responseTime && ` (${status.responseTime}ms)`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.isUser ? 'justify-end' : 'justify-start'
            }`}
          >
            {!message.isUser && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm">{getProviderIcon(message.provider)}</span>
                </div>
              </div>
            )}

            <div
              className={`max-w-3xl rounded-lg px-4 py-3 ${
                message.isUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {message.isUser ? (
                <p className="text-white">
                  {message.content}
                </p>
              ) : (
                <MarkdownRenderer 
                  content={message.content} 
                  className="prose prose-sm max-w-none text-gray-900" 
                />
              )}

              {/* Message metadata */}
              {!message.isUser && (
                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    {message.provider && (
                      <span className="flex items-center space-x-1">
                        <span>{getProviderIcon(message.provider)}</span>
                        <span>{message.provider}</span>
                      </span>
                    )}
                    
                    {message.toolsUsed && message.toolsUsed.length > 0 && (
                      <span className="flex items-center space-x-1">
                        <BarChart3 className="w-3 h-3" />
                        <span>{message.toolsUsed.join(', ')}</span>
                      </span>
                    )}

                    {message.executionTime && (
                      <span>{message.executionTime}ms</span>
                    )}

                    {message.streaming && (
                      <span className="flex items-center space-x-1 text-blue-500">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>streaming...</span>
                      </span>
                    )}

                    {message.error && (
                      <span className="text-red-500 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>error</span>
                      </span>
                    )}
                  </div>

                  <span>{message.timestamp.toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            {message.isUser && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Example queries */}
        {messages.length <= 1 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 font-medium">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => setInput(query)}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                  disabled={isStreaming}
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about betting strategies, team analysis, or code generation..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={input.split('\n').length}
              disabled={isStreaming}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={isStreaming || !input.trim()}
            className={`p-3 rounded-lg transition-colors ${
              isStreaming || !input.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isStreaming ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>
            {streamingEnabled ? '🔴 Live streaming' : '⚪ Standard responses'} • 
            Provider: {getProviderIcon(selectedProvider)} {selectedProvider}
          </span>
        </div>
      </div>
    </div>
  );
}; 