import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import {
  Database,
  Code,
  Zap,
  LineChart,
  Target,
  Brain,
  BarChart3,
  TrendingUp,
  Download,
  Play,
  Settings,
  LogOut,
} from "lucide-react";

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-quant-bg">
      {/* Navigation */}
      <nav className="border-b border-quant-border bg-quant-bg/95 backdrop-blur supports-[backdrop-filter]:bg-quant-bg/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-quant-accent" />
              <span className="text-2xl font-bold text-quant-text font-sans">
                QuantSports.ai
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-quant-text-muted font-mono">
                Welcome, {user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-3 text-quant-text">
            Sports Betting Research Platform
          </h1>
          <p className="text-quant-text-muted text-lg">
            Backtest your betting strategies with historical data and advanced
            analytics.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">Historical Data</TabsTrigger>
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
            <TabsTrigger value="backtesting">Backtesting</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-quant-text">
                    Active Strategies
                  </CardTitle>
                  <Target className="h-5 w-5 text-quant-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-quant-text mb-1">
                    3
                  </div>
                  <p className="text-xs text-quant-text-muted">
                    +1 from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-quant-text">
                    Total Backtests
                  </CardTitle>
                  <Zap className="h-4 w-4 text-quant-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-quant-text mb-1">
                    127
                  </div>
                  <p className="text-xs text-quant-accent">
                    +23 from last week
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-quant-text">
                    Best ROI
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-quant-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    +24.5%
                  </div>
                  <p className="text-xs text-quant-accent">
                    Strategy: NBA Over/Under
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-quant-text">
                    Data Points
                  </CardTitle>
                  <Database className="h-4 w-4 text-quant-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-quant-text mb-1">
                    2.4M
                  </div>
                  <p className="text-xs text-quant-text-muted">
                    Historical odds records
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Get started with common tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start" variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Browse Historical Data
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => (window.location.href = "/notebook")}
                  >
                    <Code className="w-4 h-4 mr-2" />
                    Open Notebook IDE
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => (window.location.href = "/gallery")}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Browse Strategy Gallery
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Run Backtest
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <LineChart className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your latest platform interactions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-quant-text">
                        Backtest completed
                      </p>
                      <p className="text-xs text-quant-text-muted">
                        NBA Strategy - 2 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-quant-text">
                        Strategy updated
                      </p>
                      <p className="text-xs text-quant-text-muted">
                        MLB Over/Under - 5 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-quant-text">
                        Data imported
                      </p>
                      <p className="text-xs text-quant-text-muted">
                        Historical odds - 1 day ago
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Historical Odds Database</span>
                </CardTitle>
                <CardDescription>
                  Browse and filter historical odds data across multiple sports
                  and markets.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-quant-text">
                      Sport
                    </label>
                    <select className="w-full p-2 border rounded-md bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
                      <option>All Sports</option>
                      <option>NBA</option>
                      <option>NFL</option>
                      <option>MLB</option>
                      <option>NHL</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-quant-text">
                      Market Type
                    </label>
                    <select className="w-full p-2 border rounded-md bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
                      <option>All Markets</option>
                      <option>Moneyline</option>
                      <option>Spread</option>
                      <option>Over/Under</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-quant-text">
                      Date Range
                    </label>
                    <select className="w-full p-2 border rounded-md bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
                      <option>Last 30 Days</option>
                      <option>Last 3 Months</option>
                      <option>Last Year</option>
                      <option>All Time</option>
                    </select>
                  </div>
                </div>
                <Button className="w-full">
                  <Database className="w-4 h-4 mr-2" />
                  Load Historical Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-quant-text mb-1">
                  Betting Strategies
                </h2>
                <p className="text-quant-accent">
                  Create and manage your betting strategies
                </p>
              </div>
              <Button>
                <Code className="w-4 h-4 mr-2" />
                New Strategy
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>NBA Over/Under</CardTitle>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <CardDescription>
                    Strategy targeting NBA total points markets
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>ROI:</span>
                      <span className="text-green-600 font-medium">+24.5%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Win Rate:</span>
                      <span>67.3%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Bets:</span>
                      <span>156</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Play className="w-3 h-3 mr-1" />
                      Run
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>MLB Moneyline</CardTitle>
                    <Badge variant="outline">Draft</Badge>
                  </div>
                  <CardDescription>
                    Moneyline strategy for MLB games
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>ROI:</span>
                      <span className="text-red-600 font-medium">-3.2%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Win Rate:</span>
                      <span>45.8%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Bets:</span>
                      <span>89</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Play className="w-3 h-3 mr-1" />
                      Test
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300 border-dashed">
                <CardContent className="flex flex-col items-center justify-center h-full py-8">
                  <Code className="w-12 h-12 text-quant-accent mb-4" />
                  <h3 className="font-semibold mb-2">Create New Strategy</h3>
                  <p className="text-sm text-quant-accent text-center mb-4">
                    Start with a template or build from scratch
                  </p>
                  <Button>
                    <Code className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="backtesting" className="space-y-6">
            <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Vectorized Backtesting Engine</span>
                </CardTitle>
                <CardDescription>
                  Run high-performance backtests on your strategies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-quant-text">
                        Select Strategy
                      </label>
                      <select className="w-full p-2 border rounded-md bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
                        <option>NBA Over/Under</option>
                        <option>MLB Moneyline</option>
                        <option>NFL Spread</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-quant-text">
                        Time Period
                      </label>
                      <select className="w-full p-2 border rounded-md bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
                        <option>Last Season</option>
                        <option>Last 2 Seasons</option>
                        <option>Last 3 Years</option>
                        <option>All Available Data</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-quant-text">
                        Markets to Test
                      </label>
                      <select className="w-full p-2 border rounded-md bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
                        <option>All Markets</option>
                        <option>Regular Season Only</option>
                        <option>Playoffs Only</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">
                        Backtest Configuration
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Initial Bankroll:</span>
                          <span>$10,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bet Sizing:</span>
                          <span>Kelly Criterion</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Max Bet Size:</span>
                          <span>5% of bankroll</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Commission:</span>
                          <span>-110 (4.55%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <Button className="w-full" size="lg">
                  <Zap className="w-4 h-4 mr-2" />
                  Execute Backtest
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-quant-text mb-1">
                  Performance Analytics
                </h2>
                <p className="text-quant-accent">
                  Analyze your strategy performance and results
                </p>
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Results
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-quant-text">
                    Total ROI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    +18.7%
                  </div>
                  <p className="text-xs text-quant-text-muted">
                    Across all strategies
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-quant-text">
                    Win Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-quant-text mb-1">
                    58.3%
                  </div>
                  <p className="text-xs text-quant-text-muted">
                    245 wins / 420 bets
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-quant-text">
                    Max Drawdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">-12.4%</div>
                  <p className="text-xs text-quant-text-muted">
                    Worst losing streak
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-quant-text">
                    Profit Factor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-quant-text mb-1">
                    1.47
                  </div>
                  <p className="text-xs text-quant-text-muted">
                    Gross profit / Gross loss
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
              <CardHeader>
                <CardTitle>Performance Visualization</CardTitle>
                <CardDescription>
                  Interactive charts showing strategy performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                  <div className="text-center">
                    <LineChart className="w-12 h-12 text-quant-accent mx-auto mb-2" />
                    <p className="text-quant-text-muted">
                      Performance charts will appear here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
