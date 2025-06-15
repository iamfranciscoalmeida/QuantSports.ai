// Enhanced AI Output Types for Better Presentation

export interface EnhancedInsight {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  confidence: number; // 0-100
  importance: 'high' | 'medium' | 'low';
  context?: string;
  benchmark?: string;
}

export interface ActionableRecommendation {
  action: string;
  confidence: number;
  expectedROI: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeframe: string;
  conditions: string[];
  stakeSuggestion?: number;
}

export interface VisualizationData {
  type: 'bar' | 'line' | 'pie' | 'heatmap' | 'scatter';
  title: string;
  data: any[];
  description: string;
}

export interface EnhancedAIResponse {
  // Executive Summary (Key Takeaways)
  executiveSummary: {
    keyFindings: string[];
    primaryRecommendation: string;
    riskAssessment: 'low' | 'medium' | 'high';
    confidenceScore: number;
  };

  // Core Insights with enhanced metadata
  insights: EnhancedInsight[];

  // Actionable recommendations
  recommendations: ActionableRecommendation[];

  // Supporting data for visualizations
  visualizations: VisualizationData[];

  // Risk analysis
  riskAnalysis: {
    factors: string[];
    mitigation: string[];
    maxDrawdown: number;
    volatility: number;
  };

  // Performance context
  performanceContext: {
    historicalComparison: string;
    peerComparison?: string;
    marketContext: string;
  };

  // Raw data for further analysis
  rawData?: any;
} 