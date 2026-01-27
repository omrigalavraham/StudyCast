import React from 'react';

export const ThinkingIndicator: React.FC = () => {
    return (
        <div className="flex justify-start animate-fade-in">
            <div className="relative max-w-[85%] bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl rounded-br-none p-4 border border-white/20 dark:border-slate-700 shadow-sm overflow-hidden">

                {/* Content Container */}
                <div className="flex items-center gap-3 relative z-10">
                    {/* Pulsing Dot */}
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                    </div>

                    {/* Text */}
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 tracking-wide">
                        מעבד נתונים
                    </span>
                </div>

                {/* Ambient Glow */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>

                {/* Bottom Active Line (Neural Pulse) */}
                <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-gradient-x opacity-60"></div>
            </div>
        </div>
    );
};
