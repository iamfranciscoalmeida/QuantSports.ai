import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Code2, 
  MessageSquare, 
  Sparkles, 
  ArrowRight,
  Copy,
  Play,
  Lightbulb,
  TrendingUp,
  Target
} from 'lucide-react';
import { AIMessage, NotebookCell } from '@/types/notebook';

// Extended AIMessage interface for our bridge component
interface ExtendedAIMessage extends AIMessage {
  metadata?: {
    generatedCode?: string;
    suggestedNextSteps?: NotebookCell[];
    [key: string]: any;
  };
}
import { AICodeGenerator } from '@/services/aiCodeGenerator';
import { cn } from '@/lib/utils';

interface ChatNotebookBridgeProps {
  aiMessages: ExtendedAIMessage[];
  notebookCells: NotebookCell[];
  onCodeInjection: (code: string, cellId?: string) => void;
  onChatFromCode: (code: string, question: string) => void;
  onExecuteCell: (cellId: string) => void;
  className?: string;
}

export function ChatNotebookBridge({ 
  aiMessages, 
  notebookCells, 
  onCodeInjection,
  onChatFromCode,
  onExecuteCell,
  className 
}: ChatNotebookBridgeProps) {
  const [codeSnippets, setCodeSnippets] = useState<Array<{
    code: string;
    explanation: string;
    messageId: string;
  }>>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [nextStepSuggestions, setNextStepSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  // Extract code snippets from AI messages
  useEffect(() => {
    const snippets = aiMessages
      .filter(msg => msg.metadata?.generatedCode || msg.content.includes('```'))
      .map(msg => {
        // First try to get from metadata
        if (msg.metadata?.generatedCode) {
          return {
            code: msg.metadata.generatedCode,
            explanation: msg.content.substring(0, 100) + '...',
            messageId: msg.id
          };
        }
        
        // Extract from message content
        const codeMatch = msg.content.match(/```(?:python|javascript|sql)?\n([\s\S]*?)\n```/);
        if (codeMatch) {
          return {
            code: codeMatch[1],
            explanation: msg.content.split('```')[0].substring(0, 100) + '...',
            messageId: msg.id
          };
        }
        
        return null;
      })
      .filter(Boolean)
      .slice(-5); // Keep last 5 code snippets

    setCodeSnippets(snippets as Array<{code: string; explanation: string; messageId: string}>);
  }, [aiMessages]);

  // Generate suggested questions based on current notebook state
  useEffect(() => {
    const generateSuggestions = async () => {
      if (notebookCells.length === 0) return;
      
      const lastCell = notebookCells[notebookCells.length - 1];
      if (lastCell?.output && !isGeneratingSuggestions) {
        setIsGeneratingSuggestions(true);
        try {
          const suggestions = await generateQuestionsFromResults(lastCell);
          setSuggestedQuestions(suggestions);
          
          // Also generate next step suggestions using Enhanced AI
          try {
            const { FixedAIOrchestrator } = await import('@/services/ai/orchestrator-fixed');
            const orchestrator = new FixedAIOrchestrator();
            
            const response = await orchestrator.processRequest({
              query: `Based on this notebook cell output, suggest 5+ specific next analysis steps:\n\nCell Content: ${lastCell.content}\n\nOutput: ${lastCell.output}`,
              userId: `notebook-bridge-${Date.now()}`,
              context: {
                analysis_type: 'next_steps_suggestion',
                cell_context: {
                  type: lastCell.type,
                  content: lastCell.content,
                  output: lastCell.output,
                  has_results: !!lastCell.output
                },
                notebook_context: notebookCells.length
              },
              streaming: false
            });

            const responseText = typeof response === 'string' ? response : (response as any)?.content || '';
            
            // Extract suggestions from the response
            const suggestions = responseText
              .split('\n')
              .filter(line => line.trim() && (line.includes('-') || line.includes('•')))
              .map(line => line.replace(/^[-•*]\s*/, '').trim())
              .filter(s => s.length > 10)
              .slice(0, 6);

            if (suggestions.length > 0) {
              setNextStepSuggestions(suggestions);
            } else {
              // Enhanced AI fallback with contextual suggestions
              const contextualSuggestions = generateContextualSuggestions(lastCell);
              setNextStepSuggestions(contextualSuggestions);
            }
          } catch (error) {
            console.log('Enhanced AI unavailable for next steps, using contextual suggestions');
            const contextualSuggestions = generateContextualSuggestions(lastCell);
            setNextStepSuggestions(contextualSuggestions);
          }
        } catch (error) {
          console.error('Error generating suggestions:', error);
        } finally {
          setIsGeneratingSuggestions(false);
        }
      }
    };

    generateSuggestions();
  }, [notebookCells, isGeneratingSuggestions]);

  const handleCodeInjection = useCallback((code: string, cellId?: string) => {
    onCodeInjection(code, cellId);
  }, [onCodeInjection]);

  const handleChatFromCode = useCallback((code: string, question: string) => {
    onChatFromCode(code, question);
  }, [onChatFromCode]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (codeSnippets.length === 0 && suggestedQuestions.length === 0 && nextStepSuggestions.length === 0) {
    return null;
  }

  return (
    <Card className={cn("border-l-4 border-l-blue-500 shadow-sm", className)}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-sm">Smart Bridge</h3>
          <Badge variant="secondary" className="text-xs">
            AI-Powered
          </Badge>
        </div>

        <ScrollArea className="max-h-96">
          {/* Code snippets from chat */}
          {codeSnippets.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Code2 className="h-4 w-4 text-green-600" />
                <h4 className="text-sm font-medium">Code from Chat</h4>
              </div>
              
              <div className="space-y-3">
                {codeSnippets.map((snippet, idx) => (
                  <div key={`${snippet.messageId}-${idx}`} className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-xs text-slate-600 mb-2">{snippet.explanation}</p>
                    <div className="bg-slate-900 rounded p-2 mb-2">
                      <code className="text-xs text-green-400 font-mono block overflow-x-auto">
                        {snippet.code.substring(0, 120)}
                        {snippet.code.length > 120 && '...'}
                      </code>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCodeInjection(snippet.code)}
                        className="text-xs h-7"
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Insert
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard(snippet.code)}
                        className="text-xs h-7"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next step suggestions */}
          {nextStepSuggestions.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-purple-600" />
                <h4 className="text-sm font-medium">Suggested Next Steps</h4>
              </div>
              
              <div className="space-y-2">
                {nextStepSuggestions.slice(0, 4).map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-auto p-2 text-left justify-start"
                    onClick={() => handleChatFromCode('', suggestion)}
                  >
                    <Lightbulb className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="truncate">{suggestion}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {codeSnippets.length > 0 && suggestedQuestions.length > 0 && (
            <Separator className="my-4" />
          )}

          {/* Suggested questions based on current analysis */}
          {suggestedQuestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-orange-600" />
                <h4 className="text-sm font-medium">Ask About Results</h4>
              </div>
              
              <div className="space-y-2">
                {suggestedQuestions.map((question, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs h-auto p-2 text-left justify-start hover:bg-orange-50"
                    onClick={() => handleChatFromCode(
                      notebookCells[notebookCells.length - 1]?.content || '',
                      question
                    )}
                  >
                    <TrendingUp className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="truncate">{question}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {isGeneratingSuggestions && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Generating suggestions...
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </Card>
  );
}

function generateContextualSuggestions(cell: NotebookCell): string[] {
  const content = cell.content.toLowerCase();
  const output = cell.output?.toLowerCase() || '';
  
  const suggestions: string[] = [];
  
  // Strategy-based suggestions
  if (content.includes('strategy') || content.includes('backtest')) {
    suggestions.push(
      "Optimize strategy parameters for better performance",
      "Test strategy on different time periods",
      "Add risk management rules to the strategy",
      "Compare performance across different sports/leagues"
    );
  }
  
  // Analysis-based suggestions
  if (content.includes('roi') || content.includes('profit') || output.includes('roi')) {
    suggestions.push(
      "Analyze ROI stability over time",
      "Calculate risk-adjusted returns (Sharpe ratio)",
      "Identify the most profitable bet types",
      "Examine drawdown periods and recovery"
    );
  }
  
  // Data-based suggestions
  if (content.includes('data') || content.includes('dataframe') || content.includes('df')) {
    suggestions.push(
      "Visualize data distribution patterns",
      "Perform statistical significance tests",
      "Create correlation analysis between variables",
      "Generate summary statistics by category"
    );
  }
  
  // Default suggestions if no specific context
  if (suggestions.length === 0) {
    suggestions.push(
      "Explore data patterns and trends",
      "Add visualization to understand results",
      "Perform statistical analysis on the output",
      "Create a summary report of findings"
    );
  }
  
  return suggestions.slice(0, 5);
}

async function generateQuestionsFromResults(cell: NotebookCell): Promise<string[]> {
  // AI-powered question generation based on analysis results
  // This is simplified - in a real implementation, you'd call the AI service
  const defaultQuestions = [
    "How can I optimize this strategy?",
    "What are the risks with this approach?",
    "Show me similar historical patterns",
    "Generate a visualization for this data",
    "What's the statistical significance?",
    "How does this compare to other strategies?",
    "What if I adjust the parameters?",
    "Can you find profitable variations?"
  ];

  try {
    // You could call AICodeGenerator here to get more specific suggestions
    // For now, return contextual questions based on cell content
    const hasROI = cell.content.toLowerCase().includes('roi');
    const hasStrategy = cell.content.toLowerCase().includes('strategy');
    const hasBacktest = cell.content.toLowerCase().includes('backtest');
    
    let contextQuestions: string[] = [];
    
    if (hasROI) {
      contextQuestions.push(
        "What factors drive this ROI?",
        "How stable is this ROI over time?",
        "Can we improve the risk-adjusted returns?"
      );
    }
    
    if (hasStrategy) {
      contextQuestions.push(
        "How does this strategy perform in different market conditions?",
        "What's the maximum drawdown for this strategy?",
        "Can we combine this with other strategies?"
      );
    }
    
    if (hasBacktest) {
      contextQuestions.push(
        "Is this backtest statistically robust?",
        "How does it perform out-of-sample?",
        "What are the key assumptions?"
      );
    }
    
    return [...contextQuestions, ...defaultQuestions].slice(0, 6);
  } catch (error) {
    console.error('Error generating contextual questions:', error);
    return defaultQuestions.slice(0, 6);
  }
}

export default ChatNotebookBridge; 