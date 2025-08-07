import { ChevronLeft, ChevronRight, Database, Clock } from 'lucide-react';
import { CacheStats } from '../types';

interface StatusBarProps {
  status: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  cacheStats: CacheStats;
}

export function StatusBar({ status, currentPage, totalPages, onPageChange, cacheStats }: StatusBarProps) {
  const handlePrevPage = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Status Information */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Database className="w-4 h-4" />
            <span>{status}</span>
          </div>
          
          {/* Cache Stats */}
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Cache: {cacheStats.columnWidthCache + cacheStats.searchCache} entries</span>
            <span>•</span>
            <span>{cacheStats.totalMemoryUsage}</span>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <span>Page</span>
              <span className="font-medium">{currentPage + 1}</span>
              <span>of</span>
              <span className="font-medium">{totalPages}</span>
            </div>
            
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
