import React, { useRef, useState } from 'react';
import { FileData } from '../types';
import { fileToBase64 } from '../utils/audioUtils';

interface FileUploadProps {
  onFileSelect: (fileData: FileData) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await processFile(file);
  };

  const processFile = async (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert("אנא העלה קובץ PDF או תמונה (JPEG, PNG, WEBP)");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      onFileSelect({
        base64,
        mimeType: file.type,
        name: file.name
      });
    } catch (error) {
      console.error("Error processing file", error);
      alert("שגיאה בעיבוד הקובץ");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  return (
    <div 
      className={`relative group rounded-3xl p-[2px] transition-all duration-300
        ${isDragging ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.5)]' : 'bg-gradient-to-b from-white/20 to-white/5 dark:from-white/10 dark:to-transparent hover:from-indigo-400/50 hover:to-cyan-400/50'}
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
      `}
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="bg-white/60 dark:bg-slate-900/80 backdrop-blur-xl rounded-[22px] p-12 text-center h-full flex flex-col items-center justify-center border border-white/20 dark:border-white/10 transition-all group-hover:bg-white/80 dark:group-hover:bg-slate-900/90">
        <input 
          type="file" 
          ref={inputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".pdf,image/*"
        />
        
        <div className="relative mb-6">
            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-700 p-6 rounded-2xl shadow-xl border border-white/50 dark:border-white/10 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-indigo-600 dark:text-indigo-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
            </div>
        </div>

        <div>
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 mb-2">
            העלאת חומר לימוד
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
             גרור לכאן מצגת או לחץ לבחירה
            <br />
            <span className="text-xs opacity-70">PDF, JPG, PNG</span>
          </p>
        </div>
      </div>
    </div>
  );
};