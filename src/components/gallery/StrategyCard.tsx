import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  GitFork,
  User,
  Calendar,
  BarChart3,
  Target,
  Activity,
} from "lucide-react";
import { PublishedNotebook } from "@/types/notebook";
import { cn } from "@/lib/utils";

interface StrategyCardProps {
  strategy: PublishedNotebook;
  onFork: (strategy: PublishedNotebook) => void;
  onView: (strategy: PublishedNotebook) => void;
  className?: string;
}

export function StrategyCard({
  strategy,
  onFork,
  onView,
  className,
}: StrategyCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getROIColor = (roi: number) => {
    if (roi > 15) return "text-quant-success";
    if (roi > 5) return "text-quant-accent";
    if (roi > 0) return "text-quant-warning";
    return "text-quant-error";
  };

  const getSportColor = (sport: string) => {
    const colors: Record<string, string> = {
      basketball: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      football: "bg-green-500/10 text-green-400 border-green-500/20",
      baseball: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      hockey: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      soccer: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
    return (
      colors[sport.toLowerCase()] ||
      "bg-quant-accent/10 text-quant-accent border-quant-accent/20"
    );
  };

  return (
    <Card
      className={cn(
        "bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300 hover:shadow-glow cursor-pointer group",
        className,
      )}
      onClick={() => onView(strategy)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-quant-text mb-2 group-hover:text-quant-accent transition-colors">
              {strategy.title}
            </h3>
            <div className="flex items-center space-x-3 text-sm text-quant-text-muted mb-3">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{strategy.author_name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(strategy.created_at)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <GitFork className="h-3 w-3" />
                <span>{strategy.fork_count}</span>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div
              className={cn(
                "text-xl font-bold font-mono",
                getROIColor(strategy.roi),
              )}
            >
              {strategy.roi > 0 ? "+" : ""}
              {strategy.roi.toFixed(1)}%
            </div>
            <div className="text-xs text-quant-text-muted">ROI</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-quant-bg-tertiary rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Activity className="h-4 w-4 text-quant-accent" />
            </div>
            <div className="text-sm font-mono text-quant-text">
              {strategy.sharpe.toFixed(1)}
            </div>
            <div className="text-xs text-quant-text-muted">Sharpe</div>
          </div>
          <div className="text-center p-2 bg-quant-bg-tertiary rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Target className="h-4 w-4 text-quant-accent" />
            </div>
            <div className="text-sm font-mono text-quant-text">
              {strategy.performance_data.metrics?.win_rate?.toFixed(1) || "N/A"}
              %
            </div>
            <div className="text-xs text-quant-text-muted">Win Rate</div>
          </div>
          <div className="text-center p-2 bg-quant-bg-tertiary rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <BarChart3 className="h-4 w-4 text-quant-accent" />
            </div>
            <div className="text-sm font-mono text-quant-text">
              {strategy.performance_data.metrics?.total_bets || "N/A"}
            </div>
            <div className="text-xs text-quant-text-muted">Bets</div>
          </div>
        </div>

        {/* Summary */}
        {strategy.summary && (
          <p className="text-sm text-quant-text-muted line-clamp-2">
            {strategy.summary}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <Badge className={cn("text-xs", getSportColor(strategy.sport))}>
            {strategy.sport.toUpperCase()}
          </Badge>
          {strategy.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-xs border-quant-border text-quant-text-muted"
            >
              {tag}
            </Badge>
          ))}
          {strategy.tags.length > 3 && (
            <Badge
              variant="outline"
              className="text-xs border-quant-border text-quant-text-muted"
            >
              +{strategy.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Chart Preview Placeholder */}
        <div className="h-16 bg-quant-bg-tertiary rounded-lg flex items-center justify-center border border-quant-border">
          <div className="flex items-center space-x-2 text-quant-text-muted">
            {strategy.roi >= 0 ? (
              <TrendingUp className="h-4 w-4 text-quant-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-quant-error" />
            )}
            <span className="text-xs">P&L Preview</span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onFork(strategy);
          }}
          className="w-full bg-quant-accent hover:bg-quant-accent/90 text-quant-bg"
          size="sm"
        >
          <GitFork className="h-4 w-4 mr-2" />
          Fork Strategy
        </Button>
      </CardContent>
    </Card>
  );
}
