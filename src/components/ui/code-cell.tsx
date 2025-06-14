import * as React from "react";
import { Button } from "@/components/ui/button";
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
  HelpCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeCellProps {
  children: React.ReactNode;
  className?: string;
  onRun?: () => void;
  onDelete?: () => void;
  onExplain?: () => void;
  isRunning?: boolean;
  language?: string;
}

export function CodeCell({
  children,
  className,
  onRun,
  onDelete,
  onExplain,
  isRunning = false,
  language = "python",
}: CodeCellProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && onRun) {
      e.preventDefault();
      onRun();
    }
  };

  return (
    <div
      className={cn("code-cell group relative", className)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Top-right controls */}
      <div className="absolute top-3 right-3 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <Button
          size="code"
          variant="code"
          onClick={onRun}
          disabled={isRunning}
          className="h-7 px-2"
        >
          {isRunning ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="code" variant="code" className="h-7 w-7 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-quant-bg-secondary border-quant-border"
          >
            {onExplain && (
              <DropdownMenuItem
                onClick={onExplain}
                className="text-quant-text hover:bg-quant-accent/10"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Explain Code
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={onDelete}
                className="text-quant-error hover:bg-quant-error/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Cell
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Language indicator */}
      <div className="absolute top-3 left-3 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
        <span className="text-xs font-mono text-quant-text-muted bg-quant-bg-tertiary px-2 py-1 rounded">
          {language}
        </span>
      </div>

      {/* Code content */}
      <div className="pt-10 pb-4 px-4">{children}</div>

      {/* Execution hint */}
      <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-60 transition-opacity duration-200">
        <span className="text-xs font-mono text-quant-text-muted">
          ⌘+Enter to run
        </span>
      </div>
    </div>
  );
}

// Pre-styled code block component
export function CodeBlock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <pre
      className={cn(
        "font-mono text-sm text-quant-text bg-quant-bg-tertiary p-4 rounded-xl overflow-x-auto",
        "border border-quant-border",
        className,
      )}
    >
      <code>{children}</code>
    </pre>
  );
}
