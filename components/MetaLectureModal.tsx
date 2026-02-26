import React from 'react';
import { Lecture } from '../types';

interface MetaLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableLectures: Lecture[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  metaTitle: string;
  onTitleChange: (title: string) => void;
  onCreate: () => void;
  isCreating: boolean;
}

export const MetaLectureModal: React.FC<MetaLectureModalProps> = ({
  isOpen,
  onClose,
  availableLectures,
  selectedIds,
  onToggleSelect,
  metaTitle,
  onTitleChange,
  onCreate,
  isCreating
}) => {
  if (!isOpen) return null;

  // רק הרצאות READY עם summaryData ולא מטה-הרצאות
  const readyLectures = availableLectures.filter(
    l => l.status === 'READY' && l.summaryData && l.lectureType !== 'META'
  );

  const canCreate = selectedIds.length >= 2 &&
                    selectedIds.length <= 10 &&
                    metaTitle.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/20">

        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                🎓 יצירת מטה-הרצאה
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                בחר 2-10 הרצאות לסינתזה חכמה
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">

          {/* Title Input */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              שם המטה-הרצאה
            </label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="לדוגמה: סיכום יחידה 1-3"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-colors text-slate-800 dark:text-white"
            />
          </div>

          {/* Selection Counter */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              בחר הרצאות ({selectedIds.length}/10)
            </span>
            {selectedIds.length > 0 && (
              <button
                onClick={() => selectedIds.forEach(id => onToggleSelect(id))}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                נקה הכל
              </button>
            )}
          </div>

          {/* Lecture List */}
          {readyLectures.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>אין הרצאות מוכנות בקורס זה</p>
            </div>
          ) : (
            <div className="space-y-2">
              {readyLectures.map(lecture => {
                const isSelected = selectedIds.includes(lecture.id);
                const conceptCount = lecture.summaryData?.summaryPoints.length || 0;

                return (
                  <button
                    key={lecture.id}
                    onClick={() => onToggleSelect(lecture.id)}
                    disabled={!isSelected && selectedIds.length >= 10}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-right ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:border-indigo-300'
                    } ${!isSelected && selectedIds.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-indigo-500 border-indigo-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>

                      {/* Lecture Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-white truncate">
                          {lecture.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>{lecture.date}</span>
                          <span>•</span>
                          <span>{conceptCount} מושגים</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={onCreate}
              disabled={!canCreate || isCreating}
              className={`flex-1 px-6 py-3 rounded-2xl font-bold transition-all ${
                canCreate && !isCreating
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isCreating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>מסנתז...</span>
                </div>
              ) : (
                'צור מטה-הרצאה'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
