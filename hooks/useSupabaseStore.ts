import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Course, Lecture, ViewState, ChatMessage, Insight, QuizSession, FlashcardSession, Highlight } from '../types';
import { AppUser } from './storeTypes';
import { createUpdateLectureLocal } from './storeUtils';
import { useAuth } from './useAuth';
import { useCourseActions } from './useCourseActions';
import { useLectureActions } from './useLectureActions';
import { useChatActions } from './useChatActions';
import { useInsightActions } from './useInsightActions';
import { useQuizActions } from './useQuizActions';
import { useFlashcardActions } from './useFlashcardActions';
import { useProgressActions } from './useProgressActions';
import { useHighlightActions } from './useHighlightActions';
import { useMigration } from './useMigration';

export type { AppUser } from './storeTypes';

export const useSupabaseStore = () => {
  // --- Auth State ---
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- Global State ---
  const [courses, setCourses] = useState<Course[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [viewState, setViewState] = useState<ViewState>({ type: 'DASHBOARD' });
  const [isDarkMode, setIsDarkMode] = useState(false);

  // --- Helper: Fetch Profile ---
  const fetchProfile = useCallback(async (userId: string, accessToken: string) => {
    try {
      console.log('[Auth] Fetching profile for:', userId);
      const response = await fetch(
        `https://lfqsttzweentcpeyohxu.supabase.co/rest/v1/profiles?id=eq.${userId}&select=*`,
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcXN0dHp3ZWVudGNwZXlvaHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMzk5MjEsImV4cCI6MjA4NDgxNTkyMX0.PHtlJA7lHNxeXQxIBpXFth_0IYRxSzUZjG8bwLtzA78',
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.error('[Auth] Profile fetch failed:', response.status, await response.text());
        return null;
      }

      const profiles = await response.json();
      console.log('[Auth] Profile fetch result:', profiles);

      if (profiles && profiles.length > 0) {
        return profiles[0];
      }
      return null;
    } catch (e) {
      console.error('[Auth] Profile fetch error:', e);
      return null;
    }
  }, []);

  // --- Auth Effect ---
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      console.log('[Auth] initAuth started');

      const timeoutId = setTimeout(() => {
        if (mounted) {
          console.log('[Auth] Timeout - defaulting to login screen if no user set');
          setAuthLoading((prev) => {
            if (prev) return false;
            return prev;
          });
        }
      }, 4000);

      try {
        const storedSession = localStorage.getItem('sb-lfqsttzweentcpeyohxu-auth-token');

        if (!storedSession) {
          console.log('[Auth] No stored session found');
          return;
        }

        const sessionData = JSON.parse(storedSession);

        const now = Math.floor(Date.now() / 1000);
        if (sessionData.expires_at && sessionData.expires_at < now) {
          console.log('[Auth] Stored session expired. Waiting for onAuthStateChange refresh.');
          return;
        }

        if (sessionData?.user) {
          console.log('[Auth] Valid local session found, initializing eager state');

          let profile = await fetchProfile(sessionData.user.id, sessionData.access_token);

          if (mounted) {
            setUser({
              id: sessionData.user.id,
              email: sessionData.user.email || '',
              name: profile?.name || sessionData.user.user_metadata?.name || 'משתמש',
              gender: profile?.gender || null,
              apiKey: profile?.gemini_api_key || null
            });
            clearTimeout(timeoutId);
            setAuthLoading(false);
          }
        }
      } catch (e) {
        console.error('[Auth] initAuth Error:', e);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] onAuthStateChange:', event, session?.user?.id);

      if (event === 'SIGNED_IN' && session?.user && mounted) {
        const profile = await fetchProfile(session.user.id, session.access_token);

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: profile?.name || session.user.user_metadata?.name || 'משתמש',
          gender: profile?.gender || null,
          apiKey: profile?.gemini_api_key || null
        });
        setAuthLoading(false);

      } else if (event === 'SIGNED_OUT' && mounted) {
        setUser(null);
        setCourses([]);
        setViewState({ type: 'DASHBOARD' });
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // --- Helper: Supabase fetch with auth ---
  const supabaseFetch = useCallback(async (endpoint: string, options?: RequestInit) => {
    const storedSession = localStorage.getItem('sb-lfqsttzweentcpeyohxu-auth-token');
    const accessToken = storedSession ? JSON.parse(storedSession).access_token : null;
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcXN0dHp3ZWVudGNwZXlvaHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMzk5MjEsImV4cCI6MjA4NDgxNTkyMX0.PHtlJA7lHNxeXQxIBpXFth_0IYRxSzUZjG8bwLtzA78';
    const baseUrl = 'https://lfqsttzweentcpeyohxu.supabase.co/rest/v1';

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': options?.method === 'POST' ? 'return=representation' : '',
        ...options?.headers
      }
    });

    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }, []);

  // --- Load Data Effect ---
  useEffect(() => {
    const loadData = async () => {
      console.log('[useSupabaseStore] loadData called, user:', user?.id);

      const savedTheme = localStorage.getItem('studycast_theme');
      if (savedTheme === 'dark') setIsDarkMode(true);

      if (!user) {
        console.log('[useSupabaseStore] No user, setting isDataLoaded=true');
        setIsDataLoaded(true);
        return;
      }

      try {
        console.log('[useSupabaseStore] Loading all data for user:', user.id);

        const coursesData = await supabaseFetch(`/courses?user_id=eq.${user.id}&select=*&order=created_at.desc`);
        console.log('[useSupabaseStore] Courses:', coursesData?.length || 0);

        if (!coursesData || coursesData.length === 0) {
          setCourses([]);
          setIsDataLoaded(true);
          return;
        }

        const lecturesData = await supabaseFetch(`/lectures?user_id=eq.${user.id}&select=*&order=created_at.desc`);
        console.log('[useSupabaseStore] Lectures:', lecturesData?.length || 0);

        const chatData = await supabaseFetch(`/chat_messages?user_id=eq.${user.id}&select=*&order=timestamp.asc`);
        console.log('[useSupabaseStore] Chat messages:', chatData?.length || 0);

        const insightsData = await supabaseFetch(`/insights?user_id=eq.${user.id}&select=*&order=created_at.desc`);
        console.log('[useSupabaseStore] Insights:', insightsData?.length || 0);

        const quizData = await supabaseFetch(`/quiz_sessions?user_id=eq.${user.id}&select=*`);
        console.log('[useSupabaseStore] Quiz sessions:', quizData?.length || 0);

        const flashcardsData = await supabaseFetch(`/flashcard_sessions?user_id=eq.${user.id}&select=*`);
        console.log('[useSupabaseStore] Flashcard sessions:', flashcardsData?.length || 0);

        let highlightsData: any[] = [];
        try {
          const result = await supabaseFetch(`/highlights?user_id=eq.${user.id}&select=*&order=created_at.desc`);
          if (Array.isArray(result)) {
            highlightsData = result;
          }
        } catch (e) {
          console.log('[useSupabaseStore] Highlights table not found, skipping');
        }
        console.log('[useSupabaseStore] Highlights:', highlightsData.length);

        const chatByLecture: Record<string, ChatMessage[]> = {};
        (chatData || []).forEach((msg: any) => {
          if (!chatByLecture[msg.lecture_id]) chatByLecture[msg.lecture_id] = [];
          chatByLecture[msg.lecture_id].push({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          });
        });

        const insightsByLecture: Record<string, Insight[]> = {};
        (insightsData || []).forEach((ins: any) => {
          if (!insightsByLecture[ins.lecture_id]) insightsByLecture[ins.lecture_id] = [];
          insightsByLecture[ins.lecture_id].push({
            id: ins.id,
            content: ins.content,
            date: ins.date
          });
        });

        const quizByLecture: Record<string, QuizSession> = {};
        (quizData || []).forEach((q: any) => {
          quizByLecture[q.lecture_id] = {
            status: q.status,
            settings: { difficulty: q.difficulty, questionCount: q.question_count },
            questions: q.questions || [],
            userAnswers: q.user_answers || {},
            score: q.score || 0
          };
        });

        const flashcardsByLecture: Record<string, FlashcardSession> = {};
        (flashcardsData || []).forEach((f: any) => {
          flashcardsByLecture[f.lecture_id] = {
            status: f.status || 'IDLE',
            cards: f.cards || [],
            currentIndex: f.current_index || 0,
            knownCount: f.known_count || 0
          };
        });

        const highlightsByLecture: Record<string, Highlight[]> = {};
        highlightsData.forEach((h: any) => {
          if (!highlightsByLecture[h.lecture_id]) highlightsByLecture[h.lecture_id] = [];
          highlightsByLecture[h.lecture_id].push({
            id: h.id,
            text: h.text,
            startOffset: h.start_offset,
            endOffset: h.end_offset,
            createdAt: h.created_at
          });
        });

        const downloadAudio = async (audioUrl: string): Promise<string | undefined> => {
          try {
            const storedSession = localStorage.getItem('sb-lfqsttzweentcpeyohxu-auth-token');
            const accessToken = storedSession ? JSON.parse(storedSession).access_token : null;
            const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcXN0dHp3ZWVudGNwZXlvaHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMzk5MjEsImV4cCI6MjA4NDgxNTkyMX0.PHtlJA7lHNxeXQxIBpXFth_0IYRxSzUZjG8bwLtzA78';

            const response = await fetch(
              `https://lfqsttzweentcpeyohxu.supabase.co/storage/v1/object/audio-files/${audioUrl}`,
              {
                headers: {
                  'apikey': apiKey,
                  'Authorization': `Bearer ${accessToken}`
                }
              }
            );

            if (!response.ok) {
              console.error('[loadData] Failed to download audio:', audioUrl);
              return undefined;
            }

            const blob = await response.blob();
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
              };
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            console.error('[loadData] Error downloading audio:', e);
            return undefined;
          }
        };

        const lecturesByCourse: Record<string, Lecture[]> = {};
        for (const l of (lecturesData || [])) {
          if (!lecturesByCourse[l.course_id]) lecturesByCourse[l.course_id] = [];

          let audioBase64: string | undefined;
          if (l.audio_url) {
            console.log('[loadData] Downloading audio for lecture:', l.id);
            audioBase64 = await downloadAudio(l.audio_url);
          }

          lecturesByCourse[l.course_id].push({
            id: l.id,
            title: l.title,
            date: l.date,
            status: l.status,
            processingMode: l.processing_mode,
            errorMsg: l.error_msg,
            summaryData: l.summary_data,
            fileData: l.file_name ? { name: l.file_name, mimeType: l.file_mime_type || '', base64: '' } : undefined,
            audioGeneratedDate: l.audio_generated_date,
            audioBase64,
            chatHistory: chatByLecture[l.id] || [],
            insights: insightsByLecture[l.id] || [],
            quiz: quizByLecture[l.id],
            flashcards: flashcardsByLecture[l.id],
            highlights: highlightsByLecture[l.id] || []
          });
        }

        const loadedCourses: Course[] = (coursesData || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          color: c.color,
          lectures: lecturesByCourse[c.id] || []
        }));

        console.log('[useSupabaseStore] Loaded courses with lectures:', loadedCourses);
        setCourses(loadedCourses);
      } catch (error) {
        console.error('[useSupabaseStore] Failed to load data:', error);
      } finally {
        console.log('[useSupabaseStore] Setting isDataLoaded=true');
        setIsDataLoaded(true);
      }
    };

    loadData();
  }, [user?.id, supabaseFetch]);

  // --- Theme Effect ---
  useEffect(() => {
    localStorage.setItem('studycast_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Derived State ---
  const activeCourse = useMemo(() => {
    if (viewState.type === 'DASHBOARD') return null;
    return courses.find(c => c.id === viewState.courseId) || null;
  }, [courses, viewState]);

  const activeLecture = useMemo(() => {
    if (viewState.type !== 'LECTURE' || !activeCourse) return null;
    return activeCourse.lectures.find(l => l.id === viewState.lectureId) || null;
  }, [activeCourse, viewState]);

  // --- Utility ---
  const updateLectureLocal = createUpdateLectureLocal(setCourses);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // --- Sub-hooks (order matters: Progress first, then Quiz/Flashcards) ---

  const progressActions = useProgressActions({ user, supabaseFetch });

  const authActions = useAuth({ user, setUser, setCourses, setViewState, supabaseFetch });

  const courseActions = useCourseActions({ user, setCourses, viewState, setViewState, supabaseFetch });

  const lectureActions = useLectureActions({ user, courses, setCourses, viewState, setViewState, supabaseFetch, updateLectureLocal });

  const chatActions = useChatActions({ user, setCourses, supabaseFetch, updateLectureLocal, activeLecture });

  const insightActions = useInsightActions({ user, setCourses, supabaseFetch });

  const highlightActions = useHighlightActions({ user, setCourses, supabaseFetch });

  const quizActions = useQuizActions({
    user, courses, setCourses, supabaseFetch, activeLecture,
    updateConceptProgress: progressActions.updateConceptProgress
  });

  const flashcardActions = useFlashcardActions({
    user, courses, setCourses, supabaseFetch, updateLectureLocal,
    updateConceptProgress: progressActions.updateConceptProgress
  });

  const migrationActions = useMigration({ user, setCourses });

  return {
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
    handleSignUp: authActions.handleSignUp,
    handleSignIn: authActions.handleSignIn,
    handleSignOut: authActions.handleSignOut,
    updateApiKey: authActions.updateApiKey,
    updateGender: authActions.updateGender,
    // Navigation
    setViewState,
    // Course Actions
    addCourse: courseActions.addCourse,
    updateCourse: courseActions.updateCourse,
    deleteCourse: courseActions.deleteCourse,
    // Lecture Actions
    addLecture: lectureActions.addLecture,
    updateLecture: updateLectureLocal,
    deleteLecture: lectureActions.deleteLecture,
    processLecture: lectureActions.processLecture,
    generateAudio: lectureActions.generateAudio,
    // Chat Actions
    sendChatMessage: chatActions.sendChatMessage,
    clearChatHistory: chatActions.clearChatHistory,
    // Insights Actions
    addInsight: insightActions.addInsight,
    deleteInsight: insightActions.deleteInsight,
    // Highlight Actions
    addHighlight: highlightActions.addHighlight,
    deleteHighlight: highlightActions.deleteHighlight,
    // Quiz Actions
    initQuiz: quizActions.initQuiz,
    generateNewQuiz: quizActions.generateNewQuiz,
    answerQuizQuestion: quizActions.answerQuizQuestion,
    resetQuiz: quizActions.resetQuiz,
    closeQuiz: quizActions.closeQuiz,
    // Flashcard Actions
    generateFlashcardsFromSummary: flashcardActions.generateFlashcardsFromSummary,
    startFlashcardLearning: flashcardActions.startFlashcardLearning,
    markFlashcardKnown: flashcardActions.markFlashcardKnown,
    markFlashcardUnknown: flashcardActions.markFlashcardUnknown,
    resetFlashcards: flashcardActions.resetFlashcards,
    retryUnknownFlashcards: flashcardActions.retryUnknownFlashcards,
    // Progress Actions
    getLectureProgress: progressActions.getLectureProgress,
    // Other
    toggleDarkMode,
    migrateData: migrationActions.migrateData,
    // Utilities (for meta-lecture)
    supabaseFetch,
    setCourses
  };
};
