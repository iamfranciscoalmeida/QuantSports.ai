import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronUp, 
  ChevronDown, 
  Search,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface BettingTableProps {
  data: any[];
  title?: string;
}

export function BettingTable({ data, title = "Betting Data" }: BettingTableProps) {
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (!data || data.length === 0) {
    return (
      <Card className="bg-quant-bg-secondary border-quant-border">
        <CardContent className="p-4">
          <p className="text-quant-text-muted text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Get column headers from first data item
  const columns = Object.keys(data[0]);

  // Filter data based on search term
  const filteredData = data.filter(item =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    // Handle numeric values
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Handle string values
    const aString = String(aValue).toLowerCase();
    const bString = String(bValue).toLowerCase();
    
    if (sortDirection === 'asc') {
      return aString.localeCompare(bString);
    } else {
      return bString.localeCompare(aString);
    }
  });

  // Paginate data
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatValue = (value: any, key: string) => {
    if (value === null || value === undefined) return '-';
    
    // Format percentages
    if (key.toLowerCase().includes('roi') || key.toLowerCase().includes('rate') || key.toLowerCase().includes('percentage')) {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        return (
          <div className="flex items-center">
            {numValue > 0 && <TrendingUp className="h-3 w-3 text-green-500 mr-1" />}
            {numValue < 0 && <TrendingDown className="h-3 w-3 text-red-500 mr-1" />}
            {numValue === 0 && <Minus className="h-3 w-3 text-gray-500 mr-1" />}
            <span className={numValue > 0 ? 'text-green-400' : numValue < 0 ? 'text-red-400' : 'text-gray-400'}>
              {numValue.toFixed(1)}%
            </span>
          </div>
        );
      }
    }
    
    // Format P&L values
    if (key.toLowerCase().includes('pnl') || key.toLowerCase().includes('profit')) {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        return (
          <div className="flex items-center">
            <span className={numValue > 0 ? 'text-green-400' : numValue < 0 ? 'text-red-400' : 'text-gray-400'}>
              {numValue > 0 ? '+' : ''}${numValue.toFixed(2)}
            </span>
          </div>
        );
      }
    }
    
    // Format odds
    if (key.toLowerCase().includes('odds')) {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        return numValue.toFixed(2);
      }
    }
    
    // Format win/loss results
    if (key.toLowerCase().includes('result') || key.toLowerCase().includes('outcome')) {
      if (value === 'win') {
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Win</Badge>;
      } else if (value === 'loss') {
        return <Badge variant="destructive">Loss</Badge>;
      }
    }
    
    // Format bet types
    if (key.toLowerCase().includes('bet_type') || key.toLowerCase().includes('market')) {
      const betTypeLabels: Record<string, string> = {
        '1': 'Home Win',
        'X': 'Draw',
        '2': 'Away Win',
        'over_2.5': 'Over 2.5',
        'under_2.5': 'Under 2.5'
      };
      return betTypeLabels[value] || value;
    }
    
    // Default formatting
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    
    return String(value);
  };

  const formatColumnHeader = (column: string) => {
    return column
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className="bg-quant-bg-secondary border-quant-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-quant-text">{title}</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-quant-text-muted" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 w-48 bg-quant-bg border-quant-border text-quant-text text-sm"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-quant-border">
                {columns.map((column) => (
                  <th
                    key={column}
                    className="text-left p-2 text-quant-text font-medium cursor-pointer hover:bg-quant-bg/50"
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{formatColumnHeader(column)}</span>
                      {sortField === column && (
                        <div className="text-quant-accent">
                          {sortDirection === 'asc' ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => (
                <tr 
                  key={index} 
                  className="border-b border-quant-border/50 hover:bg-quant-bg/30 transition-colors"
                >
                  {columns.map((column) => (
                    <td key={column} className="p-2 text-quant-text-muted">
                      {formatValue(row[column], column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-quant-border">
            <div className="text-sm text-quant-text-muted">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} results
            </div>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 border-quant-border hover:bg-quant-bg-secondary"
              >
                Previous
              </Button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="h-8 px-3 border-quant-border hover:bg-quant-bg-secondary"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-3 border-quant-border hover:bg-quant-bg-secondary"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 