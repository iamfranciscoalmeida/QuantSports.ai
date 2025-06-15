import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Sparkles,
  FileText,
  TrendingUp,
  Brain,
  Target,
  BarChart3,
  Zap,
  Code,
  Loader2,
  CheckCircle,
  Star,
  Users,
  Clock,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  StrategyTemplate,
  NewStrategyRequest,
  Notebook,
} from "@/types/notebook";
import { NotebookService } from "@/services/notebookService";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "Strategy name is required").max(50, "Name too long"),
  sport: z.string().min(1, "Please select a sport"),
  template_id: z.string().optional(),
  ai_prompt: z.string().optional(),
  enable_ai_assist: z.boolean().default(false),
});

interface StrategyCreatorProps {
  onStrategyCreated: (notebook: Notebook) => void;
}

export function StrategyCreator({ onStrategyCreated }: StrategyCreatorProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<StrategyTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [creationMode, setCreationMode] = useState<"template" | "ai" | "blank">(
    "template",
  );
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      sport: "",
      template_id: "",
      ai_prompt: "",
      enable_ai_assist: false,
    },
  });

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      const templateList = await NotebookService.getStrategyTemplates();
      setTemplates(templateList);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load strategy templates",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsCreating(true);

    try {
      let notebook: Notebook;

      if (creationMode === "template" && selectedTemplate) {
        // Create from template
        notebook = await NotebookService.createStrategyFromTemplate(
          selectedTemplate,
          values as NewStrategyRequest,
        );
      } else if (creationMode === "ai" && values.ai_prompt) {
        // Create from AI prompt
        const aiResponse = await NotebookService.createStrategyFromPrompt({
          prompt: values.ai_prompt,
          sport: values.sport,
        });

        notebook = {
          id: `strategy-${Date.now()}`,
          title: values.name,
          cells: [
            {
              id: `cell-${Date.now()}-1`,
              type: "markdown",
              content: `# ${values.name}\n\n**Generated from AI Prompt:** "${values.ai_prompt}"\n**Sport:** ${values.sport}\n\n---\n\n${aiResponse.explanation}`,
              executionCount: 0,
            },
            {
              id: `cell-${Date.now()}-2`,
              type: "code",
              content: aiResponse.code,
              executionCount: 0,
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else {
        // Create blank notebook
        notebook = {
          id: `strategy-${Date.now()}`,
          title: values.name,
          cells: [
            {
              id: `cell-${Date.now()}-1`,
              type: "markdown",
              content: `# ${values.name}\n\n**Sport:** ${values.sport}\n**Created:** ${new Date().toLocaleDateString()}\n\n---\n\n## Strategy Overview\nDescribe your strategy here...\n\n## Key Parameters\n- Parameter 1: Value\n- Parameter 2: Value\n\n## Implementation Notes\n- Note 1\n- Note 2`,
              executionCount: 0,
            },
            {
              id: `cell-${Date.now()}-2`,
              type: "code",
              content: `class ${values.name.replace(/\s+/g, "")}Strategy:\n    def __init__(self):\n        self.bankroll = 1000\n        # Add your parameters here\n        \n    def initialize(self):\n        """Initialize strategy parameters"""\n        print(f"${values.name} Strategy initialized")\n        \n    def on_event(self, event, odds):\n        """Main strategy logic - returns list of bets"""\n        bets = []\n        \n        # Add your betting logic here\n        \n        return bets\n\n# Initialize strategy\nstrategy = ${values.name.replace(/\s+/g, "")}Strategy()\nstrategy.initialize()`,
              executionCount: 0,
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      onStrategyCreated(notebook);
      setOpen(false);
      form.reset();
      setSelectedTemplate(null);
      setCreationMode("template");

      toast({
        title: "Strategy Created",
        description: `${values.name} has been created successfully`,
      });
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to create strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-quant-success";
      case "medium":
        return "text-quant-warning";
      case "high":
        return "text-quant-error";
      default:
        return "text-quant-text-muted";
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return <Star className="h-4 w-4" />;
      case "intermediate":
        return <Target className="h-4 w-4" />;
      case "advanced":
        return <Brain className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-quant-accent hover:bg-quant-accent/90 text-quant-bg shadow-glow">
          <Plus className="h-4 w-4 mr-2" />
          New Strategy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-quant-bg-secondary border-quant-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-quant-text flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-quant-accent" />
            Create New Strategy
          </DialogTitle>
          <DialogDescription className="text-quant-text-muted">
            Build a new sports betting strategy from templates, AI prompts, or
            start from scratch.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-quant-text">
                      Strategy Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My Awesome Strategy"
                        className="bg-quant-bg-tertiary border-quant-border text-quant-text"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sport"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-quant-text">Sport</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-quant-bg-tertiary border-quant-border text-quant-text">
                          <SelectValue placeholder="Select sport" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Creation Mode Tabs */}
            <Tabs
              value={creationMode}
              onValueChange={(value) => setCreationMode(value as any)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger
                  value="template"
                  className="flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Templates</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center space-x-2">
                  <Brain className="h-4 w-4" />
                  <span>AI Prompt</span>
                </TabsTrigger>
                <TabsTrigger
                  value="blank"
                  className="flex items-center space-x-2"
                >
                  <Code className="h-4 w-4" />
                  <span>Blank</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="template" className="space-y-4">
                <div className="text-sm text-quant-text-muted mb-4">
                  Choose from proven strategy templates to get started quickly:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-glow",
                        selectedTemplate === template.id
                          ? "border-quant-accent bg-quant-accent/5"
                          : "border-quant-border hover:border-quant-accent/50",
                      )}
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        form.setValue("template_id", template.id);
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-medium text-quant-text flex items-center">
                            {getDifficultyIcon(template.difficulty)}
                            <span className="ml-2">{template.name}</span>
                          </CardTitle>
                          {template.expected_roi && (
                            <Badge variant="secondary" className="text-xs">
                              {template.expected_roi}% ROI
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs text-quant-text-muted line-clamp-2">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-3">
                            <span
                              className={cn(
                                "font-medium",
                                getRiskColor(template.risk_level),
                              )}
                            >
                              {template.risk_level.toUpperCase()} RISK
                            </span>
                            <span className="text-quant-text-muted">
                              {template.difficulty.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {template.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs px-1 py-0"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="ai" className="space-y-4">
                <FormField
                  control={form.control}
                  name="ai_prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-quant-text flex items-center">
                        <Brain className="h-4 w-4 mr-2 text-quant-accent" />
                        Describe Your Strategy Idea
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Example: Find underdogs in La Liga with odds over 4.0 that win more than 30% of the time using recent form analysis..."
                          className="bg-quant-bg-tertiary border-quant-border text-quant-text min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-quant-text-muted">
                        Be specific about your criteria, target sports, risk
                        tolerance, and any statistical methods you want to use.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-quant-bg-tertiary p-4 rounded-xl border border-quant-border">
                  <h4 className="text-sm font-medium text-quant-accent mb-2 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Prompt Examples
                  </h4>
                  <div className="space-y-2 text-xs text-quant-text-muted">
                    <div>
                      • "Create a value betting strategy for NBA games using
                      team efficiency ratings"
                    </div>
                    <div>
                      • "Build an over/under strategy for Premier League using
                      goal statistics"
                    </div>
                    <div>
                      • "Design a closing line value tracker for NFL with Kelly
                      criterion sizing"
                    </div>
                    <div>
                      • "Make an underdog momentum strategy for teams on 3+ game
                      winning streaks"
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="blank" className="space-y-4">
                <div className="text-center py-8">
                  <Code className="h-12 w-12 text-quant-accent mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-quant-text mb-2">
                    Start from Scratch
                  </h3>
                  <p className="text-sm text-quant-text-muted max-w-md mx-auto">
                    Create a completely custom strategy with a blank notebook.
                    Perfect for experienced developers who want full control.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-quant-border">
              <div className="flex items-center space-x-2 text-xs text-quant-text-muted">
                <CheckCircle className="h-4 w-4" />
                <span>Strategy will be saved automatically</span>
              </div>
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isCreating || !form.watch("name") || !form.watch("sport")
                  }
                  className="bg-quant-accent hover:bg-quant-accent/90 text-quant-bg"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Create Strategy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
