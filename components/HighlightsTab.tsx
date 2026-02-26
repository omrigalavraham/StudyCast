import React from 'react';
import { Highlight } from '../types';

interface HighlightsTabProps {
    highlights: Highlight[];
    onDelete: (highlightId: string) => void;
    onGoToSummary: () => void;
}

export const HighlightsTab: React.FC<HighlightsTabProps> = ({
    highlights,
    onDelete,
    onGoToSummary
}) => {
    // פורמט תאריך בעברית
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('he-IL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    if (highlights.length === 0) {
        return (
            <div className="p-4 sm:p-8 md:p-10 overflow-y-auto custom-scrollbar h-full pb-20">
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-amber-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                        אין סימונים עדיין
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                        עבור לטאב "סיכום" וסמן קטעי טקסט חשובים להכנה למבחן
                    </p>
                    <button
                        onClick={onGoToSummary}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                        עבור לסיכום
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 md:p-10 overflow-y-auto custom-scrollbar h-full pb-20">
            {/* כותרת */}
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 bg-gradient-to-r from-amber-50 to-white dark:from-slate-800 dark:to-slate-800/50">
                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-3 text-xl">
                        <span className="bg-amber-100 dark:bg-amber-900/50 p-2.5 rounded-xl text-amber-600 dark:text-amber-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                        </span>
                        קטעים חשובים למבחן
                        <span className="text-sm font-normal bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-lg">
                            {highlights.length} סימונים
                        </span>
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mr-12">
                        חזור על הקטעים האלה לפני המבחן
                    </p>
                </div>

                {/* רשימת סימונים */}
                <div className="p-4 sm:p-6 space-y-4">
                    {highlights.map((highlight, index) => (
                        <div
                            key={highlight.id}
                            className="group bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl p-5 border border-amber-200/50 dark:border-amber-800/50 hover:shadow-md transition-all"
                        >
                            <div className="flex items-start gap-4">
                                {/* מספור */}
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center text-sm font-bold">
                                    {index + 1}
                                </span>

                                {/* תוכן */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-[15px] whitespace-pre-wrap">
                                        "{highlight.text}"
                                    </p>

                                    {/* מטא-דאטה */}
                                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                            </svg>
                                            נוסף: {formatDate(highlight.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* כפתורי פעולה */}
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onDelete(highlight.id)}
                                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        title="מחק סימון"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={onGoToSummary}
                                        className="p-2 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                        title="עבור לסיכום"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
