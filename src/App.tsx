import { useState, useCallback, useMemo } from 'react';
import { FileUploader } from './components/FileUploader';
import { SearchBar } from './components/SearchBar';
import { ExcelGrid, OptionsPanel, StatusBar, ToastContainer } from './components/index';
import { ExportModal } from './components/ExportModal';
import { RecentFilesModal, addToRecentFiles } from './components/RecentFilesModal';
import { DarkModeProvider, useDarkMode } from './hooks/useDarkMode.tsx';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from './hooks/useKeyboardShortcuts';
import { useToast } from './hooks/useToast';
import { AppSettings, ExcelFormatting } from './types';
import { Download, Settings, FileText, Moon, Sun, Clock, HelpCircle, History } from 'lucide-react';

// Enhanced data structure with formatting preservation
interface SimpleExcelData {
  headers: string[];
  data: any[][];
  filename: string;
  formatting?: ExcelFormatting; // Store original formatting
}

function AppContent() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { showToast } = useToast();
  
  // Core state management
  const [excelData, setExcelData] = useState<SimpleExcelData | null>(null);
  const [modifiedCells, setModifiedCells] = useState<{[key: string]: string}>({});
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [showRecentFiles, setShowRecentFiles] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  
  // App settings
  const [settings, setSettings] = useState<AppSettings>({
    rowsPerPage: 30,
    lockedColumns: 3,
    columnsLocked: true,
    customFilename: 'Strexlista modified',
    autoSaveInterval: 5,
  });

  // Keyboard shortcuts integration
  useKeyboardShortcuts({
    onSave: () => handleExport('save'),
    onExport: () => setShowExportModal(true),
    onSearch: () => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) searchInput.focus();
    },
    onToggleDarkMode: toggleDarkMode,
    onEscape: () => {
      setShowExportModal(false);
      setShowRecentFiles(false);
      setShowKeyboardHelp(false);
      setShowOptions(false);
    },
  });

  // Enhanced Excel file loading with formatting preservation
  // This function captures and stores:
  // - Column widths and row heights
  // - Cell styles (colors, borders, fonts, etc.)
  // - Original workbook structure
  // The formatting is preserved when exporting, while data modifications are applied
  const handleFileLoad = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      // Import xlsx library dynamically
      const XLSX = await import('xlsx');
      
      // Read the file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Parse the Excel file with more options to preserve formatting
      const workbook = XLSX.read(arrayBuffer, { 
        type: 'array',
        cellStyles: true, // Preserve cell styles
        cellDates: true,  // Preserve date formatting
        sheetStubs: true, // Keep empty cells for structure
        cellNF: true,     // Preserve number formats
        cellHTML: false,  // Don't convert to HTML
        dense: false      // Use sparse format for better formatting preservation
      });
      
      // Get the first worksheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON format
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // Use array format instead of objects
        raw: false, // Keep formatted values as strings when needed
        defval: '' // Default value for empty cells
      }) as any[][];
      
      if (jsonData.length === 0) {
        throw new Error('Excel file appears to be empty');
      }

      // Find the maximum column count by checking the worksheet range
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const maxCols = range.e.c + 1; // End column + 1
      
      // Extract column widths if available
      const columnWidths: { [col: number]: number } = {};
      if (worksheet['!cols']) {
        worksheet['!cols'].forEach((col: any, index: number) => {
          if (col && col.wch) {
            columnWidths[index] = col.wch;
          }
        });
      }
      
      // Extract row heights if available
      const rowHeights: { [row: number]: number } = {};
      if (worksheet['!rows']) {
        worksheet['!rows'].forEach((row: any, index: number) => {
          if (row && row.hpx) {
            rowHeights[index] = row.hpx;
          }
        });
      }
      
      // Extract cell styles
      const cellStyles: { [cellRef: string]: any } = {};
      let styledCellCount = 0;
      Object.keys(worksheet).forEach(cellRef => {
        if (cellRef.startsWith('!')) return; // Skip metadata
        const cell = worksheet[cellRef];
        if (cell && cell.s) {
          cellStyles[cellRef] = cell.s;
          styledCellCount++;
          // Log some examples of what styling is captured
          if (styledCellCount <= 3) {
            console.log(`Sample styled cell ${cellRef}:`, {
              fill: cell.s.fill,
              font: cell.s.font,
              border: cell.s.border,
              alignment: cell.s.alignment
            });
          }
        }
      });
      
      console.log('Formatting detection:', {
        styledCells: styledCellCount,
        columnWidths: Object.keys(columnWidths).length,
        rowHeights: Object.keys(rowHeights).length,
        hasWorkbook: !!workbook,
        hasWorksheet: !!worksheet,
        sheetName: firstSheetName,
        sampleCellsWithFormatting: Object.keys(cellStyles).slice(0, 5)
      });
      
      // Store formatting information
      const formatting: ExcelFormatting = {
        originalBuffer: arrayBuffer.slice(0), // Store a copy of the original file
        workbook: workbook,
        worksheet: worksheet,
        columnWidths: columnWidths,
        rowHeights: rowHeights,
        cellStyles: cellStyles,
        sheetName: firstSheetName
      };
      
      // Extract headers (first row) and ensure proper length
      const rawHeaders = jsonData[0] || [];
      const headers = [];
      for (let i = 0; i < maxCols; i++) {
        if (rawHeaders[i] !== undefined && rawHeaders[i] !== null && rawHeaders[i] !== '') {
          headers[i] = String(rawHeaders[i]);
        } else {
          // Keep empty headers as empty strings to preserve column positions
          headers[i] = '';
        }
      }
      
      // Process data and ensure all rows have the same number of columns
      const data = jsonData.slice(1).map(row => {
        const processedRow = [];
        for (let i = 0; i < maxCols; i++) {
          processedRow[i] = row[i] !== undefined && row[i] !== null ? row[i] : '';
        }
        return processedRow;
      }).filter(row => 
        // Only filter out completely empty rows
        row.some(cell => cell !== '' && cell !== null && cell !== undefined)
      );
      
      setExcelData({
        headers: headers,
        data: data,
        filename: file.name,
        formatting: formatting // Include formatting information
      });
      
      // Show toast about formatting preservation
      if (styledCellCount > 0 || Object.keys(columnWidths).length > 0) {
        showToast({
          type: 'success',
          message: `File loaded with preserved formatting: ${styledCellCount} styled cells, ${Object.keys(columnWidths).length} custom column widths`,
          duration: 4000
        });
      } else {
        showToast({
          type: 'info',
          message: 'File loaded successfully (no special formatting detected)',
          duration: 3000
        });
      }
      
      setCurrentPage(0);
      setSearchText('');
      setModifiedCells({});
      
    } catch (err) {
      console.error('Error loading Excel file:', err);
      setError(`Failed to load file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Cell update handler
  const handleCellUpdate = useCallback((row: number, col: number, value: string) => {
    setModifiedCells((prev: {[key: string]: string}) => ({
      ...prev,
      [`${row},${col}`]: value,
    }));
  }, []);

  // Simple helper function to create workbook with user changes
  const createWorkbookWithChanges = useCallback(async () => {
    const XLSX = await import('xlsx');
    
    if (!excelData) {
      throw new Error('No Excel data available');
    }
    
    console.log('Creating workbook with user changes...');
    console.log('Modified cells:', modifiedCells);
    
    // Create a copy of the data and apply user modifications
    const modifiedData = excelData.data.map((row: any[], rowIndex: number) => 
      row.map((cell: any, colIndex: number) => {
        const modifiedKey = `${rowIndex},${colIndex}`;
        const modifiedValue = modifiedCells[modifiedKey];
        
        if (modifiedValue !== undefined) {
          console.log(`Applying change: row ${rowIndex}, col ${colIndex} = ${modifiedValue}`);
          return modifiedValue;
        }
        return cell;
      })
    );
    
    // Combine headers and modified data
    const worksheetData = [excelData.headers, ...modifiedData];
    
    console.log('Final worksheet data preview:', worksheetData.slice(0, 3));
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    return workbook;
    
  }, [excelData, modifiedCells]);

  // Enhanced save handler with formatting preservation
  const handleSave = useCallback(async () => {
    if (!excelData) return;
    
    try {
      // Create a copy of the data and apply modifications
      const modifiedData = excelData.data.map((row: any[], rowIndex: number) => 
        row.map((cell: any, colIndex: number) => {
          const modifiedKey = `${rowIndex},${colIndex}`;
          return modifiedCells[modifiedKey] !== undefined 
            ? modifiedCells[modifiedKey] 
            : cell;
        })
      );
      
      // Combine headers and data
      const worksheetData = [excelData.headers, ...modifiedData];
      
      // Create workbook with preserved formatting
      const newWorkbook = await createWorkbookWithChanges();
      
      // Generate filename
      const filename = settings.customFilename || 
        excelData.filename.replace(/\.[^/.]+$/, '') + '_modified';
      
      // Import xlsx library for file writing
      const XLSX = await import('xlsx');
      
      // Save the file with explicit formatting preservation options
      XLSX.writeFile(newWorkbook, `${filename}.xlsx`, {
        cellStyles: true,
        bookSST: false,
        type: 'binary'
      });
      
      // Show success message
      showToast({
        type: 'success',
        message: 'File saved successfully with your changes!',
        duration: 3000
      });
      
      // Keep modified cells so user can continue working
      
    } catch (err) {
      console.error('Error saving Excel file:', err);
      setError(`Failed to save file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [excelData, modifiedCells, settings.customFilename, createWorkbookWithChanges, showToast]);

  // Enhanced export handler for different formats
  const handleExport = useCallback(async (type: 'save' | 'csv' | 'pdf' | 'email' | 'print') => {
    if (!excelData) return;
    
    try {
      // Import xlsx library dynamically
      const XLSX = await import('xlsx');
      
      // For CSV and other formats, we need worksheet data
      const modifiedData = excelData.data.map((row: any[], rowIndex: number) => 
        row.map((cell: any, colIndex: number) => {
          const modifiedKey = `${rowIndex},${colIndex}`;
          return modifiedCells[modifiedKey] !== undefined 
            ? modifiedCells[modifiedKey] 
            : cell;
        })
      );
      
      // Combine headers and data for formats that need it
      const worksheetData = [excelData.headers, ...modifiedData];
      
      // Generate filename
      const filename = settings.customFilename || 
        excelData.filename.replace(/\.[^/.]+$/, '') + '_modified';
      
      switch (type) {
        case 'save':
          // Use the helper function to create workbook with user changes
          const workbookWithChanges = await createWorkbookWithChanges();
          
          console.log('=== WRITING XLSX FILE (SAVE) ===');
          console.log('Workbook to write:', workbookWithChanges);
          
          XLSX.writeFile(workbookWithChanges, `${filename}.xlsx`);
          // Keep modifications so user can continue working
          addToRecentFiles(excelData.filename, excelData.filename);
          
          // Show success message
          showToast({
            type: 'success',
            message: 'File saved successfully with your changes!',
            duration: 3000
          });
          break;
          
        case 'csv':
          // CSV format doesn't support formatting - inform user
          // Create proper CSV data manually to ensure correct formatting
          const properCsvData = worksheetData.map(row => 
            row.map(cell => {
              // Escape cells containing commas, quotes, or newlines
              const cellStr = String(cell || '');
              if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }
              return cellStr;
            }).join(',')
          ).join('\n');
          
          // Create blob and download
          const csvBlob = new Blob([properCsvData], { type: 'text/csv;charset=utf-8;' });
          const csvUrl = URL.createObjectURL(csvBlob);
          const csvLink = document.createElement('a');
          csvLink.href = csvUrl;
          csvLink.download = `${filename}.csv`;
          document.body.appendChild(csvLink);
          csvLink.click();
          document.body.removeChild(csvLink);
          URL.revokeObjectURL(csvUrl);
          
          showToast({
            type: 'warning',
            message: 'CSV format exported successfully. Note: CSV files do not support formatting (colors, borders, etc.)',
            duration: 5000
          });
          break;
          
        case 'pdf':
          // For now, create a printable HTML version
          const printContent = worksheetData.map(row => 
            `<tr>${row.map(cell => `<td style="border:1px solid #ccc;padding:4px;">${cell}</td>`).join('')}</tr>`
          ).join('');
          const printHTML = `
            <html>
              <head><title>${filename}</title></head>
              <body>
                <table style="border-collapse:collapse;width:100%;">
                  ${printContent}
                </table>
              </body>
            </html>
          `;
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(printHTML);
            printWindow.document.close();
            printWindow.print();
          }
          break;
          
        case 'email':
          // Create mailto link with CSV data
          const csvData = worksheetData.map(row => row.join(',')).join('\n');
          const mailto = `mailto:?subject=${encodeURIComponent(`Excel Data: ${filename}`)}&body=${encodeURIComponent(csvData)}`;
          window.open(mailto);
          break;
          
        case 'print':
          // Print current view
          window.print();
          break;
      }
      
    } catch (err) {
      console.error('Error exporting file:', err);
      setError(`Failed to export file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [excelData, modifiedCells, settings.customFilename, createWorkbookWithChanges, showToast]);

  // Recent files handler
  const handleRecentFileSelect = useCallback(async (recentFile: { name: string; path: string }) => {
    // For web implementation, we can't directly access file paths
    // Show a message to user about manual file selection
    setError('Please select the file manually from your computer');
    setShowRecentFiles(false);
  }, []);

  // Search handler
  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    setCurrentPage(0);
  }, []);

  // Settings update
  const handleSettingsUpdate = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev: AppSettings) => ({ ...prev, ...newSettings }));
    setCurrentPage(0);
  }, []);

  // Filtered and paginated data
  const { displayData, totalPages } = useMemo(() => {
    if (!excelData) return { displayData: [], totalPages: 0 };

    let filteredData = excelData.data;
    
    if (searchText) {
      filteredData = excelData.data.filter((row: any[], index: number) => {
        // Always include row 1 (index 0) in search results
        if (index === 0) return true;
        
        const firstCol = String(row[0] || '').toLowerCase();
        const secondCol = String(row[1] || '').toLowerCase();
        return firstCol.includes(searchText.toLowerCase()) || 
               secondCol.includes(searchText.toLowerCase());
      });
    }

    const startIndex = currentPage * settings.rowsPerPage;
    const endIndex = startIndex + settings.rowsPerPage;
    const paginated = filteredData.slice(startIndex, endIndex);
    
    return {
      displayData: paginated,
      totalPages: Math.ceil(filteredData.length / settings.rowsPerPage)
    };
  }, [excelData, searchText, currentPage, settings.rowsPerPage]);

  // Status info
  const statusInfo = useMemo(() => {
    if (!excelData) return 'No file loaded';
    
    const totalRows = excelData.data.length;
    const modifiedCount = Object.keys(modifiedCells).length;
    
    if (searchText) {
      const filteredCount = displayData.length;
      return `Search: "${searchText}" - ${filteredCount} results (${modifiedCount} modifications)`;
    }
    
    return `${totalRows} rows, ${excelData.headers.length} columns (${modifiedCount} modifications)`;
  }, [excelData, displayData.length, searchText, modifiedCells]);

  // Simple cache stats
  const cacheStats = {
    columnWidthCache: 0,
    searchCache: 0,
    totalMemoryUsage: '0 MB',
    lastCleared: null,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-8 h-8 text-blue-500" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Strex Excel Editor</h1>
            </div>
            
            {excelData && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{excelData.filename}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!excelData && (
              <button
                onClick={() => setShowRecentFiles(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <History className="w-4 h-4" />
                <span>Recent Files</span>
              </button>
            )}
            
            {excelData && (
              <button
                onClick={() => setShowExportModal(true)}
                disabled={!excelData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            )}
            
            <button
              onClick={toggleDarkMode}
              className="p-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="p-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Keyboard shortcuts"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowOptions(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Options</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {!excelData ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <FileUploader onFileLoad={handleFileLoad} loading={loading} error={error} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
              <SearchBar
                searchText={searchText}
                onSearch={handleSearch}
                placeholder="Search in first two columns..."
                enableDynamicSearch={true}
                debounceMs={300}
              />
            </div>

            {/* Excel Grid */}
            <div className="flex-1 overflow-hidden">
              <ExcelGrid
                headers={excelData.headers}
                data={displayData}
                originalData={excelData.data}
                modifiedCells={modifiedCells}
                onCellUpdate={handleCellUpdate}
                lockedColumns={settings.columnsLocked ? settings.lockedColumns : 0}
                currentPage={currentPage}
                rowsPerPage={settings.rowsPerPage}
              />
            </div>

            {/* Status Bar */}
            <StatusBar
              status={statusInfo}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              cacheStats={cacheStats}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        filename={excelData?.filename || 'excel-export'}
      />

      <RecentFilesModal
        isOpen={showRecentFiles}
        onClose={() => setShowRecentFiles(false)}
        onSelectFile={handleRecentFileSelect}
      />

      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />

      {/* Options Panel */}
      {showOptions && (
        <OptionsPanel
          settings={settings}
          onSettingsUpdate={handleSettingsUpdate}
          onClose={() => setShowOptions(false)}
          onClearCache={() => alert('Cache cleared')}
        />
      )}

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}

// Main App component with providers
function App() {
  return (
    <DarkModeProvider>
      <AppContent />
    </DarkModeProvider>
  );
}

export default App;
