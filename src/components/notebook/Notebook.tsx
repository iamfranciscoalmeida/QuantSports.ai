import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Play,
  Plus,
  Save,
  Download,
  Upload,
  Settings,
  Zap,
  FileText,
  FolderOpen,
  Terminal,
  MessageSquare,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Activity,
  Brain,
  Code,
  Database,
  GitBranch,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";
import { NotebookCell } from "./NotebookCell";
import {
  NotebookCell as CellType,
  Notebook as NotebookType,
  TerminalTab,
  AIMessage,
  SportsBettingContext,
  BettingFunction,
} from "@/types/notebook";
import { NotebookService } from "@/services/notebookService";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface NotebookProps {
  className?: string;
}

export function Notebook({ className }: NotebookProps) {
  const { toast } = useToast();
  const [notebook, setNotebook] = useState<NotebookType>({
    id: "notebook-1",
    title: "Sports Betting Strategy",
    cells: [
      {
        id: "cell-1",
        type: "code",
        content:
          '# Sports Betting Strategy Notebook\n# Build and test your quantitative betting strategies\n\nfrom betting_utils import expected_value, kelly_criterion, closing_line_value\nimport pandas as pd\nimport numpy as np\n\nprint("Welcome to QuantSports.ai Strategy Builder!")',
        executionCount: 0,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [isRunningAll, setIsRunningAll] = useState(false);
  const [activeTab, setActiveTab] = useState("notebook");
  const [showAISidebar, setShowAISidebar] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [terminalTabs, setTerminalTabs] = useState<TerminalTab[]>([
    {
      id: "terminal",
      name: "Terminal",
      content: ["Welcome to QuantSports Terminal"],
      active: true,
    },
    { id: "bet-logs", name: "Bet Logs", content: [], active: false },
    { id: "backtest", name: "Backtest", content: [], active: false },
    { id: "errors", name: "Errors", content: [], active: false },
  ]);
  const [activeTerminalTab, setActiveTerminalTab] = useState("terminal");
  const [sportsContext] = useState<SportsBettingContext>(
    NotebookService.getSampleSportsBettingContext(),
  );
  const [bettingFunctions] = useState<BettingFunction[]>(
    NotebookService.getBettingFunctions(),
  );
  const [fileTreeExpanded, setFileTreeExpanded] = useState(true);

  const updateCell = useCallback((cellId: string, content: string) => {
    setNotebook((prev) => ({
      ...prev,
      cells: prev.cells.map((cell) =>
        cell.id === cellId ? { ...cell, content } : cell,
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const deleteCell = useCallback((cellId: string) => {
    setNotebook((prev) => ({
      ...prev,
      cells: prev.cells.filter((cell) => cell.id !== cellId),
      updatedAt: new Date(),
    }));
  }, []);

  const addCell = useCallback((afterCellId?: string) => {
    const newCell: CellType = {
      id: `cell-${Date.now()}`,
      type: "code",
      content: "",
      executionCount: 0,
    };

    setNotebook((prev) => {
      if (!afterCellId) {
        return {
          ...prev,
          cells: [...prev.cells, newCell],
          updatedAt: new Date(),
        };
      }

      const index = prev.cells.findIndex((cell) => cell.id === afterCellId);
      const newCells = [...prev.cells];
      newCells.splice(index + 1, 0, newCell);

      return {
        ...prev,
        cells: newCells,
        updatedAt: new Date(),
      };
    });
  }, []);

  const runCell = useCallback(
    async (cellId: string) => {
      setNotebook((prev) => ({
        ...prev,
        cells: prev.cells.map((cell) =>
          cell.id === cellId
            ? { ...cell, isRunning: true, output: undefined, error: undefined }
            : cell,
        ),
      }));

      try {
        const cell = notebook.cells.find((c) => c.id === cellId);
        if (!cell) return;

        const result = await NotebookService.executeCode(cell.content);

        setNotebook((prev) => ({
          ...prev,
          cells: prev.cells.map((cell) =>
            cell.id === cellId
              ? {
                  ...cell,
                  isRunning: false,
                  output: result.output,
                  error: result.error,
                  executionCount: (cell.executionCount || 0) + 1,
                }
              : cell,
          ),
          updatedAt: new Date(),
        }));

        // Add to terminal logs
        const logMessage = result.error
          ? `❌ Cell ${cellId}: ${result.error}`
          : `✅ Cell ${cellId}: Executed successfully`;

        setTerminalTabs((prev) =>
          prev.map((tab) =>
            tab.id === (result.error ? "errors" : "terminal")
              ? { ...tab, content: [...tab.content, logMessage] }
              : tab,
          ),
        );

        if (result.error) {
          toast({
            title: "Execution Error",
            description: result.error,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Cell Executed",
            description: `Completed in ${result.executionTime}s`,
          });
        }
      } catch (error) {
        setNotebook((prev) => ({
          ...prev,
          cells: prev.cells.map((cell) =>
            cell.id === cellId
              ? {
                  ...cell,
                  isRunning: false,
                  error: "Failed to execute code",
                }
              : cell,
          ),
        }));

        toast({
          title: "Execution Failed",
          description: "An error occurred while running the cell",
          variant: "destructive",
        });
      }
    },
    [notebook.cells, toast],
  );

  const runAllCells = useCallback(async () => {
    setIsRunningAll(true);

    try {
      for (const cell of notebook.cells) {
        if (cell.type === "code" && cell.content.trim()) {
          await runCell(cell.id);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      toast({
        title: "All Cells Executed",
        description: `Ran ${notebook.cells.length} cells successfully`,
      });
    } catch (error) {
      toast({
        title: "Execution Failed",
        description: "Failed to run all cells",
        variant: "destructive",
      });
    } finally {
      setIsRunningAll(false);
    }
  }, [notebook.cells, runCell, toast]);

  const handleAIAssist = useCallback(
    async (cellId: string, prompt: string) => {
      const cellIndex = notebook.cells.findIndex((c) => c.id === cellId);
      const contextCells = notebook.cells
        .slice(0, cellIndex)
        .filter((c) => c.type === "code" && c.content.trim())
        .map((c) => c.content);

      try {
        const response = await NotebookService.getAICompletion({
          prompt,
          context: contextCells,
          cellId,
        });

        updateCell(cellId, response.code);

        toast({
          title: "AI Code Generated",
          description:
            response.explanation || "Code has been generated successfully",
        });
      } catch (error) {
        toast({
          title: "AI Generation Failed",
          description: "Failed to generate code with AI assistant",
          variant: "destructive",
        });
      }
    },
    [notebook.cells, updateCell, toast],
  );

  const handleAIChat = useCallback(async () => {
    if (!aiInput.trim()) return;

    const userMessage: AIMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: aiInput,
      timestamp: new Date(),
    };

    setAiMessages((prev) => [...prev, userMessage]);
    setAiInput("");

    try {
      const response = await NotebookService.getAICompletion({
        prompt: aiInput,
        context: notebook.cells.map((c) => c.content),
        cellId: "chat",
      });

      const assistantMessage: AIMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: response.explanation || "I've generated some code for you.",
        timestamp: new Date(),
      };

      setAiMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: AIMessage = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setAiMessages((prev) => [...prev, errorMessage]);
    }
  }, [aiInput, notebook.cells]);

  const getContextCells = useCallback(
    (cellId: string) => {
      const cellIndex = notebook.cells.findIndex((c) => c.id === cellId);
      return notebook.cells
        .slice(0, cellIndex)
        .filter((c) => c.type === "code" && c.content.trim())
        .map((c) => c.content);
    },
    [notebook.cells],
  );

  return (
    <div className={cn("ide-layout", className)}>
      {/* IDE Header */}
      <div className="ide-header">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-quant-error rounded-full"></div>
            <div className="w-3 h-3 bg-quant-warning rounded-full"></div>
            <div className="w-3 h-3 bg-quant-success rounded-full"></div>
          </div>

          <div className="flex items-center space-x-1">
            <div className="px-3 py-1 bg-quant-bg-tertiary text-quant-text text-sm rounded-t-lg border-b-2 border-quant-accent">
              <FileText className="h-4 w-4 inline mr-2" />
              {notebook.title}.ipynb
            </div>
            <div className="px-3 py-1 text-quant-text-muted text-sm hover:text-quant-text cursor-pointer">
              <Code className="h-4 w-4 inline mr-2" />
              main.py
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAISidebar(!showAISidebar)}
            className={cn(
              "text-quant-accent hover:bg-quant-accent/10",
              showAISidebar && "bg-quant-accent/10",
            )}
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-quant-text-muted hover:text-quant-text"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* IDE Main Content */}
      <div className="ide-main">
        {/* Left Sidebar */}
        <div className="ide-sidebar">
          <div className="p-4 border-b border-quant-border">
            <div className="flex items-center space-x-2 mb-4">
              <Button
                variant={activeTab === "notebook" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("notebook")}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Notebook
              </Button>
              <Button
                variant={activeTab === "strategy" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("strategy")}
                className="flex-1"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Strategy
              </Button>
            </div>
          </div>

          {activeTab === "notebook" && (
            <div className="flex-1 overflow-auto">
              {/* File Explorer */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-quant-text">
                    EXPLORER
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFileTreeExpanded(!fileTreeExpanded)}
                    className="h-6 w-6 p-0"
                  >
                    {fileTreeExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                {fileTreeExpanded && (
                  <div className="space-y-1">
                    <div className="file-tree-item active">
                      <FileText className="h-4 w-4 mr-2 text-quant-accent" />
                      {notebook.title}.ipynb
                    </div>
                    <div className="file-tree-item">
                      <Code className="h-4 w-4 mr-2" />
                      main.py
                    </div>
                    <div className="file-tree-item">
                      <Database className="h-4 w-4 mr-2" />
                      betting_utils.py
                    </div>
                    <div className="file-tree-item">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      backtest_results.csv
                    </div>
                  </div>
                )}
              </div>

              {/* Betting Functions */}
              <div className="p-4 border-t border-quant-border">
                <h3 className="text-sm font-medium text-quant-text mb-3">
                  BETTING FUNCTIONS
                </h3>
                <div className="space-y-2">
                  {bettingFunctions.map((func) => (
                    <div
                      key={func.name}
                      className="p-2 bg-quant-bg-tertiary rounded-lg cursor-pointer hover:bg-quant-accent/10 transition-colors"
                      onClick={() => {
                        // Add function to current cell or create new cell
                        const lastCell =
                          notebook.cells[notebook.cells.length - 1];
                        if (lastCell && !lastCell.content.trim()) {
                          updateCell(lastCell.id, func.code);
                        } else {
                          addCell();
                          setTimeout(() => {
                            const newCell =
                              notebook.cells[notebook.cells.length - 1];
                            updateCell(newCell.id, func.code);
                          }, 100);
                        }
                      }}
                    >
                      <div className="text-xs font-mono text-quant-accent">
                        {func.name}
                      </div>
                      <div className="text-xs text-quant-text-muted">
                        {func.description}
                      </div>
                      <div
                        className={cn(
                          "bet-indicator mt-1",
                          func.category === "value" && "positive",
                          func.category === "risk" && "negative",
                          func.category === "analysis" && "neutral",
                        )}
                      >
                        {func.category}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "strategy" && (
            <div className="flex-1 overflow-auto p-4">
              <h3 className="text-sm font-medium text-quant-text mb-3">
                LIVE CONTEXT
              </h3>
              <Card className="p-3 mb-4">
                <div className="text-xs text-quant-text-muted mb-2">
                  Current Event
                </div>
                <div className="text-sm font-medium text-quant-text">
                  {sportsContext.event.team_home} vs{" "}
                  {sportsContext.event.team_away}
                </div>
                <div className="text-xs text-quant-text-muted">
                  {sportsContext.event.league} • {sportsContext.event.sport}
                </div>
              </Card>

              <Card className="p-3 mb-4">
                <div className="text-xs text-quant-text-muted mb-2">
                  Market Data
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-quant-text-muted">Current Odds:</span>
                    <span className="text-quant-text font-mono">
                      {sportsContext.odds.current}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-quant-text-muted">Implied Prob:</span>
                    <span className="text-quant-text font-mono">
                      {(sportsContext.odds.implied_probability * 100).toFixed(
                        1,
                      )}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-quant-text-muted">Odds Drift:</span>
                    <span
                      className={cn(
                        "font-mono",
                        sportsContext.indicators.odds_drift > 0
                          ? "text-quant-success"
                          : "text-quant-error",
                      )}
                    >
                      {sportsContext.indicators.odds_drift > 0 ? "+" : ""}
                      {sportsContext.indicators.odds_drift}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-3">
                <div className="text-xs text-quant-text-muted mb-2">
                  Indicators
                </div>
                <div className="space-y-2">
                  <div className="bet-indicator positive">
                    CLV: +
                    {(
                      sportsContext.indicators.closing_line_value * 100
                    ).toFixed(1)}
                    %
                  </div>
                  <div className="bet-indicator neutral">
                    Efficiency:{" "}
                    {(sportsContext.indicators.market_efficiency * 100).toFixed(
                      0,
                    )}
                    %
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="ide-content">
          {/* Notebook Content */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto px-6 py-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <h1 className="text-xl font-semibold text-quant-text font-sans">
                    {notebook.title}
                  </h1>
                  <span className="text-sm text-quant-text-muted font-mono">
                    Last saved {notebook.updatedAt.toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runAllCells}
                    disabled={isRunningAll}
                    className="text-quant-success border-quant-success/30 hover:bg-quant-success/10"
                  >
                    {isRunningAll ? (
                      <Zap className="h-4 w-4 mr-2 animate-pulse" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Run All
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addCell()}
                    className="text-quant-accent border-quant-accent/30 hover:bg-quant-accent/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Cell
                  </Button>

                  <Button variant="outline" size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                {notebook.cells.map((cell, index) => (
                  <NotebookCell
                    key={cell.id}
                    cell={cell}
                    onUpdate={updateCell}
                    onDelete={deleteCell}
                    onRunCell={runCell}
                    onAIAssist={handleAIAssist}
                    isLast={index === notebook.cells.length - 1}
                    contextCells={getContextCells(cell.id)}
                  />
                ))}

                <div className="flex justify-center py-8">
                  <Button
                    variant="outline"
                    onClick={() => addCell()}
                    className="text-quant-accent border-quant-accent/30 hover:bg-quant-accent/10 border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Cell
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal */}
          <div className="ide-terminal">
            <div className="flex items-center border-b border-quant-border">
              {terminalTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTerminalTab(tab.id)}
                  className={cn(
                    "terminal-tab",
                    activeTerminalTab === tab.id && "active",
                  )}
                >
                  {tab.name === "Terminal" && (
                    <Terminal className="h-4 w-4 mr-2" />
                  )}
                  {tab.name === "Bet Logs" && (
                    <Activity className="h-4 w-4 mr-2" />
                  )}
                  {tab.name === "Backtest" && (
                    <BarChart3 className="h-4 w-4 mr-2" />
                  )}
                  {tab.name === "Errors" && (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  )}
                  {tab.name}
                </button>
              ))}
            </div>

            <div className="terminal-content">
              {terminalTabs
                .find((tab) => tab.id === activeTerminalTab)
                ?.content.map((line, index) => (
                  <div key={index} className="mb-1">
                    {line}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* AI Assistant Sidebar */}
        {showAISidebar && (
          <div className="ai-sidebar">
            <div className="p-4 border-b border-quant-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-quant-accent" />
                <h3 className="font-medium text-quant-text">AI Assistant</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAISidebar(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {aiMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-quant-accent/50 mx-auto mb-4" />
                    <p className="text-sm text-quant-text-muted">
                      Ask me anything about sports betting strategies, code
                      optimization, or data analysis.
                    </p>
                  </div>
                ) : (
                  aiMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "ai-message",
                        message.role === "user" ? "user" : "assistant",
                      )}
                    >
                      {message.content}
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-quant-border">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAIChat();
                      }
                    }}
                    placeholder="Ask about betting strategies..."
                    className="flex-1 px-3 py-2 bg-quant-bg-tertiary border border-quant-border rounded-lg text-quant-text placeholder-quant-text-muted focus:outline-none focus:ring-2 focus:ring-quant-accent/50"
                  />
                  <Button
                    onClick={handleAIChat}
                    disabled={!aiInput.trim()}
                    size="sm"
                    className="px-4"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
