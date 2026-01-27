import { supabase, DbCourse, DbLecture, DbChatMessage, DbInsight, DbQuizSession, DbProfile } from './supabaseClient';
import { Course, Lecture, ChatMessage, Insight, QuizSession, SummaryData } from '../types';

// =============================================
// AUTH FUNCTIONS
// =============================================

export const signUp = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  });
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// =============================================
// PROFILE FUNCTIONS
// =============================================

export const getProfile = async (userId: string): Promise<DbProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
};

export const updateProfile = async (userId: string, updates: Partial<DbProfile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const saveGeminiApiKey = async (userId: string, apiKey: string) => {
  return updateProfile(userId, { gemini_api_key: apiKey });
};

// =============================================
// COURSES FUNCTIONS
// =============================================

export const getCourses = async (userId: string): Promise<Course[]> => {
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!courses) return [];

  // Fetch lectures for all courses
  const courseIds = courses.map(c => c.id);
  const { data: lectures, error: lecturesError } = await supabase
    .from('lectures')
    .select('*')
    .in('course_id', courseIds)
    .order('created_at', { ascending: false });

  if (lecturesError) throw lecturesError;

  // Fetch chat messages, insights, and quizzes for all lectures
  const lectureIds = lectures?.map(l => l.id) || [];

  let chatMessages: DbChatMessage[] = [];
  let insights: DbInsight[] = [];
  let quizSessions: DbQuizSession[] = [];

  if (lectureIds.length > 0) {
    const [chatRes, insightsRes, quizRes] = await Promise.all([
      supabase.from('chat_messages').select('*').in('lecture_id', lectureIds).order('timestamp', { ascending: true }),
      supabase.from('insights').select('*').in('lecture_id', lectureIds).order('created_at', { ascending: false }),
      supabase.from('quiz_sessions').select('*').in('lecture_id', lectureIds)
    ]);

    if (chatRes.error) throw chatRes.error;
    if (insightsRes.error) throw insightsRes.error;
    if (quizRes.error) throw quizRes.error;

    chatMessages = chatRes.data || [];
    insights = insightsRes.data || [];
    quizSessions = quizRes.data || [];
  }

  // Transform to app structure
  return courses.map(course => ({
    id: course.id,
    name: course.name,
    code: course.code,
    color: course.color,
    lectures: (lectures || [])
      .filter(l => l.course_id === course.id)
      .map(l => dbLectureToLecture(l, chatMessages, insights, quizSessions))
  }));
};

export const createCourse = async (userId: string, name: string, code: string, color: string): Promise<Course> => {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      user_id: userId,
      name,
      code,
      color
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    code: data.code,
    color: data.color,
    lectures: []
  };
};

export const updateCourse = async (courseId: string, updates: { name?: string; code?: string; color?: string }) => {
  const { error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId);

  if (error) throw error;
};

export const deleteCourse = async (courseId: string) => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) throw error;
};

// =============================================
// LECTURES FUNCTIONS
// =============================================

const dbLectureToLecture = (
  l: DbLecture,
  chatMessages: DbChatMessage[],
  insights: DbInsight[],
  quizSessions: DbQuizSession[]
): Lecture => {
  const quiz = quizSessions.find(q => q.lecture_id === l.id);

  return {
    id: l.id,
    title: l.title,
    date: l.date,
    status: l.status,
    processingMode: l.processing_mode || undefined,
    fileData: l.file_name ? {
      base64: '', // We don't store the actual file anymore
      mimeType: l.file_mime_type || '',
      name: l.file_name
    } : undefined,
    summaryData: l.summary_data as SummaryData | undefined,
    audioBase64: undefined, // Audio is now stored in Storage, loaded on demand
    audioGeneratedDate: l.audio_generated_date || undefined,
    errorMsg: l.error_msg || undefined,
    chatHistory: chatMessages
      .filter(m => m.lecture_id === l.id)
      .map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      })),
    insights: insights
      .filter(i => i.lecture_id === l.id)
      .map(i => ({
        id: i.id,
        content: i.content,
        date: i.date
      })),
    quiz: quiz ? {
      status: quiz.status,
      settings: {
        difficulty: quiz.difficulty,
        questionCount: quiz.question_count
      },
      questions: quiz.questions,
      userAnswers: quiz.user_answers,
      score: quiz.score
    } : undefined
  };
};

export const createLecture = async (userId: string, courseId: string, title: string): Promise<Lecture> => {
  const date = new Date().toLocaleDateString('he-IL');

  const { data, error } = await supabase
    .from('lectures')
    .insert({
      user_id: userId,
      course_id: courseId,
      title,
      date,
      status: 'EMPTY'
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    date: data.date,
    status: 'EMPTY'
  };
};

export const updateLecture = async (lectureId: string, updates: Partial<DbLecture>) => {
  const { error } = await supabase
    .from('lectures')
    .update(updates)
    .eq('id', lectureId);

  if (error) throw error;
};

export const deleteLecture = async (lectureId: string) => {
  // Also delete audio file from storage if exists
  const { data: lecture } = await supabase
    .from('lectures')
    .select('audio_url, user_id')
    .eq('id', lectureId)
    .single();

  if (lecture?.audio_url) {
    const path = `${lecture.user_id}/${lectureId}.wav`;
    await supabase.storage.from('audio-files').remove([path]);
  }

  const { error } = await supabase
    .from('lectures')
    .delete()
    .eq('id', lectureId);

  if (error) throw error;
};

// =============================================
// AUDIO STORAGE FUNCTIONS
// =============================================

export const uploadAudio = async (userId: string, lectureId: string, audioBase64: string): Promise<string> => {
  // Convert base64 to blob
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create WAV header
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const dataSize = bytes.length;
  const headerSize = 44;
  const fileSize = headerSize + dataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Copy audio data
  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(bytes, headerSize);

  const blob = new Blob([wavBytes], { type: 'audio/wav' });
  const path = `${userId}/${lectureId}.wav`;

  const { error: uploadError } = await supabase.storage
    .from('audio-files')
    .upload(path, blob, { upsert: true });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data } = supabase.storage.from('audio-files').getPublicUrl(path);

  // Update lecture with audio URL
  await updateLecture(lectureId, {
    audio_url: data.publicUrl,
    audio_generated_date: new Date().toLocaleString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  });

  return data.publicUrl;
};

export const getAudioUrl = async (userId: string, lectureId: string): Promise<string | null> => {
  const path = `${userId}/${lectureId}.wav`;

  const { data } = await supabase.storage
    .from('audio-files')
    .createSignedUrl(path, 3600); // 1 hour expiry

  return data?.signedUrl || null;
};

// =============================================
// CHAT MESSAGES FUNCTIONS
// =============================================

export const addChatMessage = async (
  userId: string,
  lectureId: string,
  role: 'user' | 'ai',
  content: string
): Promise<ChatMessage> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      lecture_id: lectureId,
      role,
      content
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    role: data.role,
    content: data.content,
    timestamp: data.timestamp
  };
};

export const clearChatHistory = async (lectureId: string) => {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('lecture_id', lectureId);

  if (error) throw error;
};

// =============================================
// INSIGHTS FUNCTIONS
// =============================================

export const addInsight = async (
  userId: string,
  lectureId: string,
  content: string
): Promise<Insight> => {
  const date = new Date().toLocaleDateString('he-IL');

  const { data, error } = await supabase
    .from('insights')
    .insert({
      user_id: userId,
      lecture_id: lectureId,
      content,
      date
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    content: data.content,
    date: data.date
  };
};

export const deleteInsight = async (insightId: string) => {
  const { error } = await supabase
    .from('insights')
    .delete()
    .eq('id', insightId);

  if (error) throw error;
};

// =============================================
// QUIZ FUNCTIONS
// =============================================

export const createQuizSession = async (
  userId: string,
  lectureId: string
): Promise<QuizSession> => {
  // Check if quiz already exists
  const { data: existing } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('lecture_id', lectureId)
    .single();

  if (existing) {
    return {
      status: existing.status,
      settings: {
        difficulty: existing.difficulty,
        questionCount: existing.question_count
      },
      questions: existing.questions,
      userAnswers: existing.user_answers,
      score: existing.score
    };
  }

  const { data, error } = await supabase
    .from('quiz_sessions')
    .insert({
      user_id: userId,
      lecture_id: lectureId,
      status: 'SETUP',
      difficulty: 'MEDIUM',
      question_count: 5,
      questions: [],
      user_answers: {},
      score: 0
    })
    .select()
    .single();

  if (error) throw error;

  return {
    status: data.status,
    settings: {
      difficulty: data.difficulty,
      questionCount: data.question_count
    },
    questions: data.questions,
    userAnswers: data.user_answers,
    score: data.score
  };
};

export const updateQuizSession = async (
  lectureId: string,
  updates: Partial<{
    status: string;
    difficulty: string;
    question_count: number;
    questions: any[];
    user_answers: Record<string, number>;
    score: number;
  }>
) => {
  const { error } = await supabase
    .from('quiz_sessions')
    .update(updates)
    .eq('lecture_id', lectureId);

  if (error) throw error;
};

export const deleteQuizSession = async (lectureId: string) => {
  const { error } = await supabase
    .from('quiz_sessions')
    .delete()
    .eq('lecture_id', lectureId);

  if (error) throw error;
};

// =============================================
// MIGRATION HELPER (IndexedDB -> Supabase)
// =============================================

export const migrateFromIndexedDB = async (
  userId: string,
  courses: Course[]
): Promise<void> => {
  console.log('Starting migration from IndexedDB to Supabase...');

  for (const course of courses) {
    // Create course
    const { data: newCourse, error: courseError } = await supabase
      .from('courses')
      .insert({
        user_id: userId,
        name: course.name,
        code: course.code,
        color: course.color
      })
      .select()
      .single();

    if (courseError) {
      console.error('Failed to migrate course:', course.name, courseError);
      continue;
    }

    console.log('Migrated course:', course.name);

    // Create lectures
    for (const lecture of course.lectures) {
      const { data: newLecture, error: lectureError } = await supabase
        .from('lectures')
        .insert({
          user_id: userId,
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
        .select()
        .single();

      if (lectureError) {
        console.error('Failed to migrate lecture:', lecture.title, lectureError);
        continue;
      }

      console.log('Migrated lecture:', lecture.title);

      // Upload audio if exists
      if (lecture.audioBase64) {
        try {
          await uploadAudio(userId, newLecture.id, lecture.audioBase64);
          console.log('Migrated audio for lecture:', lecture.title);
        } catch (audioError) {
          console.error('Failed to migrate audio:', lecture.title, audioError);
        }
      }

      // Migrate chat history
      if (lecture.chatHistory && lecture.chatHistory.length > 0) {
        for (const msg of lecture.chatHistory) {
          await supabase.from('chat_messages').insert({
            user_id: userId,
            lecture_id: newLecture.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          });
        }
        console.log('Migrated chat history for lecture:', lecture.title);
      }

      // Migrate insights
      if (lecture.insights && lecture.insights.length > 0) {
        for (const insight of lecture.insights) {
          await supabase.from('insights').insert({
            user_id: userId,
            lecture_id: newLecture.id,
            content: insight.content,
            date: insight.date
          });
        }
        console.log('Migrated insights for lecture:', lecture.title);
      }

      // Migrate quiz
      if (lecture.quiz) {
        await supabase.from('quiz_sessions').insert({
          user_id: userId,
          lecture_id: newLecture.id,
          status: lecture.quiz.status,
          difficulty: lecture.quiz.settings.difficulty,
          question_count: lecture.quiz.settings.questionCount,
          questions: lecture.quiz.questions,
          user_answers: lecture.quiz.userAnswers,
          score: lecture.quiz.score
        });
        console.log('Migrated quiz for lecture:', lecture.title);
      }
    }
  }

  console.log('Migration completed!');
};
