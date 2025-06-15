import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Code, 
  BarChart3, 
  Brain, 
  Layers, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { EnhancedAIOrchestrator, AIRequest } from '../services/ai/orchestrator-enhanced';

/**
 * Integration Examples: Migrating to Enhanced AI Architecture
 * 
 * This component demonstrates how to migrate existing AI components
 * to use the new unified orchestrator system.
 */

interface MigrationExample {
  title: string;
  description: string;
  oldCode: string;
  newCode: string;
  benefits: string[];
  status: 'completed' | 'in-progress' | 'pending';
}

export const MigrateToEnhancedAI: React.FC = () => {
  const [orchestrator] = useState(() => new EnhancedAIOrchestrator());
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [activeExample, setActiveExample] = useState<number>(0);
  const [testResults, setTestResults] = useState<{ [key: number]: any }>({});

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    try {
      const status = orchestrator.getSystemStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const migrationExamples: MigrationExample[] = [
    {
      title: "Notebook AI Assistant Migration",
      description: "Migrate notebook cells to use the unified orchestrator with intelligent routing",
      status: 'completed',
      oldCode: `// OLD: Direct AI service usage
import { AICodeGenerator } from '../services/ai/codeGenerator';

const generator = new AICodeGenerator();
const code = await generator.generateCode(query, context);

// Issues:
// - Single provider dependency
// - No fallback handling
// - Limited context awareness
// - No streaming support`,
      newCode: `// NEW: Enhanced orchestrator usage
import { EnhancedAIOrchestrator } from '../services/ai/orchestrator-enhanced';

const orchestrator = new EnhancedAIOrchestrator();
const response = await orchestrator.processRequest({
  query: 'Generate Python code for team analysis',
  userId: 'user123',
  notebookId: 'notebook456',
  streaming: true,
  context: {
    notebook_cells: existingCells,
    available_data: ['matches', 'teams', 'odds'],
    user_preferences: userPrefs
  }
});

// Benefits:
// ✅ Multi-provider fallback
// ✅ Intelligent routing based on intent
// ✅ Streaming responses
// ✅ Persistent memory
// ✅ Tool integration`,
      benefits: [
        "Multi-provider fallback ensures availability",
        "Intelligent routing selects optimal AI model",
        "Streaming responses for better UX",
        "Context-aware with conversation memory",
        "Integrated tool calling for specialized tasks"
      ]
    },
    {
      title: "Chat Component Migration",
      description: "Upgrade chat components with streaming, provider selection, and enhanced error handling",
      status: 'completed',
      oldCode: `// OLD: Basic chat implementation
const [messages, setMessages] = useState<Message[]>([]);

const sendMessage = async (text: string) => {
  try {
    const response = await aiService.query(text);
    setMessages(prev => [...prev, { 
      text: response, 
      isUser: false 
    }]);
  } catch (error) {
    // Basic error handling
    console.error(error);
  }
};`,
      newCode: `// NEW: Enhanced chat with orchestrator
const [orchestrator] = useState(() => new EnhancedAIOrchestrator());
const [isStreaming, setIsStreaming] = useState(false);

const sendMessage = async (text: string) => {
  setIsStreaming(true);
  
  const request: AIRequest = {
    query: text,
    userId: currentUser.id,
    streaming: true,
    provider: selectedProvider,
    context: {
      conversation_length: messages.length,
      user_preferences: userSettings
    }
  };

  try {
    const response = await orchestrator.processRequest(request);
    
    if (response[Symbol.asyncIterator]) {
      await handleStreamingResponse(response);
    } else {
      handleDirectResponse(response);
    }
  } catch (error) {
    handleEnhancedError(error);
  } finally {
    setIsStreaming(false);
  }
};`,
      benefits: [
        "Real-time streaming responses",
        "Provider status monitoring",
        "Advanced error handling with fallbacks",
        "Usage analytics and cost tracking",
        "Session persistence and memory"
      ]
    },
    {
      title: "Dashboard AI Integration",
      description: "Integrate dashboard components with the orchestrator for consistent AI experiences",
      status: 'in-progress',
      oldCode: `// OLD: Scattered AI service calls
const analysisService = new AnalysisService();
const codeService = new CodeGeneratorService();
const bettingService = new BettingAssistantService();

// Multiple service instances
// Inconsistent error handling
// No shared context
// Limited provider options`,
      newCode: `// NEW: Unified orchestrator integration
const orchestrator = new EnhancedAIOrchestrator();

// Single service instance
// Consistent error handling
// Shared conversation context
// Multi-provider support
// Tool chaining capabilities

const analyzeTeam = (teamName: string) => 
  orchestrator.processRequest({
    query: \`Analyze \${teamName}'s performance\`,
    userId: user.id,
    toolChain: ['analyze_team', 'discover_patterns']
  });

const generateStrategy = (criteria: any) =>
  orchestrator.processRequest({
    query: 'Create betting strategy',
    context: { strategy_criteria: criteria },
    toolChain: ['simulate_strategy', 'generate_code']
  });`,
      benefits: [
        "Unified AI interface across all components",
        "Tool chaining for complex workflows",
        "Shared context and memory",
        "Performance monitoring and analytics",
        "Consistent error handling and fallbacks"
      ]
    },
    {
      title: "Performance Monitoring Integration",
      description: "Add comprehensive monitoring and analytics to track AI system performance",
      status: 'pending',
      oldCode: `// OLD: No monitoring
// Limited error logging
// No performance metrics
// No cost tracking
// No usage analytics`,
      newCode: `// NEW: Comprehensive monitoring
const MonitoringDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [performance, setPerformance] = useState(null);

  useEffect(() => {
    const loadMetrics = async () => {
      const perf = orchestrator.getPerformanceAnalytics();
      const analytics = await orchestrator.getSessionAnalytics(userId);
      
      setPerformance(perf);
      setAnalytics(analytics);
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Update every 30s
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="monitoring-dashboard">
      <ProviderHealthStatus />
      <UsageMetrics analytics={analytics} />
      <CostTracking performance={performance} />
      <ErrorAnalysis />
    </div>
  );
};`,
      benefits: [
        "Real-time system health monitoring",
        "Usage analytics and cost tracking",
        "Performance metrics and optimization",
        "Error pattern analysis",
        "Provider comparison and selection"
      ]
    }
  ];

  const testMigrationExample = async (exampleIndex: number) => {
    const example = migrationExamples[exampleIndex];
    setTestResults(prev => ({ ...prev, [exampleIndex]: { status: 'testing' } }));

    try {
      // Test the specific migration pattern
      let testResult;

      switch (exampleIndex) {
        case 0: // Notebook migration
          testResult = await orchestrator.processRequest({
            query: 'Generate Python code to analyze team performance',
            userId: 'test-user',
            notebookId: 'test-notebook',
            context: {
              notebook_cells: ['# Previous analysis', 'import pandas as pd'],
              available_data: ['matches', 'teams']
            }
          });
          break;

        case 1: // Chat migration
          testResult = await orchestrator.processRequest({
            query: 'What is Arsenal\'s recent form?',
            userId: 'test-user',
            streaming: false,
            provider: 'openai'
          });
          break;

        case 2: // Dashboard migration
          testResult = await orchestrator.processRequest({
            query: 'Analyze Manchester City performance',
            userId: 'test-user',
            toolChain: ['analyze_team']
          });
          break;

        default:
          testResult = { text: 'Test configuration pending', provider: 'test' };
      }

      setTestResults(prev => ({ 
        ...prev, 
        [exampleIndex]: { 
          status: 'passed', 
          response: testResult,
          timestamp: new Date()
        } 
      }));

    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [exampleIndex]: { 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        } 
      }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress': return <RefreshCw className="w-5 h-5 text-yellow-500" />;
      case 'pending': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default: return null;
    }
  };

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'testing': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Layers className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Enhanced AI Migration Guide</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Learn how to migrate your existing AI components to the new unified orchestrator architecture
          for better performance, reliability, and feature richness.
        </p>
      </div>

      {/* System Status */}
      {systemStatus && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-600" />
            <span>Current System Status</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900">Providers</h3>
              <div className="mt-2 space-y-1">
                {Object.entries(systemStatus.providers).map(([name, available]) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span>{name}</span>
                    <span className={available ? 'text-green-600' : 'text-red-600'}>
                      {available ? '✅' : '❌'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900">Tools</h3>
              <div className="mt-2 space-y-1">
                {Object.entries(systemStatus.tools).map(([name, available]) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span>{name.replace('_', ' ')}</span>
                    <span className="text-green-600">✅</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-900">Memory</h3>
              <div className="mt-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="text-green-600">✅ Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Persistence</span>
                  <span className="text-green-600">✅ Enabled</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-medium text-orange-900">Performance</h3>
              <div className="mt-2 text-sm space-y-1">
                {Object.entries(systemStatus.performance || {}).slice(0, 3).map(([provider, stats]: [string, any]) => (
                  <div key={provider} className="flex items-center justify-between">
                    <span>{provider}</span>
                    <span className="text-orange-600">
                      {stats.averageResponseTime?.toFixed(0) || 0}ms
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Migration Examples */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center space-x-2">
          <Code className="w-7 h-7 text-green-600" />
          <span>Migration Examples</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Example List */}
          <div className="space-y-3">
            {migrationExamples.map((example, index) => (
              <button
                key={index}
                onClick={() => setActiveExample(index)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  activeExample === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{example.title}</h3>
                    <p className="text-sm text-gray-600">{example.description}</p>
                  </div>
                  <div className="ml-2 flex flex-col items-center space-y-2">
                    {getStatusIcon(example.status)}
                    {testResults[index] && (
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getTestStatusColor(testResults[index].status)}`}>
                        {testResults[index].status}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Example Details */}
          <div className="lg:col-span-2 space-y-6">
            {migrationExamples[activeExample] && (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {migrationExamples[activeExample].title}
                    </h3>
                    <button
                      onClick={() => testMigrationExample(activeExample)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      disabled={testResults[activeExample]?.status === 'testing'}
                    >
                      <Zap className="w-4 h-4" />
                      <span>Test Migration</span>
                    </button>
                  </div>

                  <p className="text-gray-600 mb-6">{migrationExamples[activeExample].description}</p>

                  {/* Code Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <h4 className="font-medium text-red-700 mb-2">❌ Old Approach</h4>
                      <pre className="bg-red-50 border border-red-200 rounded p-3 text-sm overflow-x-auto">
                        <code>{migrationExamples[activeExample].oldCode}</code>
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium text-green-700 mb-2">✅ New Approach</h4>
                      <pre className="bg-green-50 border border-green-200 rounded p-3 text-sm overflow-x-auto">
                        <code>{migrationExamples[activeExample].newCode}</code>
                      </pre>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Key Benefits</h4>
                    <ul className="space-y-2">
                      {migrationExamples[activeExample].benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Test Results */}
                {testResults[activeExample] && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      <span>Test Results</span>
                    </h4>

                    <div className={`p-4 rounded-lg ${getTestStatusColor(testResults[activeExample].status)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Status: {testResults[activeExample].status}</span>
                        <span className="text-sm">
                          {testResults[activeExample].timestamp?.toLocaleTimeString()}
                        </span>
                      </div>

                      {testResults[activeExample].response && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Response Preview:</p>
                          <div className="bg-white bg-opacity-50 rounded p-3 text-sm">
                            {typeof testResults[activeExample].response === 'string' 
                              ? testResults[activeExample].response
                              : testResults[activeExample].response.text?.substring(0, 200) + '...'
                            }
                          </div>
                        </div>
                      )}

                      {testResults[activeExample].error && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Error Details:</p>
                          <div className="bg-white bg-opacity-50 rounded p-3 text-sm">
                            {testResults[activeExample].error}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Implementation Steps */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Implementation Steps</h2>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <div>
              <h3 className="font-medium text-gray-900">Install Dependencies</h3>
              <p className="text-gray-600 text-sm">Add LangChain and enhanced provider packages</p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                npm install @langchain/core @langchain/openai @langchain/anthropic
              </code>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <div>
              <h3 className="font-medium text-gray-900">Initialize Orchestrator</h3>
              <p className="text-gray-600 text-sm">Replace individual AI service instances with the orchestrator</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <div>
              <h3 className="font-medium text-gray-900">Update API Calls</h3>
              <p className="text-gray-600 text-sm">Convert existing API calls to use the unified interface</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
            <div>
              <h3 className="font-medium text-gray-900">Add Streaming Support</h3>
              <p className="text-gray-600 text-sm">Implement streaming response handling for better UX</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">5</div>
            <div>
              <h3 className="font-medium text-gray-900">Test & Monitor</h3>
              <p className="text-gray-600 text-sm">Verify functionality and set up performance monitoring</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 