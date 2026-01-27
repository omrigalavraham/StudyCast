import { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import * as db from '../services/supabaseService';
import { Course, Lecture, ViewState, ProcessingMode, ScriptLine, ChatMessage, Insight, QuizSession, QuizSettings, Flashcard, FlashcardSession, ConceptProgress, MasteryLevel, LectureProgress } from '../types';
import { analyzePresentation, generatePodcastAudio, chatWithLecture, generateQuiz } from '../services/geminiService';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  gender: 'male' | 'female' | null;
  apiKey: string | null;
}

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

      // Set a 4 second timeout - slight grace period for Supabase to initialize
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
        // Check localStorage for stored session
        const storedSession = localStorage.getItem('sb-lfqsttzweentcpeyohxu-auth-token');

        if (!storedSession) {
          console.log('[Auth] No stored session found');
          // Don't kill loading yet, let onAuthStateChange have a chance to fire 'SIGNED_OUT' or 'SIGNED_IN'
          // But clear timeout is needed so we don't wait forever if Supabase is slow
          return;
        }

        const sessionData = JSON.parse(storedSession);

        // Check plain JS token expiration considering clock skew
        const now = Math.floor(Date.now() / 1000);
        if (sessionData.expires_at && sessionData.expires_at < now) {
          console.log('[Auth] Stored session expired. Waiting for onAuthStateChange refresh.');
          return; // Let duplicate onAuthStateChange logic handle the refresh
        }

        if (sessionData?.user) {
          // Valid session found locally - optimize by showing it eagerly WHILE we verify/refresh
          console.log('[Auth] Valid local session found, initializing eager state');

          let profile = await fetchProfile(sessionData.user.id, sessionData.access_token);

          if (mounted) {
            setUser({
              id: sessionData.user.id,
              email: sessionData.user.email || '',
              name: profile?.name || sessionData.user.user_metadata?.name || 'משתמש',
              gender: profile?.gender || null, // Priority to DB profile
              apiKey: profile?.gemini_api_key || null // Priority to DB profile
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] onAuthStateChange:', event, session?.user?.id);

      if (event === 'SIGNED_IN' && session?.user && mounted) {
        // Fetch fresh profile data using the guaranteed fresh token
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

    // Handle empty responses (PATCH/DELETE often return empty body)
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

      // Theme
      const savedTheme = localStorage.getItem('studycast_theme');
      if (savedTheme === 'dark') setIsDarkMode(true);

      if (!user) {
        console.log('[useSupabaseStore] No user, setting isDataLoaded=true');
        setIsDataLoaded(true);
        return;
      }

      try {
        console.log('[useSupabaseStore] Loading all data for user:', user.id);

        // 1. Load courses
        const coursesData = await supabaseFetch(`/courses?user_id=eq.${user.id}&select=*&order=created_at.desc`);
        console.log('[useSupabaseStore] Courses:', coursesData?.length || 0);

        if (!coursesData || coursesData.length === 0) {
          setCourses([]);
          setIsDataLoaded(true);
          return;
        }

        // 2. Load all lectures for user
        const lecturesData = await supabaseFetch(`/lectures?user_id=eq.${user.id}&select=*&order=created_at.desc`);
        console.log('[useSupabaseStore] Lectures:', lecturesData?.length || 0);

        // 3. Load all chat messages for user
        const chatData = await supabaseFetch(`/chat_messages?user_id=eq.${user.id}&select=*&order=timestamp.asc`);
        console.log('[useSupabaseStore] Chat messages:', chatData?.length || 0);

        // 4. Load all insights for user
        const insightsData = await supabaseFetch(`/insights?user_id=eq.${user.id}&select=*&order=created_at.desc`);
        console.log('[useSupabaseStore] Insights:', insightsData?.length || 0);

        // 5. Load all quiz sessions for user
        const quizData = await supabaseFetch(`/quiz_sessions?user_id=eq.${user.id}&select=*`);
        console.log('[useSupabaseStore] Quiz sessions:', quizData?.length || 0);

        // 6. Load all flashcard sessions for user
        const flashcardsData = await supabaseFetch(`/flashcard_sessions?user_id=eq.${user.id}&select=*`);
        console.log('[useSupabaseStore] Flashcard sessions:', flashcardsData?.length || 0);

        // Group data by lecture_id
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

        // Helper to download audio from storage
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

        // Group lectures by course_id and load audio
        const lecturesByCourse: Record<string, Lecture[]> = {};
        for (const l of (lecturesData || [])) {
          if (!lecturesByCourse[l.course_id]) lecturesByCourse[l.course_id] = [];

          // Download audio if exists
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
            flashcards: flashcardsByLecture[l.id]
          });
        }

        // Build courses with lectures
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

  // =============================================
  // AUTH ACTIONS
  // =============================================

  const handleSignUp = async (email: string, password: string, name: string) => {
    const result = await db.signUp(email, password, name);
    return result;
  };

  const handleSignIn = async (email: string, password: string) => {
    const result = await db.signIn(email, password);
    return result;
  };

  const handleSignOut = async () => {
    // Clear localStorage session
    localStorage.removeItem('sb-lfqsttzweentcpeyohxu-auth-token');
    setUser(null);
    setCourses([]);
    setViewState({ type: 'DASHBOARD' });
  };

  const updateApiKey = async (apiKey: string) => {
    if (!user) return;
    await supabaseFetch(`/profiles?id=eq.${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ gemini_api_key: apiKey })
    });
    setUser({ ...user, apiKey });
  };

  const updateGender = async (gender: 'male' | 'female') => {
    if (!user) return;
    await supabaseFetch(`/profiles?id=eq.${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ gender })
    });
    setUser({ ...user, gender });
  };

  // =============================================
  // COURSE ACTIONS
  // =============================================

  const addCourse = async (name: string) => {
    if (!user) return;

    const colors = ['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-purple-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const code = name.substring(0, 3).toUpperCase() + '-101';

    const storedSession = localStorage.getItem('sb-lfqsttzweentcpeyohxu-auth-token');
    const accessToken = storedSession ? JSON.parse(storedSession).access_token : null;

    try {
      console.log('[addCourse] Creating course:', name);
      const response = await fetch('https://lfqsttzweentcpeyohxu.supabase.co/rest/v1/courses', {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcXN0dHp3ZWVudGNwZXlvaHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMzk5MjEsImV4cCI6MjA4NDgxNTkyMX0.PHtlJA7lHNxeXQxIBpXFth_0IYRxSzUZjG8bwLtzA78',
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: user.id,
          name,
          code,
          color: randomColor
        })
      });
      const [newCourseData] = await response.json();
      console.log('[addCourse] Created:', newCourseData);

      if (newCourseData?.id) {
        const newCourse: Course = {
          id: newCourseData.id,
          name: newCourseData.name,
          code: newCourseData.code,
          color: newCourseData.color,
          lectures: []
        };
        setCourses(prev => [newCourse, ...prev]);
      }
    } catch (error) {
      console.error('Failed to add course:', error);
      throw error;
    }
  };

  const updateCourse = async (id: string, name: string) => {
    try {
      await supabaseFetch(`/courses?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name })
      });
      setCourses(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    } catch (error) {
      console.error('Failed to update course:', error);
      throw error;
    }
  };

  const deleteCourse = async (courseId: string) => {
    try {
      await supabaseFetch(`/courses?id=eq.${courseId}`, { method: 'DELETE' });
      setCourses(prev => prev.filter(c => c.id !== courseId));
      if (viewState.type !== 'DASHBOARD' && viewState.courseId === courseId) {
        setViewState({ type: 'DASHBOARD' });
      }
    } catch (error) {
      console.error('Failed to delete course:', error);
      throw error;
    }
  };

  // =============================================
  // LECTURE ACTIONS
  // =============================================

  const addLecture = async (courseId: string, name: string) => {
    if (!user) return;

    const today = new Date().toLocaleDateString('he-IL', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    try {
      const result = await supabaseFetch('/lectures', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          course_id: courseId,
          title: name,
          date: today,
          status: 'EMPTY'
        })
      });
      const newLectureData = result[0];
      console.log('[addLecture] Created:', newLectureData);

      if (newLectureData?.id) {
        const newLecture: Lecture = {
          id: newLectureData.id,
          title: newLectureData.title,
          date: newLectureData.date,
          status: 'EMPTY',
          chatHistory: [],
          insights: []
        };
        setCourses(prev => prev.map(c => {
          if (c.id === courseId) {
            return { ...c, lectures: [newLecture, ...c.lectures] };
          }
          return c;
        }));
      }
    } catch (error) {
      console.error('Failed to add lecture:', error);
      throw error;
    }
  };

  const updateLectureLocal = (courseId: string, lectureId: string, updates: Partial<Lecture>) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId) return l;
          return { ...l, ...updates };
        })
      };
    }));
  };

  const deleteLecture = async (courseId: string, lectureId: string) => {
    try {
      await supabaseFetch(`/lectures?id=eq.${lectureId}`, { method: 'DELETE' });
      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        return { ...c, lectures: c.lectures.filter(l => l.id !== lectureId) };
      }));
      if (viewState.type === 'LECTURE' && viewState.lectureId === lectureId) {
        setViewState({ type: 'COURSE', courseId });
      }
    } catch (error) {
      console.error('Failed to delete lecture:', error);
      throw error;
    }
  };

  const updateLectureInDB = async (lectureId: string, updates: Record<string, any>) => {
    await supabaseFetch(`/lectures?id=eq.${lectureId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  };

  const processLecture = async (courseId: string, lectureId: string, file: { base64: string; mimeType: string; name: string }, mode: ProcessingMode) => {
    if (!user || !user.apiKey) return;

    updateLectureLocal(courseId, lectureId, {
      fileData: file,
      status: 'ANALYZING',
      processingMode: mode,
      errorMsg: undefined
    });

    // Update DB with processing status
    await updateLectureInDB(lectureId, {
      status: 'ANALYZING',
      processing_mode: mode,
      file_name: file.name,
      file_mime_type: file.mimeType,
      error_msg: null
    });

    try {
      const result = await analyzePresentation(user.apiKey, file.base64, file.mimeType, mode, user.name, user.gender);

      // Update DB with result
      await updateLectureInDB(lectureId, {
        summary_data: result,
        status: 'READY'
      });

      updateLectureLocal(courseId, lectureId, {
        summaryData: result,
        status: 'READY'
      });
    } catch (err) {
      console.error(err);

      await updateLectureInDB(lectureId, {
        status: 'ERROR',
        error_msg: 'נכשל בניתוח המצגת. אנא נסה שוב.'
      });

      updateLectureLocal(courseId, lectureId, {
        status: 'ERROR',
        errorMsg: 'נכשל בניתוח המצגת. אנא נסה שוב.'
      });
    }
  };

  const generateAudio = async (courseId: string, lectureId: string, script: ScriptLine[]) => {
    if (!user || !user.apiKey) return;

    const currentCourse = courses.find(c => c.id === courseId);
    if (!currentCourse) return;
    const currentLecture = currentCourse.lectures.find(l => l.id === lectureId);
    if (!currentLecture) return;

    try {
      const { audioBase64, uniqueScript } = await generatePodcastAudio(user.apiKey, script, user.name, user.gender);

      const audioGeneratedDate = new Date().toLocaleString('he-IL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Upload audio to Supabase Storage
      const storedSession = localStorage.getItem('sb-lfqsttzweentcpeyohxu-auth-token');
      const accessToken = storedSession ? JSON.parse(storedSession).access_token : null;
      const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcXN0dHp3ZWVudGNwZXlvaHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMzk5MjEsImV4cCI6MjA4NDgxNTkyMX0.PHtlJA7lHNxeXQxIBpXFth_0IYRxSzUZjG8bwLtzA78';

      // Convert base64 to blob
      const byteCharacters = atob(audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: 'audio/mp3' });

      // Upload to storage - path: user_id/lecture_id.mp3
      const audioPath = `${user.id}/${lectureId}.mp3`;
      console.log('[generateAudio] Uploading audio to storage:', audioPath);

      const uploadResponse = await fetch(
        `https://lfqsttzweentcpeyohxu.supabase.co/storage/v1/object/audio-files/${audioPath}`,
        {
          method: 'POST',
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'audio/mp3',
            'x-upsert': 'true' // Overwrite if exists
          },
          body: audioBlob
        }
      );

      if (!uploadResponse.ok) {
        console.error('[generateAudio] Upload failed:', await uploadResponse.text());
        throw new Error('Failed to upload audio');
      }

      console.log('[generateAudio] Audio uploaded successfully');

      // Update summary data with timestamps in DB and audio_url
      const currentSummaryData = currentLecture.summaryData;
      await updateLectureInDB(lectureId, {
        summary_data: currentSummaryData ? { ...currentSummaryData, script: uniqueScript } : null,
        audio_generated_date: audioGeneratedDate,
        audio_url: audioPath
      });

      updateLectureLocal(courseId, lectureId, {
        audioBase64: audioBase64, // Keep in memory for immediate playback
        audioGeneratedDate,
        summaryData: currentSummaryData ? {
          ...currentSummaryData,
          script: uniqueScript
        } : undefined
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // =============================================
  // CHAT ACTIONS
  // =============================================

  const addChatMessageToDB = async (lectureId: string, role: 'user' | 'ai', content: string) => {
    await supabaseFetch('/chat_messages', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user?.id,
        lecture_id: lectureId,
        role,
        content,
        timestamp: new Date().toISOString()
      })
    });
  };

  const sendChatMessage = async (courseId: string, lectureId: string, message: string) => {
    if (!user || !user.apiKey || !activeLecture || !activeLecture.summaryData) return;

    // Add user message locally
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    const currentHistory = activeLecture.chatHistory || [];
    updateLectureLocal(courseId, lectureId, {
      chatHistory: [...currentHistory, userMsg]
    });

    // Save user message to DB
    await addChatMessageToDB(lectureId, 'user', message);

    // Get AI response
    const context = {
      summary: activeLecture.summaryData.summary,
      summaryPoints: activeLecture.summaryData.summaryPoints
    };

    try {
      const aiResponseText = await chatWithLecture(
        user.apiKey,
        context,
        currentHistory,
        message
      );

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'ai',
        content: aiResponseText,
        timestamp: new Date().toISOString()
      };

      // Save AI message to DB
      await addChatMessageToDB(lectureId, 'ai', aiResponseText);

      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          lectures: c.lectures.map(l => {
            if (l.id !== lectureId) return l;
            return { ...l, chatHistory: [...(l.chatHistory || []), aiMsg] };
          })
        };
      }));
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'ai',
        content: 'אופס, נתקלתי בשגיאה בתקשורת. אנא נסה שוב.',
        timestamp: new Date().toISOString()
      };

      await addChatMessageToDB(lectureId, 'ai', errorMsg.content);

      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          lectures: c.lectures.map(l => {
            if (l.id !== lectureId) return l;
            return { ...l, chatHistory: [...(l.chatHistory || []), errorMsg] };
          })
        };
      }));
    }
  };

  const clearChatHistory = async (courseId: string, lectureId: string) => {
    try {
      await supabaseFetch(`/chat_messages?lecture_id=eq.${lectureId}`, { method: 'DELETE' });
      updateLectureLocal(courseId, lectureId, { chatHistory: [] });
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  };

  // =============================================
  // INSIGHTS ACTIONS
  // =============================================

  const addInsight = async (courseId: string, lectureId: string, content: string) => {
    if (!user) return;

    const date = new Date().toLocaleDateString('he-IL', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    try {
      const result = await supabaseFetch('/insights', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          lecture_id: lectureId,
          content,
          date
        })
      });
      const newInsightData = result[0];

      if (newInsightData?.id) {
        const newInsight: Insight = {
          id: newInsightData.id,
          content: newInsightData.content,
          date: newInsightData.date
        };

        setCourses(prev => prev.map(c => {
          if (c.id !== courseId) return c;
          return {
            ...c,
            lectures: c.lectures.map(l => {
              if (l.id !== lectureId) return l;
              return { ...l, insights: [newInsight, ...(l.insights || [])] };
            })
          };
        }));
      }
    } catch (error) {
      console.error('Failed to add insight:', error);
    }
  };

  const deleteInsight = async (courseId: string, lectureId: string, insightId: string) => {
    try {
      await supabaseFetch(`/insights?id=eq.${insightId}`, { method: 'DELETE' });

      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          lectures: c.lectures.map(l => {
            if (l.id !== lectureId) return l;
            return {
              ...l,
              insights: (l.insights || []).filter(i => i.id !== insightId)
            };
          })
        };
      }));
    } catch (error) {
      console.error('Failed to delete insight:', error);
    }
  };

  // =============================================
  // QUIZ ACTIONS
  // =============================================

  const updateQuizInDB = async (lectureId: string, updates: Record<string, any>) => {
    await supabaseFetch(`/quiz_sessions?lecture_id=eq.${lectureId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  };

  const initQuiz = async (courseId: string, lectureId: string) => {
    if (!user) return;

    try {
      const result = await supabaseFetch('/quiz_sessions', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          lecture_id: lectureId,
          status: 'SETUP',
          difficulty: 'MEDIUM',
          question_count: 5,
          questions: [],
          user_answers: {},
          score: 0
        })
      });

      const quiz: QuizSession = {
        status: 'SETUP',
        settings: { difficulty: 'MEDIUM', questionCount: 5 },
        questions: [],
        userAnswers: {},
        score: 0
      };

      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          lectures: c.lectures.map(l => {
            if (l.id !== lectureId) return l;
            if (l.quiz) return l;
            return { ...l, quiz };
          })
        };
      }));
    } catch (error) {
      console.error('Failed to init quiz:', error);
    }
  };

  const generateNewQuiz = async (courseId: string, lectureId: string, settings: QuizSettings) => {
    if (!user || !user.apiKey || !activeLecture || !activeLecture.summaryData) return;

    // Set loading state
    await updateQuizInDB(lectureId, {
      status: 'LOADING',
      difficulty: settings.difficulty,
      question_count: settings.questionCount
    });

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId) return l;
          return {
            ...l,
            quiz: { ...(l.quiz!), status: 'LOADING', settings: settings as any }
          };
        })
      };
    }));

    const context = {
      summary: activeLecture.summaryData.summary,
      summaryPoints: activeLecture.summaryData.summaryPoints
    };

    try {
      const questions = await generateQuiz(user.apiKey, context, settings);

      await updateQuizInDB(lectureId, {
        status: 'ACTIVE',
        questions,
        user_answers: {},
        score: 0
      });

      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          lectures: c.lectures.map(l => {
            if (l.id !== lectureId) return l;
            return {
              ...l,
              quiz: {
                status: 'ACTIVE',
                settings: settings as any,
                questions,
                userAnswers: {},
                score: 0
              }
            };
          })
        };
      }));
    } catch (error) {
      console.error(error);
      await updateQuizInDB(lectureId, { status: 'SETUP' });

      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          lectures: c.lectures.map(l => {
            if (l.id !== lectureId) return l;
            return { ...l, quiz: { ...(l.quiz!), status: 'SETUP' } };
          })
        };
      }));
      alert('שגיאה ביצירת הבוחן. נסה שוב.');
    }
  };

  const answerQuizQuestion = async (courseId: string, lectureId: string, questionId: string, answerIdx: number) => {
    const lecture = courses.find(c => c.id === courseId)?.lectures.find(l => l.id === lectureId);
    if (!lecture?.quiz || !user) return;

    const question = lecture.quiz.questions.find(q => q.id === questionId);
    if (!question) return;

    const isCorrect = answerIdx === question.correctOptionIndex;
    const conceptIndex = question.conceptIndex ?? 0;

    // Update concept progress
    await updateConceptProgress(lectureId, conceptIndex, lecture.summaryData?.summaryPoints[conceptIndex]?.point || '', isCorrect, 'quiz');

    const newAnswers = { ...lecture.quiz.userAnswers, [questionId]: answerIdx };
    const isComplete = lecture.quiz.questions.every(q => newAnswers[q.id] !== undefined);

    let status = lecture.quiz.status;
    let score = lecture.quiz.score;

    if (isComplete) {
      status = 'COMPLETED';
      let correctCount = 0;
      lecture.quiz.questions.forEach(q => {
        if (newAnswers[q.id] === q.correctOptionIndex) correctCount++;
      });
      score = Math.round((correctCount / lecture.quiz.questions.length) * 100);
    }

    await updateQuizInDB(lectureId, {
      user_answers: newAnswers,
      status,
      score
    });

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId) return l;
          return {
            ...l,
            quiz: { ...l.quiz!, userAnswers: newAnswers, status: status as any, score }
          };
        })
      };
    }));
  };

  const resetQuiz = async (courseId: string, lectureId: string) => {
    await updateQuizInDB(lectureId, {
      status: 'ACTIVE',
      user_answers: {},
      score: 0
    });

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId) return l;
          return {
            ...l,
            quiz: { ...l.quiz!, status: 'ACTIVE', userAnswers: {}, score: 0 }
          };
        })
      };
    }));
  };

  const closeQuiz = async (courseId: string, lectureId: string) => {
    await supabaseFetch(`/quiz_sessions?lecture_id=eq.${lectureId}`, { method: 'DELETE' });

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId) return l;
          return { ...l, quiz: undefined };
        })
      };
    }));
  };

  // =============================================
  // LEARNING PROGRESS ACTIONS
  // =============================================

  const calculateMasteryLevel = (score: number): MasteryLevel => {
    if (score >= 90) return 'MASTERED';
    if (score >= 70) return 'STRONG';
    if (score >= 50) return 'LEARNING';
    if (score > 0) return 'WEAK';
    return 'NOT_STARTED';
  };

  const calculateMasteryScore = (quizCorrect: number, quizIncorrect: number, flashcardRatings: number[]): number => {
    let score = 50; // Start at 50%

    // Quiz impact: +15 for correct, -20 for incorrect
    score += quizCorrect * 15;
    score -= quizIncorrect * 20;

    // Flashcard impact: ratings are 1=hard, 2=medium, 3=easy
    if (flashcardRatings.length > 0) {
      const avgRating = flashcardRatings.reduce((a, b) => a + b, 0) / flashcardRatings.length;
      // avgRating 1 -> -10, avgRating 2 -> 0, avgRating 3 -> +10
      score += (avgRating - 2) * 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const updateConceptProgress = async (
    lectureId: string,
    conceptIndex: number,
    conceptText: string,
    isCorrect: boolean,
    source: 'quiz' | 'flashcard',
    flashcardRating?: number
  ) => {
    if (!user) return;

    try {
      // First, try to get existing progress
      const existingResponse = await supabaseFetch(
        `/concept_progress?lecture_id=eq.${lectureId}&user_id=eq.${user.id}&concept_index=eq.${conceptIndex}`,
        { method: 'GET' }
      );

      const existing = existingResponse?.[0];

      let quizCorrect = existing?.quiz_correct || 0;
      let quizIncorrect = existing?.quiz_incorrect || 0;
      let flashcardRatings: number[] = existing?.flashcard_ratings || [];

      if (source === 'quiz') {
        if (isCorrect) {
          quizCorrect++;
        } else {
          quizIncorrect++;
        }
      } else if (source === 'flashcard' && flashcardRating) {
        flashcardRatings.push(flashcardRating);
        // Keep only last 10 ratings
        if (flashcardRatings.length > 10) {
          flashcardRatings = flashcardRatings.slice(-10);
        }
      }

      const masteryScore = calculateMasteryScore(quizCorrect, quizIncorrect, flashcardRatings);
      const masteryLevel = calculateMasteryLevel(masteryScore);

      const progressData = {
        user_id: user.id,
        lecture_id: lectureId,
        concept_index: conceptIndex,
        concept_text: conceptText,
        quiz_correct: quizCorrect,
        quiz_incorrect: quizIncorrect,
        flashcard_ratings: flashcardRatings,
        last_flashcard_rating: flashcardRating || existing?.last_flashcard_rating || null,
        mastery_score: masteryScore,
        mastery_level: masteryLevel,
        last_reviewed_at: new Date().toISOString()
      };

      if (existing) {
        // Update existing
        await supabaseFetch(
          `/concept_progress?id=eq.${existing.id}`,
          { method: 'PATCH', body: JSON.stringify(progressData) }
        );
      } else {
        // Insert new
        await supabaseFetch('/concept_progress', {
          method: 'POST',
          body: JSON.stringify(progressData)
        });
      }

      console.log(`[Progress] Updated concept "${conceptText}" - Score: ${masteryScore}%, Level: ${masteryLevel}`);
    } catch (error) {
      console.error('[Progress] Failed to update concept progress:', error);
    }
  };

  const getLectureProgress = async (lectureId: string): Promise<LectureProgress | null> => {
    if (!user) return null;

    try {
      const response = await supabaseFetch(
        `/concept_progress?lecture_id=eq.${lectureId}&user_id=eq.${user.id}`,
        { method: 'GET' }
      );

      if (!response || response.length === 0) {
        return null;
      }

      const concepts: ConceptProgress[] = response.map((row: any) => ({
        id: row.id,
        lectureId: row.lecture_id,
        conceptIndex: row.concept_index,
        conceptText: row.concept_text,
        quizCorrect: row.quiz_correct,
        quizIncorrect: row.quiz_incorrect,
        flashcardRatings: row.flashcard_ratings || [],
        lastFlashcardRating: row.last_flashcard_rating,
        masteryScore: row.mastery_score,
        masteryLevel: row.mastery_level,
        lastReviewedAt: row.last_reviewed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      const overallMastery = concepts.length > 0
        ? Math.round(concepts.reduce((sum, c) => sum + c.masteryScore, 0) / concepts.length)
        : 0;

      const strongCount = concepts.filter(c => c.masteryScore >= 70).length;
      const weakCount = concepts.filter(c => c.masteryScore < 50 && c.masteryScore > 0).length;

      const lastStudiedAt = concepts
        .map(c => c.lastReviewedAt)
        .filter(Boolean)
        .sort()
        .reverse()[0];

      return {
        lectureId,
        concepts,
        overallMastery,
        strongCount,
        weakCount,
        lastStudiedAt
      };
    } catch (error) {
      console.error('[Progress] Failed to get lecture progress:', error);
      return null;
    }
  };

  // =============================================
  // FLASHCARD ACTIONS
  // =============================================

  const updateFlashcardsInDB = async (lectureId: string, updates: Record<string, any>) => {
    await supabaseFetch(`/flashcard_sessions?lecture_id=eq.${lectureId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  };

  const generateFlashcardsFromSummary = async (courseId: string, lectureId: string) => {
    if (!user) return;

    const course = courses.find(c => c.id === courseId);
    const lecture = course?.lectures.find(l => l.id === lectureId);
    if (!lecture?.summaryData?.summaryPoints) return;

    const cards: Flashcard[] = lecture.summaryData.summaryPoints.map((point, i) => ({
      id: crypto.randomUUID(),
      front: point.point,
      back: point.details,
      known: false
    }));

    try {
      // Create flashcard session in DB
      await supabaseFetch('/flashcard_sessions', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          lecture_id: lectureId,
          cards,
          current_index: 0,
          known_count: 0,
          status: 'IDLE'
        })
      });

      // Update local state
      updateLectureLocal(courseId, lectureId, {
        flashcards: { status: 'IDLE', cards, currentIndex: 0, knownCount: 0 }
      });
    } catch (error) {
      console.error('Failed to generate flashcards:', error);
    }
  };

  const startFlashcardLearning = async (courseId: string, lectureId: string) => {
    await updateFlashcardsInDB(lectureId, { status: 'LEARNING', current_index: 0 });

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId || !l.flashcards) return l;
          return {
            ...l,
            flashcards: { ...l.flashcards, status: 'LEARNING', currentIndex: 0 }
          };
        })
      };
    }));
  };

  const markFlashcardKnown = async (courseId: string, lectureId: string, difficulty: 1 | 2 | 3 = 3) => {
    // difficulty: 1=hard, 2=medium, 3=easy (default is easy since user marked as "known")
    const course = courses.find(c => c.id === courseId);
    const lecture = course?.lectures.find(l => l.id === lectureId);
    if (!lecture?.flashcards) return;

    const { cards, currentIndex, knownCount } = lecture.flashcards;
    const currentCard = cards[currentIndex];

    // Update concept progress with flashcard rating
    if (currentCard && lecture.summaryData?.summaryPoints) {
      const conceptText = currentCard.front;
      const conceptIndex = lecture.summaryData.summaryPoints.findIndex(p => p.point === conceptText);
      if (conceptIndex !== -1) {
        await updateConceptProgress(lectureId, conceptIndex, conceptText, true, 'flashcard', difficulty);
      }
    }

    const updatedCards = cards.map((card, idx) =>
      idx === currentIndex ? { ...card, known: true } : card
    );
    const newKnownCount = knownCount + 1;
    const nextIndex = currentIndex + 1;
    const isComplete = nextIndex >= cards.length;

    await updateFlashcardsInDB(lectureId, {
      cards: updatedCards,
      current_index: nextIndex,
      known_count: newKnownCount,
      status: isComplete ? 'COMPLETED' : 'LEARNING'
    });

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId || !l.flashcards) return l;
          return {
            ...l,
            flashcards: {
              status: isComplete ? 'COMPLETED' : 'LEARNING',
              cards: updatedCards,
              currentIndex: nextIndex,
              knownCount: newKnownCount
            }
          };
        })
      };
    }));
  };

  const markFlashcardUnknown = async (courseId: string, lectureId: string, difficulty: 1 | 2 | 3 = 1) => {
    // difficulty: 1=hard (default since user marked as "unknown"), 2=medium, 3=easy
    const course = courses.find(c => c.id === courseId);
    const lecture = course?.lectures.find(l => l.id === lectureId);
    if (!lecture?.flashcards) return;

    const { cards, currentIndex, knownCount } = lecture.flashcards;
    const currentCard = cards[currentIndex];

    // Update concept progress with flashcard rating (hard)
    if (currentCard && lecture.summaryData?.summaryPoints) {
      const conceptText = currentCard.front;
      const conceptIndex = lecture.summaryData.summaryPoints.findIndex(p => p.point === conceptText);
      if (conceptIndex !== -1) {
        await updateConceptProgress(lectureId, conceptIndex, conceptText, false, 'flashcard', difficulty);
      }
    }

    const updatedCards = cards.map((card, idx) =>
      idx === currentIndex ? { ...card, known: false } : card
    );
    const nextIndex = currentIndex + 1;
    const isComplete = nextIndex >= cards.length;

    await updateFlashcardsInDB(lectureId, {
      cards: updatedCards,
      current_index: nextIndex,
      status: isComplete ? 'COMPLETED' : 'LEARNING'
    });

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId || !l.flashcards) return l;
          return {
            ...l,
            flashcards: {
              status: isComplete ? 'COMPLETED' : 'LEARNING',
              cards: updatedCards,
              currentIndex: nextIndex,
              knownCount
            }
          };
        })
      };
    }));
  };

  const resetFlashcards = async (courseId: string, lectureId: string) => {
    const course = courses.find(c => c.id === courseId);
    const lecture = course?.lectures.find(l => l.id === lectureId);
    if (!lecture?.flashcards) return;

    const resetCards = lecture.flashcards.cards.map(card => ({ ...card, known: false }));

    await updateFlashcardsInDB(lectureId, {
      cards: resetCards,
      current_index: 0,
      known_count: 0,
      status: 'IDLE'
    });

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId || !l.flashcards) return l;
          return {
            ...l,
            flashcards: {
              status: 'IDLE',
              cards: resetCards,
              currentIndex: 0,
              knownCount: 0
            }
          };
        })
      };
    }));
  };

  const retryUnknownFlashcards = async (courseId: string, lectureId: string) => {
    const course = courses.find(c => c.id === courseId);
    const lecture = course?.lectures.find(l => l.id === lectureId);
    if (!lecture?.flashcards) return;

    // Filter only unknown cards and reset their known state
    const unknownCards = lecture.flashcards.cards
      .filter(card => !card.known)
      .map(card => ({ ...card, known: false }));

    if (unknownCards.length === 0) return;

    await updateFlashcardsInDB(lectureId, {
      cards: unknownCards,
      current_index: 0,
      known_count: 0,
      status: 'LEARNING'
    });

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId || !l.flashcards) return l;
          return {
            ...l,
            flashcards: {
              status: 'LEARNING',
              cards: unknownCards,
              currentIndex: 0,
              knownCount: 0
            }
          };
        })
      };
    }));
  };

  // =============================================
  // MIGRATION (using fetch directly)
  // =============================================

  const migrateData = async (oldCourses: Course[]) => {
    if (!user) return;

    const storedSession = localStorage.getItem('sb-lfqsttzweentcpeyohxu-auth-token');
    const accessToken = storedSession ? JSON.parse(storedSession).access_token : null;
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcXN0dHp3ZWVudGNwZXlvaHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMzk5MjEsImV4cCI6MjA4NDgxNTkyMX0.PHtlJA7lHNxeXQxIBpXFth_0IYRxSzUZjG8bwLtzA78';
    const baseUrl = 'https://lfqsttzweentcpeyohxu.supabase.co/rest/v1';

    const headers = {
      'apikey': apiKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    console.log('[Migration] Starting migration for', oldCourses.length, 'courses');

    for (const course of oldCourses) {
      try {
        // Create course
        console.log('[Migration] Creating course:', course.name);
        const courseResponse = await fetch(`${baseUrl}/courses`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            user_id: user.id,
            name: course.name,
            code: course.code,
            color: course.color
          })
        });
        const [newCourse] = await courseResponse.json();
        console.log('[Migration] Course created:', newCourse?.id);

        if (!newCourse?.id) {
          console.error('[Migration] Failed to create course:', course.name);
          continue;
        }

        // Create lectures
        for (const lecture of course.lectures) {
          console.log('[Migration] Creating lecture:', lecture.title);
          const lectureResponse = await fetch(`${baseUrl}/lectures`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              user_id: user.id,
              course_id: newCourse.id,
              title: lecture.title,
              date: lecture.date,
              status: lecture.status,
              processing_mode: lecture.processingMode || null,
              error_msg: lecture.errorMsg || null,
              summary_data: lecture.summaryData || null,
              file_name: lecture.fileData?.name || null,
              file_mime_type: lecture.fileData?.mimeType || null,
              audio_generated_date: lecture.audioGeneratedDate || null
            })
          });
          const [newLecture] = await lectureResponse.json();
          console.log('[Migration] Lecture created:', newLecture?.id);

          if (!newLecture?.id) {
            console.error('[Migration] Failed to create lecture:', lecture.title);
            continue;
          }

          // Migrate chat history
          if (lecture.chatHistory && lecture.chatHistory.length > 0) {
            console.log('[Migration] Migrating', lecture.chatHistory.length, 'chat messages');
            for (const msg of lecture.chatHistory) {
              await fetch(`${baseUrl}/chat_messages`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  user_id: user.id,
                  lecture_id: newLecture.id,
                  role: msg.role,
                  content: msg.content,
                  timestamp: msg.timestamp
                })
              });
            }
          }

          // Migrate insights
          if (lecture.insights && lecture.insights.length > 0) {
            console.log('[Migration] Migrating', lecture.insights.length, 'insights');
            for (const insight of lecture.insights) {
              await fetch(`${baseUrl}/insights`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  user_id: user.id,
                  lecture_id: newLecture.id,
                  content: insight.content,
                  date: insight.date
                })
              });
            }
          }
        }
      } catch (error) {
        console.error('[Migration] Error migrating course:', course.name, error);
      }
    }

    console.log('[Migration] Complete! Reloading courses...');

    // Reload courses after migration using fetch
    const response = await fetch(
      `${baseUrl}/courses?user_id=eq.${user.id}&select=*&order=created_at.desc`,
      { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${accessToken}` } }
    );
    const coursesData = await response.json();

    // Also fetch lectures for each course
    const migratedCourses: Course[] = [];
    for (const c of coursesData) {
      const lecturesResponse = await fetch(
        `${baseUrl}/lectures?course_id=eq.${c.id}&select=*&order=created_at.desc`,
        { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${accessToken}` } }
      );
      const lecturesData = await lecturesResponse.json();

      migratedCourses.push({
        id: c.id,
        name: c.name,
        code: c.code,
        color: c.color,
        lectures: (lecturesData || []).map((l: any) => ({
          id: l.id,
          title: l.title,
          date: l.date,
          status: l.status,
          processingMode: l.processing_mode,
          errorMsg: l.error_msg,
          summaryData: l.summary_data,
          fileData: l.file_name ? { name: l.file_name, mimeType: l.file_mime_type, base64: '' } : undefined,
          audioGeneratedDate: l.audio_generated_date,
          chatHistory: [],
          insights: []
        }))
      });
    }

    setCourses(migratedCourses);
    console.log('[Migration] Loaded', migratedCourses.length, 'courses');
  };

  // =============================================
  // TOGGLE DARK MODE
  // =============================================

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

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
    updateLecture: updateLectureLocal,
    deleteLecture,
    processLecture,
    generateAudio,
    // Chat Actions
    sendChatMessage,
    clearChatHistory,
    // Insights Actions
    addInsight,
    deleteInsight,
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
    migrateData
  };
};
