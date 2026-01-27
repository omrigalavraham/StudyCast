import React, { useState } from 'react';

interface AuthScreenProps {
    onLogin: (apiKey: string, name: string) => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, isDarkMode, toggleDarkMode }) => {
    const [apiKey, setApiKey] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKey.trim() || !name.trim()) return;
        setIsLoading(true);
        // Simulate a small delay for effect
        setTimeout(() => {
            onLogin(apiKey, name);
            setIsLoading(false);
        }, 800);
    };

    return (
        <div className={`min-h-screen flex items-center justify-center relative overflow-hidden font-rubik transition-colors duration-500 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>

            {/* Theme Toggle (Absolute Top Left) */}
            <div className="absolute top-6 left-6 z-50">
                <button
                    onClick={toggleDarkMode}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-lg border border-white/20 dark:border-slate-700 transition-all hover:scale-105"
                >
                    {isDarkMode ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Animated Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-purple-500/10 dark:bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
                {/* Noise Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md px-6">
                <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-white/10 p-10 rounded-[40px] shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-900/20 transform transition-all duration-500">

                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30 rotate-12 group hover:rotate-0 transition-transform duration-500">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-white transform -rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.24 50.552 50.552 0 00-2.658.813m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">StudyCast AI</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">העתיד של הלמידה שלך מתחיל כאן</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mr-1 block">איך לקרוא לך?</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-lg"
                                    placeholder="השם שלך"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mr-1 block flex justify-between">
                                <span>Gemini API Key</span>
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs font-normal underline">
                                    קבל מפתח בחינם
                                </a>
                            </label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-lg font-mono tracking-wider"
                                    placeholder="AIzaSy..."
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !name || !apiKey}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    מתחבר...
                                </span>
                            ) : "התחל ללמוד"}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
                        המפתח נשמר מקומית בדפדפן שלך בלבד.
                    </div>
                </div>
            </div>
        </div>
    );
};
