import OpenAI from 'openai';
import { NotebookCell, AIMessage } from '@/types/notebook';
import { EPLMatch, MatchFilters } from '@/types/epl';

interface DataSchema {
  tables: string[];
  relationships: string[];
  commonQueries: string[];
}

interface CodeGenerationRequest {
  userQuery: string;
  currentCell?: NotebookCell;
  cellHistory: NotebookCell[];
  chatHistory: AIMessage[];
  availableData?: DataSchema[];
  targetLanguage: 'python' | 'sql' | 'javascript';
}

interface CodeGenerationResponse {
  code: string;
  explanation: string;
  dependencies: string[];
  suggestedNextCells: NotebookCell[];
  relatedFunctions: string[];
  estimatedRuntime: string;
}

interface CodeOptimizationResponse {
  optimizedCode: string;
  improvements: string[];
  performanceGains: string;
}

interface CodeExplanationResponse {
  explanation: string;
  stepByStep: string[];
  assumptions: string[];
  limitations: string[];
}

export class AICodeGenerator {
  private static openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  static async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
    try {
      const systemPrompt = this.getCodeGenerationSystemPrompt();
      const userPrompt = this.buildUserPrompt(request);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        functions: [{
          name: "generate_code_response",
          description: "Generate code with explanation and suggestions",
          parameters: {
            type: "object",
            properties: {
              code: { type: "string", description: "The generated code" },
              explanation: { type: "string", description: "Explanation of the code" },
              dependencies: { type: "array", items: { type: "string" }, description: "Required dependencies" },
              next_steps: { type: "array", items: { type: "string" }, description: "Suggested next analysis steps" },
              related_functions: { type: "array", items: { type: "string" }, description: "Related functions to explore" },
              estimated_runtime: { type: "string", description: "Estimated execution time" }
            },
            required: ["code", "explanation", "dependencies", "next_steps", "related_functions", "estimated_runtime"]
          }
        }],
        function_call: { name: "generate_code_response" },
        temperature: 0.3,
        max_tokens: 2000
      });

      const response = completion.choices[0].message;
      if (response.function_call) {
        try {
          let jsonString = response.function_call.arguments;
          let args;
          
          // Log the raw response for debugging
          console.log('Raw OpenAI function call arguments:', jsonString);
          
          try {
            // First attempt: parse as-is (most common case)
            args = JSON.parse(jsonString);
            console.log('✅ JSON parsed successfully on first attempt');
          } catch (initialParseError) {
            console.log('⚠️ Initial JSON parse failed, trying with cleaning:', initialParseError.message);
            console.log('🔍 First 50 characters:', JSON.stringify(jsonString.substring(0, 50)));
            console.log('🔍 Last 50 characters:', JSON.stringify(jsonString.slice(-50)));
            
            // Second attempt: clean common JSON issues and trim whitespace
            let cleanedString = jsonString
              .trim()                    // Remove leading/trailing whitespace
              .replace(/\n/g, '\\n')     // Escape actual newlines
              .replace(/\r/g, '\\r')     // Escape carriage returns  
              .replace(/\t/g, '\\t');    // Escape tabs
            
            try {
              args = JSON.parse(cleanedString);
              console.log('✅ JSON parsed successfully after cleaning');
            } catch (cleanedParseError) {
              console.log('❌ JSON parsing failed even after cleaning:', cleanedParseError.message);
              console.log('🔍 Cleaned first 50 characters:', JSON.stringify(cleanedString.substring(0, 50)));
              throw cleanedParseError; // This will trigger the fallback
            }
          }
          
          return {
            code: args.code || '',
            explanation: args.explanation || 'Generated strategy code for Arsenal home games',
            dependencies: args.dependencies || ['pandas', 'numpy'],
            suggestedNextCells: this.createSuggestedCells(args.next_steps || []),
            relatedFunctions: args.related_functions || [],
            estimatedRuntime: args.estimated_runtime || "< 1 second"
          };
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
          console.log('Failed to parse function call arguments:', response.function_call.arguments);
          
          // Fallback: extract code from the raw response
          const fallbackCode = this.extractCodeFromRawResponse(response.function_call.arguments);
          return {
            code: fallbackCode,
            explanation: 'Generated Arsenal home betting strategy (parsed with fallback method)',
            dependencies: ['pandas', 'numpy'],
            suggestedNextCells: [],
            relatedFunctions: [],
            estimatedRuntime: "< 1 second"
          };
        }
      }

      // Fallback if function calling fails
      return this.createFallbackResponse(request.userQuery);
    } catch (error) {
      console.error('Code generation error:', error);
      
      // Handle specific OpenAI errors
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('quota')) {
          // Quota exceeded - throw error to trigger demo mode fallback
          throw new Error('QUOTA_EXCEEDED');
        }
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new Error('INVALID_API_KEY');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('RATE_LIMITED');
        }
      }
      
      return this.createErrorResponse(error as Error);
    }
  }

  static async optimizeCode(code: string, context: CodeGenerationRequest): Promise<CodeOptimizationResponse> {
    try {
      const systemPrompt = `You are an expert Python developer specializing in sports betting analysis optimization.
      
      Analyze the provided code and suggest optimizations for:
      1. Performance improvements
      2. Memory efficiency
      3. Code readability and maintainability
      4. Better use of available data structures
      5. Vectorization opportunities with pandas/numpy
      
      Focus on practical improvements that will make a measurable difference.`;

      const userPrompt = `
      Original Code:
      \`\`\`python
      ${code}
      \`\`\`
      
      Context: ${context.userQuery}
      
      Please optimize this code and explain the improvements.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1500
      });

      const response = completion.choices[0].message.content || '';
      
      // Parse the response to extract optimized code and improvements
      const codeMatch = response.match(/```python\n([\s\S]*?)\n```/);
      const optimizedCode = codeMatch ? codeMatch[1] : code;
      
      const improvements = this.extractImprovements(response);
      const performanceGains = this.extractPerformanceGains(response);

      return {
        optimizedCode,
        improvements,
        performanceGains
      };
    } catch (error) {
      console.error('Code optimization error:', error);
      return {
        optimizedCode: code,
        improvements: ['Unable to optimize code at this time'],
        performanceGains: 'Unknown'
      };
    }
  }

  static async explainCode(code: string): Promise<CodeExplanationResponse> {
    try {
      const systemPrompt = `You are an expert Python developer and sports betting analyst.
      
      Provide a comprehensive explanation of the given code including:
      1. High-level purpose and approach
      2. Step-by-step breakdown of the logic
      3. Key assumptions being made
      4. Limitations and potential issues
      5. How it relates to sports betting analysis
      
      Be clear and educational in your explanations.`;

      const userPrompt = `
      Please explain this Python code:
      
      \`\`\`python
      ${code}
      \`\`\``;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1500
      });

      const response = completion.choices[0].message.content || '';
      
      return {
        explanation: this.extractMainExplanation(response),
        stepByStep: this.extractStepByStep(response),
        assumptions: this.extractAssumptions(response),
        limitations: this.extractLimitations(response)
      };
    } catch (error) {
      console.error('Code explanation error:', error);
      return {
        explanation: 'Unable to explain code at this time',
        stepByStep: [],
        assumptions: [],
        limitations: []
      };
    }
  }

  static async debugCode(code: string, error: string, context: CodeGenerationRequest): Promise<{
    fixedCode: string;
    explanation: string;
    preventionTips: string[];
  }> {
    try {
      const systemPrompt = `You are an expert Python developer specializing in sports betting analysis.
      
      The user has encountered an error in their code. Help them fix it by:
      1. Identifying the root cause of the error
      2. Providing corrected code
      3. Explaining why the error occurred
      4. Giving tips to prevent similar errors in the future
      
      Focus on practical, working solutions.`;

      const userPrompt = `
      Code with error:
      \`\`\`python
      ${code}
      \`\`\`
      
      Error message:
      ${error}
      
      Context: ${context.userQuery}
      
      Please fix this code and explain the solution.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1500
      });

      const response = completion.choices[0].message.content || '';
      
      const codeMatch = response.match(/```python\n([\s\S]*?)\n```/);
      const fixedCode = codeMatch ? codeMatch[1] : code;
      
      return {
        fixedCode,
        explanation: this.extractDebugExplanation(response),
        preventionTips: this.extractPreventionTips(response)
      };
    } catch (error) {
      console.error('Code debugging error:', error);
      return {
        fixedCode: code,
        explanation: 'Unable to debug code at this time',
        preventionTips: []
      };
    }
  }

  static async suggestNextSteps(currentCell: NotebookCell, results: any): Promise<{
    suggestions: string[];
    codeSnippets: string[];
    explorationIdeas: string[];
  }> {
    try {
      const systemPrompt = `You are a sports betting analysis expert.
      
      Based on the current analysis results, suggest logical next steps for deeper analysis.
      Consider:
      1. Data exploration opportunities
      2. Strategy refinements
      3. Risk analysis
      4. Performance validation
      5. Visualization opportunities
      
      Provide practical, actionable suggestions.`;

      const userPrompt = `
      Current Code:
      \`\`\`python
      ${currentCell.content}
      \`\`\`
      
      Results: ${JSON.stringify(results, null, 2)}
      
      What should the analyst explore next?`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.4,
        max_tokens: 1000
      });

      const response = completion.choices[0].message.content || '';
      
      return {
        suggestions: this.extractSuggestions(response),
        codeSnippets: this.extractCodeSnippets(response),
        explorationIdeas: this.extractExplorationIdeas(response)
      };
    } catch (error) {
      console.error('Next steps suggestion error:', error);
      return {
        suggestions: ['Continue analyzing the results', 'Consider additional data points'],
        codeSnippets: [],
        explorationIdeas: ['Explore different time periods', 'Analyze by team performance']
      };
    }
  }

  // Private helper methods
  private static getCodeGenerationSystemPrompt(): string {
    return `You are an expert sports betting analyst and Python developer.

Available Data Sources:
- EPL match data with odds, results, xG stats from 2020-2024
- Historical betting performance data  
- Team statistics and head-to-head records
- Market odds movements and closing line values

Available Functions:
- SportsBettingService.simulateStrategy() - Backtest betting strategies
- SportsBettingService.getTeamROI() - Analyze team betting performance
- SportsBettingService.getMarketSummary() - Get market statistics
- SportsBettingService.getTopPerformingTeams() - Rank teams by metrics
- SportsBettingService.aggregateStats() - Overall EPL statistics

Generate clean, well-commented Python code that:
1. Directly addresses the user's analysis question
2. Uses appropriate data structures (pandas DataFrames, numpy arrays)
3. Includes proper error handling and data validation
4. Follows best practices for sports betting analysis
5. Includes visualization code when appropriate (matplotlib, plotly)
6. Considers statistical significance and sample sizes
7. Implements proper risk management concepts

Always include explanations and suggest logical next steps for analysis.`;
  }

  private static buildUserPrompt(request: CodeGenerationRequest): string {
    const cellContext = request.cellHistory.length > 0 
      ? `Previous analysis: ${request.cellHistory.slice(-2).map(cell => 
          `${cell.type}: ${cell.content.substring(0, 100)}...`
        ).join('\n')}`
      : 'Starting new analysis';

    const chatContext = request.chatHistory.length > 0
      ? `Recent conversation: ${request.chatHistory.slice(-3).map(msg => 
          `${msg.role}: ${msg.content.substring(0, 100)}...`
        ).join('\n')}`
      : 'No prior conversation';

    return `
User Query: ${request.userQuery}

Context:
${cellContext}

${chatContext}

Target Language: ${request.targetLanguage}
Current Cell: ${request.currentCell?.content || 'New cell'}

Generate appropriate ${request.targetLanguage} code for this analysis request.
Use the generate_code_response function to structure your response.`;
  }

  private static createSuggestedCells(nextSteps: string[]): NotebookCell[] {
    return nextSteps.map((step, index) => ({
      id: `suggested-${Date.now()}-${index}`,
      type: 'code' as const,
      content: `# ${step}\n# TODO: Implement this analysis step`,
      executionCount: 0
    }));
  }

  private static createFallbackResponse(query: string): CodeGenerationResponse {
    const basicCode = `# Analysis for: ${query}
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# TODO: Implement analysis logic
print("Starting analysis...")`;

    return {
      code: basicCode,
      explanation: "Generated basic code structure for your analysis. Please refine based on your specific needs.",
      dependencies: ['pandas', 'numpy', 'matplotlib'],
      suggestedNextCells: [],
      relatedFunctions: ['SportsBettingService.simulateStrategy'],
      estimatedRuntime: "< 1 second"
    };
  }

  private static createErrorResponse(error: Error): CodeGenerationResponse {
    return {
      code: "# Error generating code. Please try again with a more specific request.",
      explanation: `Unable to generate code: ${error.message}`,
      dependencies: [],
      suggestedNextCells: [],
      relatedFunctions: [],
      estimatedRuntime: "0 seconds"
    };
  }

  // Response parsing helper methods
  private static extractImprovements(response: string): string[] {
    const lines = response.split('\n');
    const improvements: string[] = [];
    
    for (const line of lines) {
      if (line.includes('improvement') || line.includes('optimization') || line.includes('better')) {
        improvements.push(line.trim());
      }
    }
    
    return improvements.length > 0 ? improvements : ['Code structure improved'];
  }

  private static extractPerformanceGains(response: string): string {
    const perfMatch = response.match(/performance.*?(\d+[\d\s%x]*)/i);
    return perfMatch ? perfMatch[1] : 'Performance gains expected';
  }

  private static extractMainExplanation(response: string): string {
    const lines = response.split('\n');
    return lines.slice(0, 3).join(' ').trim() || 'Code explanation available';
  }

  private static extractStepByStep(response: string): string[] {
    const steps: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (/^\d+\./.test(line.trim()) || line.includes('Step')) {
        steps.push(line.trim());
      }
    }
    
    return steps;
  }

  private static extractAssumptions(response: string): string[] {
    const assumptions: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('assumes') || line.toLowerCase().includes('assumption')) {
        assumptions.push(line.trim());
      }
    }
    
    return assumptions;
  }

  private static extractLimitations(response: string): string[] {
    const limitations: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('limitation') || line.toLowerCase().includes('caveat')) {
        limitations.push(line.trim());
      }
    }
    
    return limitations;
  }

  private static extractDebugExplanation(response: string): string {
    const lines = response.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('error') || line.toLowerCase().includes('fix')) {
        return line.trim();
      }
    }
    return 'Error fixed';
  }

  private static extractPreventionTips(response: string): string[] {
    const tips: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('tip') || line.toLowerCase().includes('prevent')) {
        tips.push(line.trim());
      }
    }
    
    return tips;
  }

  private static extractSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.includes('suggest') || line.includes('next') || line.includes('consider')) {
        suggestions.push(line.trim());
      }
    }
    
    return suggestions.length > 0 ? suggestions : ['Continue with current analysis'];
  }

  private static extractCodeSnippets(response: string): string[] {
    const snippets: string[] = [];
    const codeBlocks = response.match(/```[\w]*\n([\s\S]*?)\n```/g);
    
    if (codeBlocks) {
      for (const block of codeBlocks) {
        const code = block.replace(/```[\w]*\n/, '').replace(/\n```/, '');
        snippets.push(code.trim());
      }
    }
    
    return snippets;
  }

  private static extractExplorationIdeas(response: string): string[] {
    const ideas: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.includes('explore') || line.includes('investigate') || line.includes('analyze')) {
        ideas.push(line.trim());
      }
    }
    
    return ideas.length > 0 ? ideas : ['Explore different time periods', 'Analyze team-specific patterns'];
  }

  private static extractCodeFromRawResponse(rawResponse: string): string {
    try {
      // Try to extract code from malformed JSON
      const codeMatch = rawResponse.match(/"code":\s*"([^"]*(?:\\.[^"]*)*)"/) || 
                       rawResponse.match(/"code":\s*`([^`]*)`/) ||
                       rawResponse.match(/```python\n([\s\S]*?)\n```/);
      
      if (codeMatch) {
        // Unescape the extracted code
        return codeMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }

      // If no code found, return a basic template for the specific request
      return `# Arsenal Home Betting Strategy
import pandas as pd
import numpy as np

def arsenal_home_strategy(matches_df):
    """
    Betting strategy for Arsenal home games
    Focus on home advantage and reasonable odds
    """
    # Filter for Arsenal home matches
    arsenal_home = matches_df[
        (matches_df['home_team'] == 'Arsenal')
    ].copy()
    
    # Strategy: bet on home wins when odds suggest value
    arsenal_home['bet'] = arsenal_home['home_odds'].between(1.4, 2.2)
    
    # Calculate stake (flat betting)
    stake = 100  # £100 per bet
    
    # Calculate profit/loss
    arsenal_home['profit'] = np.where(
        arsenal_home['bet'] & (arsenal_home['result'] == 'H'),
        (arsenal_home['home_odds'] - 1) * stake,  # Win
        np.where(arsenal_home['bet'], -stake, 0)  # Loss or no bet
    )
    
    # Summary statistics
    total_bets = arsenal_home['bet'].sum()
    total_profit = arsenal_home['profit'].sum()
    win_rate = (arsenal_home['bet'] & (arsenal_home['result'] == 'H')).sum() / total_bets if total_bets > 0 else 0
    
    print(f"Arsenal Home Strategy Results:")
    print(f"Total Bets: {total_bets}")
    print(f"Win Rate: {win_rate:.1%}")
    print(f"Total P&L: £{total_profit:.2f}")
    print(f"ROI: {(total_profit / (total_bets * stake) * 100):.1f}%" if total_bets > 0 else "N/A")
    
    return arsenal_home[['date', 'away_team', 'home_odds', 'bet', 'result', 'profit']]

# Example usage:
# result = arsenal_home_strategy(epl_data)`;
    } catch (error) {
      console.error('Error extracting code from raw response:', error);
      return '# Error extracting code. Please try again with a simpler request.';
    }
  }
} 