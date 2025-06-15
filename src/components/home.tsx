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
              <Button
                variant="ghost"
                onClick={() => (window.location.href = "/gallery")}
              >
                Gallery
              </Button>
              <Button variant="ghost" onClick={handleSignIn}>
                Sign In
              </Button>
              <Button onClick={handleGetStarted}>Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6">
            <Brain className="w-3 h-3 mr-2" />
            AI-Powered Sports Betting Research
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight lg:text-7xl mb-4 font-sans">
            Backtest Your Betting Strategies
            <span className="text-quant-accent block mt-2">
              With AI & Historical Data
            </span>
          </h1>
          <div className="text-2xl font-bold mb-8 font-sans tracking-wide">
            <span className="text-white">Build.</span>{" "}
            <span className="text-quant-accent">Backtest.</span>{" "}
            <span className="text-white">Bet.</span>{" "}
            <span className="text-quant-accent">Better.</span>
          </div>
          <p className="text-xl text-quant-text-muted max-w-4xl mx-auto mb-8 leading-8">
            A code-first platform enabling sports bettors to backtest betting
            strategies against historical odds data through our Python SDK.
            Analyze performance, optimize strategies, and make data-driven
            decisions with AI assistance.
          </p>
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 px-4 py-2 bg-quant-accent/10 border border-quant-accent/20 rounded-full">
              <Brain className="w-5 h-5 text-quant-accent" />
              <span className="text-sm font-medium text-quant-accent">
                AI Code Assistant
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-quant-accent/10 border border-quant-accent/20 rounded-full">
              <Zap className="w-5 h-5 text-quant-accent" />
              <span className="text-sm font-medium text-quant-accent">
                Smart Autocomplete
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-quant-accent/10 border border-quant-accent/20 rounded-full">
              <Target className="w-5 h-5 text-quant-accent" />
              <span className="text-sm font-medium text-quant-accent">
                Strategy Generation
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              size="lg"
              className="text-lg px-10 py-4 h-14"
              onClick={handleGetStarted}
            >
              <Code className="w-5 h-5 mr-3" />
              Start Building Strategies
            </Button>
            <Button
              size="lg"
              className="text-lg px-10 py-4 h-14 bg-quant-accent hover:bg-quant-accent/90 text-black"
              onClick={handleGetStarted}
            >
              <Database className="w-5 h-5 mr-3" />
              Explore Historical Data
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-quant-bg-secondary/50">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold tracking-tight mb-6 text-quant-text">
              Everything You Need for Strategy Development
            </h2>
            <p className="text-xl text-quant-text-muted max-w-3xl mx-auto leading-8">
              From historical data ingestion to vectorized backtesting, our
              platform provides all the tools for serious sports betting
              research.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
              <CardHeader>
                <Database className="w-12 h-12 text-quant-accent mb-3" />
                <CardTitle className="text-quant-text text-xl">
                  Historical Odds Database
                </CardTitle>
                <CardDescription className="text-quant-text-muted">
                  Access comprehensive historical odds and results data with
                  advanced filtering by sport, league, and team.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-quant-text-muted space-y-3">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>
                    Multi-sport coverage
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>
                    Real-time data ingestion
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>
                    Advanced filtering options
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>
                    Data visualization tools
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
              <CardHeader>
                <Zap className="w-12 h-12 text-quant-accent mb-3" />
                <CardTitle className="text-quant-text text-xl">
                  Vectorized Backtesting
                </CardTitle>
                <CardDescription className="text-quant-text-muted">
                  High-performance backtesting engine that evaluates strategy
                  performance across historical periods.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-quant-text-muted space-y-3">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>
                    Lightning-fast execution
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>
                    Custom time periods
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>
                    Multiple market testing
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>
                    Performance metrics
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
              <CardHeader>
                <Code className="w-12 h-12 text-quant-accent mb-3" />
                <CardTitle className="text-quant-text text-xl">
                  Python SDK
                </CardTitle>
                <CardDescription className="text-quant-text-muted">
                  Lightweight SDK providing programmatic access to all platform
                  functionality with simple, intuitive APIs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-quant-text-muted space-y-3">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>{" "}
                    Easy installation
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>{" "}
                    Comprehensive documentation
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>{" "}
                    Strategy templates
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>{" "}
                    Code examples
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
              <CardHeader>
                <Target className="w-12 h-12 text-quant-accent mb-3" />
                <CardTitle className="text-quant-text text-xl">
                  Strategy Templates
                </CardTitle>
                <CardDescription className="text-quant-text-muted">
                  Pre-built strategy templates that you can customize with your
                  own entry/exit rules and risk parameters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-quant-text-muted space-y-3">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>{" "}
                    Ready-to-use templates
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>{" "}
                    Customizable parameters
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>{" "}
                    Risk management tools
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>{" "}
                    Best practices included
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
              <CardHeader>
                <LineChart className="w-12 h-12 text-quant-accent mb-3" />
                <CardTitle className="text-quant-text text-xl">
                  Performance Analytics
                </CardTitle>
                <CardDescription className="text-quant-text-muted">
                  Comprehensive performance metrics including ROI, win rates,
                  drawdowns, and detailed visualizations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-quant-text-muted space-y-3">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>{" "}
                    ROI & profit tracking
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>{" "}
                    Win rate analysis
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>{" "}
                    Drawdown monitoring
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>{" "}
                    Interactive charts
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-quant-bg-secondary border-quant-border hover:border-quant-accent/30 transition-all duration-300">
              <CardHeader>
                <Brain className="w-12 h-12 text-quant-accent mb-3" />
                <CardTitle className="text-quant-text text-xl">
                  Clean UI & Code Focus
                </CardTitle>
                <CardDescription className="text-quant-text-muted">
                  Minimal, clean interface focused on data presentation and code
                  execution without unnecessary complexity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-quant-text-muted space-y-3">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>{" "}
                    Intuitive interface
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>{" "}
                    Code-first approach
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>{" "}
                    Data-focused design
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-quant-accent rounded-full mr-3"></span>{" "}
                    Streamlined workflow
                  </li>
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
