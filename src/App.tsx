import { useState, useCallback, useMemo, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { SearchBar } from './components/SearchBar';
import { ExcelGrid, OptionsPanel, StatusBar, ToastContainer } from './components/index';
import { ExportModal } from './components/ExportModal';
import { RecentFilesModal, addToRecentFiles } from './components/RecentFilesModal';
import { DarkModeProvider, useDarkMode } from './hooks/useDarkMode.tsx';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from './hooks/useKeyboardShortcuts';
import { useToast } from './hooks/useToast';
import { AppSettings, ExcelFormatting } from './types';
import { Download, Settings, FileText, Moon, Sun, Clock, HelpCircle, History, FolderOpen, X } from 'lucide-react';

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
  const [showLoadNewConfirm, setShowLoadNewConfirm] = useState(false);
  
  // App settings
  const [settings, setSettings] = useState<AppSettings>({
    rowsPerPage: 30,
    lockedColumns: 3,
    columnsLocked: true,
    autoSaveInterval: 5,
  });

  // Load data from localStorage on app start
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('strex-excel-data');
      const savedModifications = localStorage.getItem('strex-excel-modifications');
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setExcelData(parsedData);
        console.log('Restored Excel data from localStorage:', parsedData.filename);
      }
      
      if (savedModifications) {
        const parsedModifications = JSON.parse(savedModifications);
        setModifiedCells(parsedModifications);
        console.log('Restored modifications from localStorage:', Object.keys(parsedModifications).length, 'changes');
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      // Clear corrupted data
      localStorage.removeItem('strex-excel-data');
      localStorage.removeItem('strex-excel-modifications');
    }
  }, []);

  // Save data to localStorage whenever excelData or modifiedCells change
  useEffect(() => {
    if (excelData) {
      localStorage.setItem('strex-excel-data', JSON.stringify(excelData));
      console.log('Saved Excel data to localStorage');
    }
  }, [excelData]);

  useEffect(() => {
    if (Object.keys(modifiedCells).length > 0) {
      localStorage.setItem('strex-excel-modifications', JSON.stringify(modifiedCells));
      console.log('Saved modifications to localStorage');
    } else {
      // Remove empty modifications from localStorage
      localStorage.removeItem('strex-excel-modifications');
    }
  }, [modifiedCells]);

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

  // Cell update handler - now tracks by record ID instead of visual position
  const handleCellUpdate = useCallback((rowData: any[], col: number, value: string) => {
    if (!rowData || rowData.length === 0) return;
    
    // Use the first column (usually name/ID) as unique identifier for the record
    const recordId = rowData[0]; // First column value as unique ID
    const recordKey = `${recordId}|${col}`; // Combine record ID with column index
    
    console.log(`Updating record "${recordId}" column ${col} to "${value}"`);
    
    setModifiedCells((prev: {[key: string]: string}) => ({
      ...prev,
      [recordKey]: value,
    }));
  }, []);

  // Enhanced helper function to create workbook with user changes while preserving formatting
  const createWorkbookWithChanges = useCallback(async () => {
    const XLSX = await import('xlsx');
    
    if (!excelData) {
      throw new Error('No Excel data available');
    }
    
    console.log('Creating workbook with user changes and preserved formatting...');
    console.log('Modified cells:', modifiedCells);
    console.log('Original formatting available:', !!excelData.formatting);
    
    // If we have original formatting, clone the original workbook
    if (excelData.formatting && excelData.formatting.workbook) {
      console.log('Using original workbook with formatting preservation');
      
      try {
        // Re-read the original buffer to ensure we have a fresh, complete workbook
        const XLSX = await import('xlsx');
        const originalBuffer = excelData.formatting.originalBuffer;
        
        // Parse the original file again with all formatting options
        const workbook = XLSX.read(originalBuffer, { 
          type: 'array',
          cellStyles: true,
          cellDates: true,
          sheetStubs: true,
          cellNF: true,
          cellHTML: false,
          dense: false
        });
        
        // Get the worksheet
        const worksheet = workbook.Sheets[excelData.formatting.sheetName];
        
        console.log('Original workbook parsed successfully');
        console.log('Available sheets:', workbook.SheetNames);
        console.log('Working with sheet:', excelData.formatting.sheetName);
        
        // Debug: Check a few cells to see if formatting is preserved
        const sampleCells = ['A1', 'B1', 'C1', 'A2', 'B2'];
        sampleCells.forEach(cellRef => {
          const cell = worksheet[cellRef];
          if (cell) {
            console.log(`Cell ${cellRef}:`, {
              value: cell.v,
              hasStyle: !!cell.s,
              style: cell.s ? {
                fill: cell.s.fill,
                font: cell.s.font,
                border: cell.s.border
              } : 'none'
            });
          }
        });
        
        // Apply user modifications while preserving formatting
        Object.keys(modifiedCells).forEach(key => {
          const recordId = key.split('|')[0];
          const colIndex = parseInt(key.split('|')[1]);
          
          // Find the row index for this record ID
          const rowIndex = excelData.data.findIndex(row => row[0] === recordId);
          if (rowIndex >= 0) {
            // Convert to Excel cell reference (adding 1 for headers, +1 for 1-based indexing)
            const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex });
            
            console.log(`Updating cell ${cellRef} with value: ${modifiedCells[key]}`);
            
            // Update the cell value while preserving its formatting
            if (worksheet[cellRef]) {
              // Keep existing cell object but update value
              const originalCell = worksheet[cellRef];
              worksheet[cellRef] = {
                ...originalCell,
                v: modifiedCells[key], // Update raw value
                w: modifiedCells[key], // Update formatted value 
                t: typeof modifiedCells[key] === 'number' ? 'n' : 's' // Update type if needed
              };
              console.log(`Updated existing cell ${cellRef}, preserved style:`, !!originalCell.s);
            } else {
              // Create new cell if it doesn't exist, try to inherit nearby formatting
              const newCell: any = {
                v: modifiedCells[key],
                w: modifiedCells[key],
                t: typeof modifiedCells[key] === 'number' ? 'n' : 's'
              };
              
              // Try to inherit formatting from the cell above or to the left
              const aboveRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
              const leftRef = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex - 1 });
              
              if (worksheet[aboveRef] && worksheet[aboveRef].s) {
                newCell.s = worksheet[aboveRef].s;
                console.log(`New cell ${cellRef} inherited formatting from above`);
              } else if (worksheet[leftRef] && worksheet[leftRef].s) {
                newCell.s = worksheet[leftRef].s;
                console.log(`New cell ${cellRef} inherited formatting from left`);
              }
              
              worksheet[cellRef] = newCell;
            }
          }
        });
        
        console.log('Successfully applied all modifications to formatted workbook');
        
        // Final check: Verify that formatting is still present
        const finalSampleCells = ['A1', 'B1', 'C1'];
        finalSampleCells.forEach(cellRef => {
          const cell = worksheet[cellRef];
          if (cell && cell.s) {
            console.log(`Final check - Cell ${cellRef} still has formatting:`, {
              hasStyle: !!cell.s,
              fill: cell.s.fill,
              font: cell.s.font
            });
          }
        });
        
        return workbook;
        
      } catch (error) {
        console.error('Error preserving formatting, falling back to basic export:', error);
        // Fall through to basic export if formatting preservation fails
      }
    }
    
    console.log('No original formatting available, creating basic workbook');
    
    // Fallback: Create basic workbook without formatting
    const modifiedData = excelData.data.map((row: any[], rowIndex: number) => 
      row.map((cell: any, colIndex: number) => {
        const recordId = row[0];
        const recordKey = `${recordId}|${colIndex}`;
        const modifiedValue = modifiedCells[recordKey];
        
        if (modifiedValue !== undefined) {
          console.log(`Applying change: record "${recordId}" col ${colIndex} = ${modifiedValue}`);
          return modifiedValue;
        }
        return cell;
      })
    );
    
    // Combine headers and modified data
    const worksheetData = [excelData.headers, ...modifiedData];
    
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
      const filename = 'Strexlista modified';
      
      // Import xlsx library for file writing
      const XLSX = await import('xlsx');
      
      // Save the file with buffer method for better formatting preservation
      const arrayBuffer = XLSX.write(newWorkbook, {
        bookType: 'xlsx',
        type: 'array',
        cellStyles: true,
        bookSST: true
      });
      
      // Create blob and save using file-saver
      const { saveAs } = await import('file-saver');
      const blob = new Blob([arrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs(blob, `${filename}.xlsx`);
      
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
  }, [excelData, modifiedCells, createWorkbookWithChanges, showToast]);

  // Enhanced export handler for different formats
  const handleExport = useCallback(async (type: 'save' | 'pdf' | 'email' | 'print') => {
    if (!excelData) return;
    
    try {
      // Import xlsx library dynamically
      const XLSX = await import('xlsx');
      
      // For CSV and other formats, we need worksheet data
      const modifiedData = excelData.data.map((row: any[], rowIndex: number) => 
        row.map((cell: any, colIndex: number) => {
          // Use record ID (first column) + column index as key
          const recordId = row[0];
          const recordKey = `${recordId}|${colIndex}`;
          return modifiedCells[recordKey] !== undefined 
            ? modifiedCells[recordKey] 
            : cell;
        })
      );
      
      // Combine headers and data for formats that need it
      const worksheetData = [excelData.headers, ...modifiedData];
      
      // Generate filename
      const filename = 'Strexlista modified';
      
      switch (type) {
        case 'save':
          // Use the helper function to create workbook with user changes
          const workbookWithChanges = await createWorkbookWithChanges();
          
          console.log('=== WRITING XLSX FILE (SAVE) ===');
          console.log('Workbook to write:', workbookWithChanges);
          console.log('Workbook sheets:', Object.keys(workbookWithChanges.Sheets));
          
          // Write file with proper formatting preservation using buffer method
          const arrayBuffer = XLSX.write(workbookWithChanges, {
            bookType: 'xlsx',
            type: 'array',
            cellStyles: true,
            bookSST: true
          });
          
          // Create blob and save using file-saver for better formatting preservation
          const { saveAs } = await import('file-saver');
          const blob = new Blob([arrayBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
          saveAs(blob, `${filename}.xlsx`);
          
          // Keep modifications so user can continue working
          addToRecentFiles(excelData.filename, excelData.filename);
          
          // Show success message
          showToast({
            type: 'success',
            message: 'File saved successfully with formatting preserved!',
            duration: 3000
          });
          break;
          
        case 'pdf':
          // Generate PDF using jsPDF with formatting from original Excel
          try {
            const jsPDF = (await import('jspdf')).default;
            const autoTable = await import('jspdf-autotable');
            
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(16);
            doc.text(filename, 14, 22);
            
            // Prepare table data with formatting
            const tableData = modifiedData.map(row => 
              row.map(cell => cell?.toString() || '')
            );
            
            // Extract styling information from original Excel if available
            let headStyles: any = {
              fillColor: [66, 139, 202],
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 10,
            };
            
            let bodyStyles: any = {
              fontSize: 9,
              cellPadding: 3,
            };
            
            let columnStyles: any = {};
            
            // If we have original formatting, try to apply it
            if (excelData.formatting && excelData.formatting.cellStyles) {
              console.log('Applying Excel formatting to PDF...');
              
              // Try to extract header row formatting
              const headerCellRef = 'A1'; // First header cell
              const headerStyle = excelData.formatting.cellStyles[headerCellRef];
              
              if (headerStyle) {
                // Apply header formatting
                if (headerStyle.fill && headerStyle.fill.fgColor) {
                  // Convert Excel color to RGB
                  const color = headerStyle.fill.fgColor.rgb || headerStyle.fill.fgColor.theme;
                  if (color && typeof color === 'string' && color.length === 8) {
                    // Extract RGB from ARGB hex
                    const r = parseInt(color.substring(2, 4), 16);
                    const g = parseInt(color.substring(4, 6), 16);
                    const b = parseInt(color.substring(6, 8), 16);
                    headStyles.fillColor = [r, g, b];
                  }
                }
                
                if (headerStyle.font) {
                  if (headerStyle.font.bold) {
                    headStyles.fontStyle = 'bold';
                  }
                  if (headerStyle.font.sz) {
                    headStyles.fontSize = Math.max(8, Math.min(16, headerStyle.font.sz));
                  }
                }
              }
              
              // Apply column widths if available
              if (excelData.formatting.columnWidths) {
                Object.keys(excelData.formatting.columnWidths).forEach(colIndex => {
                  const width = excelData.formatting.columnWidths[parseInt(colIndex)];
                  if (width) {
                    // Convert Excel column width to PDF units (rough approximation)
                    const pdfWidth = Math.max(20, Math.min(80, width * 5));
                    columnStyles[colIndex] = { cellWidth: pdfWidth };
                  }
                });
              }
              
              // Set alternating row colors for better readability
              bodyStyles.alternateRowStyles = {
                fillColor: [248, 249, 250]
              };
            }
            
            // Add table with enhanced formatting
            autoTable.default(doc, {
              head: [excelData.headers],
              body: tableData,
              startY: 30,
              styles: bodyStyles,
              headStyles: headStyles,
              columnStyles: columnStyles,
              margin: { top: 30, right: 10, bottom: 20, left: 10 },
              tableWidth: 'auto',
              theme: 'grid',
              didDrawCell: function(data: any) {
                // Add subtle borders
                if (data.section === 'body') {
                  doc.setDrawColor(200, 200, 200);
                  doc.setLineWidth(0.1);
                }
              }
            });
            
            // Add a footer with export info
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(128);
            doc.text(`Exported from Strexlista on ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);
            doc.text(`Page 1 of ${pageCount}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
            
            // Save the PDF
            doc.save(`${filename}.pdf`);
            
            showToast({
              message: 'PDF exported successfully with enhanced formatting!',
              type: 'success',
              duration: 3000
            });
          } catch (error) {
            console.error('PDF export error:', error);
            showToast({
              message: 'Failed to export PDF. Please try again.',
              type: 'error',
              duration: 5000
            });
          }
          break;
          
        case 'email':
          // Create Excel file as blob and generate attachment link
          try {
            const workbookWithChanges = await createWorkbookWithChanges();
            const XLSX = await import('xlsx');
            
            // Write workbook to array buffer
            const excelBuffer = XLSX.write(workbookWithChanges, {
              bookType: 'xlsx',
              type: 'array'
            });
            
            // Create blob
            const blob = new Blob([excelBuffer], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            
            // Create download URL
            const url = URL.createObjectURL(blob);
            
            // For desktop: create a temporary download link and prompt user
            if (window.navigator.userAgent.includes('Windows') || window.navigator.userAgent.includes('Mac')) {
              const emailBody = `Please find the attached Excel file: ${filename}.xlsx\n\nNote: Your email client should allow you to attach the downloaded file.`;
              const mailto = `mailto:?subject=${encodeURIComponent(`Excel Data: ${filename}`)}&body=${encodeURIComponent(emailBody)}`;
              
              // Download the file first
              const downloadLink = document.createElement('a');
              downloadLink.href = url;
              downloadLink.download = `${filename}.xlsx`;
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
              
              // Then open email client
              setTimeout(() => {
                window.open(mailto);
                showToast({
                  message: 'File downloaded! Please attach it to your email.',
                  type: 'info',
                  duration: 5000
                });
              }, 500);
            } else {
              // For mobile: try to use Web Share API if available
              if (navigator.share) {
                const file = new File([blob], `${filename}.xlsx`, {
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
                
                try {
                  await navigator.share({
                    title: `Excel Data: ${filename}`,
                    text: 'Please find the attached Excel file.',
                    files: [file]
                  });
                  
                  showToast({
                    message: 'Sharing completed!',
                    type: 'success',
                    duration: 3000
                  });
                } catch (shareError) {
                  console.error('Share failed:', shareError);
                  // Fallback to download
                  const downloadLink = document.createElement('a');
                  downloadLink.href = url;
                  downloadLink.download = `${filename}.xlsx`;
                  document.body.appendChild(downloadLink);
                  downloadLink.click();
                  document.body.removeChild(downloadLink);
                  
                  showToast({
                    message: 'File downloaded! You can attach it to your email.',
                    type: 'info',
                    duration: 5000
                  });
                }
              } else {
                // Fallback to download
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = `${filename}.xlsx`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                
                showToast({
                  message: 'File downloaded! You can attach it to your email.',
                  type: 'info',
                  duration: 5000
                });
              }
            }
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
          } catch (error) {
            console.error('Email export error:', error);
            showToast({
              message: 'Failed to prepare file for email. Please try again.',
              type: 'error',
              duration: 5000
            });
          }
          break;
          
        case 'print':
          // Create a well-formatted printable HTML page
          try {
            const printContent = modifiedData.map(row => 
              `<tr>${row.map(cell => 
                `<td style="border:1px solid #333;padding:6px;font-size:12px;background:white;">${cell || ''}</td>`
              ).join('')}</tr>`
            ).join('');
            
            const headerContent = excelData.headers.map(header => 
              `<th style="border:1px solid #333;padding:8px;background:#f5f5f5;font-weight:bold;font-size:12px;">${header}</th>`
            ).join('');
            
            const printHTML = `
              <!DOCTYPE html>
              <html>
                <head>
                  <title>${filename}</title>
                  <style>
                    @media print {
                      body { margin: 0; }
                      table { page-break-inside: avoid; }
                    }
                    body { 
                      font-family: Arial, sans-serif; 
                      margin: 20px;
                      background: white;
                    }
                    h1 { 
                      color: #333; 
                      font-size: 18px; 
                      margin-bottom: 20px;
                      border-bottom: 2px solid #333;
                      padding-bottom: 10px;
                    }
                    table { 
                      border-collapse: collapse; 
                      width: 100%; 
                      margin-top: 10px;
                    }
                    th, td { 
                      text-align: left; 
                      word-wrap: break-word;
                      max-width: 200px;
                    }
                    .timestamp {
                      font-size: 10px;
                      color: #666;
                      margin-top: 20px;
                    }
                  </style>
                </head>
                <body>
                  <h1>${filename}</h1>
                  <table>
                    <thead>
                      <tr>${headerContent}</tr>
                    </thead>
                    <tbody>
                      ${printContent}
                    </tbody>
                  </table>
                  <div class="timestamp">
                    Generated on: ${new Date().toLocaleString()}
                  </div>
                </body>
              </html>
            `;
            
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(printHTML);
              printWindow.document.close();
              
              // Wait for content to load, then print
              printWindow.onload = () => {
                setTimeout(() => {
                  printWindow.print();
                  // Close the window after printing (optional)
                  printWindow.onafterprint = () => {
                    printWindow.close();
                  };
                }, 500);
              };
              
              showToast({
                message: 'Print dialog opened!',
                type: 'success',
                duration: 3000
              });
            } else {
              showToast({
                message: 'Unable to open print dialog. Please check popup settings.',
                type: 'error',
                duration: 5000
              });
            }
          } catch (error) {
            console.error('Print error:', error);
            showToast({
              message: 'Failed to prepare document for printing.',
              type: 'error',
              duration: 5000
            });
          }
          break;
      }
      
    } catch (err) {
      console.error('Error exporting file:', err);
      setError(`Failed to export file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [excelData, modifiedCells, createWorkbookWithChanges, showToast]);

  // Load new file handlers
  const handleLoadNewFileRequest = useCallback(() => {
    const hasUnsavedChanges = Object.keys(modifiedCells).length > 0;
    if (hasUnsavedChanges) {
      setShowLoadNewConfirm(true);
    } else {
      handleLoadNewFileConfirmed(false);
    }
  }, [modifiedCells]);

  const handleLoadNewFileConfirmed = useCallback(async (shouldSave: boolean) => {
    if (shouldSave && excelData) {
      try {
        // Save current file before loading new one
        await handleExport('save');
        showToast({
          type: 'success',
          message: 'Current file saved successfully!',
          duration: 3000
        });
      } catch (error) {
        showToast({
          type: 'error',
          message: 'Failed to save current file',
          duration: 4000
        });
        return; // Don't proceed if save failed
      }
    }
    
    // Clear current data and go back to file upload screen
    setExcelData(null);
    setModifiedCells({});
    setSearchText('');
    setCurrentPage(0);
    setError(null);
    setShowLoadNewConfirm(false);
    
    // Clear localStorage
    localStorage.removeItem('strex-excel-data');
    localStorage.removeItem('strex-excel-modifications');
    
    showToast({
      type: 'info',
      message: 'Ready to load new file',
      duration: 2000
    });
  }, [excelData, handleExport, showToast]);

  const handleCancelLoadNew = useCallback(() => {
    setShowLoadNewConfirm(false);
  }, []);

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
              <>
                <button
                  onClick={handleLoadNewFileRequest}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  title="Load a new Excel file"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Load New File</span>
                </button>
                
                <button
                  onClick={() => setShowExportModal(true)}
                  disabled={!excelData}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </>
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
        filename="Strexlista modified"
      />

      {/* Load New File Confirmation Modal */}
      {showLoadNewConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Load New File</h3>
              <button
                onClick={handleCancelLoadNew}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                You have unsaved changes. What would you like to do before loading a new file?
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => handleLoadNewFileConfirmed(true)}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Save & Load New
                </button>
                <button
                  onClick={() => handleLoadNewFileConfirmed(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Don't Save
                </button>
                <button
                  onClick={handleCancelLoadNew}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
