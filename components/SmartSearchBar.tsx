import React, { useState, useEffect, useRef } from 'react';

interface SmartSearchBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    resultCount: number;
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({ searchQuery, setSearchQuery, resultCount }) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus shortcut (Ctrl/Cmd + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="relative w-full max-w-2xl mx-auto mb-8 z-30 group">
            {/* Glow Effect */}
            <div
                className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 ${isFocused ? 'opacity-75 blur-md' : ''}`}
            ></div>

            <div className={`relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg transition-all duration-300 ${isFocused ? 'shadow-indigo-500/20 scale-[1.02]' : ''}`}>

                {/* Search Icon */}
                <div className="pl-6 pr-3 text-slate-400 dark:text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 transition-colors duration-300 ${isFocused ? 'text-indigo-500 dark:text-indigo-400' : ''}`}>
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="חפש בתובנות, סיכומים והרצאות..."
                    className="w-full bg-transparent border-none focus:ring-0 text-lg py-4 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 font-medium outline-none"
                    style={{ outline: 'none', boxShadow: 'none' }} // Ensure no browser default outline
                />

                {/* Right Actions */}
                <div className="pr-6 pl-2 flex items-center gap-3">
                    {/* Quick Clear Button */}
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="p-1 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    )}

                    {/* Results Counter - Shortcut Removed */}
                    <div className="hidden sm:flex items-center">
                        {searchQuery && (
                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
                                {resultCount} תוצאות
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
