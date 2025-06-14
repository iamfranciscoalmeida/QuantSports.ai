import React, { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  MoreHorizontal,
  Trash2,
  Brain,
  Loader2,
  Copy,
  CheckCircle,
  XCircle,
  MessageSquare,
  Send,
  Sparkles,
  Zap,
  Code,
  RefreshCw,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { NotebookCell as CellType } from "@/types/notebook";
import { NotebookService } from "@/services/notebookService";
import { cn } from "@/lib/utils";

interface NotebookCellProps {
  cell: CellType;
  onUpdate: (cellId: string, content: string) => void;
  onDelete: (cellId: string) => void;
  onRunCell: (cellId: string) => void;
  onAIAssist: (cellId: string, prompt: string) => void;
  isLast?: boolean;
  contextCells: string[];
}

export function NotebookCell({
  cell,
  onUpdate,
  onDelete,
  onRunCell,
  onAIAssist,
  isLast = false,
  contextCells,
}: NotebookCellProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiInput, setShowAiInput] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const aiInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (showAiInput && aiInputRef.current) {
      aiInputRef.current.focus();
    }
  }, [showAiInput]);

  const handleRunCell = async () => {
    onRunCell(cell.id);
  };

  const handleAIAssist = async () => {
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    try {
      await onAIAssist(cell.id, aiPrompt);
      setAiPrompt("");
      setShowAiInput(false);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleQuickAI = async (prompt: string) => {
    setIsAiLoading(true);
    try {
      await onAIAssist(cell.id, prompt);
    } finally {
      setIsAiLoading(false);
      setShowAiSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleRunCell();
    }
  };

  const handleAiKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleAIAssist();
    }
    if (e.key === "Escape") {
      setShowAiInput(false);
      setAiPrompt("");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const aiSuggestions = [
    {
      icon: Brain,
      label: "Explain this logic",
      prompt: "Explain what this code does step by step",
    },
    {
      icon: RefreshCw,
      label: "Refactor this code",
      prompt: "Refactor this code to be more efficient and readable",
    },
    {
      icon: TrendingUp,
      label: "Convert to betting pattern",
      prompt:
        "Convert this to a sports betting strategy pattern with proper risk management",
    },
    {
      icon: AlertCircle,
      label: "Add error handling",
      prompt: "Add proper error handling and validation to this code",
    },
  ];

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* AI Chat Bubble */}
      {isHovered && (
        <div
          className="ai-chat-bubble"
          onClick={() => setShowAiSuggestions(!showAiSuggestions)}
        >
          <Zap className="h-4 w-4 text-quant-bg" />
        </div>
      )}

      {/* AI Quick Suggestions */}
      {showAiSuggestions && (
        <div className="absolute -right-2 top-8 z-20 w-64 bg-quant-bg-secondary border border-quant-border rounded-xl shadow-glow p-2">
          <div className="text-xs font-medium text-quant-accent mb-2 px-2">
            AI Quick Actions
          </div>
          <div className="space-y-1">
            {aiSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleQuickAI(suggestion.prompt)}
                disabled={isAiLoading}
                className="w-full flex items-center space-x-2 px-2 py-2 text-sm text-quant-text hover:bg-quant-accent/10 rounded-lg transition-colors"
              >
                <suggestion.icon className="h-4 w-4 text-quant-accent" />
                <span>{suggestion.label}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-quant-border mt-2 pt-2">
            <button
              onClick={() => {
                setShowAiSuggestions(false);
                setShowAiInput(true);
              }}
              className="w-full flex items-center space-x-2 px-2 py-2 text-sm text-quant-accent hover:bg-quant-accent/10 rounded-lg transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Custom prompt...</span>
            </button>
          </div>
        </div>
      )}

      <Card className="code-cell bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 shadow-code-cell hover:shadow-glow transition-all duration-200 rounded-xl overflow-hidden">
        {/* Cell Header */}
        <div className="flex items-center justify-between p-4 border-b border-quant-border bg-quant-bg-tertiary">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-quant-accent font-medium bg-quant-accent/10 px-2 py-1 rounded">
              In [{cell.executionCount || " "}]
            </span>
            <span className="text-xs text-quant-text-muted font-mono">
              Python 3.11
            </span>
            {cell.isRunning && (
              <div className="flex items-center space-x-1">
                <Loader2 className="h-3 w-3 animate-spin text-quant-accent" />
                <span className="text-xs text-quant-accent">Running...</span>
              </div>
            )}
          </div>

          <div
            className={cn(
              "flex items-center space-x-1 transition-opacity duration-200",
              isHovered ? "opacity-100" : "opacity-60",
            )}
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRunCell}
              disabled={cell.isRunning}
              className="h-8 px-3 text-quant-success hover:text-quant-success hover:bg-quant-success/10 rounded-lg"
            >
              {cell.isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAiInput(!showAiInput)}
              className="h-8 px-3 text-quant-accent hover:text-quant-accent hover:bg-quant-accent/10 rounded-lg"
            >
              <Brain className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-quant-text-muted hover:text-quant-text hover:bg-quant-bg-tertiary rounded-lg"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-quant-bg-secondary border border-quant-border rounded-xl"
              >
                <DropdownMenuItem
                  onClick={() => copyToClipboard(cell.content)}
                  className="text-quant-text hover:bg-quant-bg-tertiary rounded-lg"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleQuickAI("Explain what this code does step by step")
                  }
                  className="text-quant-accent hover:bg-quant-accent/10 rounded-lg"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Explain with AI
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleQuickAI("Refactor this code to be more efficient")
                  }
                  className="text-quant-accent hover:bg-quant-accent/10 rounded-lg"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refactor Logic
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleQuickAI(
                      "Convert this to a value betting pattern with proper risk management",
                    )
                  }
                  className="text-quant-accent hover:bg-quant-accent/10 rounded-lg"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Convert to Betting Pattern
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(cell.id)}
                  className="text-quant-error hover:bg-quant-error/10 rounded-lg"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Cell
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* AI Assistant Input */}
        {showAiInput && (
          <div className="p-4 bg-quant-accent/5 border-b border-quant-accent/20">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-quant-accent/10 rounded-lg">
                <Brain className="h-4 w-4 text-quant-accent flex-shrink-0" />
              </div>
              <div className="flex-1">
                <textarea
                  ref={aiInputRef}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={handleAiKeyDown}
                  placeholder="Describe what you want to code... (Cmd+Enter to generate)"
                  className="w-full p-3 text-sm bg-quant-bg-tertiary border border-quant-border text-quant-text rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-quant-accent/50 focus:border-quant-accent/50 font-mono"
                  rows={3}
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-quant-accent font-mono">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    AI will use context from {contextCells.length} previous
                    cells
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowAiInput(false);
                        setAiPrompt("");
                      }}
                      className="h-7 px-3 text-xs text-quant-text-muted hover:text-quant-text hover:bg-quant-bg-tertiary rounded-lg"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAIAssist}
                      disabled={!aiPrompt.trim() || isAiLoading}
                      className="h-7 px-4 text-xs bg-quant-accent hover:bg-quant-accent/90 text-quant-bg rounded-lg font-medium"
                    >
                      {isAiLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monaco Code Editor */}
        <div className="relative" onKeyDown={handleKeyDown}>
          <Editor
            height="200px"
            defaultLanguage="python"
            theme="vs-dark"
            value={cell.content}
            onChange={(value) => onUpdate(cell.id, value || "")}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              lineNumbers: "on",
              folding: true,
              wordWrap: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              renderLineHighlight: "all",
              selectOnLineNumbers: true,
              roundedSelection: false,
              readOnly: false,
              cursorStyle: "line",
              mouseWheelZoom: true,
              contextmenu: true,
              quickSuggestions: true,
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: "on",
              tabCompletion: "on",
              wordBasedSuggestions: true,
              parameterHints: {
                enabled: true,
              },
              hover: {
                enabled: true,
              },
              codeLens: true,
              formatOnPaste: true,
              formatOnType: true,
            }}
            className="rounded-b-xl"
          />
        </div>

        {/* Output */}
        {(cell.output || cell.error) && (
          <div className="border-t border-quant-border">
            {cell.output && (
              <div className="console-output p-4 bg-quant-bg-tertiary">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="h-4 w-4 text-quant-success" />
                  <span className="text-xs font-medium text-quant-success font-mono">
                    Out [{cell.executionCount}]
                  </span>
                </div>
                <pre className="text-sm font-mono text-quant-text whitespace-pre-wrap leading-relaxed">
                  {cell.output}
                </pre>
              </div>
            )}
            {cell.error && (
              <div className="error-message p-4 bg-quant-error/5">
                <div className="flex items-center space-x-2 mb-3">
                  <XCircle className="h-4 w-4 text-quant-error" />
                  <span className="text-xs font-medium text-quant-error font-mono">
                    Error
                  </span>
                </div>
                <pre className="text-sm font-mono text-quant-error whitespace-pre-wrap leading-relaxed">
                  {cell.error}
                </pre>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Execution hint */}
      {isHovered && (
        <div className="absolute -bottom-6 right-3 opacity-70">
          <span className="text-xs font-mono text-quant-text-muted bg-quant-bg-secondary px-2 py-1 rounded border border-quant-border">
            ⌘+Enter to run • Right-click for AI actions
          </span>
        </div>
      )}
    </div>
  );
}
