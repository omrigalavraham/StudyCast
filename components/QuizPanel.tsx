import React, { useState } from 'react';
import { QuizSession, QuizQuestion, QuizDifficulty, Lecture } from '../types';

interface QuizPanelProps {
    quizState: QuizSession;
    lecture: Lecture;
    onStartQuiz: (settings: { difficulty: QuizDifficulty, questionCount: number }) => void;
    onAnswer: (questionId: string, answerIdx: number) => void;
    onReset: () => void;
    onNewQuiz: () => void;
}

export const QuizPanel: React.FC<QuizPanelProps> = ({ quizState, lecture, onStartQuiz, onAnswer, onReset, onNewQuiz }) => {
    // All hooks must be called at the top level BEFORE any early returns (React Rules of Hooks)
    const [difficulty, setDifficulty] = useState<QuizDifficulty>('MEDIUM');
    // Default to more questions for meta-lectures
    const isMetaLecture = lecture.lectureType === 'META';
    const defaultCount = isMetaLecture ? 10 : 5;
    const [count, setCount] = useState(defaultCount);
    const [viewingResult, setViewingResult] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Get current question for hooks that need it (safe to access even if undefined)
    const question = quizState.status === 'ACTIVE' ? quizState.questions[currentQuestionIndex] : null;
    const userAnswer = question ? quizState.userAnswers[question.id] : undefined;
    const isAnswered = userAnswer !== undefined;

    // Reset state when quiz status changes
    React.useEffect(() => {
        if (quizState.status === 'SETUP') {
            setViewingResult(false);
            setCurrentQuestionIndex(0);
            // Reset count to default for lecture type when returning to SETUP
            setCount(isMetaLecture ? 10 : 5);
            setDifficulty('MEDIUM');
        } else if (quizState.status === 'ACTIVE') {
            // When quiz becomes active (new quiz started), reset navigation state
            setViewingResult(false);
            setCurrentQuestionIndex(0);
        }
    }, [quizState.status, isMetaLecture]);

    // Sync viewing state when user answer changes (for page reload scenarios)
    React.useEffect(() => {
        if (quizState.status === 'ACTIVE' && question) {
            const hasAnswered = quizState.userAnswers[question.id] !== undefined;
            setViewingResult(hasAnswered);
        }
    }, [quizState.status, question, quizState.userAnswers]);

    // --- Render: SETUP ---
    if (quizState.status === 'SETUP') {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full animate-fadeIn">
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20">
                    <span className="text-4xl">🎓</span>
                </div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-300 dark:to-orange-400 mb-2">
                    בוחן ידע
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs leading-relaxed">
                    בחן את עצמך על החומר שנלמד. המערכת תייצר שאלות מותאמות אישית לרמה שלך.
                </p>

                <div className="w-full max-w-sm space-y-6">
                    {/* Difficulty */}
                    <div className="bg-white/50 dark:bg-slate-800/50 p-1 rounded-xl flex shadow-sm border border-slate-200 dark:border-slate-700">
                        {(['EASY', 'MEDIUM', 'HARD'] as QuizDifficulty[]).map((level) => (
                            <button
                                key={level}
                                onClick={() => setDifficulty(level)}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${difficulty === level
                                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-black/5'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                    }`}
                            >
                                {level === 'EASY' ? 'בסיסי' : level === 'MEDIUM' ? 'הבנה' : 'יישום'}
                            </button>
                        ))}
                    </div>

                    {/* Count - More options for meta-lectures */}
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-sm font-bold text-slate-500">מספר שאלות:</span>
                        <div className="flex gap-2 flex-wrap justify-center">
                            {(lecture.lectureType === 'META' ? [5, 10, 20, 30] : [3, 5, 10]).map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCount(c)}
                                    className={`w-10 h-10 rounded-full font-bold text-sm transition-all border ${count === c
                                        ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30 scale-110'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-amber-300'
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                        {lecture.lectureType === 'META' && (
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                מטה-הרצאה מכילה יותר חומר - מומלץ יותר שאלות
                            </p>
                        )}
                    </div>

                    <button
                        onClick={() => onStartQuiz({ difficulty, questionCount: count })}
                        className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-bold shadow-xl shadow-orange-500/20 hover:scale-105 transition-transform flex items-center justify-center gap-2"
                    >
                        <span>התחל בוחן</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    // --- Render: LOADING ---
    if (quizState.status === 'LOADING') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-pulse">
                <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-white">מכין את השאלות...</h3>
                <p className="text-slate-500 text-sm mt-2">ה-AI מנתח את הסיכום ובונה שאלות מותאמות אישית</p>
            </div>
        );
    }

    // --- Render: COMPLETED ---
    if (quizState.status === 'COMPLETED') {
        const isPass = quizState.score >= 60;
        return (
            <div className="flex flex-col h-full overflow-hidden p-6 animate-fadeIn">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">{isPass ? '🏆' : '📚'}</div>
                    <h2 className="text-3xl font-black mb-2 text-slate-800 dark:text-white">
                        {quizState.score}%
                    </h2>
                    <p className={`font-bold ${isPass ? 'text-emerald-500' : 'text-orange-500'}`}>
                        {isPass ? 'כל הכבוד! שולט בחומר.' : 'כדאי לחזור על החומר.'}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-6 pr-2">
                    {quizState.questions.map((q, idx) => {
                        const userAns = quizState.userAnswers[q.id];
                        const isCorrect = userAns === q.correctOptionIndex;
                        return (
                            <div key={q.id} className={`p-4 rounded-xl border-l-4 ${isCorrect ? 'bg-emerald-50/50 border-emerald-400 dark:bg-emerald-900/20' : 'bg-red-50/50 border-red-400 dark:bg-red-900/20'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-xs opacity-50">שאלה {idx + 1}</span>
                                    {isCorrect
                                        ? <span className="text-emerald-600 text-xs font-bold">נכון</span>
                                        : <span className="text-red-600 text-xs font-bold">טעות</span>
                                    }
                                </div>
                                <p className="text-sm font-medium mb-2 text-slate-800 dark:text-slate-200">{q.text}</p>
                                {!isCorrect && (
                                    <div className="text-xs text-slate-500 bg-white/50 dark:bg-slate-800/50 p-2 rounded">
                                        <span className="font-bold">תשובה נכונה:</span> {q.options[q.correctOptionIndex]}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                    <button
                        onClick={onReset}
                        className="py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                        נסה שוב
                    </button>
                    <button
                        onClick={onNewQuiz}
                        className="py-3 px-4 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-colors"
                    >
                        בוחן חדש
                    </button>
                </div>
            </div>
        );
    }

    // --- Render: ACTIVE (Question Card) ---
    if (!question) return <div>Error</div>; // Should not happen if logic is correct

    const handleOptionSelect = (idx: number) => {
        if (viewingResult) return; // Block input if already answered
        onAnswer(question.id, idx);
        setViewingResult(true);
    };

    const handleNext = () => {
        // Check if this is the last question
        const isLastQuestion = currentQuestionIndex === quizState.questions.length - 1;

        if (isLastQuestion) {
            // Last question - quiz should already be COMPLETED by answerQuizQuestion
            // Just reset viewing state, the COMPLETED status will trigger the results screen
            setViewingResult(false);
            // The quiz status change to COMPLETED happens in useQuizActions.answerQuizQuestion
            // which is called when the user selects an answer. The UI will automatically
            // switch to the COMPLETED view because quizState.status === 'COMPLETED'
        } else {
            // Not the last question - move to next
            setViewingResult(false);
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };



    return (
        <div className="flex flex-col h-full p-6 relative">
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
                <div
                    className="h-full bg-amber-500 transition-all duration-500 ease-out"
                    style={{ width: `${((currentQuestionIndex) / quizState.questions.length) * 100}%` }}
                ></div>
            </div>

            <div className="flex-1 flex flex-col justify-center animate-slideIn">
                <span className="text-xs font-bold text-amber-500 mb-2 uppercase tracking-wider">
                    שאלה {currentQuestionIndex + 1} מתוך {quizState.questions.length}
                </span>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-8 leading-relaxed">
                    {question.text}
                </h3>

                <div className="space-y-3">
                    {question.options.map((opt, idx) => {
                        let stateClass = "border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-slate-700";

                        if (viewingResult) {
                            if (idx === question.correctOptionIndex) {
                                stateClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500";
                            } else if (idx === userAnswer) {
                                stateClass = "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-1 ring-red-500";
                            } else {
                                stateClass = "opacity-50 border-transparent grayscale";
                            }
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleOptionSelect(idx)}
                                disabled={viewingResult}
                                className={`w-full p-4 rounded-xl border-2 text-right transition-all duration-200 font-medium ${stateClass} ${viewingResult ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                                <span className="inline-block w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-current text-[10px] text-center leading-[20px] ml-3 opacity-60">
                                    {['א', 'ב', 'ג', 'ד'][idx]}
                                </span>
                                {opt}
                            </button>
                        );
                    })}
                </div>

                {/* Feedback Area */}
                <div className={`mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-all duration-500 ${viewingResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                    <div className="flex items-start gap-3">
                        <div className={`mt-1 text-xl ${userAnswer === question.correctOptionIndex ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {userAnswer === question.correctOptionIndex ? '✨' : '💡'}
                        </div>
                        <div>
                            <h4 className="font-bold text-sm mb-1 text-slate-800 dark:text-white">
                                {userAnswer === question.correctOptionIndex ? 'תשובה נכונה!' : 'הסבר:'}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {question.explanation}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Next Button */}
            <div className={`mt-auto pt-6 transition-all duration-300 ${viewingResult ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <button
                    onClick={handleNext}
                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold shadow-xl hover:scale-[1.02] transition-transform"
                >
                    {currentQuestionIndex === quizState.questions.length - 1 ? 'סיים בוחן' : 'השאלה הבאה'}
                </button>
            </div>
        </div>
    );
};
