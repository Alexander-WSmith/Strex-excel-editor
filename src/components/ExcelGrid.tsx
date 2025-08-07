import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { ModifiedCells } from '../types';
import { Minus, Plus } from 'lucide-react';

interface ExcelGridProps {
  headers: string[];
  data: any[][];
  originalData: any[][]; // Full original dataset for sticky row 1
  modifiedCells: ModifiedCells;
  onCellUpdate: (row: number, col: number, value: string) => void;
  lockedColumns: number;
  currentPage: number;
  rowsPerPage: number;
}

interface EditableCellProps {
  value: any;
  row: number;
  col: number;
  isLocked: boolean;
  isModified: boolean;
  onUpdate: (row: number, col: number, value: string) => void;
  columnWidth?: number;
}

interface NumericCellProps {
  value: any;
  row: number;
  col: number;
  isLocked: boolean;
  isModified: boolean;
  onUpdate: (row: number, col: number, value: string) => void;
  columnWidth?: number;
}

function NumericCell({ value, row, col, isLocked, isModified, onUpdate, columnWidth }: NumericCellProps) {
  const [isActive, setIsActive] = useState(false);
  const cellRef = useRef<HTMLTableCellElement>(null);
  
  const numericValue = useMemo(() => {
    const parsed = parseFloat(String(value || '0'));
    return isNaN(parsed) ? 0 : Math.max(0, Math.floor(parsed)); // Ensure integers only
  }, [value]);

  const handleIncrement = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isLocked) {
      const newValue = numericValue + 1;
      onUpdate(row, col, String(newValue));
    }
  }, [numericValue, row, col, onUpdate, isLocked]);

  const handleDecrement = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isLocked && numericValue > 0) {
      const newValue = numericValue - 1;
      onUpdate(row, col, String(newValue));
    }
  }, [numericValue, row, col, onUpdate, isLocked]);

  const handleCellClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLocked) {
      setIsActive(true);
    }
  }, [isLocked]);

  const handleDeactivate = useCallback(() => {
    setIsActive(false);
  }, []);

  // Handle clicks outside the cell
  useEffect(() => {
    if (!isActive) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (cellRef.current && !cellRef.current.contains(event.target as Node)) {
        setIsActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isActive]);

  // Handle keyboard events when cell is active
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isActive || isLocked) return;
    
    switch (e.key) {
      case 'Escape':
        setIsActive(false);
        break;
      case 'ArrowUp':
      case '+':
        e.preventDefault();
        handleIncrement(e as any);
        break;
      case 'ArrowDown':
      case '-':
        e.preventDefault();
        handleDecrement(e as any);
        break;
    }
  }, [isActive, isLocked, handleIncrement, handleDecrement]);

  return (
    <td 
      ref={cellRef}
      className={`excel-cell numeric-cell ${isLocked ? 'readonly bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} ${isActive ? 'active' : ''}`}
      style={{ 
        minWidth: columnWidth ? `${columnWidth}px` : '150px',
        width: columnWidth ? `${columnWidth}px` : '150px',
        height: '48px'
      }}
      onClick={handleCellClick}
      onKeyDown={handleKeyDown}
      tabIndex={isLocked ? -1 : 0}
    >
      <div className="numeric-cell-content h-full flex items-center justify-center relative">
        {isActive && !isLocked ? (
          <>
            <button
              className="numeric-btn decrement-btn"
              onMouseDown={handleDecrement}
              disabled={numericValue <= 0}
              title="Decrease by 1"
            >
              <Minus className="w-3 h-3" />
            </button>
            <div className="numeric-display-active">
              {numericValue}
            </div>
            <button
              className="numeric-btn increment-btn"
              onMouseDown={handleIncrement}
              title="Increase by 1"
            >
              <Plus className="w-3 h-3" />
            </button>
          </>
        ) : (
          <span className="numeric-display text-center w-full">{numericValue}</span>
        )}
      </div>
    </td>
  );
}

function EditableCell({ value, row, col, isLocked, isModified, onUpdate, columnWidth }: EditableCellProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(row, col, e.target.value);
  }, [row, col, onUpdate]);

  const displayValue = value ?? '';

  return (
    <td 
      className={`excel-cell ${isLocked ? 'readonly bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`}
      style={{ 
        minWidth: columnWidth ? `${columnWidth}px` : (col === 0 ? '120px' : '150px'),
        width: columnWidth ? `${columnWidth}px` : (col === 0 ? '120px' : '150px'),
        height: '48px'
      }}
    >
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        disabled={isLocked}
        className={`cell-input w-full h-full px-2 py-1 text-sm border-none outline-none bg-transparent text-gray-900 dark:text-white ${
          isLocked ? 'cursor-not-allowed text-gray-500 dark:text-gray-400' : ''
        }`}
      />
    </td>
  );
}

export function ExcelGrid({ 
  headers, 
  data, 
  originalData,
  modifiedCells, 
  onCellUpdate, 
  lockedColumns, 
  currentPage, 
  rowsPerPage 
}: ExcelGridProps) {
  const startRow = currentPage * rowsPerPage;

  // Calculate optimal width for column A based on content (excluding header)
  const columnAWidth = useMemo(() => {
    if (!originalData.length) return 120;

    // Get all values from column A (index 0) starting from row 1, including modifications
    const allColumnAValues = originalData.map((row, rowIndex) => {
      const cellKey = `${rowIndex},0`;
      const isModified = cellKey in modifiedCells;
      const value = isModified ? modifiedCells[cellKey] : (row[0] || '');
      return String(value);
    });

    // Calculate the longest text length and convert to approximate pixel width
    const maxLength = Math.max(...allColumnAValues.map(text => text.length));
    // Approximate: 8px per character + some padding
    const calculatedWidth = Math.max(120, Math.min(400, maxLength * 8 + 40));
    
    return calculatedWidth;
  }, [originalData, modifiedCells]);

  const tableData = useMemo(() => {
    return data.map((row, rowIndex) => 
      row.map((cell, colIndex) => {
        const globalRowIndex = startRow + rowIndex;
        const cellKey = `${globalRowIndex},${colIndex}`;
        const isModified = cellKey in modifiedCells;
        const displayValue = isModified ? modifiedCells[cellKey] : cell;
        
        return {
          value: displayValue,
          isModified,
          isLocked: colIndex < lockedColumns,
          globalRowIndex,
          colIndex
        };
      })
    );
  }, [data, modifiedCells, lockedColumns, startRow]);

  // Always show row 1 (index 0) when there's data, using original data
  const stickyRow1 = useMemo(() => {
    if (!originalData.length || originalData.length === 0) return null;
    
    // Get the actual first data row (row 1 in Excel terms) from original data
    const firstDataRow = originalData[0];
    if (!firstDataRow) return null;

    return firstDataRow.map((cell, colIndex) => {
      const cellKey = `0,${colIndex}`;
      const isModified = cellKey in modifiedCells;
      const displayValue = isModified ? modifiedCells[cellKey] : cell;
      
      return {
        value: displayValue,
        isModified,
        isLocked: colIndex < lockedColumns,
        globalRowIndex: 0,
        colIndex
      };
    });
  }, [originalData, modifiedCells, lockedColumns]);

  if (!headers.length || !data.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500 text-lg">No data to display</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto custom-scrollbar">
      <div className="min-w-full">
        <table className="excel-grid w-full border-collapse">
          <thead className="sticky-header bg-gray-50 dark:bg-gray-800" style={{ position: 'sticky', top: 0, zIndex: 20 }}>
            <tr>
              <th className="excel-cell bg-gray-100 dark:bg-gray-700 font-semibold text-left px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" style={{ minWidth: '60px', width: '60px', height: '48px' }}>
                Row
              </th>
              {headers.map((header, index) => (
                <th 
                  key={index}
                  className={`excel-cell font-semibold text-left px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white ${
                    index < lockedColumns ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                  style={{ 
                    minWidth: index === 0 ? `${columnAWidth}px` : '150px',
                    width: index === 0 ? `${columnAWidth}px` : '150px',
                    height: '48px'
                  }}
                >
                  {header || <span className="text-gray-400 dark:text-gray-500 italic">Column {String.fromCharCode(65 + index)}</span>}
                  {index < lockedColumns && (
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">🔒</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Sticky Row 1 (always visible) */}
            {stickyRow1 && (
              <tr 
                className="excel-row hover:bg-gray-50 dark:hover:bg-gray-700 sticky-row-1 bg-gray-50 dark:bg-gray-800" 
                style={{ position: 'sticky', top: '41px', zIndex: 15 }}
              >
                <td className="excel-cell bg-gray-100 dark:bg-gray-700 font-medium text-center px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" style={{ minWidth: '60px', width: '60px', height: '48px' }}>
                  1
                </td>
                {stickyRow1.map((cell, colIndex) => {
                  // Use NumericCell for columns D-T (indices 3-19) starting from row 2, but row 1 is always EditableCell
                  const shouldUseNumericCell = false; // Row 1 always uses regular EditableCell
                  
                  return shouldUseNumericCell ? (
                    <NumericCell
                      key={`sticky-0-${colIndex}`}
                      value={cell.value}
                      row={cell.globalRowIndex}
                      col={cell.colIndex}
                      isLocked={cell.isLocked}
                      isModified={cell.isModified}
                      onUpdate={onCellUpdate}
                      columnWidth={colIndex === 0 ? columnAWidth : 150}
                    />
                  ) : (
                    <EditableCell
                      key={`sticky-0-${colIndex}`}
                      value={cell.value}
                      row={cell.globalRowIndex}
                      col={cell.colIndex}
                      isLocked={cell.isLocked}
                      isModified={cell.isModified}
                      onUpdate={onCellUpdate}
                      columnWidth={colIndex === 0 ? columnAWidth : 150}
                    />
                  );
                })}
              </tr>
            )}
            
            {/* Regular data rows */}
            {tableData.map((row, rowIndex) => {
              const actualRowNumber = startRow + rowIndex + 1;
              // Skip row 1 if it's already shown as sticky
              if (actualRowNumber === 1) return null;
              
              return (
                <tr key={startRow + rowIndex} className="excel-row hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="excel-cell bg-gray-50 dark:bg-gray-700 font-medium text-center px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" style={{ minWidth: '60px', width: '60px', height: '48px' }}>
                    {actualRowNumber}
                  </td>
                  {row.map((cell, colIndex) => {
                    // Use NumericCell for columns D-T (indices 3-19) starting from row 2
                    const shouldUseNumericCell = actualRowNumber >= 2 && colIndex >= 3 && colIndex <= 19;
                    
                    return shouldUseNumericCell ? (
                      <NumericCell
                        key={`${startRow + rowIndex}-${colIndex}`}
                        value={cell.value}
                        row={cell.globalRowIndex}
                        col={cell.colIndex}
                        isLocked={cell.isLocked}
                        isModified={cell.isModified}
                        onUpdate={onCellUpdate}
                        columnWidth={colIndex === 0 ? columnAWidth : 150}
                      />
                    ) : (
                      <EditableCell
                        key={`${startRow + rowIndex}-${colIndex}`}
                        value={cell.value}
                        row={cell.globalRowIndex}
                        col={cell.colIndex}
                        isLocked={cell.isLocked}
                        isModified={cell.isModified}
                        onUpdate={onCellUpdate}
                        columnWidth={colIndex === 0 ? columnAWidth : 150}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
