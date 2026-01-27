import React, { useState, useEffect } from 'react';
import { get } from 'idb-keyval';
import { Course } from '../types';

interface MigrationPromptProps {
  onMigrate: (courses: Course[]) => Promise<void>;
  onSkip: () => void;
}

export const MigrationPrompt: React.FC<MigrationPromptProps> = ({ onMigrate, onSkip }) => {
  const [oldCourses, setOldCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState('');

  useEffect(() => {
    const checkOldData = async () => {
      try {
        const savedCourses = await get('studycast_courses');
        if (savedCourses && savedCourses.length > 0) {
          setOldCourses(savedCourses);
        }
      } catch (error) {
        console.error('Error checking old data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkOldData();
  }, []);

  const handleMigrate = async () => {
    setIsMigrating(true);
    setMigrationProgress('מתחיל העברת נתונים...');

    try {
      await onMigrate(oldCourses);
      setMigrationProgress('הושלם!');
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationProgress('שגיאה בהעברת הנתונים');
    }
  };

  // No old data found
  if (!isLoading && oldCourses.length === 0) {
    return null;
  }

  // Loading
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">בודק נתונים קיימים...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalLectures = oldCourses.reduce((acc, c) => acc + c.lectures.length, 0);
  const lecturesWithAudio = oldCourses.reduce(
    (acc, c) => acc + c.lectures.filter(l => l.audioBase64).length,
    0
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            מצאנו נתונים קיימים!
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            יש לך נתונים מהגרסה הקודמת. רוצה להעביר אותם לחשבון החדש?
          </p>
        </div>

        {/* Stats */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{oldCourses.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">קורסים</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalLectures}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">הרצאות</div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{lecturesWithAudio}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">פודקאסטים</div>
            </div>
          </div>
        </div>

        {/* Migration Progress */}
        {isMigrating && (
          <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
              <span className="text-indigo-700 dark:text-indigo-300 font-medium">{migrationProgress}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        {!isMigrating && (
          <div className="flex gap-3">
            <button
              onClick={onSkip}
              className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              דלג
            </button>
            <button
              onClick={handleMigrate}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              העבר נתונים
            </button>
          </div>
        )}

        {/* Warning */}
        <div className="mt-4 text-center text-xs text-slate-400">
          הנתונים הישנים יישארו בדפדפן גם לאחר ההעברה
        </div>
      </div>
    </div>
  );
};
