import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Code, 
  Sparkles, 
  TrendingUp, 
  BarChart3,
  Loader2,
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { AICodeGenerator } from '@/services/aiCodeGenerator';
import { AIBettingAssistant } from '@/services/aiBettingAssistant';
import { HistoricalAnalysisEngine } from '@/services/historicalAnalysisEngine';
import { NotebookCell } from '@/types/notebook';

interface DemoResult {
  type: 'code' | 'analysis' | 'patterns' | 'visualization';
  title: string;
  content: string;
  explanation?: string;
  success: boolean;
  timestamp: Date;
}

export function AIIntegrationDemo() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DemoResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('test');

  // Demo queries for quick testing
  const demoQueries = [
    "Generate a Python strategy that bets on Arsenal home games with odds between 1.5 and 2.5",
    "Create a visualization showing the relationship between odds and goals scored",
    "Find profitable patterns in Premier League over/under 2.5 goals markets",
    "Analyze the performance of home teams vs away teams in London derbies"
  ];

  const testCodeGeneration = async (userQuery: string) => {
    setIsLoading(true);
    try {
      const response = await AICodeGenerator.generateCode({
        userQuery,
        cellHistory: [],
        chatHistory: [],
        targetLanguage: 'python'
      });

      setResults(prev => [...prev, {
        type: 'code',
        title: 'AI Code Generation',
        content: response.code,
        explanation: response.explanation,
        success: true,
        timestamp: new Date()
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        type: 'code',
        title: 'AI Code Generation Error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
        timestamp: new Date()
      }]);
    }
    setIsLoading(false);
  };

  const testPatternDiscovery = async () => {
    setIsLoading(true);
    try {
      const response = await AIBettingAssistant.processQuery({
        query: "Discover profitable betting patterns with minimum 5% ROI for Premier League teams"
      });

      setResults(prev => [...prev, {
        type: 'patterns',
        title: 'Pattern Discovery',
        content: response.text,
        success: true,
        timestamp: new Date()
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        type: 'patterns',
        title: 'Pattern Discovery Error', 
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
        timestamp: new Date()
      }]);
    }
    setIsLoading(false);
  };

  const testVisualizationGeneration = async () => {
    setIsLoading(true);
    try {
      const response = await AIBettingAssistant.processQuery({
        query: "Create a bar chart visualization comparing ROI across different betting markets"
      });

      setResults(prev => [...prev, {
        type: 'visualization',
        title: 'Visualization Generation',
        content: response.code || response.text,
        explanation: response.explanation,
        success: true,
        timestamp: new Date()
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        type: 'visualization',
        title: 'Visualization Error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
        timestamp: new Date()
      }]);
    }
    setIsLoading(false);
  };

  const testCodeAnalysis = async () => {
    setIsLoading(true);
    const sampleCode = `
# Sample betting strategy
import pandas as pd

def analyze_team_performance(team_name):
    # Get team matches
    matches = get_team_matches(team_name)
    
    # Calculate ROI
    roi = calculate_roi(matches)
    win_rate = calculate_win_rate(matches)
    
    return {
        'roi': roi,
        'win_rate': win_rate,
        'total_matches': len(matches)
    }

result = analyze_team_performance('Arsenal')
print(f"Arsenal ROI: {result['roi']:.2f}%")
`;

    try {
      const response = await AICodeGenerator.explainCode(sampleCode);

      setResults(prev => [...prev, {
        type: 'analysis',
        title: 'Code Analysis',
        content: `**Explanation:** ${response.explanation}\n\n**Key Steps:**\n${response.stepByStep.map((step, i) => `${i+1}. ${step}`).join('\n')}\n\n**Assumptions:**\n${response.assumptions.map(a => `- ${a}`).join('\n')}`,
        success: true,
        timestamp: new Date()
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        type: 'analysis',
        title: 'Code Analysis Error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
        timestamp: new Date()
      }]);
    }
    setIsLoading(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🚀 AI Integration Demo</h1>
        <p className="text-gray-600">Test the new AI-powered code generation and analysis features</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="test">🧪 Test Features</TabsTrigger>
          <TabsTrigger value="results">📊 Results</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-6">
          {/* Custom Query Section */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Custom AI Query
            </h3>
            <div className="space-y-4">
              <Textarea
                placeholder="Enter your AI query here..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[100px]"
              />
              <Button 
                onClick={() => testCodeGeneration(query)} 
                disabled={!query.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Code className="h-4 w-4 mr-2" /> Generate Code</>
                )}
              </Button>
            </div>
          </Card>

          {/* Quick Test Buttons */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Play className="h-5 w-5 text-green-500" />
              Quick Tests
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={() => testCodeGeneration(demoQueries[0])} 
                disabled={isLoading}
                variant="outline"
                className="h-auto p-4 text-left justify-start"
              >
                <Code className="h-4 w-4 mr-2 flex-shrink-0" />
                <div>
                  <div className="font-medium">Strategy Generation</div>
                  <div className="text-xs text-gray-500">Generate Arsenal home strategy</div>
                </div>
              </Button>

              <Button 
                onClick={() => testVisualizationGeneration()} 
                disabled={isLoading}
                variant="outline"
                className="h-auto p-4 text-left justify-start"
              >
                <BarChart3 className="h-4 w-4 mr-2 flex-shrink-0" />
                <div>
                  <div className="font-medium">Visualization Code</div>
                  <div className="text-xs text-gray-500">Create chart comparing markets</div>
                </div>
              </Button>

              <Button 
                onClick={testPatternDiscovery} 
                disabled={isLoading}
                variant="outline"
                className="h-auto p-4 text-left justify-start"
              >
                <TrendingUp className="h-4 w-4 mr-2 flex-shrink-0" />
                <div>
                  <div className="font-medium">Pattern Discovery</div>
                  <div className="text-xs text-gray-500">Find profitable patterns</div>
                </div>
              </Button>

              <Button 
                onClick={testCodeAnalysis} 
                disabled={isLoading}
                variant="outline"
                className="h-auto p-4 text-left justify-start"
              >
                <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />
                <div>
                  <div className="font-medium">Code Analysis</div>
                  <div className="text-xs text-gray-500">Analyze sample strategy code</div>
                </div>
              </Button>
            </div>
          </Card>

          {/* Demo Queries */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">💡 Try These Queries</h3>
            <div className="space-y-3">
              {demoQueries.map((demoQuery, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm flex-1">{demoQuery}</span>
                  <Button 
                    size="sm" 
                    onClick={() => setQuery(demoQuery)}
                    variant="ghost"
                  >
                    Use
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Test Results ({results.length})</h3>
            <Button onClick={clearResults} variant="outline" size="sm">
              Clear Results
            </Button>
          </div>

          {results.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No test results yet. Run some tests to see results here.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        result.success ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{result.title}</h4>
                        <p className="text-xs text-gray-500">
                          {result.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={result.success ? 'default' : 'destructive'}>
                      {result.type}
                    </Badge>
                  </div>

                  {result.explanation && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">{result.explanation}</p>
                    </div>
                  )}

                  <div className="relative">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
                      {result.content}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                      onClick={() => copyToClipboard(result.content)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIIntegrationDemo; 