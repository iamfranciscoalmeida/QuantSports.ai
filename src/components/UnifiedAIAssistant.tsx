import React, { useState } from 'react';
import { AIOrchestrator } from '@/services/ai/orchestrator-simple';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bot, Code, TrendingUp, Brain } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  provider?: string;
  error?: string;
}

export const UnifiedAIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orchestrator] = useState(() => new AIOrchestrator());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await orchestrator.processRequest({
        query: input,
        userId: 'demo-user', // In production, get from auth
        context: {
          previous_messages: messages.slice(-5) // Last 5 messages for context
        }
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        provider: response.provider,
        error: response.error
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    setMessages([]);
    await orchestrator.clearSession('demo-user');
  };

  const getProviderStatus = () => {
    return orchestrator.getProviderStatus();
  };

  const providerStatus = getProviderStatus();

  const exampleQueries = [
    {
      text: "Generate code to analyze Arsenal's home performance",
      icon: <Code className="w-4 h-4" />,
      category: "Code Generation"
    },
    {
      text: "Simulate a strategy betting on home teams with odds 1.5-2.0",
      icon: <TrendingUp className="w-4 h-4" />,
      category: "Strategy Analysis"
    },
    {
      text: "What patterns exist in over/under markets this season?",
      icon: <Brain className="w-4 h-4" />,
      category: "Pattern Discovery"
    }
  ];

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            Unified AI Assistant
            <Badge variant="outline" className="ml-auto">
              v2.0 - Orchestrated
            </Badge>
          </CardTitle>
          <div className="flex gap-2 text-sm">
            <span className="text-gray-600">Provider Status:</span>
            {Object.entries(providerStatus).map(([provider, status]) => (
              <Badge 
                key={provider} 
                variant={status ? "default" : "destructive"}
                className="text-xs"
              >
                {provider}: {status ? "✓" : "✗"}
              </Badge>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Example Queries */}
      {messages.length === 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Try these examples:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {exampleQueries.map((query, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => setInput(query.text)}
                >
                  <div className="flex items-start gap-3">
                    {query.icon}
                    <div>
                      <div className="text-sm font-medium">{query.category}</div>
                      <div className="text-xs text-gray-600">{query.text}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <Card className="flex-1 mb-4 overflow-hidden">
        <CardContent className="h-full p-0">
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <Bot className="w-3 h-3" />
                      {message.provider && (
                        <Badge variant="outline" className="text-xs">
                          {message.provider}
                        </Badge>
                      )}
                      {message.error && (
                        <Badge variant="destructive" className="text-xs">
                          Error
                        </Badge>
                      )}
                    </div>
                  )}
                  {message.role === 'user' ? (
                    <div className="text-white">
                      {message.content}
                    </div>
                  ) : (
                    <MarkdownRenderer 
                      content={message.content} 
                      className="prose prose-sm max-w-none text-gray-900" 
                    />
                  )}
                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600">
                      AI is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Input */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about betting strategies, code generation, or data analysis..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Send'
              )}
            </Button>
            {messages.length > 0 && (
              <Button type="button" variant="outline" onClick={clearChat}>
                Clear
              </Button>
            )}
          </form>
          <div className="text-xs text-gray-500 mt-2">
            🧠 Powered by Unified AI Orchestrator - Intelligent routing, memory, and fallbacks
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 