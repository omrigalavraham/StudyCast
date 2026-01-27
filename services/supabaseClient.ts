import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lfqsttzweentcpeyohxu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcXN0dHp3ZWVudGNwZXlvaHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMzk5MjEsImV4cCI6MjA4NDgxNTkyMX0.PHtlJA7lHNxeXQxIBpXFth_0IYRxSzUZjG8bwLtzA78';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
});

// Types for database tables
export interface DbProfile {
  id: string;
  name: string;
  gemini_api_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCourse {
  id: string;
  user_id: string;
  name: string;
  code: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface DbLecture {
  id: string;
  course_id: string;
  user_id: string;
  title: string;
  date: string;
  status: 'EMPTY' | 'ANALYZING' | 'READY' | 'ERROR';
  processing_mode: 'SUMMARY' | 'FULL_LECTURE' | null;
  error_msg: string | null;
  summary_data: any | null; // JSONB
  file_name: string | null;
  file_mime_type: string | null;
  audio_url: string | null;
  audio_generated_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbChatMessage {
  id: string;
  lecture_id: string;
  user_id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface DbInsight {
  id: string;
  lecture_id: string;
  user_id: string;
  content: string;
  date: string;
  created_at: string;
}

export interface DbQuizSession {
  id: string;
  lecture_id: string;
  user_id: string;
  status: 'SETUP' | 'LOADING' | 'ACTIVE' | 'COMPLETED';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  question_count: number;
  questions: any[]; // JSONB
  user_answers: Record<string, number>; // JSONB
  score: number;
  created_at: string;
  updated_at: string;
}

export interface DbConceptProgress {
  id: string;
  lecture_id: string;
  user_id: string;
  concept_index: number;
  concept_text: string;
  quiz_correct: number;
  quiz_incorrect: number;
  flashcard_ratings: number[]; // JSONB array
  last_flashcard_rating: number | null;
  mastery_score: number;
  mastery_level: 'NOT_STARTED' | 'WEAK' | 'LEARNING' | 'STRONG' | 'MASTERED';
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}
