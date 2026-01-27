import React, { useEffect, useState } from 'react';
import { LectureProgress, MasteryLevel } from '../types';

interface ProgressPanelProps {
  lectureId: string;
  getLectureProgress: (lectureId: string) => Promise<LectureProgress | null>;
  onNavigateToFlashcards: () => void;
  onNavigateToQuiz: () => void;
}

const getMasteryColor = (level: MasteryLevel): string => {
  switch (level) {
    case 'MASTERED': return 'bg-emerald-500';
    case 'STRONG': return 'bg-green-500';
    case 'LEARNING': return 'bg-amber-500';
    case 'WEAK': return 'bg-red-500';
    default: return 'bg-slate-300 dark:bg-slate-600';
  }
};

const getMasteryTextColor = (level: MasteryLevel): string => {
  switch (level) {
    case 'MASTERED': return 'text-emerald-600 dark:text-emerald-400';
    case 'STRONG': return 'text-green-600 dark:text-green-400';
    case 'LEARNING': return 'text-amber-600 dark:text-amber-400';
    case 'WEAK': return 'text-red-600 dark:text-red-400';
    default: return 'text-slate-500 dark:text-slate-400';
  }
};

const getMasteryLabel = (level: MasteryLevel): string => {
  switch (level) {
    case 'MASTERED': return 'שליטה מלאה';
    case 'STRONG': return 'חזק';
    case 'LEARNING': return 'בתהליך';
    case 'WEAK': return 'צריך חיזוק';
    default: return 'לא נבחן';
  }
};

export const ProgressPanel: React.FC<ProgressPanelProps> = ({
  lectureId,
  getLectureProgress,
  onNavigateToFlashcards,
  onNavigateToQuiz
}) => {
  const [progress, setProgress] = useState<LectureProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      setLoading(true);
      const data = await getLectureProgress(lectureId);
      setProgress(data);
      setLoading(false);
    };
    loadProgress();
  }, [lectureId, getLectureProgress]);

  if (loading) {
    return (
      <div className="p-8 h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">טוען נתוני התקדמות...</p>
        </div>
      </div>
    );
  }

  if (!progress || progress.concepts.length === 0) {
    return (
      <div className="p-8 h-full overflow-y-auto custom-scrollbar">
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-indigo-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">אין עדיין נתוני התקדמות</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
            התחל ללמוד עם הכרטיסיות או הבוחן כדי לראות את ההתקדמות שלך
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onNavigateToFlashcards}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
            >
              התחל עם כרטיסיות
            </button>
            <button
              onClick={onNavigateToQuiz}
              className="px-6 py-3 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all"
            >
              עשה בוחן
            </button>
          </div>
        </div>
      </div>
    );
  }

  const weakConcepts = progress.concepts.filter(c => c.masteryLevel === 'WEAK');
  const learningConcepts = progress.concepts.filter(c => c.masteryLevel === 'LEARNING');
  const strongConcepts = progress.concepts.filter(c => c.masteryLevel === 'STRONG' || c.masteryLevel === 'MASTERED');

  return (
    <div className="p-4 sm:p-8 h-full overflow-y-auto custom-scrollbar pb-24">
      {/* Overall Progress Header */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white mb-6 sm:mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-bold mb-1">ההתקדמות שלך</h3>
              <p className="text-indigo-100 text-sm">
                {progress.lastStudiedAt
                  ? `עודכן לאחרונה: ${new Date(progress.lastStudiedAt).toLocaleDateString('he-IL')}`
                  : 'התחל ללמוד כדי לעקוב אחרי ההתקדמות'
                }
              </p>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-4xl sm:text-5xl font-black">{progress.overallMastery}%</div>
              <div className="text-indigo-100 text-sm">שליטה כללית</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progress.overallMastery}%` }}
            ></div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{strongConcepts.length}</div>
              <div className="text-indigo-100 text-xs sm:text-sm">בשליטה</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{learningConcepts.length}</div>
              <div className="text-indigo-100 text-xs sm:text-sm">בתהליך</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{weakConcepts.length}</div>
              <div className="text-indigo-100 text-xs sm:text-sm">לחיזוק</div>
            </div>
          </div>
        </div>
      </div>

      {/* Weak Concepts - Need Attention */}
      {weakConcepts.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <h4 className="font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            נושאים שדורשים חיזוק
          </h4>
          <div className="space-y-3">
            {weakConcepts.map(concept => (
              <ConceptCard
                key={concept.id}
                concept={concept}
                onPractice={onNavigateToFlashcards}
              />
            ))}
          </div>
        </div>
      )}

      {/* Learning Concepts */}
      {learningConcepts.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <h4 className="font-bold text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            בתהליך למידה
          </h4>
          <div className="space-y-3">
            {learningConcepts.map(concept => (
              <ConceptCard key={concept.id} concept={concept} />
            ))}
          </div>
        </div>
      )}

      {/* Strong Concepts */}
      {strongConcepts.length > 0 && (
        <div>
          <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            נושאים בשליטה
          </h4>
          <div className="space-y-3">
            {strongConcepts.map(concept => (
              <ConceptCard key={concept.id} concept={concept} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for individual concept cards
const ConceptCard: React.FC<{
  concept: LectureProgress['concepts'][0];
  onPractice?: () => void;
}> = ({ concept, onPractice }) => {
  return (
    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-xl p-4 transition-all hover:shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${getMasteryColor(concept.masteryLevel)}`}></span>
            <h5 className="font-bold text-slate-800 dark:text-white truncate">{concept.conceptText}</h5>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getMasteryColor(concept.masteryLevel)}`}
              style={{ width: `${concept.masteryScore}%` }}
            ></div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className={getMasteryTextColor(concept.masteryLevel)}>
              {getMasteryLabel(concept.masteryLevel)}
            </span>
            {concept.quizCorrect + concept.quizIncorrect > 0 && (
              <span>
                בוחן: {concept.quizCorrect}/{concept.quizCorrect + concept.quizIncorrect}
              </span>
            )}
            {concept.flashcardRatings.length > 0 && (
              <span>
                כרטיסיות: {concept.flashcardRatings.length} חזרות
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`text-lg font-bold ${getMasteryTextColor(concept.masteryLevel)}`}>
            {concept.masteryScore}%
          </div>
          {onPractice && concept.masteryLevel === 'WEAK' && (
            <button
              onClick={onPractice}
              className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              title="תרגל נושא זה"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
