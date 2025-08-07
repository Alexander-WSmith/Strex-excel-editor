import { useState, useEffect } from 'react';
import { Clock, FileX, X } from 'lucide-react';

interface RecentFile {
  name: string;
  path: string;
  lastOpened: Date;
  size?: number;
}

interface RecentFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: RecentFile) => void;
}

export function RecentFilesModal({ isOpen, onClose, onSelectFile }: RecentFilesModalProps) {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('recentFiles');
      if (stored) {
        const files = JSON.parse(stored).map((file: any) => ({
          ...file,
          lastOpened: new Date(file.lastOpened)
        }));
        setRecentFiles(files.sort((a: RecentFile, b: RecentFile) => 
          b.lastOpened.getTime() - a.lastOpened.getTime()
        ));
      }
    }
  }, [isOpen]);

  const removeRecentFile = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentFiles.filter(file => file.path !== path);
    setRecentFiles(updated);
    localStorage.setItem('recentFiles', JSON.stringify(updated));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Files</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {recentFiles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent files found</p>
              <p className="text-sm">Files you open will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentFiles.map((file) => (
                <div
                  key={file.path}
                  onClick={() => onSelectFile(file)}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {file.name}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {file.path}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(file.lastOpened)}
                      {file.size && ` • ${formatFileSize(file.size)}`}
                    </div>
                  </div>
                  <button
                    onClick={(e) => removeRecentFile(file.path, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <FileX className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Tip: Recent files are stored locally and persist between sessions
          </p>
        </div>
      </div>
    </div>
  );
}

// Utility function to add file to recent files
export const addToRecentFiles = (filename: string, path: string, size?: number) => {
  const recentFile: RecentFile = {
    name: filename,
    path: path,
    lastOpened: new Date(),
    size
  };

  const stored = localStorage.getItem('recentFiles');
  let recentFiles: RecentFile[] = stored ? JSON.parse(stored) : [];
  
  // Remove if already exists
  recentFiles = recentFiles.filter(file => file.path !== path);
  
  // Add to beginning
  recentFiles.unshift(recentFile);
  
  // Keep only last 10 files
  recentFiles = recentFiles.slice(0, 10);
  
  localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
};
