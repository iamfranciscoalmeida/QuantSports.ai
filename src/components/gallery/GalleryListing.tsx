import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  BarChart3,
  TrendingUp,
  GitFork,
  Calendar,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { StrategyCard } from "./StrategyCard";
import { PublishedNotebook, GalleryFilters } from "@/types/notebook";
import { NotebookService } from "@/services/notebookService";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface GalleryListingProps {
  className?: string;
}

export function GalleryListing({ className }: GalleryListingProps) {
  const [strategies, setStrategies] = useState<PublishedNotebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<GalleryFilters>({
    sort_by: "created_at",
    sort_order: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const sports = [
    { value: "basketball", label: "Basketball" },
    { value: "football", label: "Football" },
    { value: "baseball", label: "Baseball" },
    { value: "hockey", label: "Hockey" },
    { value: "soccer", label: "Soccer" },
  ];

  const sortOptions = [
    { value: "created_at", label: "Recently Added" },
    { value: "roi", label: "ROI" },
    { value: "fork_count", label: "Most Forked" },
    { value: "sharpe", label: "Sharpe Ratio" },
  ];

  const loadStrategies = async () => {
    try {
      setLoading(true);
      // For now, use sample data. In production, this would call the API
      const data = await NotebookService.getSamplePublishedNotebooks();
      setStrategies(data);
    } catch (error) {
      console.error("Failed to load strategies:", error);
      toast({
        title: "Error Loading Strategies",
        description: "Failed to load published strategies. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStrategies();
  }, []);

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchTerm }));
    // In production, this would trigger a new API call
    // For now, we'll filter the existing data
    if (searchTerm) {
      const filtered = strategies.filter(
        (strategy) =>
          strategy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          strategy.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          strategy.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
      setStrategies(filtered);
    } else {
      loadStrategies();
    }
  };

  const handleFilterChange = (key: keyof GalleryFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // In production, this would trigger a new API call with filters
  };

  const handleFork = async (strategy: PublishedNotebook) => {
    try {
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
    }
  };

  const handleView = (strategy: PublishedNotebook) => {
    navigate(`/gallery/${strategy.slug}`);
  };

  const toggleSortOrder = () => {
    const newOrder = filters.sort_order === "desc" ? "asc" : "desc";
    handleFilterChange("sort_order", newOrder);
  };

  const filteredStrategies = strategies.filter((strategy) => {
    if (filters.sport && strategy.sport !== filters.sport) return false;
    if (filters.min_roi !== undefined && strategy.roi < filters.min_roi)
      return false;
    if (filters.max_roi !== undefined && strategy.roi > filters.max_roi)
      return false;
    return true;
  });

  return (
    <div className={cn("min-h-screen bg-quant-bg", className)}>
      {/* Header */}
      <div className="border-b border-quant-border bg-quant-bg/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-quant-text mb-2">
                Strategy Gallery
              </h1>
              <p className="text-quant-text-muted">
                Discover, learn from, and fork profitable betting strategies
                from the community
              </p>
            </div>
            <Button
              onClick={loadStrategies}
              variant="outline"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-quant-text-muted" />
                <Input
                  placeholder="Search strategies, tags, or authors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 bg-quant-bg-secondary border-quant-border text-quant-text"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Filter Controls */}
            <div className="flex space-x-2">
              <Select
                value={filters.sport || "all"}
                onValueChange={(value) =>
                  handleFilterChange(
                    "sport",
                    value === "all" ? undefined : value,
                  )
                }
              >
                <SelectTrigger className="w-40 bg-quant-bg-secondary border-quant-border">
                  <SelectValue placeholder="All Sports" />
                </SelectTrigger>
                <SelectContent className="bg-quant-bg-secondary border-quant-border">
                  <SelectItem value="all">All Sports</SelectItem>
                  {sports.map((sport) => (
                    <SelectItem key={sport.value} value={sport.value}>
                      {sport.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.sort_by || "created_at"}
                onValueChange={(value) => handleFilterChange("sort_by", value)}
              >
                <SelectTrigger className="w-40 bg-quant-bg-secondary border-quant-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-quant-bg-secondary border-quant-border">
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={toggleSortOrder}
                className="bg-quant-bg-secondary border-quant-border"
              >
                {filters.sort_order === "desc" ? (
                  <SortDesc className="h-4 w-4" />
                ) : (
                  <SortAsc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {(filters.sport || filters.search) && (
            <div className="flex items-center space-x-2 mt-4">
              <span className="text-sm text-quant-text-muted">
                Active filters:
              </span>
              {filters.sport && (
                <Badge
                  variant="secondary"
                  className="bg-quant-accent/10 text-quant-accent border-quant-accent/20"
                >
                  {sports.find((s) => s.value === filters.sport)?.label}
                  <button
                    onClick={() => handleFilterChange("sport", undefined)}
                    className="ml-2 hover:text-quant-error"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.search && (
                <Badge
                  variant="secondary"
                  className="bg-quant-accent/10 text-quant-accent border-quant-accent/20"
                >
                  "{filters.search}"
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      handleFilterChange("search", undefined);
                      loadStrategies();
                    }}
                    className="ml-2 hover:text-quant-error"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-quant-accent" />
              <span className="text-quant-text">Loading strategies...</span>
            </div>
          </div>
        ) : filteredStrategies.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-quant-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-quant-text mb-2">
              No strategies found
            </h3>
            <p className="text-quant-text-muted mb-4">
              Try adjusting your filters or search terms
            </p>
            <Button
              onClick={() => {
                setFilters({ sort_by: "created_at", sort_order: "desc" });
                setSearchTerm("");
                loadStrategies();
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="mb-6">
              <div className="flex flex-col gap-4">
                <p className="text-sm text-quant-text-muted">
                  Showing {filteredStrategies.length} strategies
                </p>
                <div className="flex flex-col sm:flex-row gap-8 text-sm text-quant-text-muted">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-4 w-4 text-quant-accent" />
                    <span className="font-medium">Avg ROI:</span>
                    <span className="text-quant-text font-semibold text-base">
                      {(
                        filteredStrategies.reduce((sum, s) => sum + s.roi, 0) /
                        filteredStrategies.length
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <GitFork className="h-4 w-4 text-quant-accent" />
                    <span className="font-medium">Total Forks:</span>
                    <span className="text-quant-text font-semibold text-base">
                      {filteredStrategies.reduce(
                        (sum, s) => sum + s.fork_count,
                        0,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategy Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStrategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  onFork={handleFork}
                  onView={handleView}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
