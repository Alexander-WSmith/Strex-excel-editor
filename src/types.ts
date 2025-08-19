// Core data types for Excel functionality
export interface ExcelData {
  headers: string[];
  data: any[][];
  filename: string;
  formatting?: ExcelFormatting; // Optional formatting information
}

export interface ExcelFormatting {
  originalBuffer: ArrayBuffer; // Store the original file buffer
  workbook: any; // Original XLSX workbook object
  worksheet: any; // Original XLSX worksheet object
  columnWidths: { [col: number]: number }; // Column widths
  rowHeights: { [row: number]: number }; // Row heights
  cellStyles: { [cellRef: string]: any }; // Cell-specific formatting
  sheetName: string; // Original sheet name
}

export interface CellModification {
  row: number;
  col: number;
  value: string;
  timestamp: number;
}

export interface ModifiedCells {
  [key: string]: string; // key format: "row,col"
}

// Application settings
export interface AppSettings {
  rowsPerPage: number;
  lockedColumns: number;
  columnsLocked: boolean;
  autoSaveInterval: number; // in minutes
}

// Cache management
export interface CacheStats {
  columnWidthCache: number;
  searchCache: number;
  totalMemoryUsage: string;
  lastCleared: Date | null;
}

// Search and filtering
export interface SearchOptions {
  searchInColumns: number[];
  caseSensitive: boolean;
  exactMatch: boolean;
}

// Toast notifications
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// File operations
export interface FileOperationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: Error;
}

// Export configuration
export interface ExportOptions {
  filename: string;
  preserveTypes: boolean;
  includeHeaders: boolean;
  format: 'xlsx' | 'csv';
}

// Performance metrics
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  searchTime: number;
  cacheHitRate: number;
}

// Auto-save data structure
export interface AutoSaveData {
  filename: string;
  modifiedCells: ModifiedCells;
  timestamp: number;
  settings: AppSettings;
}

// Column configuration
export interface ColumnConfig {
  index: number;
  header: string;
  width: number;
  locked: boolean;
  dataType: 'string' | 'number' | 'date' | 'boolean';
}

// Grid display options
export interface GridDisplayOptions {
  showRowNumbers: boolean;
  stickyHeader: boolean;
  highlightModified: boolean;
  zebraStripes: boolean;
}

// Password protection (for deployment)
export interface AuthConfig {
  enabled: boolean;
  password: string;
  sessionTimeout: number; // in minutes
}

// Electron-specific types
export interface ElectronAPI {
  openFile: () => Promise<string | null>;
  saveFile: (data: any, filename: string) => Promise<boolean>;
  showMessage: (message: string, type: 'info' | 'error' | 'warning') => void;
}
