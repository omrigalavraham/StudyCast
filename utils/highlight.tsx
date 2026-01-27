import React from 'react';

interface HighlightTextProps {
    text: string;
    term?: string;
    className?: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({ text, term, className = '' }) => {
    if (!term || !term.trim()) {
        return <span className={className}>{text}</span>;
    }

    const parts = text.split(new RegExp(`(${term})`, 'gi'));

    return (
        <span className={className}>
            {parts.map((part, i) =>
                part.toLowerCase() === term.toLowerCase() ? (
                    <span key={i} className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-1 rounded animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.5)] border border-yellow-200 dark:border-yellow-700 font-bold relative z-10 inline-block mx-0.5">
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </span>
    );
};
