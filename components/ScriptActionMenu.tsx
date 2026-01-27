import React, { useState } from 'react';

interface ScriptActionMenuProps {
    onExplain: () => void;
    isOmri: boolean;
}

export const ScriptActionMenu: React.FC<ScriptActionMenuProps> = ({ onExplain, isOmri }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={`absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center transition-all duration-300
                ${isOmri ? 'left-2' : 'right-2'}
                opacity-0 group-hover:opacity-100
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`
                 flex items-center gap-2
                 ${isHovered ? 'scale-100' : 'scale-90'}
                 transition-all duration-300
            `}>
                {/* Explain Action - Premium Design (Gold Edition) */}
                <button
                    onClick={(e) => { e.stopPropagation(); onExplain(); }}
                    className="relative group/btn w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                    title="הסבר לי את זה"
                >
                    {/* Glowing Backlight - Gold */}
                    <div className="absolute inset-0 rounded-full bg-amber-500 blur-md opacity-30 group-hover/btn:opacity-80 transition-opacity duration-300"></div>

                    {/* Gradient Border Container - Gold/Luxury */}
                    <div className="absolute inset-0 rounded-full p-[1px] bg-gradient-to-br from-amber-200 via-yellow-400 to-orange-300 opacity-80 group-hover/btn:opacity-100 shadow-lg shadow-amber-500/20">
                        {/* Dark/Glass Inner */}
                        <div className="w-full h-full rounded-full bg-slate-900/90 backdrop-blur-md flex items-center justify-center relative overflow-hidden">

                            {/* Shimmer Effect */}
                            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-40 group-hover/btn:animate-shine" />

                            {/* Icon - Gold tint */}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-amber-200 group-hover/btn:text-white transition-colors z-10">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                            </svg>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
};

