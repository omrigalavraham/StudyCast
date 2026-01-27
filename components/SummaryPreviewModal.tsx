
import React from 'react';
import { Lecture } from '../types';

interface SummaryPreviewModalProps {
    lecture: Lecture;
    onClose: () => void;
}

export const SummaryPreviewModal: React.FC<SummaryPreviewModalProps> = ({ lecture, onClose }) => {
    if (!lecture.summaryData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="
                relative w-full max-w-2xl max-h-[85vh] 
                bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl 
                border border-white/40 dark:border-white/10 
                rounded-[32px] shadow-2xl 
                flex flex-col overflow-hidden 
                animate-scale-up-fade
            ">
                {/* Header */}
                <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shrink-0 z-10">
                    <div>
                        <div className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 rounded-full text-[10px] font-bold text-indigo-600 dark:text-indigo-300 mb-2 uppercase tracking-wide">
                            תקציר מנהלים
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight line-clamp-2">
                            {lecture.title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors flex items-center justify-center shrink-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <p className="text-base sm:text-lg leading-relaxed text-slate-700 dark:text-slate-300 font-light whitespace-pre-line">
                            {lecture.summaryData.summary}
                        </p>
                    </div>

                    {/* Quick Stats or Tags could go here if available */}
                    {lecture.summaryData.summaryPoints.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-dashed border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">נושאים מרכזיים</h4>
                            <div className="flex flex-wrap gap-2">
                                {lecture.summaryData.summaryPoints.slice(0, 5).map((point, idx) => (
                                    <span key={idx} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                        {point.point}
                                    </span>
                                ))}
                                {lecture.summaryData.summaryPoints.length > 5 && (
                                    <span className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs sm:text-sm font-medium text-slate-400 border border-slate-100 dark:border-slate-800/50">
                                        +{lecture.summaryData.summaryPoints.length - 5} נוספים
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shrink-0 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform text-sm sm:text-base"
                    >
                        סגור
                    </button>
                </div>
            </div>
        </div>
    );
};
