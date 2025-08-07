import { useState, useCallback, useMemo } from 'react';
import { CacheStats } from '../types';

interface CacheEntry {
  data: any;
  timestamp: number;
  accessCount: number;
}

interface CacheStore {
  columnWidths: Map<string, CacheEntry>;
  searchResults: Map<string, CacheEntry>;
}

const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 50;

export function useCache() {
  const [cache, setCache] = useState<CacheStore>({
    columnWidths: new Map(),
    searchResults: new Map(),
  });

  const [lastCleared, setLastCleared] = useState<Date | null>(null);

  const cleanExpiredEntries = useCallback((cacheMap: Map<string, CacheEntry>) => {
    const now = Date.now();
    const entries = Array.from(cacheMap.entries());
    
    entries.forEach(([key, entry]) => {
      if (now - entry.timestamp > CACHE_EXPIRY_MS) {
        cacheMap.delete(key);
      }
    });
  }, []);

  const limitCacheSize = useCallback((cacheMap: Map<string, CacheEntry>) => {
    if (cacheMap.size <= MAX_CACHE_SIZE) return;

    // Sort by access count and timestamp (least recently used first)
    const entries = Array.from(cacheMap.entries()).sort((a, b) => {
      const accessDiff = a[1].accessCount - b[1].accessCount;
      if (accessDiff !== 0) return accessDiff;
      return a[1].timestamp - b[1].timestamp;
    });

    // Remove oldest entries
    const toRemove = entries.slice(0, cacheMap.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => cacheMap.delete(key));
  }, []);

  const setCacheEntry = useCallback((
    type: 'columnWidths' | 'searchResults',
    key: string,
    data: any
  ) => {
    setCache(prev => {
      const newCache = { ...prev };
      const cacheMap = new Map(newCache[type]);
      
      cacheMap.set(key, {
        data,
        timestamp: Date.now(),
        accessCount: 1,
      });

      cleanExpiredEntries(cacheMap);
      limitCacheSize(cacheMap);

      newCache[type] = cacheMap;
      return newCache;
    });
  }, [cleanExpiredEntries, limitCacheSize]);

  const getCacheEntry = useCallback((
    type: 'columnWidths' | 'searchResults',
    key: string
  ): any | null => {
    const cacheMap = cache[type];
    const entry = cacheMap.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
      cacheMap.delete(key);
      return null;
    }

    // Update access count
    entry.accessCount += 1;

    return entry.data;
  }, [cache]);

  const clearCache = useCallback(() => {
    setCache({
      columnWidths: new Map(),
      searchResults: new Map(),
    });
    setLastCleared(new Date());
  }, []);

  const cacheStats: CacheStats = useMemo(() => {
    const columnWidthEntries = cache.columnWidths.size;
    const searchEntries = cache.searchResults.size;
    
    // Rough memory calculation (very approximate)
    const estimatedMemory = (columnWidthEntries + searchEntries) * 1024; // 1KB per entry estimate
    const memoryInMB = (estimatedMemory / (1024 * 1024)).toFixed(2);

    return {
      columnWidthCache: columnWidthEntries,
      searchCache: searchEntries,
      totalMemoryUsage: `${memoryInMB} MB`,
      lastCleared,
    };
  }, [cache, lastCleared]);

  const setColumnWidthCache = useCallback((key: string, widths: number[]) => {
    setCacheEntry('columnWidths', key, widths);
  }, [setCacheEntry]);

  const getColumnWidthCache = useCallback((key: string): number[] | null => {
    return getCacheEntry('columnWidths', key);
  }, [getCacheEntry]);

  const setSearchCache = useCallback((key: string, results: any[][]) => {
    setCacheEntry('searchResults', key, results);
  }, [setCacheEntry]);

  const getSearchCache = useCallback((key: string): any[][] | null => {
    return getCacheEntry('searchResults', key);
  }, [getCacheEntry]);

  return {
    cacheStats,
    clearCache,
    setColumnWidthCache,
    getColumnWidthCache,
    setSearchCache,
    getSearchCache,
  };
}
