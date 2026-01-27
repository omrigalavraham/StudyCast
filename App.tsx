import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Course, Lecture, FileData, ProcessingMode } from './types';
import { useAppStore } from './hooks/useAppStore';
import { FileUpload } from './components/FileUpload';
import { AudioPlayer } from './components/AudioPlayer';
import { AuthScreen } from './components/AuthScreen';
import { CourseCard } from './components/CourseCard';
import { LectureItem } from './components/LectureItem';
import { ConceptCard } from './components/ConceptCard';
import { ExpandedConceptModal } from './components/ExpandedConceptModal';
import { Breadcrumbs } from './components/Breadcrumbs';
import { ScriptActionMenu } from './components/ScriptActionMenu';
import { SmartBoard } from './components/SmartBoard';
import { SummaryPreviewModal } from './components/SummaryPreviewModal';
import { SmartSearchBar } from './components/SmartSearchBar';

const App: React.FC = () => {
  const {
    // State
    courses,
    isDataLoaded,
    user,
    viewState,
    isDarkMode,
    activeCourse,
    activeLecture,
    // Actions
    handleLogin,
    handleLogout,
    setViewState,
    addCourse,
    updateCourse,
    addLecture,
    updateLecture,
    toggleDarkMode,
    processLecture,
    generateAudio,
    sendChatMessage,
    addInsight,
    deleteInsight,
    deleteCourse,
    deleteLecture,
    clearChatHistory,
    initQuiz,
    generateNewQuiz,
    answerQuizQuestion,
    resetQuiz,
    closeQuiz
  } = useAppStore();

  // --- UI State for adding items ---
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');

  const [isAddLectureModalOpen, setIsAddLectureModalOpen] = useState(false);
  const [newLectureName, setNewLectureName] = useState('');

  // --- UI State for EDITING items ---
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editCourseName, setEditCourseName] = useState('');

  // --- Search State ---
  const [searchQuery, setSearchQuery] = useState('');

  // --- Filtered Lectures (Smart Search Logic) ---
  const filteredLectures = useMemo(() => {
    if (!activeCourse) return [];
    if (!searchQuery.trim()) return activeCourse.lectures.map(l => ({ lecture: l, matchType: null }));

    const query = searchQuery.toLowerCase();

    return activeCourse.lectures
      .map(lecture => {
        // 1. Check Title (High Priority)
        if (lecture.title.toLowerCase().includes(query)) {
          return { lecture, matchType: 'TITLE' as const };
        }

        // 2. Check Summary
        if (lecture.summaryData?.summary.toLowerCase().includes(query)) {
          return { lecture, matchType: 'SUMMARY' as const };
        }

        // 3. Check Summary Points
        if (lecture.summaryData?.summaryPoints.some(p => p.point.toLowerCase().includes(query) || p.details.toLowerCase().includes(query))) {
          return { lecture, matchType: 'SUMMARY' as const };
        }

        // 4. Check Insights
        if (lecture.insights?.some(insight => insight.content.toLowerCase().includes(query))) {
          return { lecture, matchType: 'INSIGHT' as const };
        }

        return null;
      })
      .filter((item): item is { lecture: Lecture; matchType: 'TITLE' | 'SUMMARY' | 'INSIGHT' | null } => item !== null);
  }, [activeCourse, searchQuery]);

  const [editingLecture, setEditingLecture] = useState<{ lecture: Lecture, courseId: string } | null>(null);
  const [editLectureName, setEditLectureName] = useState('');

  // --- UI State for Preview Mode ---
  const [previewLecture, setPreviewLecture] = useState<Lecture | null>(null);

  // --- UI State for Processing Mode ---
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<FileData | null>(null);

  // --- Lecture Workspace Logic ---
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
  const [activePointIndex, setActivePointIndex] = useState<number>(-1); // Tracks which summary point is currently active
  const [expandedPointIndex, setExpandedPointIndex] = useState<number | null>(null); // Tracks which concept is fully open
  const [forcedTab, setForcedTab] = useState<'CHAT' | undefined>(undefined);
  const [chatDraft, setChatDraft] = useState<string>('');
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scriptContainerRef = useRef<HTMLDivElement>(null);

  // --- Action Handlers (UI Glue) ---

  const onAddCourse = () => {
    if (!newCourseName.trim()) return;
    addCourse(newCourseName);
    setNewCourseName('');
    setIsAddCourseModalOpen(false);
  };

  const onUpdateCourse = () => {
    if (!editingCourse || !editCourseName.trim()) return;
    updateCourse(editingCourse.id, editCourseName);
    setEditingCourse(null);
    setEditCourseName('');
  };

  const openEditCourseModal = (course: Course) => {
    setEditingCourse(course);
    setEditCourseName(course.name);
  };

  const onAddLecture = () => {
    if (!newLectureName.trim() || !activeCourse) return;
    addLecture(activeCourse.id, newLectureName);
    setNewLectureName('');
    setIsAddLectureModalOpen(false);
  };

  const onUpdateLecture = () => {
    if (!editingLecture || !editLectureName.trim()) return;
    updateLecture(editingLecture.courseId, editingLecture.lecture.id, { title: editLectureName });
    setEditingLecture(null);
    setEditLectureName('');
  };

  const openEditLectureModal = (lecture: Lecture) => {
    if (!activeCourse) return;
    setEditingLecture({ lecture, courseId: activeCourse.id });
    setEditLectureName(lecture.title);
  };

  // --- Processing Logic ---

  // 1. Initial File Selection -> Open Modal
  const onFileSelected = (file: FileData) => {
    setPendingFile(file);
    setIsProcessingModalOpen(true);
  };

  // 2. User Chose Mode -> Start Processing
  const startProcessing = async (mode: ProcessingMode) => {
    if (!pendingFile || viewState.type !== 'LECTURE' || !user) return;

    setIsProcessingModalOpen(false);

    // Call store action
    await processLecture(viewState.courseId, viewState.lectureId, pendingFile, mode);

    setPendingFile(null);
  };

  const handleGenerateAudioClick = async () => {
    if (!activeLecture?.summaryData?.script || viewState.type !== 'LECTURE' || !user) return;
    if (isGeneratingAudio) return; // Prevent duplicate calls
    setIsGeneratingAudio(true);
    try {
      await generateAudio(viewState.courseId, viewState.lectureId, activeLecture.summaryData.script);
    } catch (err) {
      alert("נכשל ביצירת אודיו");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Script Auto-Scroll & Concept Linking Logic
  const parsedScript = useMemo(() => {
    if (!activeLecture?.summaryData?.script) return [];

    const scriptLines = activeLecture.summaryData.script;
    const totalDuration = activeLecture.audioGeneratedDate ? 0 : 0; // We can't easily know total duration here without audio ref, but individual lines have end times.

    // Check if we have timestamps
    const hasTimestamps = scriptLines.some(l => l.startTime !== undefined);

    if (hasTimestamps) {
      return scriptLines.map(line => ({
        ...line,
        isOmri: line.speaker === 'עומרי',
        isNoa: line.speaker === 'נועה',
        start: line.startTime || 0,
        end: line.endTime || 0
      }));
    }

    // Fallback logic for old data (Character count estimation)
    const totalLength = scriptLines.reduce((acc, curr) => acc + curr.text.length, 0);
    let currentPos = 0;

    return scriptLines.map(line => {
      const startRatio = currentPos / totalLength;
      const endRatio = (currentPos + line.text.length) / totalLength;
      currentPos += line.text.length;
      return {
        ...line,
        isOmri: line.speaker === 'עומרי',
        isNoa: line.speaker === 'נועה',
        // We will scale these ratios by duration in handleAudioProgress if no timestamps
        startRatio,
        endRatio,
        start: 0, // Placeholder
        end: 0   // Placeholder
      };
    });
  }, [activeLecture?.summaryData?.script]);

  const handleAudioProgress = (currentTime: number, duration: number) => {
    if (!parsedScript.length) return;

    // Determine if we are using timestamps or ratios
    const usingTimestamps = parsedScript[0].start !== parsedScript[0].end; // Simple heuristic: if start != end (and not 0), we have data.

    let index = -1;

    if (usingTimestamps) {
      // Use exact seconds
      index = parsedScript.findIndex(line => currentTime >= line.start && currentTime < line.end);
    } else {
      // Fallback: Use ratios (Old way) assuming linear distribution
      const progressRatio = duration > 0 ? currentTime / duration : 0;
      // The fallback logic in parsedScript used `startRatio` and `endRatio` (which I added in previous step).
      // Let's access them naturally. Typescript might complain if I didn't add them to type definition? 
      // `parsedScript` is inferred.
      index = parsedScript.findIndex(line => {
        // @ts-ignore
        const s = line.startRatio || 0;
        // @ts-ignore
        const e = line.endRatio || 0;
        return progressRatio >= s && progressRatio < e;
      });
    }

    if (index !== -1 && index !== activeLineIndex) {
      setActiveLineIndex(index);
      // Link audio to concept card
      const relatedPointIndex = parsedScript[index].relatedPointIndex;
      if (relatedPointIndex !== undefined && relatedPointIndex !== -1) {
        setActivePointIndex(relatedPointIndex);

        // If the modal is already open, sync it with the audio!
        // This creates the "Switch according to what they are talking about" effect.
        if (expandedPointIndex !== null) {
          setExpandedPointIndex(relatedPointIndex);
        }
      } else {
        // Reset if no specific point is discussed or if we are in general chat (-1)
        setActivePointIndex(-1);
      }
    }
  };

  useEffect(() => {
    if (activeLineIndex >= 0 && lineRefs.current[activeLineIndex]) {
      lineRefs.current[activeLineIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLineIndex]);


  // --- RENDERING ---

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

  // Show Auth Screen if no user
  if (!user) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <AuthScreen
          onLogin={handleLogin}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />
      </div>
    );
  }

  // --- Contextual Actions Logic ---

  const handleContextAction = async (action: 'EXPLAIN' | 'ASK', text: string, speaker: string) => {
    if (!activeCourse || !activeLecture || isActionProcessing) return;

    setIsActionProcessing(true);

    try {
      if (action === 'EXPLAIN') {
        // 1. Switch tab to CHAT immediately
        setForcedTab('CHAT');
        // 2. Send the prompt
        const prompt = `לא הבנתי את הקטע ש${speaker} אמר: "${text}". תוכל להסביר לי אותו במילים פשוטות?`;
        await sendChatMessage(activeCourse.id, activeLecture.id, prompt);
      } else {
        // 'ASK': Populate draft and switch tab
        const prompt = `יש לי שאלה לגבי מה ש${speaker} אמר: "${text}"...`;
        setChatDraft(prompt);
        setForcedTab('CHAT');
      }
    } catch (error) {
      console.error("Context action failed:", error);
    } finally {
      // Simple debounce to prevent accidental double-clicks
      setTimeout(() => setIsActionProcessing(false), 1000);
    }
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>

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
                    onClick={handleLogout}
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
                    onClick={() => setIsAddCourseModalOpen(true)}
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
                  <button
                    onClick={() => setIsAddLectureModalOpen(true)}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-indigo-500/50 hover:scale-105 transition-all flex items-center gap-2 group"
                  >
                    <span className="bg-white/20 rounded-full p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </span>
                    הוסף הרצאה
                  </button>
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
            <div className="animate-fade-in-up h-full overflow-y-auto custom-scrollbar pb-20 pr-2">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                <div>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white mb-2 tracking-tight">הקורסים שלי</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-lg">בחר קורס כדי לצלול לחומר הלימוד</p>
                </div>
              </div>

              {courses.length === 0 ? (
                <div className="text-center py-24 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[40px] border border-dashed border-slate-300 dark:border-slate-700 group cursor-pointer hover:bg-white/50 dark:hover:bg-slate-900/50 transition-colors" onClick={() => setIsAddCourseModalOpen(true)}>
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-400 dark:text-slate-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <p className="text-2xl text-slate-700 dark:text-slate-200 font-bold mb-2">המרחב שלך ריק עדיין</p>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">נראה שעדיין לא יצרת קורסים. צור את הקורס הראשון שלך והתחל ללמוד בצורה חכמה.</p>
                  <button
                    className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
                  >
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
                {/* Abstract Background Decoration */}
                <div className={`absolute -right-20 -top-20 w-[500px] h-[500px] ${activeCourse.color} opacity-20 blur-[120px] rounded-full group-hover:opacity-30 transition-opacity duration-700`}></div>

                <div className="relative z-10">
                  <div className="inline-block px-4 py-1.5 bg-white/50 dark:bg-slate-800/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-4 border border-white/20 shadow-sm backdrop-blur-md">
                    {activeCourse.code}
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{activeCourse.name}</h2>
                  <p className="text-xl text-slate-600 dark:text-slate-300 font-light">נהל את חומרי הלימוד והפודקאסטים שלך</p>
                </div>
              </div>

              {/* Search Bar - Moved outside grid for better visibility */}
              <div className="mb-8 relative z-50">
                {/* DEBUG MARKER */}
                <div className="bg-red-500 text-white p-2 text-center font-bold rounded mb-2">
                  DEBUG: Search Bar Should Be Below This
                </div>
                <SmartSearchBar
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  resultCount={filteredLectures.length}
                />
              </div>

              <div className="grid gap-6">

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
                      onClick={() => setViewState({ type: 'LECTURE', courseId: activeCourse.id, lectureId: lecture.id })}
                      onEdit={openEditLectureModal}
                      onDelete={(l) => deleteLecture(activeCourse.id, l.id)}
                      onPreview={(l) => setPreviewLecture(l)}
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
              </div>

              {/* EMPTY STATE */}
              {activeLecture.status === 'EMPTY' && (
                <div className="max-w-3xl mx-auto mt-12 text-center">
                  <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[40px] p-12 md:p-16 border border-white/50 dark:border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white mb-6">הפוך את המצגת לפודקאסט</h2>
                    <p className="text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-lg mx-auto leading-relaxed">
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
                <div className="flex flex-col items-center justify-center min-h-[500px] bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[40px] border border-white/50 dark:border-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-900/10 animate-pulse"></div>
                  <div className="relative w-40 h-40 mb-10">
                    <div className="absolute inset-0 border-[10px] border-indigo-100 dark:border-slate-800 rounded-full"></div>
                    <div className="absolute inset-0 border-[10px] border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner text-4xl">
                        🧠
                      </div>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">מפענח את החומר...</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xl max-w-md text-center leading-relaxed">
                    {activeLecture.processingMode === 'FULL_LECTURE'
                      ? "בונה סיכום מקיף, משלים פערים וכותב תסריט..."
                      : "מארגן את הסיכום שלך וכותב דיאלוג..."}
                  </p>
                </div>
              )}

              {/* READY STATE (The Cockpit) */}
              {activeLecture.status === 'READY' && activeLecture.summaryData && (
                <div key={activeLecture.id} className="flex flex-col xl:flex-row gap-6 h-full min-h-0 overflow-hidden pb-2">

                  {/* Left Panel: Audio & Context (4 cols) */}
                  <div className="xl:w-1/3 flex flex-col gap-6 h-full min-h-0 overflow-visible xl:overflow-hidden">
                    <div className="flex-1 flex flex-col gap-6 overflow-visible xl:overflow-y-auto custom-scrollbar pb-2 pr-1">

                      {/* Audio Player */}
                      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[32px] p-2 border border-white/60 dark:border-slate-700 shadow-xl z-20 sticky top-0 transition-transform hover:scale-[1.01] flex-none">
                        {activeLecture.audioBase64 || isGeneratingAudio ? (
                          <AudioPlayer
                            base64Audio={activeLecture.audioBase64}
                            audioGeneratedDate={activeLecture.audioGeneratedDate}
                            onProgressUpdate={handleAudioProgress}
                            onRegenerate={handleGenerateAudioClick}
                            isRegenerating={isGeneratingAudio}
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
                              disabled={isGeneratingAudio}
                              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
                            >
                              {isGeneratingAudio ? (
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

                      {/* Script / Chat View */}
                      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[32px] border border-white/50 dark:border-slate-800 flex-1 flex flex-col min-h-0 shadow-lg relative overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 rounded-t-[32px] backdrop-blur-md sticky top-0 z-10 flex items-center justify-between flex-none">
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
                        <div ref={scriptContainerRef} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                          {parsedScript.map((line, idx) => {
                            const isActive = idx === activeLineIndex;

                            if (!line.isOmri && !line.isNoa) {
                              return null;
                            }

                            return (
                              <div key={idx} ref={(el) => { lineRefs.current[idx] = el; }} className={`flex ${line.isOmri ? 'justify-start' : 'justify-end'} group relative`}>

                                <div className={`
                                 max-w-[85%] rounded-3xl p-5 text-sm relative transition-all duration-300 shadow-sm
                                 ${line.isOmri
                                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700'
                                    : 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/20'
                                  }
                                 ${isActive ? 'ring-2 ring-offset-2 ring-indigo-400 scale-[1.02] shadow-xl z-10' : 'opacity-90 hover:opacity-100'}
                               `}>
                                  {/* Context Menu Trigger is now INSIDE the bubble for overlay */}
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

                  {/* Right Panel: Smart Board (8 cols equivalent) */}
                  <div className="xl:flex-1 h-[800px] xl:h-full">
                    <SmartBoard
                      summaryData={activeLecture.summaryData}
                      chatHistory={activeLecture.chatHistory || []}
                      insights={activeLecture.insights || []}
                      activePointIndex={activePointIndex}
                      onSendMessage={(msg) => sendChatMessage(activeCourse.id, activeLecture.id, msg)}
                      onAddInsight={(content) => addInsight(activeCourse.id, activeLecture.id, content)}
                      onDeleteInsight={(id) => deleteInsight(activeCourse.id, activeLecture.id, id)}
                      onClearChat={() => clearChatHistory(activeCourse.id, activeLecture.id)}
                      onExpandPoint={(index) => setExpandedPointIndex(index)}
                      overriddenTab={forcedTab}
                      initialInput={chatDraft}
                      // Quiz Props
                      quizState={activeLecture.quiz}
                      onInitQuiz={() => activeCourse && activeLecture && initQuiz(activeCourse.id, activeLecture.id)}
                      onStartQuiz={(settings) => activeCourse && activeLecture && generateNewQuiz(activeCourse.id, activeLecture.id, settings)}
                      onQuizAnswer={(qId, ans) => activeCourse && activeLecture && answerQuizQuestion(activeCourse.id, activeLecture.id, qId, ans)}
                      onQuizReset={() => activeCourse && activeLecture && resetQuiz(activeCourse.id, activeLecture.id)}
                      onNewQuiz={() => activeCourse && activeLecture && closeQuiz(activeCourse.id, activeLecture.id)}
                    />
                  </div>

                </div>
              )}
            </div>
          )}
        </main>

        {/* --- MODALS --- */}

        {/* Expanded Concept View Modal - Lifted State */}
        {expandedPointIndex !== null && activeLecture?.summaryData?.summaryPoints && (
          <ExpandedConceptModal
            item={activeLecture.summaryData.summaryPoints[expandedPointIndex]}
            index={expandedPointIndex}
            onClose={() => setExpandedPointIndex(null)}
          />
        )}


        {/* Processing Mode Selection Modal */}

        {isProcessingModalOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-2xl p-10 shadow-2xl border border-white/20 relative overflow-hidden animate-fade-in-up">
              {/* Decorative background blobs */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]"></div>

              <div className="relative z-10 text-center mb-10">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3">איך לעבד את המצגת?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-lg">בחר את המסלול המתאים ביותר לקובץ שהעלית</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 relative z-10">
                {/* Option 1: Full Lecture */}
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

                {/* Option 2: Summary */}
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
                onClick={() => { setIsProcessingModalOpen(false); setPendingFile(null); }}
                className="mt-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold transition-colors w-full uppercase tracking-wide"
              >
                ביטול
              </button>
            </div>
          </div>
        )}

        {/* Modal for Adding Course */}
        {isAddCourseModalOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-md p-10 shadow-2xl border border-white/20">
              <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">הוספת קורס חדש</h3>
              <input
                type="text"
                placeholder="שם הקורס (לדוגמה: מבוא לכלכלה)"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-4 mb-8 focus:ring-2 focus:ring-indigo-500 outline-none text-lg transition-all"
                autoFocus
              />
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setIsAddCourseModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={onAddCourse}
                  disabled={!newCourseName.trim()}
                  className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                >
                  צור קורס
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Editing Course */}
        {editingCourse && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-md p-10 shadow-2xl border border-white/20">
              <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">עריכת שם קורס</h3>
              <input
                type="text"
                value={editCourseName}
                onChange={(e) => setEditCourseName(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-4 mb-8 focus:ring-2 focus:ring-indigo-500 outline-none text-lg transition-all"
                autoFocus
              />
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setEditingCourse(null)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={onUpdateCourse}
                  disabled={!editCourseName.trim()}
                  className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                >
                  שמור שינויים
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Adding Lecture */}
        {isAddLectureModalOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-md p-10 shadow-2xl border border-white/20">
              <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">הוספת הרצאה חדשה</h3>
              <input
                type="text"
                placeholder="נושא ההרצאה (לדוגמה: המהפכה התעשייתית)"
                value={newLectureName}
                onChange={(e) => setNewLectureName(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-4 mb-8 focus:ring-2 focus:ring-indigo-500 outline-none text-lg transition-all"
                autoFocus
              />
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setIsAddLectureModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={onAddLecture}
                  disabled={!newLectureName.trim()}
                  className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                >
                  צור הרצאה
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Editing Lecture */}
        {editingLecture && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-md p-10 shadow-2xl border border-white/20">
              <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">עריכת שם הרצאה</h3>
              <input
                type="text"
                value={editLectureName}
                onChange={(e) => setEditLectureName(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-4 mb-8 focus:ring-2 focus:ring-indigo-500 outline-none text-lg transition-all"
                autoFocus
              />
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setEditingLecture(null)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={onUpdateLecture}
                  disabled={!editLectureName.trim()}
                  className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                >
                  שמור שינויים
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;