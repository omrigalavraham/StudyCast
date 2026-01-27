
import React, { useState, useEffect } from 'react';

interface SupabaseAuthScreenProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, name: string) => Promise<void>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const SupabaseAuthScreen: React.FC<SupabaseAuthScreenProps> = ({
  onSignIn,
  onSignUp,
  isDarkMode,
  toggleDarkMode
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [animateCard, setAnimateCard] = useState(false);

  useEffect(() => {
    setAnimateCard(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setError('נא למלא את כל השדות');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('נא להזין שם');
      return;
    }

    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        await onSignIn(email, password);
      } else {
        await onSignUp(email, password, name);
        setSuccessMessage('נשלח אליך אימייל לאימות. אנא בדוק את תיבת הדואר שלך.');
        setMode('signin');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setError('אימייל או סיסמה שגויים');
      } else if (err.message?.includes('User already registered')) {
        setError('משתמש עם אימייל זה כבר קיים');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('אנא אמת את האימייל שלך לפני ההתחברות');
      } else {
        setError(err.message || 'שגיאה בהתחברות');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden font-rubik transition-colors duration-500 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'} bg-[url('https://grainy-gradients.vercel.app/noise.svg')]`}>

      {/* Theme Toggle */}
      <div className="absolute top-6 left-6 z-50 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        <button
          onClick={toggleDarkMode}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-lg border border-white/20 dark:border-slate-700 transition-all hover:scale-105 hover:bg-white/80 dark:hover:bg-slate-800/80"
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
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/20 dark:bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/20 dark:bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[60%] w-[40%] h-[40%] bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className={`relative z-10 w-full max-w-md px-6 transition-all duration-700 transform ${animateCard ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-white/10 p-8 sm:p-10 rounded-[40px] shadow-2xl shadow-indigo-500/10 dark:shadow-black/50 overflow-hidden relative">



          {/* Header */}
          <div className="text-center mb-8 relative">
            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30 rotate-3 hover:rotate-6 transition-all duration-500 group cursor-pointer hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-white transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.24 50.552 50.552 0 00-2.658.813m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
            </div>
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 mb-2 tracking-tight">StudyCast AI</h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
              {mode === 'signin' ? 'ברוכים השבים!' : 'הצטרפו למהפכת הלמידה'}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl p-1.5 mb-8 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); }}
              className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 ${mode === 'signin'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-[1.02]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              התחברות
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 ${mode === 'signup'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-[1.02]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              הרשמה
            </button>
          </div>

          {/* Messages */}
          <div className={`transition-all duration-300 ${successMessage || error ? 'mb-6 opacity-100 max-h-24' : 'mb-0 opacity-0 max-h-0 overflow-hidden'}`}>
            {successMessage && (
              <div className="p-4 bg-emerald-50/80 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm text-center font-medium backdrop-blur-sm shadow-sm ring-1 ring-emerald-500/20">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-50/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm text-center font-medium backdrop-blur-sm shadow-sm ring-1 ring-red-500/20">
                {error}
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className={`space-y-5 transition-all duration-300 ${mode === 'signup' ? 'opacity-100 translate-x-0' : 'opacity-100 translate-x-0'}`}>

              {/* Name Input (Signup only) */}
              <div className={`space-y-2 transition-all duration-300 overflow-hidden ${mode === 'signup' ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">שם מלא</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg backdrop-blur-sm group-hover:bg-white dark:group-hover:bg-slate-800"
                    placeholder="השם שלך"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">אימייל</label>
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg backdrop-blur-sm group-hover:bg-white dark:group-hover:bg-slate-800"
                    placeholder="your@email.com"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">סיסמה</label>
                <div className="relative group">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg backdrop-blur-sm group-hover:bg-white dark:group-hover:bg-slate-800"
                    placeholder="לפחות 6 תווים"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                </div>
                {mode === 'signin' && (
                  <div className="text-left">
                    <button type="button" className="text-xs text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold hover:underline transition-all">
                      שכחת סיסמה?
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white font-bold text-lg shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-6 group"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === 'signin' ? 'מתחבר ללמידה...' : 'יוצר חשבון...'}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {mode === 'signin' ? 'התחבר עכשיו' : 'הירשם ל-StudyCast'}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-[-4px] transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {mode === 'signin' ? (
              <p>חדש כאן? <button type="button" onClick={() => setMode('signup')} className="text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline font-bold transition-all">צור חשבון בחינם</button></p>
            ) : (
              <p>כבר יש לך חשבון? <button type="button" onClick={() => setMode('signin')} className="text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline font-bold transition-all">התחבר כאן</button></p>
            )}
          </div>
        </div>

        {/* Footer Credit */}
        <div className="text-center mt-8 opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-xs text-slate-500 dark:text-slate-400">© 2026 StudyCast AI. למידה חכמה מתחילה כאן.</p>
        </div>
      </div>
    </div>
  );
};
