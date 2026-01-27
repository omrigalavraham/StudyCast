import React from 'react';
import { Insight } from '../types';
import { HighlightText } from '../utils/highlight';

interface InsightsPanelProps {
    insights: Insight[];
    onDeleteInsight: (id: string) => void;
    highlightTerm?: string;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, onDeleteInsight, highlightTerm }) => {
    return (
        <div className="p-8 h-full overflow-y-auto custom-scrollbar pb-24">
            {insights.length === 0 ? (
                <div className="text-center text-slate-400 mt-20">
                    <div className="text-6xl mb-4">💡</div>
                    <p className="font-bold">אין עדיין תובנות</p>
                    <p className="text-sm mt-2">תוכל לשמור הסברים מעניינים מהצ'אט לכאן.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {insights.map(insight => (
                        <div key={insight.id} className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 p-6 rounded-2xl relative group">
                            <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onDeleteInsight(insight.id)}
                                    className="text-amber-400 hover:text-red-500 p-1 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                                    title="מחק תובנה"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-1.5 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </span>
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider">{insight.date}</span>
                            </div>
                            <div className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                                <HighlightText text={insight.content} term={highlightTerm} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
