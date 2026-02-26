import React, { useState } from 'react';
import { ProcessingMode } from './types';
import { useSupabaseStore } from './hooks/useSupabaseStore';
import { useModalState } from './hooks/useModalState';
import { useSmartSearch } from './hooks/useSmartSearch';
import { useAudioSync } from './hooks/useAudioSync';
import { useLectureWorkspace } from './hooks/useLectureWorkspace';
import { useMetaLectureActions } from './hooks/useMetaLectureActions';
import { FileUpload } from './components/FileUpload';
import { AudioPlayer } from './components/AudioPlayer';
import { SupabaseAuthScreen } from './components/SupabaseAuthScreen';
import { ApiKeySetup } from './components/ApiKeySetup';
import { MigrationPrompt } from './components/MigrationPrompt';
import { CourseCard } from './components/CourseCard';
import { LectureItem } from './components/LectureItem';
import { ExpandedConceptModal } from './components/ExpandedConceptModal';
import { Breadcrumbs } from './components/Breadcrumbs';
import { ScriptActionMenu } from './components/ScriptActionMenu';
import { SmartBoard } from './components/SmartBoard';
import { SummaryPreviewModal } from './components/SummaryPreviewModal';
import { SmartSearchBar } from './components/SmartSearchBar';
import { MetaLectureModal } from './components/MetaLectureModal';

const AppSupabase: React.FC = () => {
  const {
    // Auth State
    user,
    authLoading,
    // Data State
    courses,
    isDataLoaded,
    viewState,
    isDarkMode,
    activeCourse,
    activeLecture,
    // Auth Actions
    handleSignUp,
    handleSignIn,
    handleSignOut,
    updateApiKey,
    updateGender,
    // Navigation
    setViewState,
    // Course Actions
    addCourse,
    updateCourse,
    deleteCourse,
    // Lecture Actions
    addLecture,
    updateLecture,
    deleteLecture,
    processLecture,
    generateAudio,
    // Chat Actions
    sendChatMessage,
    clearChatHistory,
    // Insights Actions
    addInsight,
    deleteInsight,
    // Highlight Actions
    addHighlight,
    deleteHighlight,
    // Quiz Actions
    initQuiz,
    generateNewQuiz,
    answerQuizQuestion,
    resetQuiz,
    closeQuiz,
    // Flashcard Actions
    generateFlashcardsFromSummary,
    startFlashcardLearning,
    markFlashcardKnown,
    markFlashcardUnknown,
    resetFlashcards,
    retryUnknownFlashcards,
    // Progress Actions
    getLectureProgress,
    // Other
    toggleDarkMode,
    migrateData,
    // Utilities
    supabaseFetch,
    setCourses
  } = useSupabaseStore();

  // --- Migration State (disabled - migration complete) ---
  const [showMigration, setShowMigration] = useState(false);
  // Migration is disabled for new users - data already migrated

  // --- Search State ---
  const [searchQuery, setSearchQuery] = useState('');

  // --- Custom Hooks for UI State Management ---
  const modalState = useModalState();
  const { filteredLectures } = useSmartSearch({ activeCourse, searchQuery });
  const audioSync = useAudioSync({ activeLecture });
  const workspace = useLectureWorkspace();
  const metaLectureActions = useMetaLectureActions({
    user,
    courses,
    setCourses,
    supabaseFetch,
    updateLectureLocal: updateLecture
  });

  // --- Action Handlers ---

  const onAddCourse = async () => {
    if (!modalState.newCourseName.trim()) return;
    await addCourse(modalState.newCourseName);
    modalState.setNewCourseName('');
    modalState.setIsAddCourseModalOpen(false);
  };

  const onUpdateCourse = async () => {
    if (!modalState.editingCourse || !modalState.editCourseName.trim()) return;
    await updateCourse(modalState.editingCourse.id, modalState.editCourseName);
    modalState.setEditingCourse(null);
    modalState.setEditCourseName('');
  };

  const openEditCourseModal = (course: any) => {
    modalState.setEditingCourse(course);
    modalState.setEditCourseName(course.name);
  };

  const onAddLecture = async () => {
    if (!modalState.newLectureName.trim() || !activeCourse) return;
    await addLecture(activeCourse.id, modalState.newLectureName);
    modalState.setNewLectureName('');
    modalState.setIsAddLectureModalOpen(false);
  };

  const onUpdateLecture = async () => {
    if (!modalState.editingLecture || !modalState.editLectureName.trim()) return;
    updateLecture(modalState.editingLecture.courseId, modalState.editingLecture.lecture.id, { title: modalState.editLectureName });
    modalState.setEditingLecture(null);
    modalState.setEditLectureName('');
  };

  const openEditLectureModal = (lecture: any) => {
    if (!activeCourse) return;
    modalState.setEditingLecture({ lecture, courseId: activeCourse.id });
    modalState.setEditLectureName(lecture.title);
  };

  // --- Meta-Lecture Handlers ---
  const onCreateMetaLecture = async () => {
    if (!activeCourse) return;

    workspace.setIsActionProcessing(true);

    try {
      await metaLectureActions.createMetaLecture(
        activeCourse.id,
        modalState.metaLectureName,
        modalState.selectedLectureIds
      );

      // איפוס modal
      modalState.setMetaLectureName('');
      modalState.setSelectedLectureIds([]);
      modalState.setIsMetaLectureModalOpen(false);

    } catch (error) {
      console.error('Failed to create meta-lecture:', error);
      alert('שגיאה ביצירת מטה-הרצאה. נסה שוב.');
    } finally {
      workspace.setIsActionProcessing(false);
    }
  };

  const onToggleSelectLecture = (lectureId: string) => {
    modalState.setSelectedLectureIds(prev =>
      prev.includes(lectureId)
        ? prev.filter(id => id !== lectureId)
        : [...prev, lectureId]
    );
  };

  // --- Processing Logic ---
  const onFileSelected = (file: any) => {
    modalState.setPendingFile(file);
    modalState.setIsProcessingModalOpen(true);
  };

  const startProcessing = async (mode: ProcessingMode) => {
    if (!modalState.pendingFile || viewState.type !== 'LECTURE' || !user) return;
    modalState.setIsProcessingModalOpen(false);
    await processLecture(viewState.courseId, viewState.lectureId, modalState.pendingFile, mode);
    modalState.setPendingFile(null);
  };

  const handleGenerateAudioClick = async () => {
    if (!activeLecture?.summaryData?.script || viewState.type !== 'LECTURE' || !user) return;
    if (workspace.isGeneratingAudio) return;
    workspace.setIsGeneratingAudio(true);
    try {
      await generateAudio(viewState.courseId, viewState.lectureId, activeLecture.summaryData.script);
    } catch (err) {
      alert("נכשל ביצירת אודיו");
    } finally {
      workspace.setIsGeneratingAudio(false);
    }
  };

  // --- Context Actions ---
  const handleContextAction = async (action: 'EXPLAIN' | 'ASK', text: string, speaker: string) => {
    if (!activeCourse || !activeLecture || workspace.isActionProcessing) return;
    workspace.setIsActionProcessing(true);

    try {
      if (action === 'EXPLAIN') {
        workspace.setForcedTab('CHAT');
        const prompt = `לא הבנתי את הקטע ש${speaker} אמר: "${text}". תוכל להסביר לי אותו במילים פשוטות?`;
        await sendChatMessage(activeCourse.id, activeLecture.id, prompt);
      } else {
        const prompt = `יש לי שאלה לגבי מה ש${speaker} אמר: "${text}"...`;
        workspace.setChatDraft(prompt);
        workspace.setForcedTab('CHAT');
      }
    } catch (error) {
      console.error("Context action failed:", error);
    } finally {
      setTimeout(() => workspace.setIsActionProcessing(false), 1000);
    }
  };

  // --- RENDERING ---

  // Auth Loading
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-full h-full border-[6px] border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">StudyCast AI</h2>
          <p className="text-slate-500 mt-3 font-medium text-lg">מתחבר...</p>
        </div>
      </div>
    );
  }

  // Not logged in - Show Auth Screen
  if (!user) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <SupabaseAuthScreen
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />
      </div>
    );
  }

  // User logged in but no gender - Show Gender Selection
  if (!user.gender) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950 flex items-center justify-center p-4">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-white/10 p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">שלום {user.name}!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">כדי להתאים את הפודקאסט אליך, בחר/י את המגדר שלך:</p>

            <div className="flex gap-4 mb-4">
              <button
                onClick={() => updateGender('male')}
                className="flex-1 py-4 px-6 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all group"
              >
                <span className="text-4xl block mb-2">👨</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">זכר</span>
              </button>
              <button
                onClick={() => updateGender('female')}
                className="flex-1 py-4 px-6 rounded-2xl bg-pink-50 dark:bg-pink-900/30 border-2 border-pink-200 dark:border-pink-700 hover:border-pink-500 hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-all group"
              >
                <span className="text-4xl block mb-2">👩</span>
                <span className="font-bold text-pink-700 dark:text-pink-300">נקבה</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500">המידע משמש רק להתאמת הפודקאסט והדיאלוג</p>
          </div>
        </div>
      </div>
    );
  }

  // User logged in but no API key - Show API Key Setup
  if (!user.apiKey) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <ApiKeySetup
          onSave={updateApiKey}
          userName={user.name}
        />
      </div>
    );
  }

  // Data Loading
  if (!isDataLoaded) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-full h-full border-[6px] border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">🚀</span>
            </div>
          </div>
          <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">StudyCast AI</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3 font-medium text-lg">טוען את מרחב הלמידה שלך...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Migration Prompt */}
      {showMigration && (
        <MigrationPrompt
          onMigrate={async (oldCourses) => {
            await migrateData(oldCourses);
            setShowMigration(false);
          }}
          onSkip={() => setShowMigration(false)}
        />
      )}

      <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-rubik transition-colors duration-200 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]">
        {/* Ambient Backlights */}
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-900/20 blur-[120px] pointer-events-none z-0"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-900/20 blur-[120px] pointer-events-none z-0"></div>

        {/* Navigation Bar */}
        <header className="relative z-50 flex-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-between">

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setViewState({ type: 'DASHBOARD' })}>
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.24 50.552 50.552 0 00-2.658.813m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                    </svg>
                  </div>
                  <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 hidden sm:block tracking-tight">StudyCast</h1>
                </div>
                <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                <div className="hidden md:block">
                  <Breadcrumbs
                    viewState={viewState}
                    setViewState={setViewState}
                    activeCourse={activeCourse}
                    activeLecture={activeLecture}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* User Profile / Logout */}
                <div className="hidden sm:flex items-center gap-3 pr-2 border-r border-slate-200 dark:border-slate-700">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">שלום,</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-white leading-none">{user.name}</div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="התנתק"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={toggleDarkMode}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  {isDarkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                    </svg>
                  )}
                </button>

                {viewState.type === 'DASHBOARD' && (
                  <button
                    onClick={() => modalState.setIsAddCourseModalOpen(true)}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 group"
                  >
                    <span className="bg-white/20 dark:bg-black/10 rounded-full p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </span>
                    קורס חדש
                  </button>
                )}
                {viewState.type === 'COURSE' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => modalState.setIsAddLectureModalOpen(true)}
                      className="bg-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-indigo-500/50 hover:scale-105 transition-all flex items-center gap-2 group"
                    >
                      <span className="bg-white/20 rounded-full p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </span>
                      הוסף הרצאה
                    </button>
                    <button
                      onClick={() => modalState.setIsMetaLectureModalOpen(true)}
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-purple-500/30 hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                      </svg>
                      צור מטה-הרצאה
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="md:hidden px-4 pb-2">
            <Breadcrumbs
              viewState={viewState}
              setViewState={setViewState}
              activeCourse={activeCourse}
              activeLecture={activeLecture}
            />
          </div>
        </header>

        <main className={`relative z-10 flex-1 min-h-0 ${viewState.type === 'LECTURE' && activeLecture?.status === 'READY' ? 'overflow-y-auto xl:overflow-hidden' : 'overflow-y-auto'} overflow-x-hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full`}>

          {/* 1. Dashboard View */}
          {viewState.type === 'DASHBOARD' && (
            <div className="animate-fade-in-up h-full overflow-y-auto custom-scrollbar pb-32 p-10 md:p-20">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                <div>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white mb-2 tracking-tight">הקורסים שלי</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-lg">בחר קורס כדי לצלול לחומר הלימוד</p>
                </div>
              </div>

              {courses.length === 0 ? (
                <div className="text-center py-24 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[40px] border border-dashed border-slate-300 dark:border-slate-700 group cursor-pointer hover:bg-white/50 dark:hover:bg-slate-900/50 transition-colors" onClick={() => modalState.setIsAddCourseModalOpen(true)}>
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-400 dark:text-slate-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <p className="text-2xl text-slate-700 dark:text-slate-200 font-bold mb-2">המרחב שלך ריק עדיין</p>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">נראה שעדיין לא יצרת קורסים. צור את הקורס הראשון שלך והתחל ללמוד בצורה חכמה.</p>
                  <button className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105">
                    + הוסף קורס חדש
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {courses.map(course => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onClick={() => setViewState({ type: 'COURSE', courseId: course.id })}
                      onEdit={openEditCourseModal}
                      onDelete={(c) => deleteCourse(c.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. Course View */}
          {viewState.type === 'COURSE' && activeCourse && (
            <div className="animate-fade-in-up">
              <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[40px] p-8 md:p-12 border border-white/50 dark:border-white/10 shadow-2xl mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden group">
                <div className={`absolute -right-20 -top-20 w-[500px] h-[500px] ${activeCourse.color} opacity-20 blur-[120px] rounded-full group-hover:opacity-30 transition-opacity duration-700`}></div>
                <div className="relative z-10">
                  <div className="inline-block px-4 py-1.5 bg-white/50 dark:bg-slate-800/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-4 border border-white/20 shadow-sm backdrop-blur-md">
                    {activeCourse.code}
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{activeCourse.name}</h2>
                  <p className="text-xl text-slate-600 dark:text-slate-300 font-light">נהל את חומרי הלימוד והפודקאסטים שלך</p>
                </div>
              </div>

              <div className="grid gap-6">
                {/* Search Bar */}
                <SmartSearchBar
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  resultCount={filteredLectures.length}
                />

                {activeCourse.lectures.length === 0 ? (
                  <div className="text-center py-20 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">עדיין לא הוספת הרצאות לקורס זה.</p>
                  </div>
                ) : filteredLectures.length === 0 ? (
                  <div className="text-center py-20 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">לא נמצאו הרצאות התואמות לחיפוש.</p>
                  </div>
                ) : (
                  filteredLectures.map(({ lecture, matchType }) => (
                    <LectureItem
                      key={lecture.id}
                      lecture={lecture}
                      matchType={matchType}
                      onClick={() => {
                        setViewState({ type: 'LECTURE', courseId: activeCourse.id, lectureId: lecture.id });
                        // Contextual Navigation Logic
                        if (matchType === 'SUMMARY') workspace.setForcedTab('SUMMARY');
                        else if (matchType === 'INSIGHT') workspace.setForcedTab('INSIGHTS');
                        else if (matchType === 'CONCEPT') workspace.setForcedTab('CONCEPTS');
                        else workspace.setForcedTab(undefined); // Default navigation
                      }}
                      onEdit={openEditLectureModal}
                      onDelete={(l) => deleteLecture(activeCourse.id, l.id)}
                      onPreview={(l) => modalState.setPreviewLecture(l)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* 3. Smart Lecture Cockpit View */}
          {viewState.type === 'LECTURE' && activeLecture && activeCourse && (
            <div className={`animate-fade-in-up ${activeLecture.status === 'READY' ? 'flex flex-col h-full' : 'space-y-6'}`}>
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">{activeLecture.title}</h2>
                  <div className="flex items-center gap-2 mt-2 text-slate-500 dark:text-slate-400 font-medium">
                    <span>{activeCourse.name}</span>
                    <span>•</span>
                    <span>{activeLecture.date}</span>
                  </div>
                </div>

                {/* Toggle Podcast Panel - Only for regular lectures with script */}
                {activeLecture.lectureType !== 'META' && activeLecture.status === 'READY' && activeLecture.summaryData?.script && activeLecture.summaryData.script.length > 0 && (
                  <button
                    onClick={() => workspace.setIsPodcastPanelHidden(!workspace.isPodcastPanelHidden)}
                    className={`hidden xl:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      workspace.isPodcastPanelHidden
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    title={workspace.isPodcastPanelHidden ? 'הצג פודקאסט ותסריט' : 'הסתר פודקאסט ותסריט'}
                  >
                    {workspace.isPodcastPanelHidden ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                        </svg>
                        הצג פודקאסט
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                        </svg>
                        הרחב תצוגה
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* EMPTY STATE */}
              {activeLecture.status === 'EMPTY' && (
                <div className="max-w-3xl mx-auto mt-6 sm:mt-12 text-center px-2">
                  <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl sm:rounded-[40px] p-6 sm:p-12 md:p-16 border border-white/50 dark:border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 dark:text-white mb-4 sm:mb-6">הפוך את המצגת לפודקאסט</h2>
                    <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 mb-8 sm:mb-12 max-w-lg mx-auto leading-relaxed">
                      העלה את קובץ הלימוד שלך, וה-AI שלנו יצור עבורך סיכום מקיף ושיחה קולית שתכין אותך למבחן.
                    </p>
                    <div className="max-w-md mx-auto">
                      <FileUpload onFileSelect={onFileSelected} isLoading={false} />
                    </div>
                  </div>
                </div>
              )}

              {/* ANALYZING STATE */}
              {activeLecture.status === 'ANALYZING' && (
                <div className="flex flex-col items-center justify-center min-h-[400px] sm:min-h-[500px] bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl sm:rounded-[40px] border border-white/50 dark:border-white/10 relative overflow-hidden px-4">
                  <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-900/10 animate-pulse"></div>
                  <div className="relative w-28 h-28 sm:w-40 sm:h-40 mb-6 sm:mb-10">
                    <div className="absolute inset-0 border-[8px] sm:border-[10px] border-indigo-100 dark:border-slate-800 rounded-full"></div>
                    <div className="absolute inset-0 border-[8px] sm:border-[10px] border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner text-2xl sm:text-4xl">
                        🧠
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-3 sm:mb-4">מפענח את החומר...</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-base sm:text-xl max-w-md text-center leading-relaxed">
                    {activeLecture.processingMode === 'FULL_LECTURE'
                      ? "בונה סיכום מקיף, משלים פערים וכותב תסריט..."
                      : "מארגן את הסיכום שלך וכותב דיאלוג..."}
                  </p>
                </div>
              )}

              {/* READY STATE (The Cockpit) */}
              {activeLecture.status === 'READY' && activeLecture.summaryData && (
                <div key={activeLecture.id} className="flex flex-col xl:flex-row gap-4 sm:gap-6 xl:h-full min-h-0 pb-2">

                  {/* Mobile: SmartBoard first (order-1 on mobile, order-2 on xl) */}
                  {/* Meta-lectures or hidden panel take full width, regular lectures take flex-1 */}
                  <div className={`min-h-[400px] sm:min-h-[500px] xl:min-h-0 xl:h-full order-1 ${(activeLecture.lectureType === 'META' || workspace.isPodcastPanelHidden) ? 'xl:w-full' : 'xl:flex-1 xl:order-2'}`}>
                    <SmartBoard
                      summaryData={activeLecture.summaryData}
                      chatHistory={activeLecture.chatHistory || []}
                      insights={activeLecture.insights || []}
                      activePointIndex={audioSync.activePointIndex}
                      onSendMessage={(msg) => sendChatMessage(activeCourse.id, activeLecture.id, msg)}
                      onAddInsight={(content) => addInsight(activeCourse.id, activeLecture.id, content)}
                      onDeleteInsight={(id) => deleteInsight(activeCourse.id, activeLecture.id, id)}
                      onClearChat={() => clearChatHistory(activeCourse.id, activeLecture.id)}
                      onExpandPoint={(index) => audioSync.setExpandedPointIndex(index)}
                      overriddenTab={workspace.forcedTab}
                      initialInput={workspace.chatDraft}
                      quizState={activeLecture.quiz}
                      onInitQuiz={() => activeCourse && activeLecture && initQuiz(activeCourse.id, activeLecture.id)}
                      onStartQuiz={(settings) => activeCourse && activeLecture && generateNewQuiz(activeCourse.id, activeLecture.id, settings)}
                      onQuizAnswer={(qId, ans) => activeCourse && activeLecture && answerQuizQuestion(activeCourse.id, activeLecture.id, qId, ans)}
                      onQuizReset={() => activeCourse && activeLecture && resetQuiz(activeCourse.id, activeLecture.id)}
                      onNewQuiz={() => activeCourse && activeLecture && closeQuiz(activeCourse.id, activeLecture.id)}
                      lecture={activeLecture}
                      flashcards={activeLecture.flashcards}
                      isGeneratingFlashcards={workspace.isGeneratingFlashcards}
                      onGenerateFlashcards={async () => {
                        if (activeCourse && activeLecture) {
                          workspace.setIsGeneratingFlashcards(true);
                          try {
                            await generateFlashcardsFromSummary(activeCourse.id, activeLecture.id);
                          } finally {
                            workspace.setIsGeneratingFlashcards(false);
                          }
                        }
                      }}
                      onStartFlashcardLearning={() => activeCourse && activeLecture && startFlashcardLearning(activeCourse.id, activeLecture.id)}
                      onMarkFlashcardKnown={() => activeCourse && activeLecture && markFlashcardKnown(activeCourse.id, activeLecture.id)}
                      onMarkFlashcardUnknown={() => activeCourse && activeLecture && markFlashcardUnknown(activeCourse.id, activeLecture.id)}
                      onResetFlashcards={() => activeCourse && activeLecture && resetFlashcards(activeCourse.id, activeLecture.id)}
                      onRetryUnknownFlashcards={() => activeCourse && activeLecture && retryUnknownFlashcards(activeCourse.id, activeLecture.id)}
                      getLectureProgress={getLectureProgress}
                      highlights={activeLecture.highlights || []}
                      onAddHighlight={(text, startOffset, endOffset) =>
                        activeCourse && activeLecture && addHighlight(activeCourse.id, activeLecture.id, text, startOffset, endOffset)
                      }
                      onDeleteHighlight={(highlightId) =>
                        activeCourse && activeLecture && deleteHighlight(activeCourse.id, activeLecture.id, highlightId)
                      }
                      highlightTerm={searchQuery}
                    />
                  </div>

                  {/* Left Panel: Audio & Context (order-2 on mobile, order-1 on xl) */}
                  {/* Hidden for meta-lectures or when user toggles it off */}
                  {activeLecture.lectureType !== 'META' && !workspace.isPodcastPanelHidden && activeLecture.summaryData?.script && activeLecture.summaryData.script.length > 0 && (
                  <div className="xl:w-1/3 flex flex-col gap-4 sm:gap-6 min-h-0 order-2 xl:order-1">
                    <div className="flex flex-col gap-4 sm:gap-6 xl:overflow-y-auto custom-scrollbar pb-2 xl:pr-1 xl:flex-1">

                      {/* Audio Player */}
                      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-[32px] p-2 border border-white/60 dark:border-slate-700 shadow-xl z-20 xl:sticky xl:top-0 transition-transform hover:scale-[1.01] flex-none">
                        {activeLecture.audioBase64 ? (
                          <AudioPlayer
                            base64Audio={activeLecture.audioBase64}
                            audioGeneratedDate={activeLecture.audioGeneratedDate}
                            onProgressUpdate={audioSync.handleAudioProgress}
                            onRegenerate={handleGenerateAudioClick}
                            isRegenerating={workspace.isGeneratingAudio}
                          />
                        ) : (
                          <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-indigo-500/30 transform rotate-3">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                              </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">מוכן להאזנה?</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">הפודקאסט שלך מוכן ליצירה. לחץ למטה כדי להתחיל ללמוד תוך כדי תנועה.</p>
                            <button
                              onClick={handleGenerateAudioClick}
                              disabled={workspace.isGeneratingAudio}
                              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
                            >
                              {workspace.isGeneratingAudio ? (
                                <span className="flex items-center justify-center gap-2">
                                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  מייצר אודיו...
                                </span>
                              ) : "צור פודקאסט עכשיו"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Script View */}
                      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl sm:rounded-[32px] border border-white/50 dark:border-slate-800 flex flex-col min-h-[300px] xl:min-h-0 xl:flex-1 shadow-lg relative overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 rounded-t-2xl sm:rounded-t-[32px] backdrop-blur-md sticky top-0 z-10 flex items-center justify-between flex-none">
                          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <span className="flex h-3 w-3 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            תסריט השיחה
                          </h3>
                          <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <span>עומרי</span>
                            <span>•</span>
                            <span>נועה</span>
                          </div>
                        </div>
                        <div ref={audioSync.scriptContainerRef} className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 sm:space-y-6 max-h-[400px] xl:max-h-none">
                          {audioSync.parsedScript.map((line, idx) => {
                            const isActive = idx === audioSync.activeLineIndex;
                            if (!line.isOmri && !line.isNoa) return null;

                            return (
                              <div key={idx} ref={(el) => { audioSync.lineRefs.current[idx] = el; }} className={`flex ${line.isOmri ? 'justify-start' : 'justify-end'} group relative`}>
                                <div className={`
                                  max-w-[85%] rounded-3xl p-5 text-sm relative transition-all duration-300 shadow-sm
                                  ${line.isOmri
                                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700'
                                    : 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/20'
                                  }
                                  ${isActive ? 'ring-2 ring-offset-2 ring-indigo-400 scale-[1.02] shadow-xl z-10' : 'opacity-90 hover:opacity-100'}
                                `}>
                                  <ScriptActionMenu
                                    isOmri={line.isOmri}
                                    onExplain={() => handleContextAction('EXPLAIN', line.text, line.isOmri ? 'עומרי' : 'נועה')}
                                  />
                                  <div className={`text-[10px] font-bold mb-1.5 uppercase tracking-wide flex items-center gap-2 ${line.isOmri ? 'text-slate-400' : 'text-indigo-200'}`}>
                                    <div className={`w-2 h-2 rounded-full ${line.isOmri ? 'bg-sky-400' : 'bg-pink-400'}`}></div>
                                    {line.isOmri ? 'עומרי' : 'נועה'}
                                  </div>
                                  <p className="leading-relaxed whitespace-pre-wrap text-base">{line.text}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                </div>

              )}
            </div>
          )}
        </main>

        {/* --- MODALS --- */}

        {/* Expanded Concept View Modal */}
        {audioSync.expandedPointIndex !== null && activeLecture?.summaryData?.summaryPoints && (
          <ExpandedConceptModal
            item={activeLecture.summaryData.summaryPoints[audioSync.expandedPointIndex]}
            index={audioSync.expandedPointIndex}
            onClose={() => audioSync.setExpandedPointIndex(null)}
          />
        )}

        {/* Processing Mode Selection Modal */}
        {modalState.isProcessingModalOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-2xl p-10 shadow-2xl border border-white/20 relative overflow-hidden animate-fade-in-up">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]"></div>

              <div className="relative z-10 text-center mb-10">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3">איך לעבד את המצגת?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-lg">בחר את המסלול המתאים ביותר לקובץ שהעלית</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 relative z-10">
                <button
                  onClick={() => startProcessing('FULL_LECTURE')}
                  className="group relative bg-slate-50 dark:bg-slate-800 p-8 rounded-[32px] border-2 border-transparent hover:border-indigo-500 text-right transition-all hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-3">הרצאה גולמית</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    המצגת מכילה רק שקפים. המערכת תבנה עבורך סיכום מקיף למבחן, תשלים פערים ותיצור פודקאסט לימודי מעמיק.
                  </p>
                </button>

                <button
                  onClick={() => startProcessing('SUMMARY')}
                  className="group relative bg-slate-50 dark:bg-slate-800 p-8 rounded-[32px] border-2 border-transparent hover:border-emerald-500 text-right transition-all hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-3">סיכום מוכן</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    המצגת היא כבר סיכום. המערכת תארגן את המידע מחדש ותהפוך אותו לשיחה קולית זורמת וקלילה.
                  </p>
                </button>
              </div>

              <button
                onClick={() => { modalState.setIsProcessingModalOpen(false); modalState.setPendingFile(null); }}
                className="mt-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold transition-colors w-full uppercase tracking-wide"
              >
                ביטול
              </button>
            </div>
          </div>
        )}

        {/* Modal for Adding Course */}
        {modalState.isAddCourseModalOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-md p-10 shadow-2xl border border-white/20">
              <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">הוספת קורס חדש</h3>
              <input
                type="text"
                placeholder="שם הקורס (לדוגמה: מבוא לכלכלה)"
                value={modalState.newCourseName}
                onChange={(e) => modalState.setNewCourseName(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-4 mb-8 focus:ring-2 focus:ring-indigo-500 outline-none text-lg transition-all"
                autoFocus
              />
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => modalState.setIsAddCourseModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={onAddCourse}
                  disabled={!modalState.newCourseName.trim()}
                  className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                >
                  צור קורס
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Editing Course */}
        {modalState.editingCourse && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-md p-10 shadow-2xl border border-white/20">
              <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">עריכת שם קורס</h3>
              <input
                type="text"
                value={modalState.editCourseName}
                onChange={(e) => modalState.setEditCourseName(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-4 mb-8 focus:ring-2 focus:ring-indigo-500 outline-none text-lg transition-all"
                autoFocus
              />
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => modalState.setEditingCourse(null)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={onUpdateCourse}
                  disabled={!modalState.editCourseName.trim()}
                  className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                >
                  שמור שינויים
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Adding Lecture */}
        {modalState.isAddLectureModalOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-md p-10 shadow-2xl border border-white/20">
              <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">הוספת הרצאה חדשה</h3>
              <input
                type="text"
                placeholder="נושא ההרצאה (לדוגמה: המהפכה התעשייתית)"
                value={modalState.newLectureName}
                onChange={(e) => modalState.setNewLectureName(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-4 mb-8 focus:ring-2 focus:ring-indigo-500 outline-none text-lg transition-all"
                autoFocus
              />
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => modalState.setIsAddLectureModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={onAddLecture}
                  disabled={!modalState.newLectureName.trim()}
                  className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                >
                  צור הרצאה
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Editing Lecture */}
        {modalState.editingLecture && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-md p-10 shadow-2xl border border-white/20">
              <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">עריכת שם הרצאה</h3>
              <input
                type="text"
                value={modalState.editLectureName}
                onChange={(e) => modalState.setEditLectureName(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-4 mb-8 focus:ring-2 focus:ring-indigo-500 outline-none text-lg transition-all"
                autoFocus
              />
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => modalState.setEditingLecture(null)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={onUpdateLecture}
                  disabled={!modalState.editLectureName.trim()}
                  className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                >
                  שמור שינויים
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- Preview Lecture Modal --- */}
        {modalState.previewLecture && (
          <SummaryPreviewModal
            lecture={modalState.previewLecture}
            onClose={() => modalState.setPreviewLecture(null)}
          />
        )}

        {/* --- Meta-Lecture Creation Modal --- */}
        <MetaLectureModal
          isOpen={modalState.isMetaLectureModalOpen}
          onClose={() => modalState.setIsMetaLectureModalOpen(false)}
          availableLectures={activeCourse?.lectures || []}
          selectedIds={modalState.selectedLectureIds}
          onToggleSelect={onToggleSelectLecture}
          metaTitle={modalState.metaLectureName}
          onTitleChange={modalState.setMetaLectureName}
          onCreate={onCreateMetaLecture}
          isCreating={workspace.isActionProcessing}
        />

      </div>
    </div>
  );
};

export default AppSupabase;
