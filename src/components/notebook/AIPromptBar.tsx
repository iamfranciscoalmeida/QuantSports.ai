import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain,
  Sparkles,
  Send,
  Loader2,
  Lightbulb,
  Code,
  BarChart3,
  Target,
  TrendingUp,
  X,
  Zap,
  MessageSquare,
} from "lucide-react";
import { NotebookService } from "@/services/notebookService";
import { AIPromptRequest, NotebookCell } from "@/types/notebook";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface AIPromptBarProps {
  onCodeGenerated: (code: string, explanation?: string) => void;
  contextCells?: NotebookCell[];
  sport?: string;
  className?: string;
}

export function AIPromptBar({
  onCodeGenerated,
  contextCells = [],
  sport = "football",
  className,
}: AIPromptBarProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const request: AIPromptRequest = {
        prompt,
        sport,
        context: contextCells.map((cell) => cell.content),
      };

      const response = await NotebookService.createStrategyFromPrompt(request);
      onCodeGenerated(response.code, response.explanation);

      setPrompt("");
      setIsExpanded(false);

      toast({
        title: "Code Generated",
        description: "AI has generated code based on your prompt",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
    if (e.key === "Escape") {
      setIsExpanded(false);
      setPrompt("");
    }
  };

  const quickPrompts = [
    {
      icon: Target,
      label: "Value Betting Logic",
      prompt:
        "Create a value betting function that calculates expected value and identifies profitable bets",
    },
    {
      icon: BarChart3,
      label: "Backtest Framework",
      prompt:
        "Build a backtesting framework to test this strategy on historical data",
    },
    {
      icon: TrendingUp,
      label: "Kelly Criterion",
      prompt:
        "Implement Kelly criterion for optimal bet sizing based on edge and bankroll",
    },
    {
      icon: Code,
      label: "Data Analysis",
      prompt:
        "Add statistical analysis to identify patterns in team performance and odds movements",
    },
  ];

  const examplePrompts = [
    "Find value bets in Premier League using team form and injury reports",
    "Create an over/under strategy for NBA games based on pace and efficiency",
    "Build a closing line value tracker for NFL with automated bet logging",
    "Design a machine learning model to predict tennis match outcomes",
    "Implement a bankroll management system with risk controls",
  ];

  if (!isExpanded) {
    return (
      <div className={cn("ai-prompt-bar-collapsed", className)}>
        <Button
          onClick={() => setIsExpanded(true)}
          className="w-full bg-quant-accent/10 hover:bg-quant-accent/20 border border-quant-accent/30 text-quant-accent rounded-xl transition-all duration-200 hover:shadow-glow-blue"
          variant="outline"
        >
          <Brain className="h-4 w-4 mr-2" />
          <span className="flex-1 text-left">
            Describe what you want to code...
          </span>
          <Sparkles className="h-4 w-4 ml-2 opacity-60" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "ai-prompt-bar-expanded bg-quant-bg-secondary border border-quant-accent/30 rounded-xl p-4 shadow-glow-blue",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-quant-accent/10 rounded-lg">
            <Brain className="h-4 w-4 text-quant-accent" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-quant-text">
              AI Strategy Assistant
            </h3>
            <p className="text-xs text-quant-text-muted">
              Describe your betting strategy idea
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsExpanded(false);
            setPrompt("");
            setShowSuggestions(false);
          }}
          className="h-8 w-8 p-0 text-quant-text-muted hover:text-quant-text"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {quickPrompts.map((item, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => setPrompt(item.prompt)}
            className="h-auto p-2 text-left justify-start bg-quant-bg-tertiary border-quant-border hover:border-quant-accent/50 hover:bg-quant-accent/5"
          >
            <item.icon className="h-3 w-3 mr-2 text-quant-accent flex-shrink-0" />
            <span className="text-xs">{item.label}</span>
          </Button>
        ))}
      </div>

      {/* Prompt Input */}
      <div className="space-y-3">
        <Textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Example: Create a value betting strategy for NBA games that identifies when the implied probability is lower than my model's prediction..."
          className="bg-quant-bg-tertiary border-quant-border text-quant-text min-h-[80px] resize-none focus:ring-2 focus:ring-quant-accent/50"
        />

        {/* Context Info */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4 text-quant-text-muted">
            <span className="flex items-center">
              <MessageSquare className="h-3 w-3 mr-1" />
              Context: {contextCells.length} cells
            </span>
            <span className="flex items-center">
              <Target className="h-3 w-3 mr-1" />
              Sport: {sport}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="h-6 px-2 text-xs text-quant-accent hover:bg-quant-accent/10"
          >
            <Lightbulb className="h-3 w-3 mr-1" />
            Examples
          </Button>
        </div>

        {/* Example Prompts */}
        {showSuggestions && (
          <div className="bg-quant-bg-tertiary p-3 rounded-lg border border-quant-border">
            <h4 className="text-xs font-medium text-quant-accent mb-2">
              Example Prompts:
            </h4>
            <div className="space-y-1">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setPrompt(example);
                    setShowSuggestions(false);
                  }}
                  className="block w-full text-left text-xs text-quant-text-muted hover:text-quant-text p-1 rounded hover:bg-quant-bg-secondary transition-colors"
                >
                  • {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-quant-text-muted">
            <kbd className="px-1 py-0.5 bg-quant-bg-tertiary border border-quant-border rounded text-xs">
              ⌘
            </kbd>
            <span className="mx-1">+</span>
            <kbd className="px-1 py-0.5 bg-quant-bg-tertiary border border-quant-border rounded text-xs">
              Enter
            </kbd>
            <span className="ml-1">to generate</span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsExpanded(false);
                setPrompt("");
              }}
              disabled={isGenerating}
              className="h-8 px-3 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="h-8 px-4 text-xs bg-quant-accent hover:bg-quant-accent/90 text-quant-bg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-3 w-3 mr-1" />
                  Generate Code
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
