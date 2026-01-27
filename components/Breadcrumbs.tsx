import React from 'react';
import { ViewState, Course, Lecture } from '../types';

interface BreadcrumbsProps {
    viewState: ViewState;
    setViewState: (view: ViewState) => void;
    activeCourse: Course | null;
    activeLecture: Lecture | null;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
    viewState,
    setViewState,
    activeCourse,
    activeLecture
}) => (
    <div className="flex items-center gap-2 text-sm backdrop-blur-md bg-white/40 dark:bg-slate-900/40 px-5 py-2 rounded-full border border-white/30 dark:border-white/10 shadow-sm transition-all hover:bg-white/60 dark:hover:bg-slate-900/60">
        <button
            onClick={() => setViewState({ type: 'DASHBOARD' })}
            className={`flex items-center gap-1.5 font-bold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${viewState.type === 'DASHBOARD' ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
            </svg>
            ראשי
        </button>

        {activeCourse && (
            <>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <button
                    onClick={() => setViewState({ type: 'COURSE', courseId: activeCourse.id })}
                    className={`font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors max-w-[150px] truncate ${viewState.type === 'COURSE' ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    {activeCourse.name}
                </button>
            </>
        )}

        {activeLecture && (
            <>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="font-medium text-slate-800 dark:text-white max-w-[150px] truncate">
                    {activeLecture.title}
                </span>
            </>
        )}
    </div>
);
