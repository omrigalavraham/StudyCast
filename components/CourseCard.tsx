import React from 'react';
import { Course } from '../types';

export const CourseCard: React.FC<{ course: Course; onClick: () => void; onEdit: (course: Course) => void; onDelete: (course: Course) => void }> = ({ course, onClick, onEdit, onDelete }) => (
    <div
        onClick={onClick}
        className="group relative cursor-pointer"
    >
        {/* Glow Effect */}
        <div className={`absolute -inset-0.5 rounded-[32px] opacity-0 group-hover:opacity-75 transition duration-500 blur-xl ${course.color.replace('bg-', 'bg-opacity-50 bg-')}`}></div>

        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[30px] p-8 h-72 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2">
            {/* Decorative Gradient Background */}
            <div className={`absolute top-0 right-0 w-48 h-48 ${course.color} opacity-10 rounded-full blur-[60px] -mr-16 -mt-16 transition-opacity group-hover:opacity-20`}></div>

            <div>
                <div className="flex justify-between items-start mb-6">
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/20 dark:border-white/10 text-slate-600 dark:text-slate-300 tracking-widest uppercase shadow-sm">
                        {course.code}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(course); }}
                            className="w-10 h-10 rounded-full bg-white/30 dark:bg-slate-800/30 hover:bg-white/60 dark:hover:bg-slate-700 backdrop-blur-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all z-20 border border-white/20"
                            title="ערוך שם קורס"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`האם אתה בטוח שברצונך למחוק את הקורס "${course.name}"?`)) {
                                    onDelete(course);
                                }
                            }}
                            className="w-10 h-10 rounded-full bg-white/30 dark:bg-slate-800/30 hover:bg-white/60 dark:hover:bg-slate-700 backdrop-blur-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all z-20 border border-white/20"
                            title="מחק קורס"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                        </button>
                        <div className="w-12 h-12 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-white transition-all duration-300 border border-white/20 dark:border-white/10 shadow-sm group-hover:shadow-md group-hover:scale-110">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </div>
                    </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white line-clamp-3 leading-tight tracking-tight">{course.name}</h3>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                    {[...Array(Math.min(3, course.lectures.length))].map((_, i) => (
                        <div key={i} className="w-10 h-10 rounded-full border-[3px] border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A9.948 9.948 0 0110 15a9.948 9.948 0 014.793-1.61A5.99 5.99 0 0010 12z" clipRule="evenodd" />
                            </svg>
                        </div>
                    ))}
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 px-2 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg py-1">
                    {course.lectures.length === 0 ? 'אין הרצאות' : `${course.lectures.length} הרצאות`}
                </span>
            </div>
        </div>
    </div>
);
