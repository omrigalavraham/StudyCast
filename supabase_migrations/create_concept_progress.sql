-- Create concept_progress table for tracking learning progress per concept
CREATE TABLE IF NOT EXISTS concept_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  concept_index INTEGER NOT NULL,
  concept_text TEXT NOT NULL,
  quiz_correct INTEGER DEFAULT 0,
  quiz_incorrect INTEGER DEFAULT 0,
  flashcard_ratings JSONB DEFAULT '[]'::jsonb,
  last_flashcard_rating INTEGER,
  mastery_score INTEGER DEFAULT 0,
  mastery_level TEXT DEFAULT 'NOT_STARTED' CHECK (mastery_level IN ('NOT_STARTED', 'WEAK', 'LEARNING', 'STRONG', 'MASTERED')),
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one progress record per concept per user per lecture
  UNIQUE(lecture_id, user_id, concept_index)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_concept_progress_user_lecture ON concept_progress(user_id, lecture_id);
CREATE INDEX IF NOT EXISTS idx_concept_progress_mastery ON concept_progress(user_id, mastery_level);

-- Enable RLS
ALTER TABLE concept_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own concept progress"
  ON concept_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own concept progress"
  ON concept_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own concept progress"
  ON concept_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own concept progress"
  ON concept_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_concept_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_concept_progress_updated_at
  BEFORE UPDATE ON concept_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_concept_progress_updated_at();
