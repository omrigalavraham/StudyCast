import React from 'react';
import { Lecture } from '../types';

export const LectureItem: React.FC<{
    lecture: Lecture;
    onClick: () => void;
    onEdit: (lecture: Lecture) => void;
    onDelete: (lecture: Lecture) => void;
    onPreview: (lecture: Lecture) => void;
    matchType?: 'TITLE' | 'SUMMARY' | 'INSIGHT' | 'CONCEPT' | null;
}> = ({ lecture, onClick, onEdit, onDelete, onPreview, matchType }) => {
    let statusColor = "bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400";
    let statusText = "ממתין";
    let icon = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    );

    if (lecture.status === 'ANALYZING') {
        statusColor = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse";
        statusText = "מעבד...";
        icon = <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>;
    } else if (lecture.status === 'READY') {
        statusColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
        statusText = "מוכן";
        icon = (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    } else if (lecture.status === 'ERROR') {
        statusColor = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
        statusText = "שגיאה";
    }

    return (
        <div
            onClick={onClick}
            className="relative group overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-4 sm:p-6 hover:bg-white/90 dark:hover:bg-slate-800/90 cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800"
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between relative z-10 gap-3 sm:gap-4">
                {/* Left side - Icon and Title */}
                <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
                    <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ${lecture.status === 'READY' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                        <div className="w-5 h-5 sm:w-6 sm:h-6">{icon}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base sm:text-xl text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{lecture.title}</h4>

                            {/* Match Badges */}
                            {matchType === 'SUMMARY' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 animate-fade-in">
                                    <span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse"></span>
                                    נמצא בסיכום
                                </span>
                            )}
                            {matchType === 'INSIGHT' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-[10px] font-bold border border-pink-200 dark:border-pink-800 animate-fade-in">
                                    <span className="w-1 h-1 rounded-full bg-pink-500 animate-pulse"></span>
                                    נמצא בתובנה
                                </span>
                            )}
                            {matchType === 'CONCEPT' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-[10px] font-bold border border-sky-200 dark:border-sky-800 animate-fade-in">
                                    <span className="w-1 h-1 rounded-full bg-sky-500 animate-pulse"></span>
                                    נמצא במושגים
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            <span>{lecture.date}</span>
                            {lecture.processingMode === 'FULL_LECTURE' && (
                                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 sm:px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800 text-[10px] sm:text-xs font-bold">מקיף</span>
                            )}
                            {lecture.processingMode === 'SUMMARY' && (
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 sm:px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 text-[10px] sm:text-xs font-bold">מהיר</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right side - Badges and Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 mr-12 sm:mr-0">
                    {/* Badges - hidden on very small screens */}
                    <div className="flex items-center gap-3">
                        {lecture.audioBase64 && (
                            <div className="flex flex-col items-center gap-1 group/vinyl" title="פודקאסט מוכן להאזנה">
                                {/* Glass Vinyl Icon */}
                                <div className="relative w-8 h-8 rounded-full bg-slate-900/5 dark:bg-white/10 backdrop-blur-md border border-slate-200/50 dark:border-white/10 flex items-center justify-center overflow-hidden">
                                    {/* The Vinyl Disc */}
                                    <div className="w-full h-full rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] from-slate-800 via-slate-700 to-slate-800 dark:from-slate-950 dark:via-slate-800 dark:to-slate-950 opacity-90 animate-[spin_3s_linear_infinite]">
                                        <div className="absolute inset-[15%] rounded-full border border-white/20 dark:border-white/10 opacity-50"></div>
                                        <div className="absolute inset-[30%] rounded-full border border-white/20 dark:border-white/10 opacity-40"></div>
                                        <div className="absolute inset-[45%] rounded-full border border-white/20 dark:border-white/10 opacity-30"></div>
                                    </div>

                                    {/* Center Label (Hole) */}
                                    <div className="absolute w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] z-10 flex items-center justify-center">
                                        <div className="w-0.5 h-0.5 rounded-full bg-white/80"></div>
                                    </div>

                                    {/* Glass Reflection */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
                                </div>
                                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 drop-shadow-[0_0_5px_rgba(99,102,241,0.6)] animate-pulse whitespace-nowrap">
                                    פודקאסט מוכן
                                </span>
                            </div>
                        )}
                        <span className={`text-[10px] sm:text-xs font-bold px-2 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm ${statusColor}`}>
                            {statusText}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Quick Peek Button - Only if summary exists */}
                        {lecture.summaryData && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onPreview(lecture); }}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center transition-all duration-300 group/preview"
                                title="הצצה לסיכום"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 group-hover/preview:scale-110 transition-transform">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        )}

                        {/* Edit Button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(lecture); }}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center transition-all duration-300"
                            title="ערוך שם הרצאה"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                        </button>
                        {/* Delete Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`האם אתה בטוח שברצונך למחוק את ההרצאה "${lecture.title}"?`)) {
                                    onDelete(lecture);
                                }
                            }}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition-all duration-300"
                            title="מחק הרצאה"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Arrow - positioned absolutely on mobile for better layout */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 sm:relative sm:left-auto sm:top-auto sm:translate-y-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-700/50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all duration-300 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </div>
            </div>
        </div>
    );
};
