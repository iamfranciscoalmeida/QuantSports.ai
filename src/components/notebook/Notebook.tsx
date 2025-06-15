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
  Target,
  DollarSign,
  Sparkles,
  Layers,
  Home,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NotebookCell } from "./NotebookCell";
import { StrategyCreator } from "./StrategyCreator";
import { StrategySummary } from "./StrategySummary";
import { AIPromptBar } from "./AIPromptBar";
import { BettingChatInterface } from "../chat/BettingChatInterface";
import {
  NotebookCell as CellType,
  Notebook as NotebookType,
  TerminalTab,
  AIMessage,
  SportsBettingContext,
  BettingFunction,
  StrategyMetadata,
} from "@/types/notebook";
import { MarkdownRenderer } from "../MarkdownRenderer";

interface CodeTab {
  id: string;
  name: string;
  content: string;
  type: "notebook" | "script";
  active: boolean;
}
import { NotebookService } from "@/services/notebookService";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NotebookProps {
  className?: string;
}

export function Notebook({ className }: NotebookProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
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
  const [strategyMetadata, setStrategyMetadata] = useState<StrategyMetadata>({
    id: notebook.id,
    name: notebook.title,
    description: "A quantitative sports betting strategy",
    sport: "football",
    tags: ["value", "quantitative"],
    parameters: {
      bankroll: 1000,
      stake_percentage: 0.03,
      min_odds: 1.5,
      max_odds: 4.0,
    },
    current_version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  const [showAIPromptBar, setShowAIPromptBar] = useState(false);
  const [codeTabs, setCodeTabs] = useState<CodeTab[]>([
    {
      id: "notebook-1",
      name: notebook.title,
      content: "",
      type: "notebook",
      active: true,
    },
  ]);
  const [activeCodeTab, setActiveCodeTab] = useState("notebook-1");
  const [scriptContent, setScriptContent] = useState<Record<string, string>>(
    {},
  );

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

    console.log("🚀 Enhanced AI Chat - Starting with input:", aiInput);

    const userMessage: AIMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: aiInput,
      timestamp: new Date(),
    };

    setAiMessages((prev) => [...prev, userMessage]);
    const currentInput = aiInput;
    setAiInput("");

    try {
      // Use the Fixed AI Orchestrator (handles database errors gracefully)
      const { FixedAIOrchestrator } = await import('@/services/ai/orchestrator-fixed');
      const orchestrator = new FixedAIOrchestrator();

      console.log("🚀 Enhanced AI Chat - Using Enhanced Orchestrator");

      // Create streaming message placeholder
      const streamingMessageId = `msg-${Date.now()}-ai`;
      const streamingMessage: AIMessage = {
        id: streamingMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      setAiMessages((prev) => [...prev, streamingMessage]);

      const response = await orchestrator.processRequest({
        query: currentInput,
        userId: `notebook-user-${notebook.id}`,
        notebookId: notebook.id,
        streaming: true,
        context: {
          notebook_cells: notebook.cells.map(cell => ({
            type: cell.type,
            content: cell.content,
            output: cell.output
          })),
          strategy_metadata: strategyMetadata,
          cell_count: notebook.cells.length,
          last_updated: notebook.updatedAt.toISOString(),
          user_preferences: {
            language: 'python',
            framework: 'pandas',
            sport: strategyMetadata.sport
          }
        }
      });

      let fullContent = "";
      let generatedCode = "";

      if (response && typeof response === 'object' && Symbol.asyncIterator in response) {
        // Handle streaming response
        console.log("🚀 Enhanced AI Chat - Processing streaming response");
        
        for await (const chunk of response as AsyncIterable<string>) {
          fullContent += chunk;
          
          // Update streaming message
          setAiMessages((prev) => 
            prev.map(msg => 
              msg.id === streamingMessageId 
                ? { ...msg, content: fullContent }
                : msg
            )
          );

          // Small delay for smooth streaming effect
          await new Promise(resolve => setTimeout(resolve, 20));
        }

        // Mark streaming as complete
        setAiMessages((prev) => 
          prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, isStreaming: false }
              : msg
          )
        );

      } else {
        // Handle direct response
        const aiResponse = response as any;
        fullContent = aiResponse.text || aiResponse.content || "I've processed your request.";
        
        setAiMessages((prev) => 
          prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, content: fullContent, isStreaming: false }
              : msg
          )
        );
      }

      // Extract code blocks from the response
      const codeMatches = fullContent.match(/```(?:python)?\n([\s\S]*?)\n```/g);
      if (codeMatches && codeMatches.length > 0) {
        // Get the largest code block (most comprehensive)
        const codeBlocks = codeMatches.map(match => 
          match.replace(/```(?:python)?\n/, '').replace(/\n```/, '')
        );
        generatedCode = codeBlocks.reduce((longest, current) => 
          current.length > longest.length ? current : longest, ''
        );

        // Add code to notebook if it's substantial and not just examples
        if (generatedCode.length > 50 && 
            !generatedCode.includes('# Add your implementation here') &&
            !generatedCode.includes('# Example usage') &&
            generatedCode.includes('\n')) {
          
          const newCell = {
            id: `cell-${Date.now()}`,
            type: 'code' as const,
            content: generatedCode,
            output: '',
            isExecuting: false,
            executionCount: null
          };
          
          setNotebook(prev => ({
            ...prev,
            cells: [...prev.cells, newCell],
            updatedAt: new Date()
          }));

          console.log("🚀 Enhanced AI Chat - Added generated code to new cell");
        }
      }

      console.log("🚀 Enhanced AI Chat - Response completed successfully");
      
    } catch (error) {
      console.error("🚀 Enhanced AI Chat - Error:", error);
      
      // Update the streaming message with error
      setAiMessages((prev) => 
        prev.map(msg => 
          msg.role === "assistant" && msg.isStreaming
            ? { 
                ...msg, 
                content: `❌ **Enhanced AI Temporarily Unavailable**

I encountered an issue with the enhanced AI system. This could be due to:
- API rate limits or quota exceeded
- Network connectivity issues  
- Temporary service disruption

**What I can still help with:**
- Code suggestions and examples
- Strategy analysis guidance
- General betting concepts
- Data analysis patterns

Please try your request again in a moment, or rephrase it for a simpler response.

*The enhanced AI system provides multi-provider fallbacks, streaming responses, and advanced analysis capabilities.*`,
                isStreaming: false,
                hasError: true
              }
            : msg
        )
      );
    }
  }, [aiInput, notebook.cells, strategyMetadata]);

  const handleRunBacktest = useCallback(
    async (cellId: string) => {
      setNotebook((prev) => ({
        ...prev,
        cells: prev.cells.map((cell) =>
          cell.id === cellId
            ? { ...cell, isBacktesting: true, backtestResult: undefined }
            : cell,
        ),
      }));

      try {
        const cell = notebook.cells.find((c) => c.id === cellId);
        if (!cell) return;

        const backtestRequest = {
          code: cell.content,
          settings: {
            initial_bankroll: 1000,
            commission: 0.02,
            stake_model: "flat" as const,
            start_date: "2024-01-01",
            end_date: "2024-03-01",
          },
        };

        const result = await NotebookService.runBacktest(backtestRequest);

        setNotebook((prev) => ({
          ...prev,
          cells: prev.cells.map((cell) =>
            cell.id === cellId
              ? {
                  ...cell,
                  isBacktesting: false,
                  backtestResult: result,
                }
              : cell,
          ),
          updatedAt: new Date(),
        }));

        // Add to terminal logs
        const logMessage = `✅ Backtest completed: ROI ${result.summary.roi.toFixed(1)}%, Win Rate ${result.summary.win_rate.toFixed(1)}%`;
        setTerminalTabs((prev) =>
          prev.map((tab) =>
            tab.id === "backtest"
              ? { ...tab, content: [...tab.content, logMessage] }
              : tab,
          ),
        );

        toast({
          title: "Backtest Completed",
          description: `ROI: ${result.summary.roi.toFixed(1)}% | Win Rate: ${result.summary.win_rate.toFixed(1)}%`,
        });
      } catch (error) {
        setNotebook((prev) => ({
          ...prev,
          cells: prev.cells.map((cell) =>
            cell.id === cellId
              ? {
                  ...cell,
                  isBacktesting: false,
                  error: "Failed to run backtest",
                }
              : cell,
          ),
        }));

        toast({
          title: "Backtest Failed",
          description: "An error occurred while running the backtest",
          variant: "destructive",
        });
      }
    },
    [notebook.cells, toast],
  );

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

  const handleStrategyCreated = useCallback((newNotebook: NotebookType) => {
    setNotebook(newNotebook);
    setStrategyMetadata({
      id: newNotebook.id,
      name: newNotebook.title,
      description: "A quantitative sports betting strategy",
      sport: "football",
      tags: ["quantitative", "strategy"],
      parameters: {},
      current_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }, []);

  const handleSaveVersion = useCallback(
    (changelog?: string) => {
      const newVersion = strategyMetadata.current_version + 1;
      setStrategyMetadata((prev) => ({
        ...prev,
        current_version: newVersion,
        updated_at: new Date().toISOString(),
      }));

      // In production, save to backend
      NotebookService.saveStrategyVersion(
        notebook,
        strategyMetadata,
        changelog,
      );
    },
    [notebook, strategyMetadata],
  );

  const handleUpdateMetadata = useCallback(
    (updates: Partial<StrategyMetadata>) => {
      setStrategyMetadata((prev) => ({
        ...prev,
        ...updates,
        updated_at: new Date().toISOString(),
      }));
    },
    [],
  );

  const addNewScript = useCallback(() => {
    const newScriptId = `script-${Date.now()}`;
    const newScript: CodeTab = {
      id: newScriptId,
      name: `script_${codeTabs.filter((tab) => tab.type === "script").length + 1}.py`,
      content: "",
      type: "script",
      active: false,
    };

    setCodeTabs((prev) => [
      ...prev.map((tab) => ({ ...tab, active: false })),
      { ...newScript, active: true },
    ]);
    setActiveCodeTab(newScriptId);
    setScriptContent((prev) => ({
      ...prev,
      [newScriptId]: "# New Python script\n",
    }));
  }, [codeTabs]);

  const switchTab = useCallback((tabId: string) => {
    setCodeTabs((prev) =>
      prev.map((tab) => ({ ...tab, active: tab.id === tabId })),
    );
    setActiveCodeTab(tabId);
  }, []);

  const closeTab = useCallback(
    (tabId: string) => {
      if (codeTabs.length <= 1) return; // Don't close the last tab

      const tabIndex = codeTabs.findIndex((tab) => tab.id === tabId);
      const isActive = codeTabs[tabIndex].active;

      setCodeTabs((prev) => {
        const newTabs = prev.filter((tab) => tab.id !== tabId);
        if (isActive && newTabs.length > 0) {
          const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
          newTabs[newActiveIndex].active = true;
          setActiveCodeTab(newTabs[newActiveIndex].id);
        }
        return newTabs;
      });

      // Clean up script content
      setScriptContent((prev) => {
        const newContent = { ...prev };
        delete newContent[tabId];
        return newContent;
      });
    },
    [codeTabs],
  );

  const updateScriptContent = useCallback((tabId: string, content: string) => {
    setScriptContent((prev) => ({ ...prev, [tabId]: content }));
  }, []);

  const handleAICodeGenerated = useCallback(
    (code: string, explanation?: string) => {
      const newCell: CellType = {
        id: `cell-${Date.now()}`,
        type: "code",
        content: code,
        executionCount: 0,
      };

      if (explanation) {
        const explanationCell: CellType = {
          id: `cell-${Date.now()}-explanation`,
          type: "markdown",
          content: `## AI Generated Code\n\n${explanation}`,
          executionCount: 0,
        };

        setNotebook((prev) => ({
          ...prev,
          cells: [...prev.cells, explanationCell, newCell],
          updatedAt: new Date(),
        }));
      } else {
        setNotebook((prev) => ({
          ...prev,
          cells: [...prev.cells, newCell],
          updatedAt: new Date(),
        }));
      }

      setShowAIPromptBar(false);
    },
    [],
  );

  return (
    <div className={cn("ide-layout", className)}>
      {/* IDE Header */}
      <div className="ide-header">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            {codeTabs.map((tab) => (
              <div
                key={tab.id}
                className={cn(
                  "flex items-center px-3 py-1 text-sm rounded-t-lg cursor-pointer group",
                  tab.active
                    ? "bg-quant-bg-tertiary text-quant-text border-b-2 border-quant-accent"
                    : "text-quant-text-muted hover:text-quant-text hover:bg-quant-bg-tertiary/50",
                )}
                onClick={() => switchTab(tab.id)}
              >
                {tab.type === "notebook" ? (
                  <FileText className="h-4 w-4 mr-2" />
                ) : (
                  <Code className="h-4 w-4 mr-2" />
                )}
                {tab.type === "notebook" ? `${tab.name}.ipynb` : tab.name}
                {tab.type === "script" && codeTabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="ml-2 opacity-0 group-hover:opacity-100 hover:bg-quant-error/20 rounded p-0.5 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addNewScript}
              className="flex items-center px-2 py-1 text-quant-text-muted hover:text-quant-text hover:bg-quant-bg-tertiary/50 rounded-t-lg text-sm transition-colors"
              title="Add new script"
            >
              <Plus className="h-4 w-4" />
            </button>
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

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="text-quant-text-muted hover:text-quant-text"
            title="Go to Dashboard"
          >
            <Home className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* IDE Main Content - Flex container for main content + AI sidebar */}
      <div className="flex flex-1 min-h-0 transition-all duration-300">
        {/* Main IDE Content */}
        <div className={cn(
          "ide-main flex-1 transition-all duration-300",
          showAISidebar && "ide-main-with-ai-sidebar"
        )}>
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
              {/* <Button
                variant={activeTab === "analyst" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("analyst")}
                className="flex-1"
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Analyst
              </Button> */}
            </div>
          </div>

          {activeTab === "notebook" && (
            <div className="flex-1 overflow-auto">
              {/* File Explorer */}
              <div className="p-4">
                <div className="flex items ht-center justify-between mb-3">
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

          {activeTab === "analyst" && (
            <div className="flex-1 overflow-auto">
              <BettingChatInterface onCodeGenerated={handleAICodeGenerated} />
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
        <div className={cn(
          "ide-content",
          showAISidebar && "max-w-full"
        )}>
          {/* Content based on active tab */}
          <div className="flex-1 overflow-auto">
            {activeCodeTab === "notebook-1" ? (
              <div className={cn(
                "w-full px-6 py-8",
                showAISidebar && "max-w-full overflow-x-auto"
              )}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-semibold text-quant-text font-sans">
                      {notebook.title}
                    </h1>
                    <span className="text-sm text-quant-text-muted font-mono">
                      Last saved {notebook.updatedAt.toLocaleTimeString()}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      v{strategyMetadata.current_version}
                    </Badge>
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

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAIPromptBar(!showAIPromptBar)}
                      className={cn(
                        "text-quant-warning border-quant-warning/30 hover:bg-quant-warning/10",
                        showAIPromptBar && "bg-quant-warning/10",
                      )}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Generate
                    </Button>

                    <Button variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>

                {/* AI Prompt Bar */}
                {showAIPromptBar && (
                  <div className="mb-6">
                    <AIPromptBar
                      onCodeGenerated={handleAICodeGenerated}
                      contextCells={notebook.cells}
                      sport={strategyMetadata.sport}
                    />
                  </div>
                )}

                <div className={cn(
                  "space-y-6",
                  showAISidebar && "max-w-full"
                )}>
                  {notebook.cells.map((cell, index) => (
                    <NotebookCell
                      key={cell.id}
                      cell={cell}
                      onUpdate={updateCell}
                      onDelete={deleteCell}
                      onRunCell={runCell}
                      onAIAssist={handleAIAssist}
                      onRunBacktest={handleRunBacktest}
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
            ) : (
              <div className="h-full">
                <div className="h-full bg-quant-bg-secondary">
                  <textarea
                    value={scriptContent[activeCodeTab] || ""}
                    onChange={(e) =>
                      updateScriptContent(activeCodeTab, e.target.value)
                    }
                    className="w-full h-full p-4 bg-transparent text-quant-text font-mono text-sm resize-none focus:outline-none"
                    placeholder="# Write your Python script here..."
                    spellCheck={false}
                  />
                </div>
              </div>
            )}
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
        </div>

        {/* AI Assistant Sidebar */}
        {showAISidebar && (
              <div className="w-80 bg-quant-bg-secondary border-l-2 border-quant-accent flex flex-col h-full shadow-xl transition-all duration-300">
              <div className="p-4 border-b-2 border-quant-accent/20 flex items-center justify-between flex-shrink-0 bg-quant-accent/5">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-quant-accent animate-pulse" />
                  <h3 className="font-semibold text-quant-text">AI Assistant</h3>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
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

            <div className="flex-1 flex flex-col min-h-0">
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
                      {message.role === 'user' ? (
                        <div className="text-quant-bg">
                          {message.content}
                        </div>
                      ) : (
                        <MarkdownRenderer 
                          content={message.content} 
                          className="prose prose-sm max-w-none text-quant-text" 
                        />
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-quant-border flex-shrink-0">
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
