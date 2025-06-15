import React from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

export const MarkdownTester: React.FC = () => {
  const testContent = `📈 **Manchester United - Complete Performance Summary**

**Match Record:**
- Total Matches: 76
- Home: 17W-6D-15L (44.7%)
- Away: 12W-9D-17L (31.6%)

**Goal Scoring:**
- Home: 1.42 goals per game
- Away: 1.24 goals per game

**Betting Markets:**
- Over 2.5 Goals: 56.6%
- Home ROI: -10.53%
- Away ROI: 10.53%

## Analysis Summary

✅ **Strong Away Value**: The 10.53% away ROI indicates consistent value when betting on United as away favorites or underdogs.

❌ **Poor Home Performance**: The -10.53% home ROI suggests the market overvalues United at Old Trafford.

📊 **Goal Trends**: Lower goal scoring rates (1.42 home, 1.24 away) suggest a more defensive approach.

### Recommended Strategies

1. **Away Betting Focus**: Target United away matches where odds provide value
2. **Under Goals**: Consider under 2.5 goals given the lower scoring rates
3. **Market Timing**: Avoid home favorites, look for away underdog spots

\`\`\`python
# Manchester United betting analysis
home_roi = -10.53
away_roi = 10.53
home_goals_per_game = 1.42
away_goals_per_game = 1.24

print(f"Home ROI: {home_roi}%")
print(f"Away ROI: {away_roi}%")
print(f"Strategy: Focus on away matches")
\`\`\``;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold mb-4">❌ Before (Raw Text)</h3>
          <div className="bg-gray-50 p-4 rounded-lg border h-96 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap">{testContent}</pre>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-bold mb-4">✅ After (Formatted)</h3>
          <div className="bg-white p-4 rounded-lg border h-96 overflow-y-auto">
            <MarkdownRenderer 
              content={testContent}
              className="text-gray-900"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-bold text-green-800 mb-2">✅ Fixed Components</h4>
        <div className="text-sm text-green-700 space-y-1">
          <p>• ✅ UnifiedAIAssistant - Main chat interface</p>
          <p>• ✅ StreamingAIChat - Real-time streaming chat</p>
          <p>• ✅ BettingChatInterface - Betting analysis chat</p>
          <p>• ✅ Notebook AI Sidebar - Notebook assistant</p>
        </div>
      </div>
    </div>
  );
}; 