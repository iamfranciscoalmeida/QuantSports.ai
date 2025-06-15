import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const formatMarkdown = (text: string): JSX.Element => {
    // Split into sections by newlines to process line by line
    const lines = text.split('\n');
    const formattedLines: JSX.Element[] = [];
    let currentList: string[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Handle code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          // Start of code block
          inCodeBlock = true;
          codeLanguage = line.replace('```', '').trim();
          codeContent = [];
          continue;
        } else {
          // End of code block
          inCodeBlock = false;
          formattedLines.push(
            <pre key={i} className="bg-gray-100 p-3 rounded-lg my-2 overflow-x-auto">
              <code className={`language-${codeLanguage}`}>
                {codeContent.join('\n')}
              </code>
            </pre>
          );
          codeContent = [];
          continue;
        }
      }

      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }

      // Handle lists
      if (line.trim().startsWith('- ')) {
        currentList.push(line.trim().substring(2));
        continue;
      } else if (currentList.length > 0) {
        // End of list, add it
        formattedLines.push(
          <ul key={`list-${i}`} className="list-disc ml-6 my-2 space-y-1">
            {currentList.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
            ))}
          </ul>
        );
        currentList = [];
      }

      // Skip empty lines if we just processed a list
      if (line.trim() === '' && currentList.length === 0) {
        formattedLines.push(<div key={i} className="h-2" />);
        continue;
      }

      // Headers
      if (line.startsWith('### ')) {
        formattedLines.push(
          <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-blue-700">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        formattedLines.push(
          <h2 key={i} className="text-xl font-bold mt-4 mb-2 text-blue-800">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        formattedLines.push(
          <h1 key={i} className="text-2xl font-bold mt-4 mb-3 text-blue-900">
            {line.substring(2)}
          </h1>
        );
      } else if (line.trim() !== '') {
        // Regular paragraph
        formattedLines.push(
          <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
        );
      }
    }

    // Handle any remaining list items
    if (currentList.length > 0) {
      formattedLines.push(
        <ul key="final-list" className="list-disc ml-6 my-2 space-y-1">
          {currentList.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
          ))}
        </ul>
      );
    }

    return <div className={className}>{formattedLines}</div>;
  };

  const formatInlineMarkdown = (text: string): string => {
    return text
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Italic text
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Inline code
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Links (basic support)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Emojis and special formatting
      .replace(/⚽/g, '<span class="text-green-600">⚽</span>')
      .replace(/🏠/g, '<span class="text-blue-600">🏠</span>')
      .replace(/📊/g, '<span class="text-purple-600">📊</span>')
      .replace(/✅/g, '<span class="text-green-600">✅</span>')
      .replace(/❌/g, '<span class="text-red-600">❌</span>')
      .replace(/⚠️/g, '<span class="text-yellow-600">⚠️</span>')
      // Statistics formatting
      .replace(/(\d+\.\d+%)/g, '<span class="font-semibold text-blue-700">$1</span>')
      .replace(/(\d+ goals?)/g, '<span class="font-semibold text-green-700">$1</span>');
  };

  return formatMarkdown(content);
}; 