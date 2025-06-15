import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  GitFork,
  User,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  BarChart3,
  Activity,
  AlertTriangle,
  Copy,
  Share,
  Heart,
  MessageSquare,
  Loader2,
  Code,
  Play,
} from "lucide-react";
import { PublishedNotebook } from "@/types/notebook";
import { NotebookService } from "@/services/notebookService";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import Editor from "@monaco-editor/react";

export function StrategyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [strategy, setStrategy] = useState<PublishedNotebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [forking, setForking] = useState(false);

  useEffect(() => {
    const loadStrategy = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        // For now, use sample data. In production, this would call the API
        const sampleStrategies =
          await NotebookService.getSamplePublishedNotebooks();
        const foundStrategy = sampleStrategies.find((s) => s.slug === slug);

        if (foundStrategy) {
          setStrategy(foundStrategy);
        } else {
          toast({
            title: "Strategy Not Found",
            description: "The requested strategy could not be found.",
            variant: "destructive",
          });
          navigate("/gallery");
        }
      } catch (error) {
        console.error("Failed to load strategy:", error);
        toast({
          title: "Error Loading Strategy",
          description: "Failed to load the strategy details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStrategy();
  }, [slug, navigate, toast]);

  const handleFork = async () => {
    if (!strategy) return;

    try {
      setForking(true);
      const forkedNotebook = await NotebookService.forkNotebook({
        published_notebook_id: strategy.id,
        new_title: `${strategy.title} (Fork)`,
      });

      toast({
        title: "Strategy Forked!",
        description: `"${strategy.title}" has been added to your workspace.`,
      });

      // Navigate to the notebook editor with the forked notebook
      navigate("/notebook", { state: { notebook: forkedNotebook } });
    } catch (error) {
      console.error("Failed to fork strategy:", error);
      toast({
        title: "Fork Failed",
        description: "Failed to fork the strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setForking(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Strategy link has been copied to clipboard.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-quant-bg flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-quant-accent" />
          <span className="text-quant-text">Loading strategy...</span>
        </div>
      </div>
    );
  }

  if (!strategy) {
    return null;
  }

  return (
    <div className="min-h-screen bg-quant-bg">
      {/* Header */}
      <div className="border-b border-quant-border bg-quant-bg/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/gallery")}
                className="text-quant-text-muted hover:text-quant-text"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Gallery
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-2xl font-bold text-quant-text">
                  {strategy.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-quant-text-muted mt-1">
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
                    <span>{strategy.fork_count} forks</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleShare}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                onClick={handleFork}
                disabled={forking}
                className="bg-quant-accent hover:bg-quant-accent/90 text-quant-bg"
              >
                {forking ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <GitFork className="h-4 w-4 mr-2" />
                )}
                Fork Strategy
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            {strategy.summary && (
              <Card className="bg-quant-bg-secondary border-quant-border">
                <CardHeader>
                  <CardTitle className="text-quant-text">
                    Strategy Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-quant-text-muted leading-relaxed">
                    {strategy.summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            <Card className="bg-quant-bg-secondary border-quant-border">
              <CardHeader>
                <CardTitle className="text-quant-text">
                  Tags & Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={cn("text-sm", getSportColor(strategy.sport))}
                  >
                    {strategy.sport.toUpperCase()}
                  </Badge>
                  {strategy.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-quant-border text-quant-text-muted"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Code Preview */}
            <Card className="bg-quant-bg-secondary border-quant-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-quant-text flex items-center">
                    <Code className="h-5 w-5 mr-2" />
                    Strategy Code
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(strategy.code)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden border border-quant-border">
                  <Editor
                    height="400px"
                    defaultLanguage="python"
                    theme="vs-dark"
                    value={strategy.code}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      lineNumbers: "on",
                      folding: true,
                      wordWrap: "on",
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Performance Chart Placeholder */}
            <Card className="bg-quant-bg-secondary border-quant-border">
              <CardHeader>
                <CardTitle className="text-quant-text flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Performance Chart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-quant-bg-tertiary rounded-lg flex items-center justify-center border border-quant-border">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-quant-text-muted mx-auto mb-2" />
                    <p className="text-quant-text-muted">
                      P&L curve visualization would appear here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Metrics */}
            <Card className="bg-quant-bg-secondary border-quant-border">
              <CardHeader>
                <CardTitle className="text-quant-text">
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-quant-bg-tertiary rounded-lg">
                    <div
                      className={cn(
                        "text-2xl font-bold font-mono",
                        getROIColor(strategy.roi),
                      )}
                    >
                      {strategy.roi > 0 ? "+" : ""}
                      {strategy.roi.toFixed(1)}%
                    </div>
                    <div className="text-xs text-quant-text-muted mt-1">
                      ROI
                    </div>
                  </div>
                  <div className="text-center p-3 bg-quant-bg-tertiary rounded-lg">
                    <div className="text-2xl font-bold font-mono text-quant-text">
                      {strategy.sharpe.toFixed(1)}
                    </div>
                    <div className="text-xs text-quant-text-muted mt-1">
                      Sharpe Ratio
                    </div>
                  </div>
                </div>

                {strategy.performance_data.metrics && (
                  <div className="space-y-3">
                    <Separator className="bg-quant-border" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-quant-text-muted flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Win Rate
                      </span>
                      <span className="font-mono text-quant-text">
                        {strategy.performance_data.metrics.win_rate?.toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-quant-text-muted flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Max Drawdown
                      </span>
                      <span className="font-mono text-quant-error">
                        -
                        {strategy.performance_data.metrics.max_drawdown?.toFixed(
                          1,
                        )}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-quant-text-muted flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Total Bets
                      </span>
                      <span className="font-mono text-quant-text">
                        {strategy.performance_data.metrics.total_bets}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-quant-bg-secondary border-quant-border">
              <CardHeader>
                <CardTitle className="text-quant-text">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleFork}
                  disabled={forking}
                  className="w-full bg-quant-accent hover:bg-quant-accent/90 text-quant-bg"
                >
                  {forking ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <GitFork className="h-4 w-4 mr-2" />
                  )}
                  Fork to My Workspace
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleShare}
                >
                  <Share className="h-4 w-4 mr-2" />
                  Share Strategy
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigator.clipboard.writeText(strategy.code)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
              </CardContent>
            </Card>

            {/* Author Info */}
            <Card className="bg-quant-bg-secondary border-quant-border">
              <CardHeader>
                <CardTitle className="text-quant-text">Author</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-quant-accent/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-quant-accent" />
                  </div>
                  <div>
                    <div className="font-medium text-quant-text">
                      {strategy.author_name}
                    </div>
                    <div className="text-sm text-quant-text-muted">
                      Published {formatDate(strategy.created_at)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
