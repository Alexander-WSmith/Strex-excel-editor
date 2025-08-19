import { useState } from 'react';
import { X, Lock, Unlock, Trash2, Save } from 'lucide-react';
import { AppSettings } from '../types';

interface OptionsPanelProps {
  settings: AppSettings;
  onSettingsUpdate: (settings: Partial<AppSettings>) => void;
  onClose: () => void;
  onClearCache: () => void;
}

export function OptionsPanel({ settings, onSettingsUpdate, onClose, onClearCache }: OptionsPanelProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  const handleSave = () => {
    onSettingsUpdate(localSettings);
    onClose();
  };

  const handleInputChange = (key: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto custom-scrollbar">
          {/* Performance Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Performance</h3>
            
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Rows per page
              </label>
              <select
                value={localSettings.rowsPerPage}
                onChange={(e) => handleInputChange('rowsPerPage', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value={10}>10 rows</option>
                <option value={20}>20 rows</option>
                <option value={30}>30 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Auto-save interval (minutes)
              </label>
              <select
                value={localSettings.autoSaveInterval}
                onChange={(e) => handleInputChange('autoSaveInterval', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value={1}>1 minute</option>
                <option value={3}>3 minutes</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
              </select>
            </div>
          </div>

          {/* Column Locking */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Column Locking</h3>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="columnsLocked"
                checked={localSettings.columnsLocked}
                onChange={(e) => handleInputChange('columnsLocked', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="columnsLocked" className="flex items-center space-x-2 text-sm text-gray-700">
                {localSettings.columnsLocked ? (
                  <Lock className="w-4 h-4 text-gray-500" />
                ) : (
                  <Unlock className="w-4 h-4 text-gray-500" />
                )}
                <span>Enable column locking</span>
              </label>
            </div>

            {localSettings.columnsLocked && (
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Number of locked columns
                </label>
                <select
                  value={localSettings.lockedColumns}
                  onChange={(e) => handleInputChange('lockedColumns', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {Array.from({ length: 11 }, (_, i) => (
                    <option key={i} value={i}>
                      {i} column{i !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Cache Management */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Cache Management</h3>
            
            <button
              onClick={onClearCache}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Cache</span>
            </button>
            
            <p className="text-xs text-gray-500">
              Clearing cache will remove stored column widths and search results,
              which may temporarily affect performance.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
