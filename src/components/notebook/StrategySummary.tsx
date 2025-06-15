import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Settings,
  TrendingUp,
  Target,
  DollarSign,
  BarChart3,
  Save,
  GitBranch,
  Clock,
  Tag,
  Edit3,
  CheckCircle,
  AlertTriangle,
  Percent,
  Calendar,
  User,
  FileText,
  Sparkles,
} from "lucide-react";
import { StrategyMetadata, BacktestSummary, Notebook } from "@/types/notebook";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface StrategySummaryProps {
  notebook: Notebook;
  metadata?: StrategyMetadata;
  lastBacktest?: BacktestSummary;
  onSaveVersion?: (changelog?: string) => void;
  onUpdateMetadata?: (metadata: Partial<StrategyMetadata>) => void;
  className?: string;
}

export function StrategySummary({
  notebook,
  metadata,
  lastBacktest,
  onSaveVersion,
  onUpdateMetadata,
  className,
}: StrategySummaryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [changelog, setChangelog] = useState("");
  const [editedMetadata, setEditedMetadata] = useState(
    metadata || {
      id: notebook.id,
      name: notebook.title,
      description: "",
      sport: "football",
      tags: [],
      parameters: {},
      current_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  );
  const { toast } = useToast();

  const handleSaveVersion = () => {
    if (onSaveVersion) {
      onSaveVersion(changelog);
      setChangelog("");
      toast({
        title: "Version Saved",
        description: `Version ${(metadata?.current_version || 1) + 1} saved successfully`,
      });
    }
  };

  const handleUpdateMetadata = () => {
    if (onUpdateMetadata) {
      onUpdateMetadata(editedMetadata);
      setIsEditing(false);
      toast({
        title: "Strategy Updated",
        description: "Strategy metadata has been updated",
      });
    }
  };

  const getPerformanceColor = (value: number, isPositive: boolean = true) => {
    if (value === 0) return "text-quant-text-muted";
    return (isPositive ? value > 0 : value < 0)
      ? "text-quant-success"
      : "text-quant-error";
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case "low":
        return "secondary";
      case "medium":
        return "outline";
      case "high":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "text-quant-text border-quant-border hover:bg-quant-accent/10",
            className,
          )}
        >
          <Settings className="h-4 w-4 mr-2" />
          Strategy Info
        </Button>
      </SheetTrigger>
      <SheetContent className="w-96 bg-quant-bg-secondary border-quant-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-quant-text flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-quant-accent" />
            Strategy Summary
          </SheetTitle>
          <SheetDescription className="text-quant-text-muted">
            Manage your strategy parameters, view performance, and save
            versions.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Basic Info */}
          <Card className="bg-quant-bg-tertiary border-quant-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-quant-text">
                  Basic Info
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="h-8 w-8 p-0 text-quant-text-muted hover:text-quant-text"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-quant-text-muted mb-1 block">
                      Strategy Name
                    </label>
                    <Input
                      value={editedMetadata.name}
                      onChange={(e) =>
                        setEditedMetadata({
                          ...editedMetadata,
                          name: e.target.value,
                        })
                      }
                      className="h-8 text-sm bg-quant-bg-secondary border-quant-border"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-quant-text-muted mb-1 block">
                      Description
                    </label>
                    <Textarea
                      value={editedMetadata.description}
                      onChange={(e) =>
                        setEditedMetadata({
                          ...editedMetadata,
                          description: e.target.value,
                        })
                      }
                      className="text-sm bg-quant-bg-secondary border-quant-border min-h-[60px]"
                      placeholder="Describe your strategy..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-quant-text-muted mb-1 block">
                      Sport
                    </label>
                    <Select
                      value={editedMetadata.sport}
                      onValueChange={(value) =>
                        setEditedMetadata({ ...editedMetadata, sport: value })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm bg-quant-bg-secondary border-quant-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-quant-bg-secondary border-quant-border">
                        <SelectItem value="football">Football ⚽</SelectItem>
                        <SelectItem value="basketball">
                          Basketball 🏀
                        </SelectItem>
                        <SelectItem value="baseball">Baseball ⚾</SelectItem>
                        <SelectItem value="hockey">Hockey 🏒</SelectItem>
                        <SelectItem value="tennis">Tennis 🎾</SelectItem>
                        <SelectItem value="all">All Sports</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleUpdateMetadata}
                      className="flex-1 h-8 text-xs bg-quant-accent hover:bg-quant-accent/90"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 h-8 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-quant-text-muted">Name</div>
                    <div className="text-sm font-medium text-quant-text">
                      {editedMetadata.name}
                    </div>
                  </div>
                  {editedMetadata.description && (
                    <div>
                      <div className="text-xs text-quant-text-muted">
                        Description
                      </div>
                      <div className="text-sm text-quant-text">
                        {editedMetadata.description}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-quant-text-muted">Sport</div>
                      <div className="text-sm text-quant-text capitalize">
                        {editedMetadata.sport}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-quant-text-muted">
                        Version
                      </div>
                      <div className="text-sm font-mono text-quant-accent">
                        v{metadata?.current_version || 1}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          {lastBacktest && (
            <Card className="bg-quant-bg-tertiary border-quant-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-quant-text flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-quant-accent" />
                  Last Backtest Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xs text-quant-text-muted mb-1">
                      ROI
                    </div>
                    <div
                      className={cn(
                        "text-lg font-bold font-mono",
                        getPerformanceColor(lastBacktest.roi),
                      )}
                    >
                      {lastBacktest.roi > 0 ? "+" : ""}
                      {lastBacktest.roi.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-quant-text-muted mb-1">
                      Win Rate
                    </div>
                    <div className="text-lg font-bold font-mono text-quant-text">
                      {lastBacktest.win_rate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-quant-text-muted mb-1">
                      Net P&L
                    </div>
                    <div
                      className={cn(
                        "text-sm font-mono",
                        getPerformanceColor(lastBacktest.net_pnl),
                      )}
                    >
                      ${lastBacktest.net_pnl.toFixed(0)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-quant-text-muted mb-1">
                      Max DD
                    </div>
                    <div className="text-sm font-mono text-quant-error">
                      -{lastBacktest.max_drawdown.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-quant-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-quant-text-muted">Total Bets:</span>
                    <span className="font-mono text-quant-text">
                      {lastBacktest.total_bets}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-quant-text-muted">Sharpe Ratio:</span>
                    <span className="font-mono text-quant-text">
                      {lastBacktest.sharpe_ratio.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strategy Parameters */}
          <Card className="bg-quant-bg-tertiary border-quant-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-quant-text flex items-center">
                <Settings className="h-4 w-4 mr-2 text-quant-accent" />
                Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(editedMetadata.parameters).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(editedMetadata.parameters).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <span className="text-xs text-quant-text-muted">
                          {key}:
                        </span>
                        <span className="text-xs font-mono text-quant-text">
                          {typeof value === "number"
                            ? value.toFixed(3)
                            : String(value)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="text-xs text-quant-text-muted text-center py-2">
                  No parameters defined
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="bg-quant-bg-tertiary border-quant-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-quant-text flex items-center">
                <Tag className="h-4 w-4 mr-2 text-quant-accent" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editedMetadata.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {editedMetadata.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-quant-text-muted text-center py-2">
                  No tags added
                </div>
              )}
            </CardContent>
          </Card>

          {/* Version Control */}
          <Card className="bg-quant-bg-tertiary border-quant-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-quant-text flex items-center">
                <GitBranch className="h-4 w-4 mr-2 text-quant-accent" />
                Version Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-quant-text-muted">Current Version:</span>
                <span className="font-mono text-quant-accent">
                  v{metadata?.current_version || 1}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-quant-text-muted">Created:</span>
                <span className="font-mono text-quant-text">
                  {new Date(editedMetadata.created_at).toLocaleDateString()}
                </span>
              </div>
              {metadata?.forked_from && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-quant-text-muted">Forked from:</span>
                  <span className="text-quant-accent">
                    {metadata.forked_from}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-quant-border">
                <Textarea
                  placeholder="Describe changes in this version..."
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  className="text-xs bg-quant-bg-secondary border-quant-border min-h-[60px] mb-3"
                />
                <Button
                  onClick={handleSaveVersion}
                  disabled={!changelog.trim()}
                  className="w-full h-8 text-xs bg-quant-accent hover:bg-quant-accent/90"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save Version v{(metadata?.current_version || 1) + 1}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-quant-bg-tertiary border-quant-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-quant-text flex items-center">
                <FileText className="h-4 w-4 mr-2 text-quant-accent" />
                Notebook Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-quant-text-muted">Total Cells:</span>
                  <span className="font-mono text-quant-text">
                    {notebook.cells.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-quant-text-muted">Code Cells:</span>
                  <span className="font-mono text-quant-text">
                    {
                      notebook.cells.filter((cell) => cell.type === "code")
                        .length
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-quant-text-muted">Last Modified:</span>
                  <span className="font-mono text-quant-text">
                    {notebook.updatedAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
