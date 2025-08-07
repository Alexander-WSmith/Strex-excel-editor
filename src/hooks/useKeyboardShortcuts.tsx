import { useEffect, useCallback } from 'react';

export interface KeyboardShortcuts {
  onSave?: () => void;
  onExport?: () => void;
  onSearch?: () => void;
  onToggleDarkMode?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onTab?: () => void;
  onDelete?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onSelectAll?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { ctrlKey, metaKey, shiftKey, altKey, key } = event;
    const isCtrlOrCmd = ctrlKey || metaKey;

    // Prevent shortcuts when typing in input fields
    const activeElement = document.activeElement;
    const isInputField = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement as HTMLElement).contentEditable === 'true'
    );

    // Allow some shortcuts even in input fields
    if (isInputField) {
      if (isCtrlOrCmd && key === 's' && shortcuts.onSave) {
        event.preventDefault();
        shortcuts.onSave();
        return;
      }
      if (isCtrlOrCmd && key === 'e' && shortcuts.onExport) {
        event.preventDefault();
        shortcuts.onExport();
        return;
      }
      if (isCtrlOrCmd && key === 'f' && shortcuts.onSearch) {
        event.preventDefault();
        shortcuts.onSearch();
        return;
      }
      if (isCtrlOrCmd && shiftKey && key === 'D' && shortcuts.onToggleDarkMode) {
        event.preventDefault();
        shortcuts.onToggleDarkMode();
        return;
      }
      if (key === 'Escape' && shortcuts.onEscape) {
        event.preventDefault();
        shortcuts.onEscape();
        return;
      }
      return; // Don't handle other shortcuts in input fields
    }

    // Global shortcuts
    switch (key) {
      case 's':
        if (isCtrlOrCmd && shortcuts.onSave) {
          event.preventDefault();
          shortcuts.onSave();
        }
        break;
      case 'e':
        if (isCtrlOrCmd && shortcuts.onExport) {
          event.preventDefault();
          shortcuts.onExport();
        }
        break;
      case 'f':
        if (isCtrlOrCmd && shortcuts.onSearch) {
          event.preventDefault();
          shortcuts.onSearch();
        }
        break;
      case 'D':
        if (isCtrlOrCmd && shiftKey && shortcuts.onToggleDarkMode) {
          event.preventDefault();
          shortcuts.onToggleDarkMode();
        }
        break;
      case 'Escape':
        if (shortcuts.onEscape) {
          event.preventDefault();
          shortcuts.onEscape();
        }
        break;
      case 'ArrowUp':
        if (shortcuts.onArrowUp) {
          event.preventDefault();
          shortcuts.onArrowUp();
        }
        break;
      case 'ArrowDown':
        if (shortcuts.onArrowDown) {
          event.preventDefault();
          shortcuts.onArrowDown();
        }
        break;
      case 'ArrowLeft':
        if (shortcuts.onArrowLeft) {
          event.preventDefault();
          shortcuts.onArrowLeft();
        }
        break;
      case 'ArrowRight':
        if (shortcuts.onArrowRight) {
          event.preventDefault();
          shortcuts.onArrowRight();
        }
        break;
      case 'Enter':
        if (shortcuts.onEnter) {
          event.preventDefault();
          shortcuts.onEnter();
        }
        break;
      case 'Tab':
        if (shortcuts.onTab) {
          event.preventDefault();
          shortcuts.onTab();
        }
        break;
      case 'Delete':
        if (shortcuts.onDelete) {
          event.preventDefault();
          shortcuts.onDelete();
        }
        break;
      case 'z':
        if (isCtrlOrCmd && !shiftKey && shortcuts.onUndo) {
          event.preventDefault();
          shortcuts.onUndo();
        } else if (isCtrlOrCmd && shiftKey && shortcuts.onRedo) {
          event.preventDefault();
          shortcuts.onRedo();
        }
        break;
      case 'y':
        if (isCtrlOrCmd && shortcuts.onRedo) {
          event.preventDefault();
          shortcuts.onRedo();
        }
        break;
      case 'c':
        if (isCtrlOrCmd && shortcuts.onCopy) {
          event.preventDefault();
          shortcuts.onCopy();
        }
        break;
      case 'v':
        if (isCtrlOrCmd && shortcuts.onPaste) {
          event.preventDefault();
          shortcuts.onPaste();
        }
        break;
      case 'a':
        if (isCtrlOrCmd && shortcuts.onSelectAll) {
          event.preventDefault();
          shortcuts.onSelectAll();
        }
        break;
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

// Helper component to display keyboard shortcuts
export function KeyboardShortcutsHelp({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Ctrl', 'S'], description: 'Save file' },
    { keys: ['Ctrl', 'E'], description: 'Export options' },
    { keys: ['Ctrl', 'F'], description: 'Focus search' },
    { keys: ['Ctrl', 'Shift', 'D'], description: 'Toggle dark mode' },
    { keys: ['Escape'], description: 'Close modals/cancel' },
    { keys: ['Arrow Keys'], description: 'Navigate cells' },
    { keys: ['Enter'], description: 'Edit cell' },
    { keys: ['Tab'], description: 'Next cell' },
    { keys: ['Delete'], description: 'Clear cell' },
    { keys: ['Ctrl', 'Z'], description: 'Undo' },
    { keys: ['Ctrl', 'Y'], description: 'Redo' },
    { keys: ['Ctrl', 'C'], description: 'Copy' },
    { keys: ['Ctrl', 'V'], description: 'Paste' },
    { keys: ['Ctrl', 'A'], description: 'Select all' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Keyboard Shortcuts
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">
                  {shortcut.description}
                </span>
                <div className="flex space-x-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <kbd
                      key={keyIndex}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
