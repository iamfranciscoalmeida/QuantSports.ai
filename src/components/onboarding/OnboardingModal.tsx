import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Code,
  Zap,
  Target,
  LineChart,
  Brain,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
} from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const onboardingSteps = [
  {
    title: "Welcome to QuantSports.ai",
    description: "Your journey to data-driven sports betting starts here",
    icon: Brain,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          QuantSports.ai is a cloud-native platform that enables you to backtest
          betting strategies against historical odds data through our Python
          SDK.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Historical Data Access</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Vectorized Backtesting</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Python SDK</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Performance Analytics</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Explore Historical Data",
    description: "Access comprehensive odds and results database",
    icon: Database,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Browse our extensive historical odds database with advanced filtering
          capabilities.
        </p>
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">What you can do:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Filter by sport, league, and team</li>
            <li>• View historical odds trends</li>
            <li>• Access real-time data ingestion</li>
            <li>• Visualize odds movements</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "Build Your Strategy",
    description: "Create custom betting strategies with Python",
    icon: Code,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Use our Python SDK and strategy templates to define your betting
          logic.
        </p>
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Strategy Development:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Start with pre-built templates</li>
            <li>• Customize entry/exit rules</li>
            <li>• Set risk parameters</li>
            <li>• Define betting logic</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "Run Backtests",
    description: "Test your strategies against historical data",
    icon: Zap,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Execute high-performance backtesting to evaluate strategy performance.
        </p>
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Backtesting Features:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Lightning-fast vectorized execution</li>
            <li>• Custom time periods</li>
            <li>• Multiple market testing</li>
            <li>• Real-time performance metrics</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "Analyze Results",
    description: "Review performance metrics and optimize",
    icon: LineChart,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Comprehensive analytics to understand your strategy's performance.
        </p>
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Performance Metrics:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• ROI and profit tracking</li>
            <li>• Win rate analysis</li>
            <li>• Drawdown monitoring</li>
            <li>• Interactive visualizations</li>
          </ul>
        </div>
      </div>
    ),
  },
];

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = onboardingSteps[currentStep];
  const Icon = step.icon;

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-left">{step.title}</DialogTitle>
                <DialogDescription className="text-left">
                  {step.description}
                </DialogDescription>
              </div>
            </div>
            <Badge variant="secondary">
              {currentStep + 1} of {onboardingSteps.length}
            </Badge>
          </div>
        </DialogHeader>

        <div className="py-6">{step.content}</div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep
                    ? "bg-primary"
                    : index < currentStep
                      ? "bg-primary/50"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="flex space-x-2">
            <Button variant="ghost" onClick={skipOnboarding}>
              Skip
            </Button>
            {currentStep > 0 && (
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button onClick={nextStep}>
              {currentStep === onboardingSteps.length - 1 ? (
                "Get Started"
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
