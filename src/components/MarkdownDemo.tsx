import React, { useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export const MarkdownDemo: React.FC = () => {
  const [showFormatted, setShowFormatted] = useState(true);

  const sampleContent = `⚽ **Chelsea - Home Goals Analysis**

**Goals Scored at Home:**
- Average: **2.08 goals per game**
- Total: 79 goals in 38 home matches

**Goals Conceded at Home:**
- Average: **1.16 goals per game**
- Total: 44 goals conceded

**Home Goal Difference:** 0.92 per game

## Performance Summary

Chelsea shows strong attacking performance at home with:
- ✅ Above-average goal scoring (2.08 vs league average 1.8)
- ✅ Solid defensive record (1.16 conceded vs league average 1.4)
- 📈 Positive goal difference indicates dominance in home fixtures

### Recommendations

For betting strategies:
1. **Over 2.5 Goals**: Consider backing when Chelsea plays weaker opposition at home
2. **Chelsea Win & Over 1.5**: High probability given their scoring consistency
3. **Both Teams to Score**: Less favorable given their defensive strength at home

\`\`\`python
# Calculate expected goals for Chelsea home matches
home_goals_avg = 2.08
home_conceded_avg = 1.16
goal_difference = home_goals_avg - home_conceded_avg
print(f"Chelsea home goal difference: {goal_difference:.2f}")
\`\`\``;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            AI Assistant Output Demo
            <Button
              onClick={() => setShowFormatted(!showFormatted)}
              variant="outline"
            >
              {showFormatted ? 'Show Raw Text' : 'Show Formatted'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">
                {showFormatted ? '❌ Before (Raw Text)' : '✅ After (Formatted)'}
              </h3>
              
              {showFormatted ? (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {sampleContent}
                  </pre>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-lg border">
                  <MarkdownRenderer 
                    content={sampleContent}
                    className="text-gray-900"
                  />
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">
                {showFormatted ? '✅ After (Formatted)' : '❌ Before (Raw Text)'}
              </h3>
              
              {showFormatted ? (
                <div className="bg-white p-4 rounded-lg border">
                  <MarkdownRenderer 
                    content={sampleContent}
                    className="text-gray-900"
                  />
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {sampleContent}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What's Fixed?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-red-600">❌ Before</h4>
              <ul className="text-sm space-y-1">
                <li>• Raw markdown syntax showing (`**text**`)</li>
                <li>• Headers as plain text (`## Header`)</li>
                <li>• Lists with dashes (`- item`)</li>
                <li>• Code blocks as raw text</li>
                <li>• No visual hierarchy</li>
                <li>• Hard to scan information</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✅ After</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Bold text rendered properly</strong></li>
                <li>• <span className="text-lg font-bold">Headers with proper styling</span></li>
                <li>• • Proper bullet lists</li>
                <li>• <code className="bg-gray-100 px-1 rounded">Styled code blocks</code></li>
                <li>• Clear visual hierarchy</li>
                <li>• Easy to scan and understand</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">🚀 Implementation Status</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Updated Components:</p>
                <ul className="mt-1 space-y-1">
                  <li>✅ UnifiedAIAssistant</li>
                  <li>✅ StreamingAIChat</li>
                  <li>✅ BettingChatInterface</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Features Added:</p>
                <ul className="mt-1 space-y-1">
                  <li>✅ Proper markdown rendering</li>
                  <li>✅ Code block highlighting</li>
                  <li>✅ Sports emoji styling</li>
                  <li>✅ Statistics highlighting</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 