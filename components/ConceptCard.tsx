import React, { useRef, useEffect } from 'react';
import { HighlightText } from '../utils/highlight';

export const ConceptCard: React.FC<{
    item: { point: string; details: string };
    index: number;
    isActive: boolean;
    onExpand: () => void;
    highlightTerm?: string;
}> = ({ item, index, isActive, onExpand, highlightTerm }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isActive && cardRef.current) {
            cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isActive]);

    return (
        <div
            ref={cardRef}
            onClick={onExpand}
            className={`group relative rounded-3xl p-[1px] transition-all duration-500 cursor-pointer h-full
        ${isActive
                    ? 'scale-[1.02] z-10 shadow-2xl shadow-indigo-500/20'
                    : 'hover:scale-[1.02] hover:z-10 hover:shadow-xl'
                }
      `}
        >
            {/* Animated Gradient Border Layer */}
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r transition-all duration-500
         ${isActive
                    ? 'from-indigo-500 via-purple-500 to-pink-500 opacity-100 blur-[1px]'
                    : 'from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 opacity-100 group-hover:from-indigo-400 group-hover:via-purple-400 group-hover:to-pink-400'
                }
      `}></div>

            {/* Main Content Container */}
            <div className={`relative h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[23px] p-6 transition-all duration-300 flex flex-col overflow-hidden
          ${isActive ? 'bg-white/100 dark:bg-slate-900/100' : 'group-hover:bg-white/100 dark:group-hover:bg-slate-900/100'}
      `}>

                {/* Decorative background sheen */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50"></div>

                {/* Header Section */}
                <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
                    <div className="flex items-start gap-4">
                        {/* Number Badge */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-500 border
                 ${isActive
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/40 scale-110'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 group-hover:border-indigo-200 dark:group-hover:border-indigo-800 group-hover:text-indigo-600'}
              `}>
                            {index + 1}
                        </div>

                        <h4 className={`text-lg font-bold leading-tight transition-colors duration-300 mt-1
                 ${isActive
                                ? 'text-indigo-600 dark:text-indigo-300'
                                : 'text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}
              `}>
                            <HighlightText text={item.point} term={highlightTerm} />
                        </h4>
                    </div>

                    {/* Expand Icon / Active Indicator */}
                    {isActive ? (
                        <div className="relative flex h-3 w-3 mt-2 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                        </div>
                    ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100
                    bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-500
                `}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Details Preview */}
                <div className={`relative rounded-xl p-4 text-sm leading-relaxed transition-all duration-300 flex-1 border
            ${isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-slate-700 dark:text-slate-300 border-indigo-100 dark:border-indigo-800/50'
                        : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800 group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:border-slate-200 dark:group-hover:border-slate-700'}
        `}>
                    <p className="line-clamp-3">{item.details}</p>
                </div>

            </div>
        </div>
    );
};
