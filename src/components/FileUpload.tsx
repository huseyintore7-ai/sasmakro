import React, { useCallback, useRef } from 'react';
import { Upload, File as FileIcon, X } from 'lucide-react';

interface FileUploadProps {
  label: string;
  description?: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
}

export function FileUpload({ label, description, file, onFileSelect }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {description && <p className="text-xs text-slate-500">{description}</p>}
      
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          file 
            ? 'border-emerald-500 bg-emerald-50/50' 
            : 'border-slate-300 hover:border-slate-400 bg-white'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".txt,.sas,.csv,.json"
        />
        
        {file ? (
          <div className="flex items-center gap-3 w-full">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <FileIcon size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-slate-100 text-slate-500 rounded-full mb-3">
              <Upload size={24} />
            </div>
            <p className="text-sm font-medium text-slate-700">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-slate-500 mt-1">
              TXT, SAS files up to 10MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
