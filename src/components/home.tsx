import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Code,
  Database,
  TrendingUp,
  Zap,
  Target,
  Brain,
  LineChart,
} from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useAuth } from "@/hooks/useAuth";

function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      setShowOnboarding(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleSignIn = () => {
    setShowAuthModal(true);
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">
                QuantSports.ai
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleSignIn}>
                Sign In
              </Button>
              <Button onClick={handleGetStarted}>Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            <Zap className="w-3 h-3 mr-1" />
            Cloud-Native Sports Betting Research
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl mb-6">
            Backtest Your Betting Strategies
            <span className="text-primary block">With Historical Data</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-7">
            A code-first platform enabling sports bettors to backtest betting
            strategies against historical odds data through our Python SDK.
            Analyze performance, optimize strategies, and make data-driven
            decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8 py-3"
              onClick={handleGetStarted}
            >
              <Code className="w-5 h-5 mr-2" />
              Start Building Strategies
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-3"
              onClick={handleGetStarted}
            >
              <Database className="w-5 h-5 mr-2" />
              Explore Historical Data
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold tracking-tight mb-4">
              Everything You Need for Strategy Development
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From historical data ingestion to vectorized backtesting, our
              platform provides all the tools for serious sports betting
              research.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-background">
              <CardHeader>
                <Database className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Historical Odds Database</CardTitle>
                <CardDescription>
                  Access comprehensive historical odds and results data with
                  advanced filtering by sport, league, and team.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Multi-sport coverage</li>
                  <li>• Real-time data ingestion</li>
                  <li>• Advanced filtering options</li>
                  <li>• Data visualization tools</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardHeader>
                <Zap className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Vectorized Backtesting</CardTitle>
                <CardDescription>
                  High-performance backtesting engine that evaluates strategy
                  performance across historical periods.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Lightning-fast execution</li>
                  <li>• Custom time periods</li>
                  <li>• Multiple market testing</li>
                  <li>• Performance metrics</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardHeader>
                <Code className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Python SDK</CardTitle>
                <CardDescription>
                  Lightweight SDK providing programmatic access to all platform
                  functionality with simple, intuitive APIs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Easy installation</li>
                  <li>• Comprehensive documentation</li>
                  <li>• Strategy templates</li>
                  <li>• Code examples</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardHeader>
                <Target className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Strategy Templates</CardTitle>
                <CardDescription>
                  Pre-built strategy templates that you can customize with your
                  own entry/exit rules and risk parameters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Ready-to-use templates</li>
                  <li>• Customizable parameters</li>
                  <li>• Risk management tools</li>
                  <li>• Best practices included</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardHeader>
                <LineChart className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>
                  Comprehensive performance metrics including ROI, win rates,
                  drawdowns, and detailed visualizations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• ROI & profit tracking</li>
                  <li>• Win rate analysis</li>
                  <li>• Drawdown monitoring</li>
                  <li>• Interactive charts</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardHeader>
                <Brain className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Clean UI & Code Focus</CardTitle>
                <CardDescription>
                  Minimal, clean interface focused on data presentation and code
                  execution without unnecessary complexity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Intuitive interface</li>
                  <li>• Code-first approach</li>
                  <li>• Data-focused design</li>
                  <li>• Streamlined workflow</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold tracking-tight mb-4">
              How QuantSports.ai Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From data exploration to strategy optimization, follow our
              streamlined workflow to develop profitable betting strategies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Explore Data</h3>
              <p className="text-muted-foreground">
                Browse our comprehensive historical odds database and filter by
                your preferred sports and markets.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Build Strategy</h3>
              <p className="text-muted-foreground">
                Use our Python SDK and strategy templates to define your betting
                logic, entry/exit rules, and risk parameters.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Run Backtest</h3>
              <p className="text-muted-foreground">
                Execute vectorized backtesting across historical periods to
                evaluate your strategy's performance.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">4. Optimize</h3>
              <p className="text-muted-foreground">
                Analyze results, refine your strategy, and iterate until you
                achieve consistent profitability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-semibold tracking-tight mb-4">
            Ready to Build Winning Strategies?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join the next generation of data-driven sports bettors. Start
            backtesting your strategies today with our comprehensive platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8 py-3"
              onClick={handleGetStarted}
            >
              <Code className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              View Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">QuantSports.ai</span>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Documentation
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Support
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>
              &copy; 2024 QuantSports.ai. All rights reserved. Built for serious
              sports betting research.
            </p>
          </div>
        </div>
      </footer>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      <OnboardingModal open={showOnboarding} onOpenChange={setShowOnboarding} />
    </div>
  );
}

export default Home;
