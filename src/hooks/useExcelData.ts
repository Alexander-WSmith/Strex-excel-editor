import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ExcelData, ModifiedCells, FileOperationResult } from '../types';
// @ts-ignore - useToast import issue
import { useToast } from './useToast';

export function useExcelData() {
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [filteredData, setFilteredData] = useState<any[][] | null>(null);
  const [modifiedCells, setModifiedCells] = useState<ModifiedCells>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { showToast } = useToast();

  const loadExcelFile = useCallback(async (file: File): Promise<FileOperationResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get the first worksheet
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      
      // Convert to JSON with header  
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        raw: false // This helps preserve data types better
      });
      
      if (jsonData.length === 0) {
        throw new Error('The Excel file appears to be empty');
      }
      
      // Extract headers (first row) and data (remaining rows)
      const headers = (jsonData[0] as string[]) || [];
      const data = jsonData.slice(1) as any[][];
      
      // Ensure all rows have the same number of columns
      const maxCols = Math.max(headers.length, ...data.map(row => row.length));
      const normalizedData = data.map(row => {
        const normalizedRow = [...row];
        while (normalizedRow.length < maxCols) {
          normalizedRow.push('');
        }
        return normalizedRow;
      });
      
      // Ensure headers match the max columns  
      while (headers.length < maxCols) {
        headers.push(`Column ${headers.length + 1}`);
      }

      setExcelData({
        headers,
        data: normalizedData,
        filename: file.name,
      });
      
      setFilteredData(normalizedData);
      setModifiedCells({});
      
      setExcelData({
        headers,
        data: normalizedData,
        filename: file.name,
      });
      
      setFilteredData(normalizedData);
      setModifiedCells({});
      
      setLoading(false);
      showToast({
        type: 'success',
        message: `Loaded ${normalizedData.length} rows, ${headers.length} columns`,
      });
      
      return { 
        success: true, 
        message: `Loaded ${normalizedData.length} rows, ${headers.length} columns` 
      };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load Excel file';
      setError(errorMessage);
      showToast({
        type: 'error',
        message: errorMessage,
      });
      
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const updateCell = useCallback((row: number, col: number, value: string) => {
    setModifiedCells(prev => ({
      ...prev,
      [`${row},${col}`]: value,
    }));
    
    // Update the filtered data immediately for UI responsiveness
    setFilteredData(prev => {
      if (!prev) return prev;
      
      const newData = [...prev];
      if (newData[row]) {
        newData[row] = [...newData[row]];
        newData[row][col] = value;
      }
      
      return newData;
    });
  }, []);

  const saveExcelFile = useCallback(async (filename: string): Promise<FileOperationResult> => {
    if (!excelData) {
      return {
        success: false,
        message: 'No data to save',
      };
    }
    
    try {
      setLoading(true);
      
      // Apply all modifications to the data
      const modifiedData = excelData.data.map((row, rowIndex) => 
        row.map((cell, colIndex) => {
          const modKey = `${rowIndex},${colIndex}`;
          return modifiedCells[modKey] !== undefined ? modifiedCells[modKey] : cell;
        })
      );
      
      // Convert data types properly
      const typedData = modifiedData.map(row => 
        row.map(cell => {
          if (cell === '' || cell === null || cell === undefined) {
            return '';
          }
          
          const cellStr = String(cell).trim();
          
          // Try to convert to number if it looks like a number
          if (/^-?\d+\.?\d*$/.test(cellStr)) {
            const num = Number(cellStr);
            if (!isNaN(num)) {
              return num;
            }
          }
          
          // Try to convert boolean
          if (cellStr.toLowerCase() === 'true') return true;
          if (cellStr.toLowerCase() === 'false') return false;
          
          // Return as string
          return cellStr;
        })
      );
      
      // Create workbook
      const worksheet = XLSX.utils.aoa_to_sheet([excelData.headers, ...typedData]);
      const workbook = (XLSX.utils as any).book_new();
      (XLSX.utils as any).book_append_sheet(workbook, worksheet, 'Sheet1');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'buffer' as any,
      });
      
      // Save file
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
      saveAs(blob, finalFilename);
      
      showToast({
        type: 'success',
        message: `File saved as ${finalFilename}`,
      });
      
      return {
        success: true,
        message: 'File saved successfully',
      };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save Excel file';
      setError(errorMessage);
      showToast({
        type: 'error',
        message: errorMessage,
      });
      
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, [excelData, modifiedCells, showToast]);

  const resetData = useCallback(() => {
    setExcelData(null);
    setFilteredData(null);
    setModifiedCells({});
    setError(null);
  }, []);

  return {
    excelData,
    filteredData,
    modifiedCells,
    loading,
    error,
    loadExcelFile,
    updateCell,
    saveExcelFile,
    resetData,
  };
}
