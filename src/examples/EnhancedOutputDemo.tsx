import React, { useState } from 'react';
import { EnhancedOutputFormatter } from '../services/enhancedOutputFormatter';
import { EnhancedAIResponse } from '../types/ai-output';

const EnhancedOutputDemo: React.FC = () => {
  const [showEnhanced, setShowEnhanced] = useState(false);

  // Sample Arsenal data for demonstration
  const sampleAnalysis = {
    team: "Arsenal",
    matches_played: 38,
    home_record: {
      wins: 14,
      draws: 3,
      losses: 2,
      goals_for: 45,
      goals_against: 18
    },
    away_record: {
      wins: 12,
      draws: 5,
      losses: 2,
      goals_for: 38,
      goals_against: 15
    },
    betting_stats: {
      roi_as_favorite: 28.4,
      roi_as_underdog: 102.6,
      roi_home: 36.8,
      roi_away: 45.2,
      over_2_5_rate: 53.9,
      under_2_5_rate: 46.1
    }
  };

  // Generate enhanced response
  const enhancedResponse = EnhancedOutputFormatter.formatTeamAnalysis(sampleAnalysis, "Arsenal");
  const enhancedMarkdown = EnhancedOutputFormatter.formatAsMarkdown(enhancedResponse);

  // Old format (simulating your current output)
  const oldFormat = `
## Arsenal - Betting Analysis

**Overall Performance:**
- Matches Played: 38

**Home Record:**
- Wins: 14
- Draws: 3
- Losses: 2
- Goals For: 45
- Goals Against: 18

**Away Record:**
- Wins: 12
- Draws: 5
- Losses: 2
- Goals For: 38
- Goals Against: 15

**Betting Statistics:**
- ROI as Favorite: 28.40%
- ROI as Underdog: 102.60%
- ROI at Home: 36.80%
- ROI Away: 45.20%
- Over 2.5 Goals Rate: 53.9%
- Under 2.5 Goals Rate: 46.1%

📈 Arsenal performs better as an underdog!

### Arsenal's Home Game Performance:
- **Matches Played**: Out of the 38 matches played, a significant portion were home games, with Arsenal registering 14 wins, 3 draws, and 2 losses. This indicates a strong home advantage, which is crucial for betting analysis.
- **Goals Scored and Conceded**: At home, Arsenal scored a total of 45 goals and conceded 18. This positive goal difference highlights their offensive prowess and defensive solidity when playing in front of their home crowd.

### Betting Statistics and Profitability:
- **Return on Investment (ROI) at Home**: The ROI for betting on Arsenal in home games stands at 36.84%. This is a robust figure, suggesting that betting on Arsenal to win in their home games has been profitable over the past year.
- **Comparison with Away Games**: Interestingly, the ROI for Arsenal in away games is significantly higher at 45.20%. This might indicate that while Arsenal's performance at home is strong, the betting market may undervalue them in away fixtures, presenting lucrative opportunities.
- **Over/Under 2.5 Goals Rate**: The over 2.5 goals rate for Arsenal games is 53.95%, compared to an under 2.5 goals rate of 46.05%. This suggests a slight inclination towards higher-scoring matches, which is an important consideration for over/under bets.

### Specific Recommendations:
1. **Home Game Betting**: Given the strong ROI of 36.84% for home games, betting on Arsenal to win when they play at home appears to be a solid strategy. However, bettors should always consider the odds being offered to ensure value.
2. **Over/Under Goals**: With a relatively balanced over/under 2.5 goals rate, bettors should closely analyze the specific match-up and recent form when betting on over/under markets. The slightly higher rate of over 2.5 goals games might favor bets on higher-scoring matches, especially against weaker defenses.
3. **Comparative Betting**: The stark difference in ROI between home (36.84%) and away (45.20%) games suggests that Arsenal might be undervalued in away fixtures. While this analysis focuses on home games, it's worth noting for bettors looking for value across different types of bets.

### Conclusion:
Arsenal has demonstrated strong performance in home games over the past year, making them a generally safe bet, especially when the odds offer value. The significant ROI in home games highlights their reliability at the Emirates Stadium. However, bettors should remain vigilant, considering match-specific factors and keeping an eye on opportunities where Arsenal is undervalued, particularly in away games. Always remember to engage in responsible gambling practices, analyzing each bet carefully and never betting more than you can afford to lose.
  `;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Enhanced AI Output Demo</h1>
        <p className="text-gray-600 mb-6">
          See how we've improved agent findings presentation for better decision-making
        </p>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setShowEnhanced(false)}
            className={`px-6 py-2 rounded-lg transition-colors ${
              !showEnhanced 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Old Format
          </button>
          <button
            onClick={() => setShowEnhanced(true)}
            className={`px-6 py-2 rounded-lg transition-colors ${
              showEnhanced 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Enhanced Format
          </button>
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Issues with Old Format */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-4">Issues with Current Format</h3>
          <ul className="space-y-2 text-sm text-red-700">
            <li>• <strong>Too verbose</strong> - Hard to scan quickly</li>
            <li>• <strong>No confidence indicators</strong> - Can't assess reliability</li>
            <li>• <strong>Unclear actionability</strong> - What should I actually bet?</li>
            <li>• <strong>No risk assessment</strong> - Missing drawdown/volatility info</li>
            <li>• <strong>Limited context</strong> - No benchmarks or comparisons</li>
            <li>• <strong>Wall of text</strong> - Poor visual hierarchy</li>
          </ul>
        </div>

        {/* Benefits of Enhanced Format */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">Enhanced Format Benefits</h3>
          <ul className="space-y-2 text-sm text-green-700">
            <li>• <strong>Executive Summary</strong> - Key findings upfront</li>
            <li>• <strong>Confidence Scores</strong> - Know how reliable insights are</li>
            <li>• <strong>Actionable Recommendations</strong> - Specific betting actions with stakes</li>
            <li>• <strong>Risk Analysis</strong> - Drawdown, volatility, and mitigation</li>
            <li>• <strong>Performance Context</strong> - Historical and market benchmarks</li>
            <li>• <strong>Visual Structure</strong> - Tables, icons, and clear sections</li>
          </ul>
        </div>
      </div>

      {/* Enhanced Features Showcase */}
      {showEnhanced && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Enhanced Analysis Features</h3>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold text-sm mb-2">📊 Confidence Score</h4>
              <div className="text-2xl font-bold text-blue-600">
                {enhancedResponse.executiveSummary.confidenceScore}%
              </div>
              <p className="text-xs text-gray-600">Based on sample size & consistency</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold text-sm mb-2">⚠️ Risk Level</h4>
              <div className={`text-2xl font-bold ${
                enhancedResponse.executiveSummary.riskAssessment === 'low' ? 'text-green-600' :
                enhancedResponse.executiveSummary.riskAssessment === 'medium' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {enhancedResponse.executiveSummary.riskAssessment.toUpperCase()}
              </div>
              <p className="text-xs text-gray-600">Volatility-based assessment</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold text-sm mb-2">🎯 Recommendations</h4>
              <div className="text-2xl font-bold text-purple-600">
                {enhancedResponse.recommendations.length}
              </div>
              <p className="text-xs text-gray-600">Actionable betting strategies</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold mb-2">Key Findings Summary</h4>
            <ul className="space-y-1">
              {enhancedResponse.executiveSummary.keyFindings.map((finding, index) => (
                <li key={index} className="text-sm">• {finding}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Output Display */}
      <div className="bg-white border rounded-lg">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold">
            {showEnhanced ? '✨ Enhanced Format' : '📝 Current Format'}
          </h2>
        </div>
        
        <div className="p-6">
          {showEnhanced ? (
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ 
                __html: enhancedMarkdown.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              }} />
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-4 rounded">
              {oldFormat}
            </div>
          )}
        </div>
      </div>

      {/* Implementation Guide */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Implementation Guide</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Step 1: Update Agent Responses</h4>
            <p className="text-sm text-gray-600 mb-2">
              Replace current formatting with the EnhancedOutputFormatter
            </p>
            <code className="text-xs bg-white p-2 rounded block">
              {`const enhanced = EnhancedOutputFormatter.formatTeamAnalysis(analysis, team);
const markdown = EnhancedOutputFormatter.formatAsMarkdown(enhanced);`}
            </code>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Step 2: Add Visualization Support</h4>
            <p className="text-sm text-gray-600 mb-2">
              Use the visualization data for charts and graphs
            </p>
            <code className="text-xs bg-white p-2 rounded block">
              {`enhanced.visualizations.forEach(viz => {
  renderChart(viz.type, viz.data, viz.title);
});`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedOutputDemo; 