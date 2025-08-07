import { useState, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchText: string;
  onSearch: (text: string) => void;
  placeholder?: string;
  enableDynamicSearch?: boolean;
  debounceMs?: number;
}

export function SearchBar({ 
  searchText, 
  onSearch, 
  placeholder = 'Search...', 
  enableDynamicSearch = true,
  debounceMs = 300 
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState(searchText);

  // Debounced search effect for dynamic search
  useEffect(() => {
    if (!enableDynamicSearch) return;

    const timeoutId = setTimeout(() => {
      if (inputValue !== searchText) {
        onSearch(inputValue);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [inputValue, searchText, onSearch, enableDynamicSearch, debounceMs]);

  // Sync input value when searchText changes externally (e.g., clear button)
  useEffect(() => {
    setInputValue(searchText);
  }, [searchText]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch(inputValue);
  }, [inputValue, onSearch]);

  const handleClear = useCallback(() => {
    setInputValue('');
    onSearch('');
  }, [onSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:placeholder-gray-400"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {!enableDynamicSearch && (
        <button
          type="submit"
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Search
        </button>
      )}
      
      {searchText && !enableDynamicSearch && (
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
      )}
      
      {enableDynamicSearch && (
        <div className="text-sm text-gray-500 px-2">
          {inputValue ? `Searching...` : 'Type to search'}
        </div>
      )}
    </form>
  );
}
