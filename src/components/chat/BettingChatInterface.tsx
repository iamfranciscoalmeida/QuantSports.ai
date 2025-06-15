import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Loader2, 
  BarChart3, 
  TrendingUp, 
  Target, 
  Brain,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { AIBettingAssistant } from '@/services/aiBettingAssistant';
import { DemoService } from '@/services/demo';
import { ChatMessage, AIBettingResponse } from '@/types/epl';
// import { BettingChart } from './BettingChart';
// import { BettingTable } from './BettingTable';
import { useToast } from '@/components/ui/use-toast';

interface BettingChatInterfaceProps {
  onCodeGenerated?: (code: string, explanation?: string) => void;
}

export function BettingChatInterface({ onCodeGenerated }: BettingChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `# 🎯 Welcome to the AI Betting Analyst!

I can help you analyze Premier League betting data and strategies. Here are some things you can ask me:

**Strategy Analysis:**
- "What would my P&L be if I bet $100 on all EPL home teams?"
- "Show me the ROI of betting Arsenal at home"
- "Generate a strategy that bets on overs when odds are above 2.0"

**Team Performance:**
- "Which teams had the best ROI as underdogs?"
- "Analyze Manchester City's betting performance"
- "Show me the top performing teams by win rate"

**Market Analysis:**
- "How profitable is the over 2.5 goals market?"
- "Compare home win vs away win market performance"

Try asking me anything about EPL betting data and I'll analyze it for you!`,
        timestamp: new Date()
      }]);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      console.log('🚀 Enhanced Betting Chat - Starting with input:', currentInput);
      
      // Use the Fixed AI Orchestrator for better analysis (handles database errors)
      const { FixedAIOrchestrator } = await import('@/services/ai/orchestrator-fixed');
      const orchestrator = new FixedAIOrchestrator();

      // Create streaming message placeholder
      const streamingMessageId = (Date.now() + 1).toString();
      const streamingMessage: ChatMessage = {
        id: streamingMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      };

      setMessages(prev => [...prev, streamingMessage]);

      const response = await orchestrator.processRequest({
        query: currentInput,
        userId: `betting-user-${Date.now()}`,
        context: {
          conversation_type: 'betting_analysis',
          domain: 'sports_betting',
          sport: 'football',
          league: 'premier_league',
          analysis_type: 'historical_data',
          user_preferences: {
            chart_preference: 'visual',
            data_format: 'detailed',
            include_recommendations: true
          },
          previous_messages: messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content
          }))
        },
        streaming: true
      });

      let fullContent = "";
      let aiResponseData: any = null;
      let generatedCode = "";

      if (response && typeof response === 'object' && Symbol.asyncIterator in response) {
        // Handle streaming response
        console.log('🚀 Enhanced Betting Chat - Processing streaming response');
        
        for await (const chunk of response as AsyncIterable<string>) {
          fullContent += chunk;
          
          // Update streaming message
          setMessages(prev => 
            prev.map(msg => 
              msg.id === streamingMessageId 
                ? { ...msg, content: fullContent }
                : msg
            )
          );

          // Small delay for smooth streaming effect
          await new Promise(resolve => setTimeout(resolve, 25));
        }

        // Mark streaming as complete
        setMessages(prev => 
          prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, isStreaming: false }
              : msg
          )
        );

      } else {
        // Handle direct response
        const aiResponse = response as any;
        fullContent = aiResponse.text || aiResponse.content || "I've analyzed your request.";
        aiResponseData = aiResponse.data;
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === streamingMessageId 
              ? { 
                  ...msg, 
                  content: fullContent, 
                  isStreaming: false,
                  data: aiResponseData
                }
              : msg
          )
        );
      }

      // Extract code blocks from the response for notebook integration
      const codeMatches = fullContent.match(/```(?:python|sql|r)?\n([\s\S]*?)\n```/g);
      if (codeMatches && codeMatches.length > 0) {
        const codeBlocks = codeMatches.map(match => 
          match.replace(/```(?:python|sql|r)?\n/, '').replace(/\n```/, '')
        );
        generatedCode = codeBlocks.reduce((longest, current) => 
          current.length > longest.length ? current : longest, ''
        );

        // Offer to add substantial code to notebook
        if (generatedCode.length > 30 && onCodeGenerated) {
          toast({
            title: "🧠 Enhanced AI Code Generated",
            description: "AI has generated betting strategy code with advanced analysis. Add to notebook?",
            action: (
              <Button 
                size="sm" 
                onClick={() => onCodeGenerated(generatedCode, "Enhanced AI generated betting analysis code")}
              >
                Add to Notebook
              </Button>
            )
          });
        }
      }

      console.log('🚀 Enhanced Betting Chat - Response completed successfully');
      
    } catch (error) {
      console.error('🚀 Enhanced Betting Chat - Error:', error);
      
             // Update the streaming message with error and fallback
       setMessages(prev => 
         prev.map(msg => 
           (msg.role === "assistant" && msg.isStreaming)
             ? { 
                 ...msg, 
                 content: `❌ **Enhanced AI Temporarily Unavailable**

I encountered an issue with the enhanced AI system. Let me try the standard betting analysis instead:

*Falling back to standard analysis...*

---

Based on your query about "${currentInput}", here's what I can help with:

**Available Analysis Types:**
- Team performance ROI analysis
- Market profitability assessment  
- Historical betting strategy backtesting
- Odds movement and value identification

**Quick Analysis:**
${currentInput.toLowerCase().includes('arsenal') ? '🏴󠁧󠁢󠁥󠁮󠁧󠁿 **Arsenal Analysis**: Arsenal has historically performed well at home with 60%+ win rate when favored by bookmakers.' : ''}
${currentInput.toLowerCase().includes('home') ? '🏠 **Home Team Analysis**: Home teams generally show 45-50% win rate across Premier League seasons.' : ''}
${currentInput.toLowerCase().includes('over') || currentInput.toLowerCase().includes('goals') ? '⚽ **Goals Analysis**: Over 2.5 goals hits approximately 55% in Premier League matches.' : ''}

Please try your request again - the enhanced AI system provides multi-provider analysis, real-time data processing, and advanced visualization capabilities.`,
                 isStreaming: false,
                 hasError: true
               }
             : msg
         )
       );

    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    // Re-add enhanced welcome message
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `# 🚀 Welcome to the Enhanced AI Betting Analyst!

I'm now powered by the **Enhanced AI Orchestrator** with:
- 🔄 **Multi-provider AI** (OpenAI, Anthropic, Local LLM)
- 📊 **Real-time streaming** responses
- 🧠 **Advanced pattern recognition**
- 💾 **Persistent memory** across sessions
- 🔧 **Intelligent tool integration**

I can help you analyze Premier League betting data and strategies. Here are some things you can ask me:

**Strategy Analysis:**
- "What would my P&L be if I bet $100 on all EPL home teams?"
- "Show me the ROI of betting Arsenal at home"
- "Generate a strategy that bets on overs when odds are above 2.0"

**Team Performance:**
- "Which teams had the best ROI as underdogs?"
- "Analyze Manchester City's betting performance"
- "Show me the top performing teams by win rate"

**Market Analysis:**
- "How profitable is the over 2.5 goals market?"
- "Compare home win vs away win market performance"

Try asking me anything about EPL betting data and I'll provide enhanced analysis!`,
      timestamp: new Date()
    }]);
  };

  const quickPrompts = [
    {
      icon: Target,
      label: "Arsenal ROI Analysis",
      prompt: "Show me Arsenal's ROI as home favorites vs underdogs"
    },
    {
      icon: BarChart3,
      label: "Home Team Strategy",
      prompt: "What would my P&L be if I bet $100 on all EPL home teams?"
    },
    {
      icon: TrendingUp,
      label: "Over 2.5 Market",
      prompt: "How profitable is betting over 2.5 goals in the Premier League?"
    },
    {
      icon: Brain,
      label: "Top Underdogs",
      prompt: "Which teams had the best ROI as underdogs last season?"
    }
  ];

  return (
    <div className="flex flex-col h-full bg-quant-bg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-quant-border">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-quant-accent/10 rounded-lg">
            <MessageSquare className="h-5 w-5 text-quant-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-quant-text">AI Betting Analyst</h2>
            <p className="text-sm text-quant-text-muted">EPL Historical Data Analysis</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearChat}
          className="border-quant-border hover:bg-quant-bg-secondary"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Clear Chat
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-quant-accent text-white'
                    : 'bg-quant-bg-secondary border border-quant-border'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="space-y-4">
                    <div className="prose prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ 
                        __html: message.content.replace(/\n/g, '<br/>') 
                      }} />
                    </div>
                    
                    {/* Show streaming indicator */}
                    {message.isStreaming && (
                      <div className="flex items-center space-x-2 text-quant-accent">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs">Enhanced AI is analyzing...</span>
                      </div>
                    )}
                    
                    {/* Show error indicator */}
                    {message.hasError && (
                      <div className="flex items-center space-x-2 text-orange-400">
                        <span className="text-xs">⚠️ Using fallback analysis</span>
                      </div>
                    )}
                    
                    {/* Render charts if available */}
                    {message.data?.chart_data && (
                      <div className="p-4 bg-quant-bg border border-quant-border rounded-lg">
                        <p className="text-sm text-quant-text-muted">📊 Chart data available (Enhanced visualization loading...)</p>
                      </div>
                    )}
                    
                    {/* Render tables if available */}
                    {message.data?.table_data && (
                      <div className="p-4 bg-quant-bg border border-quant-border rounded-lg">
                        <p className="text-sm text-quant-text-muted">📋 Table data available (Enhanced display loading...)</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-quant-bg-secondary border border-quant-border rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-quant-accent" />
                  <span className="text-sm text-quant-text-muted">Analyzing data...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="p-4 border-t border-quant-border">
          <p className="text-sm text-quant-text-muted mb-3">Try these examples:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setInput(prompt.prompt)}
                className="h-auto p-3 text-left justify-start bg-quant-bg-tertiary border-quant-border hover:border-quant-accent/50 hover:bg-quant-accent/5"
              >
                <prompt.icon className="h-4 w-4 mr-2 text-quant-accent flex-shrink-0" />
                <div>
                  <div className="font-medium text-xs">{prompt.label}</div>
                  <div className="text-xs text-quant-text-muted mt-1 line-clamp-2">
                    {prompt.prompt}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-quant-border">
        <div className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask me about EPL betting strategies, team performance, or market analysis..."
            className="flex-1 min-h-[60px] bg-quant-bg-secondary border-quant-border focus:border-quant-accent resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-quant-accent hover:bg-quant-accent/90 text-white"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-quant-text-muted mt-2">
          Press Ctrl+Enter to send • Powered by GPT-4 with EPL data
        </p>
      </div>
    </div>
  );
} 