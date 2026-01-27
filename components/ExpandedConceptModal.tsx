import React from 'react';

export const ExpandedConceptModal: React.FC<{
    item: { point: string; details: string };
    index: number;
    onClose: () => void;
}> = ({ item, index, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            ></div>

            <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[40px] shadow-2xl border border-white/20 relative overflow-hidden animate-fade-in-up">
                {/* Background Decorations */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                {/* Header */}
                <div className="relative z-10 p-10 pb-6 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-500/30">
                            {index + 1}
                        </div>
                        <div>
                            <span className="text-sm font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">מושג לימודי</span>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mt-1">{item.point}</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="relative z-10 px-10 pb-12">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 text-lg md:text-xl leading-relaxed text-slate-700 dark:text-slate-300">
                        {item.details}
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-sm font-medium">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                        כרטיס זה מסונכרן עם הפודקאסט
                    </div>
                </div>
            </div>
        </div>
    );
};
