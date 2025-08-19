import { useState } from 'react';
import { Download, Mail, Printer, X, FileSpreadsheet } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (type: 'save' | 'pdf' | 'email' | 'print') => void;
  filename: string;
}

export function ExportModal({ isOpen, onClose, onExport, filename }: ExportModalProps) {
  const [customFilename, setCustomFilename] = useState(filename);

  if (!isOpen) return null;

  const handleExport = (type: 'save' | 'pdf' | 'email' | 'print') => {
    onExport(type);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Export Options</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filename
            </label>
            <input
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleExport('save')}
              className="w-full flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium text-blue-900">Save as Excel</div>
                <div className="text-sm text-blue-700">Download as .xlsx file</div>
              </div>
            </button>

            <button
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center space-x-3 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5 text-red-600" />
              <div className="text-left">
                <div className="font-medium text-red-900">Export as PDF</div>
                <div className="text-sm text-red-700">Print-ready document</div>
              </div>
            </button>

            <button
              onClick={() => handleExport('email')}
              className="w-full flex items-center space-x-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <Mail className="w-5 h-5 text-purple-600" />
              <div className="text-left">
                <div className="font-medium text-purple-900">Send by Email</div>
                <div className="text-sm text-purple-700">Share via email client</div>
              </div>
            </button>

            <button
              onClick={() => handleExport('print')}
              className="w-full flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Printer className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Print</div>
                <div className="text-sm text-gray-700">Print current view</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
