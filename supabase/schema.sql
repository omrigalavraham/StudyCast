-- =============================================
-- StudyCast Hebrew - Supabase Database Schema
-- =============================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- Enable UUID extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES TABLE (extends Supabase Auth)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female')), -- For personalized podcast voice and dialogue
    gemini_api_key TEXT, -- Encrypted in production, stored here for simplicity
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- 2. COURSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'bg-indigo-500',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Policies for courses
CREATE POLICY "Users can view own courses" ON courses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own courses" ON courses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses" ON courses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses" ON courses
    FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_courses_user_id ON courses(user_id);

-- =============================================
-- 3. LECTURES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS lectures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'EMPTY' CHECK (status IN ('EMPTY', 'ANALYZING', 'READY', 'ERROR')),
    processing_mode TEXT CHECK (processing_mode IN ('SUMMARY', 'FULL_LECTURE')),
    error_msg TEXT,
    -- Summary Data (stored as JSONB)
    summary_data JSONB,
    -- File data (original upload info, not the actual file)
    file_name TEXT,
    file_mime_type TEXT,
    -- Audio
    audio_url TEXT, -- URL to audio file in Storage bucket
    audio_generated_date TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;

-- Policies for lectures
CREATE POLICY "Users can view own lectures" ON lectures
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lectures" ON lectures
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lectures" ON lectures
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lectures" ON lectures
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_lectures_course_id ON lectures(course_id);
CREATE INDEX idx_lectures_user_id ON lectures(user_id);

-- =============================================
-- 4. CHAT MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_messages
CREATE POLICY "Users can view own chat messages" ON chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages" ON chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_chat_messages_lecture_id ON chat_messages(lecture_id);

-- =============================================
-- 5. INSIGHTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Policies for insights
CREATE POLICY "Users can view own insights" ON insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights" ON insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights" ON insights
    FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_insights_lecture_id ON insights(lecture_id);

-- =============================================
-- 6. QUIZ SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'SETUP' CHECK (status IN ('SETUP', 'LOADING', 'ACTIVE', 'COMPLETED')),
    difficulty TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    question_count INT NOT NULL DEFAULT 5,
    questions JSONB DEFAULT '[]'::JSONB,
    user_answers JSONB DEFAULT '{}'::JSONB,
    score INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for quiz_sessions
CREATE POLICY "Users can view own quiz sessions" ON quiz_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz sessions" ON quiz_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz sessions" ON quiz_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quiz sessions" ON quiz_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_quiz_sessions_lecture_id ON quiz_sessions(lecture_id);

-- =============================================
-- 7. FLASHCARD SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS flashcard_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cards JSONB NOT NULL DEFAULT '[]'::JSONB,
    current_index INT DEFAULT 0,
    known_count INT DEFAULT 0,
    status TEXT DEFAULT 'IDLE' CHECK (status IN ('IDLE', 'LEARNING', 'COMPLETED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE flashcard_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for flashcard_sessions
CREATE POLICY "Users can view own flashcard sessions" ON flashcard_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcard sessions" ON flashcard_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard sessions" ON flashcard_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcard sessions" ON flashcard_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_flashcard_sessions_lecture_id ON flashcard_sessions(lecture_id);

-- =============================================
-- 8. FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lectures_updated_at
    BEFORE UPDATE ON lectures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_sessions_updated_at
    BEFORE UPDATE ON quiz_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcard_sessions_updated_at
    BEFORE UPDATE ON flashcard_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 8. AUTO-CREATE PROFILE ON USER SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'משתמש חדש'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 9. STORAGE BUCKET FOR AUDIO FILES
-- =============================================
-- Run this separately in Supabase Dashboard > Storage > Create Bucket
-- Or use this SQL:

INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own audio files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'audio-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own audio files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'audio-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own audio files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'audio-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
