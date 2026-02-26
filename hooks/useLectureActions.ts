import { Dispatch, SetStateAction } from 'react';
import { Course, Lecture, ViewState, ProcessingMode, ScriptLine } from '../types';
import { analyzePresentation, generatePodcastAudio } from '../services/geminiService';
import { AppUser, SupabaseFetchFn, UpdateLectureLocalFn } from './storeTypes';

interface UseLectureDeps {
  user: AppUser | null;
  courses: Course[];
  setCourses: Dispatch<SetStateAction<Course[]>>;
  viewState: ViewState;
  setViewState: Dispatch<SetStateAction<ViewState>>;
  supabaseFetch: SupabaseFetchFn;
  updateLectureLocal: UpdateLectureLocalFn;
}

export const useLectureActions = ({ user, courses, setCourses, viewState, setViewState, supabaseFetch, updateLectureLocal }: UseLectureDeps) => {

  const updateLectureInDB = async (lectureId: string, updates: Record<string, any>) => {
    await supabaseFetch(`/lectures?id=eq.${lectureId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  };

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

  return { addLecture, deleteLecture, processLecture, generateAudio, updateLectureInDB };
};
