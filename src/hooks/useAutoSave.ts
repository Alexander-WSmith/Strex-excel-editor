import { useEffect, useCallback } from 'react';
import { ModifiedCells, AutoSaveData } from '../types';

const AUTOSAVE_KEY = 'strex-autosave-data';

export function useAutoSave(modifiedCells: ModifiedCells, intervalMinutes: number = 5) {
  const saveToLocalStorage = useCallback(() => {
    if (Object.keys(modifiedCells).length === 0) {
      // No modifications to save
      return;
    }

    const autoSaveData: AutoSaveData = {
      filename: 'auto-saved-changes',
      modifiedCells,
      timestamp: Date.now(),
      settings: {
        rowsPerPage: 30,
        lockedColumns: 3,
        columnsLocked: true,
        autoSaveInterval: intervalMinutes,
      },
    };

    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autoSaveData));
      console.log('Auto-save completed:', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [modifiedCells, intervalMinutes]);

  const loadFromLocalStorage = useCallback((): AutoSaveData | null => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load auto-save data:', error);
    }
    return null;
  }, []);

  const clearAutoSave = useCallback(() => {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch (error) {
      console.error('Failed to clear auto-save data:', error);
    }
  }, []);

  // Set up auto-save interval
  useEffect(() => {
    const intervalMs = intervalMinutes * 60 * 1000;
    const interval = setInterval(saveToLocalStorage, intervalMs);

    return () => clearInterval(interval);
  }, [saveToLocalStorage, intervalMinutes]);

  return {
    saveToLocalStorage,
    loadFromLocalStorage,
    clearAutoSave,
  };
}
