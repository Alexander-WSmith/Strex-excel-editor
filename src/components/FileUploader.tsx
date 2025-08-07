import { useCallback } from 'react';
// @ts-ignore - react-dropzone types issue
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onFileLoad: (file: File) => void;
  loading?: boolean;
  error?: string | null;
}

export function FileUploader({ onFileLoad, loading = false, error = null }: FileUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileLoad(acceptedFiles[0]);
    }
  }, [onFileLoad]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
    disabled: loading,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          drop-zone p-12 text-center cursor-pointer transition-all duration-200 
          border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg 
          bg-gray-50 dark:bg-gray-800
          ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''}
          ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-400 hover:bg-blue-50 dark:hover:bg-gray-700'}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {loading ? (
            <div className="w-16 h-16 spinner mx-auto"></div>
          ) : (
            <>
              <FileSpreadsheet className="w-16 h-16 text-primary-500" />
              <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </>
          )}
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {loading ? 'Loading Excel File...' : 'Upload Excel File'}
            </h3>
            
            {!loading && (
              <>
                <p className="text-gray-600 dark:text-gray-300">
                  {isDragActive
                    ? 'Drop your Excel file here'
                    : 'Drag and drop your Excel file here, or click to browse'
                  }
                </p>
                
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supports .xlsx and .xls files
                </p>
              </>
            )}
          </div>
          
          {!loading && (
            <button
              type="button"
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Choose File
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-center">
        <h4 className="text-lg font-medium text-gray-900 mb-2">Features</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Auto-save every 5 minutes</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>Advanced search & filtering</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span>Column locking support</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <span>Performance optimized</span>
          </div>
        </div>
      </div>
    </div>
  );
}
