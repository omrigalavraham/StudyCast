import React, { useState } from 'react';
import { FlashCard } from './FlashCard';
import { FlashcardSession, Lecture } from '../types';

interface FlashcardPanelProps {
  lecture: Lecture;
  flashcards: FlashcardSession | undefined;
  isGenerating: boolean;
  onGenerateFromSummary: () => void;
  onStartLearning: () => void;
  onMarkKnown: () => void;
  onMarkUnknown: () => void;
  onReset: () => void;
  onRetryUnknown: () => void;
}

export const FlashcardPanel: React.FC<FlashcardPanelProps> = ({
  lecture,
  flashcards,
  isGenerating,
  onGenerateFromSummary,
  onStartLearning,
  onMarkKnown,
  onMarkUnknown,
  onReset,
  onRetryUnknown
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const hasSummaryPoints = lecture.summaryData?.summaryPoints && lecture.summaryData.summaryPoints.length > 0;

  // Reset flip state when moving to next card
  const handleMarkKnown = () => {
    setIsFlipped(false);
    onMarkKnown();
  };

  const handleMarkUnknown = () => {
    setIsFlipped(false);
    onMarkUnknown();
  };

  // IDLE or no flashcards - Show generate button
  if (!flashcards || flashcards.cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-16 px-4">
        {/* Icon */}
        <div className="float-animation mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20
                          border border-white/10 flex items-center justify-center">
            <span className="text-3xl sm:text-4xl">🃏</span>
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-white mb-2 sm:mb-3">כרטיסיות לימוד</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base text-center mb-6 sm:mb-8 max-w-md">
          {hasSummaryPoints
            ? 'צור כרטיסיות לימוד אוטומטית מתוכן ההרצאה'
            : 'יש לנתח את ההרצאה לפני יצירת כרטיסיות'}
        </p>

        {hasSummaryPoints && (
          <button
            onClick={onGenerateFromSummary}
            disabled={isGenerating}
            className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl
                       bg-gradient-to-r from-violet-600 to-purple-600
                       text-white font-medium text-sm sm:text-base
                       shadow-[0_0_20px_rgba(139,92,246,0.3)]
                       hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]
                       hover:scale-[1.02]
                       active:scale-[0.98]
                       transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            aria-label="יצירת כרטיסיות חכמה"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                יוצר כרטיסיות...
              </span>
            ) : (
              'יצירת כרטיסיות חכמה'
            )}
          </button>
        )}
      </div>
    );
  }

  // IDLE with cards - Show start learning
  if (flashcards.status === 'IDLE') {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-16 px-4">
        <div className="float-animation mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20
                          border border-white/10 flex items-center justify-center">
            <span className="text-3xl sm:text-4xl">📚</span>
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-white mb-2 sm:mb-3">מוכן ללמידה!</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base text-center mb-6 sm:mb-8">
          יש לך {flashcards.cards.length} כרטיסיות מוכנות
        </p>

        <button
          onClick={onStartLearning}
          className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl
                     bg-gradient-to-r from-violet-600 to-purple-600
                     text-white font-medium text-sm sm:text-base
                     shadow-[0_0_20px_rgba(139,92,246,0.3)]
                     hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]
                     hover:scale-[1.02]
                     active:scale-[0.98]
                     transition-all duration-300
                     focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          aria-label="התחל ללמוד"
        >
          התחל ללמוד
        </button>
      </div>
    );
  }

  // LEARNING - Show current card
  if (flashcards.status === 'LEARNING') {
    const currentCard = flashcards.cards[flashcards.currentIndex];
    const progress = ((flashcards.currentIndex + 1) / flashcards.cards.length) * 100;

    return (
      <div className="flex flex-col items-center py-4 sm:py-8 px-3 sm:px-4">
        {/* Progress indicator */}
        <div className="w-full max-w-md mb-4 sm:mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
              {flashcards.currentIndex + 1} / {flashcards.cards.length}
            </span>
            <span className="text-emerald-500 dark:text-emerald-400 text-xs sm:text-sm">
              ידעתי: {flashcards.knownCount}
            </span>
          </div>
          <div className="h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full progress-gradient rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="mb-4 sm:mb-8 w-full flex justify-center perspective-1000">
          <FlashCard
            front={currentCard.front}
            back={currentCard.back}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 sm:gap-4 w-full max-w-md">
          <button
            onClick={handleMarkUnknown}
            className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl
                       bg-red-500/20 border border-red-500/30
                       text-red-500 dark:text-red-400 font-medium text-sm sm:text-base
                       hover:bg-red-500/30 hover:border-red-500/50
                       hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]
                       active:scale-[0.98]
                       transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-red-500/50"
            aria-label="לא ידעתי"
          >
            ✗ עוד לא
          </button>
          <button
            onClick={handleMarkKnown}
            className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl
                       bg-emerald-500/20 border border-emerald-500/30
                       text-emerald-600 dark:text-emerald-400 font-medium text-sm sm:text-base
                       hover:bg-emerald-500/30 hover:border-emerald-500/50
                       hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]
                       active:scale-[0.98]
                       transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            aria-label="ידעתי"
          >
            ✓ ידעתי
          </button>
        </div>
      </div>
    );
  }

  // COMPLETED - Show results
  if (flashcards.status === 'COMPLETED') {
    const percentage = Math.round((flashcards.knownCount / flashcards.cards.length) * 100);
    const unknownCount = flashcards.cards.filter(c => !c.known).length;

    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-16 px-4">
        {/* Celebration */}
        <div className="mb-4 sm:mb-6 text-3xl sm:text-4xl">✨</div>

        {/* Score */}
        <div className="score-reveal mb-3 sm:mb-4">
          <span className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-violet-500 to-purple-500 dark:from-violet-400 dark:to-purple-400
                           bg-clip-text text-transparent">
            {percentage}%
          </span>
        </div>

        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base text-center mb-6 sm:mb-8">
          ידעת {flashcards.knownCount} מתוך {flashcards.cards.length} כרטיסיות
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-md h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-6 sm:mb-8">
          <div
            className="h-full progress-gradient rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {unknownCount > 0 && (
            <button
              onClick={onRetryUnknown}
              className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl
                         bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10
                         text-slate-700 dark:text-white font-medium text-sm sm:text-base
                         hover:bg-slate-200 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20
                         active:scale-[0.98]
                         transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-white/20"
              aria-label="חזור על מה שלא ידעת"
            >
              ↻ חזור על {unknownCount} כרטיסיות
            </button>
          )}
          <button
            onClick={onReset}
            className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl
                       bg-gradient-to-r from-violet-600 to-purple-600
                       text-white font-medium text-sm sm:text-base
                       shadow-[0_0_20px_rgba(139,92,246,0.3)]
                       hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]
                       hover:scale-[1.02]
                       active:scale-[0.98]
                       transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            aria-label="התחל מחדש"
          >
            התחל מחדש
          </button>
        </div>
      </div>
    );
  }

  return null;
};
