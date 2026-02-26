import React, { useState, useEffect } from 'react';
import { SummaryData, SummaryPoint, ChatMessage, Insight, QuizSession, QuizDifficulty, FlashcardSession, Lecture, LectureProgress, Highlight } from '../types';
import { HighlightText } from '../utils/highlight';
import { ConceptCard } from './ConceptCard';
import { ExpandedConceptModal } from './ExpandedConceptModal';
import { ChatPanel } from './ChatPanel';
import { InsightsPanel } from './InsightsPanel';
import { QuizPanel } from './QuizPanel';
import { FlashcardPanel } from './FlashcardPanel';
import { ProgressPanel } from './ProgressPanel';
import { DetailedSummary } from './DetailedSummary';
import { HighlightsTab } from './HighlightsTab';

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
    // Highlight Actions
    highlights?: Highlight[];
    onAddHighlight?: (text: string, startOffset: number, endOffset: number) => void;
    onDeleteHighlight?: (highlightId: string) => void;

    overriddenTab?: Tab;
    initialInput?: string;
    highlightTerm?: string;
}

type Tab = 'CONCEPTS' | 'SUMMARY' | 'CHAT' | 'FLASHCARDS' | 'QUIZ' | 'PROGRESS' | 'INSIGHTS' | 'HIGHLIGHTS';

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
    highlights = [],
    onAddHighlight,
    onDeleteHighlight,
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
        { id: 'HIGHLIGHTS' as Tab, label: 'למבחן', color: 'text-amber-500 dark:text-amber-400', glow: 'shadow-amber-500/20', bg: 'bg-amber-500/10', dot: 'bg-amber-500', count: highlights.length },
        { id: 'INSIGHTS' as Tab, label: 'תובנות', color: 'text-rose-500 dark:text-rose-400', glow: 'shadow-rose-500/20', bg: 'bg-rose-500/10', dot: 'bg-rose-500', count: insights.length },
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
                    <DetailedSummary
                        summaryData={summaryData}
                        highlightTerm={highlightTerm}
                        highlights={highlights}
                        onAddHighlight={onAddHighlight}
                        onDeleteHighlight={onDeleteHighlight}
                    />
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
                        lecture={lecture}
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

                {activeTab === 'HIGHLIGHTS' && (
                    <HighlightsTab
                        highlights={highlights}
                        onDelete={(id) => onDeleteHighlight?.(id)}
                        onGoToSummary={() => setActiveTab('SUMMARY')}
                    />
                )}
            </div>
        </div>
    );
};
