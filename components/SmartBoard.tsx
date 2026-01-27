import React, { useState, useEffect } from 'react';
import { SummaryData, SummaryPoint, ChatMessage, Insight, QuizSession, QuizDifficulty, FlashcardSession, Lecture, LectureProgress } from '../types';
import { HighlightText } from '../utils/highlight';
import { ConceptCard } from './ConceptCard';
import { ExpandedConceptModal } from './ExpandedConceptModal';
import { ChatPanel } from './ChatPanel';
import { InsightsPanel } from './InsightsPanel';
import { QuizPanel } from './QuizPanel';
import { FlashcardPanel } from './FlashcardPanel';
import { ProgressPanel } from './ProgressPanel';

interface SmartBoardProps {
    summaryData: SummaryData;
    chatHistory: ChatMessage[];
    insights: Insight[];
    quizState?: QuizSession;
    activePointIndex: number;
    onSendMessage: (msg: string) => Promise<void>;
    onAddInsight: (content: string) => void;
    onDeleteInsight: (id: string) => void;
    onClearChat: () => void;
    onExpandPoint: (index: number) => void;
    // Quiz Actions
    onInitQuiz: () => void;
    onStartQuiz: (settings: { difficulty: QuizDifficulty, questionCount: number }) => void;
    onQuizAnswer: (questionId: string, answerIdx: number) => void;
    onQuizReset: () => void;
    onNewQuiz: () => void;
    // Flashcard Actions
    lecture: Lecture;
    flashcards?: FlashcardSession;
    isGeneratingFlashcards: boolean;
    onGenerateFlashcards: () => void;
    onStartFlashcardLearning: () => void;
    onMarkFlashcardKnown: () => void;
    onMarkFlashcardUnknown: () => void;
    onResetFlashcards: () => void;
    onRetryUnknownFlashcards: () => void;
    // Progress Actions
    getLectureProgress: (lectureId: string) => Promise<LectureProgress | null>;

    overriddenTab?: Tab;
    initialInput?: string;
    highlightTerm?: string;
}

type Tab = 'CONCEPTS' | 'SUMMARY' | 'CHAT' | 'FLASHCARDS' | 'QUIZ' | 'PROGRESS' | 'INSIGHTS';

export const SmartBoard: React.FC<SmartBoardProps> = ({
    summaryData,
    chatHistory,
    insights,
    activePointIndex,
    onSendMessage,
    onAddInsight,
    onDeleteInsight,
    onClearChat,
    onExpandPoint,
    overriddenTab,
    initialInput,
    // Quiz Props
    quizState,
    onInitQuiz,
    onStartQuiz,
    onQuizAnswer,
    onQuizReset,
    onNewQuiz,
    // Flashcard Props
    lecture,
    flashcards,
    isGeneratingFlashcards,
    onGenerateFlashcards,
    onStartFlashcardLearning,
    onMarkFlashcardKnown,
    onMarkFlashcardUnknown,
    onResetFlashcards,
    onRetryUnknownFlashcards,
    getLectureProgress,
    highlightTerm
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('CONCEPTS');

    useEffect(() => {
        if (overriddenTab) {
            setActiveTab(overriddenTab);
        }
    }, [overriddenTab]);

    // Initialize Quiz when tab is active
    useEffect(() => {
        if (activeTab === 'QUIZ' && !quizState) {
            onInitQuiz();
        }
    }, [activeTab, quizState, onInitQuiz]);

    // Neural Glass Tabs Configuration
    const tabs = [
        { id: 'CONCEPTS' as Tab, label: 'מושגים', color: 'text-sky-500 dark:text-sky-400', glow: 'shadow-sky-500/20', bg: 'bg-sky-500/10', dot: 'bg-sky-500' },
        { id: 'SUMMARY' as Tab, label: 'סיכום', color: 'text-indigo-500 dark:text-indigo-400', glow: 'shadow-indigo-500/20', bg: 'bg-indigo-500/10', dot: 'bg-indigo-500' },
        { id: 'CHAT' as Tab, label: 'צ\'אט', color: 'text-violet-500 dark:text-violet-400', glow: 'shadow-violet-500/20', bg: 'bg-violet-500/10', dot: 'bg-violet-500' },
        { id: 'FLASHCARDS' as Tab, label: 'כרטיסיות', color: 'text-fuchsia-500 dark:text-fuchsia-400', glow: 'shadow-fuchsia-500/20', bg: 'bg-fuchsia-500/10', dot: 'bg-fuchsia-500', count: flashcards?.cards.length },
        { id: 'QUIZ' as Tab, label: 'בוחן', color: 'text-orange-500 dark:text-orange-400', glow: 'shadow-orange-500/20', bg: 'bg-orange-500/10', dot: 'bg-orange-500' },
        { id: 'PROGRESS' as Tab, label: 'התקדמות', color: 'text-emerald-500 dark:text-emerald-400', glow: 'shadow-emerald-500/20', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
        { id: 'INSIGHTS' as Tab, label: 'תובנות', color: 'text-amber-500 dark:text-amber-400', glow: 'shadow-amber-500/20', bg: 'bg-amber-500/10', dot: 'bg-amber-500', count: insights.length },
    ];

    return (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[32px] border border-white/50 dark:border-slate-800 flex flex-col h-full overflow-hidden shadow-2xl relative">

            {/* Neural Glass Tabs Header */}
            <div className="sticky top-0 z-30 pt-4 pb-2 px-4 w-full pointer-events-none">
                <div className="pointer-events-auto w-full">
                    <div className="
                        flex items-center justify-between gap-1 p-1.5 
                        bg-white/80 dark:bg-slate-950/80 
                        backdrop-blur-2xl 
                        border border-white/40 dark:border-white/5 
                        rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50
                        w-full overflow-x-auto custom-scrollbar-hide
                    ">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        relative flex-1 px-4 py-2 sm:py-2.5 rounded-xl 
                                        text-xs sm:text-sm font-bold transition-all duration-300 group
                                        whitespace-nowrap flex flex-col items-center justify-center gap-0.5
                                        ${isActive
                                            ? `${tab.color} ${tab.bg} shadow-lg ${tab.glow}`
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>{tab.label}</span>
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span className={`
                                                text-[9px] px-1.5 py-px rounded-full font-extrabold
                                                ${isActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-800'}
                                            `}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </div>

                                    {/* Active Dot Indicator */}
                                    {isActive && (
                                        <div className={`w-1 h-1 rounded-full ${tab.dot} shadow-[0_0_8px_currentColor]`}></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden min-h-0">
                {activeTab === 'CONCEPTS' && (
                    <div className="p-4 sm:p-8 md:p-10 overflow-y-auto custom-scrollbar h-full pb-20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {summaryData.summaryPoints.map((item, idx) => (
                                <ConceptCard
                                    key={idx}
                                    item={item}
                                    index={idx}
                                    isActive={idx === activePointIndex}
                                    onExpand={() => onExpandPoint(idx)}
                                    highlightTerm={highlightTerm}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'SUMMARY' && (
                    <div className="p-4 sm:p-8 md:p-10 overflow-y-auto custom-scrollbar h-full pb-20">
                        <div className="bg-gradient-to-br from-white to-indigo-50/50 dark:from-slate-800 dark:to-slate-800/50 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/60 dark:border-slate-700 mb-10 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
                            <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-3 text-lg">
                                <span className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                                    </svg>
                                </span>
                                המבט הכולל
                            </h4>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg font-light">
                                <HighlightText text={summaryData.summary} term={highlightTerm} />
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'CHAT' && (
                    <ChatPanel
                        messages={chatHistory}
                        onSendMessage={onSendMessage}
                        onAddInsight={onAddInsight}
                        onClearChat={onClearChat}
                        initialInput={initialInput}
                    />
                )}

                {activeTab === 'INSIGHTS' && (
                    <InsightsPanel
                        insights={insights}
                        onDeleteInsight={onDeleteInsight}
                        highlightTerm={highlightTerm}
                    />
                )}

                {activeTab === 'FLASHCARDS' && (
                    <FlashcardPanel
                        lecture={lecture}
                        flashcards={flashcards}
                        isGenerating={isGeneratingFlashcards}
                        onGenerateFromSummary={onGenerateFlashcards}
                        onStartLearning={onStartFlashcardLearning}
                        onMarkKnown={onMarkFlashcardKnown}
                        onMarkUnknown={onMarkFlashcardUnknown}
                        onReset={onResetFlashcards}
                        onRetryUnknown={onRetryUnknownFlashcards}
                    />
                )}

                {activeTab === 'QUIZ' && quizState && (
                    <QuizPanel
                        quizState={quizState}
                        onStartQuiz={onStartQuiz}
                        onAnswer={onQuizAnswer}
                        onReset={onQuizReset}
                        onNewQuiz={onNewQuiz}
                    />
                )}

                {activeTab === 'PROGRESS' && (
                    <ProgressPanel
                        lectureId={lecture.id}
                        getLectureProgress={getLectureProgress}
                        onNavigateToFlashcards={() => setActiveTab('FLASHCARDS')}
                        onNavigateToQuiz={() => setActiveTab('QUIZ')}
                    />
                )}
            </div>
        </div>
    );
};
