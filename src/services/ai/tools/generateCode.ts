import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { AICodeGenerator } from '../../aiCodeGenerator';

const GenerateCodeSchema = z.object({
  query: z.string().describe('Natural language description of what code to generate'),
  language: z.enum(['python', 'sql', 'javascript']).default('python').describe('Target programming language'),
  context: z.object({
    current_notebook_cells: z.array(z.any()).optional().describe('Current notebook cells for context'),
    available_data: z.array(z.string()).optional().describe('Available datasets or tables'),
    user_preferences: z.record(z.any()).optional().describe('User coding preferences')
  }).optional().describe('Additional context for code generation')
});

export class GenerateCodeTool extends StructuredTool {
  name = 'generate_code';
  description = 'Generate production-ready code for sports betting analysis, including data processing, strategy implementation, and visualization';
  schema = GenerateCodeSchema;

  async _call(input: z.infer<typeof GenerateCodeSchema>): Promise<string> {
    try {
      const codeRequest = {
        userQuery: input.query,
        targetLanguage: input.language as 'python' | 'sql' | 'javascript',
        cellHistory: input.context?.current_notebook_cells || [],
        chatHistory: [],
        availableData: input.context?.available_data?.map(name => ({
          tables: [name],
          relationships: [],
          commonQueries: []
        })) || []
      };

      const result = await AICodeGenerator.generateCode(codeRequest);

      // Validate the generated code
      const validationResult = await this.validateCode(result.code, input.language);

      let response = `## Generated Code: ${input.query}

### Code:
\`\`\`${input.language}
${result.code}
\`\`\`

### Explanation:
${result.explanation}

### Dependencies:
${result.dependencies.length > 0 ? result.dependencies.map(dep => `- ${dep}`).join('\n') : 'No additional dependencies required'}

### Estimated Runtime:
${result.estimatedRuntime}`;

      if (validationResult.issues.length > 0) {
        response += `\n\n### ⚠️ Code Validation Issues:
${validationResult.issues.map(issue => `- ${issue}`).join('\n')}`;
      }

      if (result.suggestedNextCells.length > 0) {
        response += `\n\n### 📋 Suggested Next Steps:
${result.suggestedNextCells.map(cell => `- ${cell.metadata?.title || 'Next analysis step'}`).join('\n')}`;
      }

      if (validationResult.isValid) {
        response += `\n\n✅ **Code validation passed** - This code is ready to run!`;
      } else {
        response += `\n\n⚠️ **Code validation warnings** - Please review the issues above before running.`;
      }

      return response;
    } catch (error) {
      console.error('Code generation error:', error);
      
      // Provide fallback code generation
      if (error instanceof Error && error.message === 'QUOTA_EXCEEDED') {
        return this.getFallbackCode(input);
      }
      
      return `I encountered an error while generating code for: "${input.query}". Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try simplifying your request or check your API configuration.`;
    }
  }

  private async validateCode(code: string, language: string): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];

    if (!code || code.trim() === '') {
      return { isValid: false, issues: ['Generated code is empty'] };
    }

    // Basic syntax validation
    if (language === 'python') {
      // Check for basic Python syntax issues
      if (!code.includes('import') && code.includes('pandas')) {
        issues.push('Code uses pandas but missing import statement');
      }
      
      if (code.includes('undefined') || code.includes('null')) {
        issues.push('Code contains JavaScript-like syntax (undefined/null) instead of Python (None)');
      }

      if (code.split('\n').some(line => line.trim().endsWith(':') && !line.trim().startsWith('#'))) {
        const nextLines = code.split('\n');
        let hasIndentationIssues = false;
        
        for (let i = 0; i < nextLines.length - 1; i++) {
          if (nextLines[i].trim().endsWith(':')) {
            if (nextLines[i + 1] && !nextLines[i + 1].startsWith('    ') && nextLines[i + 1].trim() !== '') {
              hasIndentationIssues = true;
              break;
            }
          }
        }
        
        if (hasIndentationIssues) {
          issues.push('Potential indentation issues detected');
        }
      }
    }

    // Security validation
    if (code.includes('eval(') || code.includes('exec(')) {
      issues.push('Code contains potentially unsafe eval() or exec() functions');
    }

    if (code.includes('os.system') || code.includes('subprocess')) {
      issues.push('Code contains system command execution - potential security risk');
    }

    // Performance validation
    if (code.includes('for') && code.includes('append') && code.includes('list')) {
      issues.push('Consider using list comprehension or vectorized operations for better performance');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  private getFallbackCode(input: z.infer<typeof GenerateCodeSchema>): string {
    const query = input.query.toLowerCase();
    
    let fallbackCode = '';
    let explanation = '';

    if (query.includes('strategy') || query.includes('backtest')) {
      fallbackCode = `import pandas as pd
import numpy as np

# Basic betting strategy framework
def create_betting_strategy(matches_df, strategy_name="Custom Strategy"):
    """
    Basic betting strategy template
    """
    # Filter matches based on criteria
    filtered_matches = matches_df[
        (matches_df['home_odds'] >= 1.5) & 
        (matches_df['home_odds'] <= 2.5)
    ]
    
    # Calculate strategy performance
    results = {
        'total_bets': len(filtered_matches),
        'win_rate': 0.0,
        'roi': 0.0
    }
    
    if len(filtered_matches) > 0:
        wins = filtered_matches['home_win'].sum()
        results['win_rate'] = (wins / len(filtered_matches)) * 100
        
        # Calculate ROI (simplified)
        total_staked = len(filtered_matches) * 10  # £10 per bet
        total_returns = (filtered_matches['home_win'] * filtered_matches['home_odds'] * 10).sum()
        results['roi'] = ((total_returns - total_staked) / total_staked) * 100
    
    return results

# Example usage
# strategy_results = create_betting_strategy(matches_df, "Home Favorites")
# print(f"Win Rate: {strategy_results['win_rate']:.1f}%")
# print(f"ROI: {strategy_results['roi']:.2f}%")`;

      explanation = 'This is a basic betting strategy framework that filters matches and calculates performance metrics. You can customize the filtering criteria and betting logic based on your specific requirements.';
    } else if (query.includes('analysis') || query.includes('team')) {
      fallbackCode = `import pandas as pd
import matplotlib.pyplot as plt

# Team performance analysis
def analyze_team_performance(matches_df, team_name):
    """
    Analyze team performance metrics
    """
    # Filter matches for the specific team
    team_matches = matches_df[
        (matches_df['home_team'] == team_name) | 
        (matches_df['away_team'] == team_name)
    ]
    
    # Calculate basic statistics
    home_matches = team_matches[team_matches['home_team'] == team_name]
    away_matches = team_matches[team_matches['away_team'] == team_name]
    
    analysis = {
        'total_matches': len(team_matches),
        'home_record': {
            'played': len(home_matches),
            'wins': home_matches['home_win'].sum(),
            'draws': home_matches['draw'].sum(),
            'losses': home_matches['away_win'].sum()
        },
        'away_record': {
            'played': len(away_matches),
            'wins': away_matches['away_win'].sum(),
            'draws': away_matches['draw'].sum(),
            'losses': away_matches['home_win'].sum()
        }
    }
    
    return analysis

# Example usage
# team_stats = analyze_team_performance(matches_df, "Arsenal")
# print(f"Total matches: {team_stats['total_matches']}")`;

      explanation = 'This code provides basic team performance analysis including home and away records. You can extend it to include more detailed metrics like goal statistics, form analysis, and head-to-head records.';
    } else {
      fallbackCode = `import pandas as pd
import numpy as np

# General data analysis template
def analyze_data(df):
    """
    Basic data analysis template
    """
    print("Dataset Overview:")
    print(f"Shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print("\\nBasic Statistics:")
    print(df.describe())
    
    return df.head()

# Example usage
# results = analyze_data(your_dataframe)`;

      explanation = 'This is a general data analysis template. Please provide more specific requirements to generate more targeted code for your betting analysis needs.';
    }

    return `## Generated Code (Offline Mode): ${input.query}

### Code:
\`\`\`${input.language}
${fallbackCode}
\`\`\`

### Explanation:
${explanation}

### Dependencies:
- pandas
- numpy
- matplotlib (if visualization needed)

### Note:
This is a basic template generated in offline mode. For more sophisticated and personalized code generation, please ensure your AI service is connected.

✅ **Ready to use** - This code provides a solid foundation that you can customize further.`;
  }
} 