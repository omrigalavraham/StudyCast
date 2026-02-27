# StudyCast Hebrew - Database Documentation

## Overview
The application uses Supabase as a backend-as-a-service, providing:
- **PostgreSQL Database** - Relational data storage
- **Row Level Security (RLS)** - Per-user data isolation
- **Storage Buckets** - File storage for audio files
- **Authentication** - Email/password auth with session management

---

## Entity Relationship Diagram
```
auth.users (Supabase managed)
    │
    ├──< profiles (1:1)
    │
    └──< courses (1:N)
            │
            └──< lectures (1:N)
                    │
                    ├──< chat_messages (1:N)
                    ├──< insights (1:N)
                    ├──< highlights (1:N)
                    ├──< quiz_sessions (1:1)
                    ├──< flashcard_sessions (1:1)
                    └──< concept_progress (1:N, per concept)
```

---

## Tables

### 1. `profiles`
Extends Supabase Auth users with additional profile data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | References `auth.users(id)` |
| `name` | TEXT | User display name |
| `gender` | TEXT | 'male' or 'female' (for AI voice selection) |
| `gemini_api_key` | TEXT | User's Gemini API key (nullable) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Auto-updated on change |

**Trigger:** Auto-created on signup via `handle_new_user()` trigger.

**API:**
```
GET    /profiles?id=eq.{user_id}&select=*
PATCH  /profiles?id=eq.{user_id}  →  { gemini_api_key, gender, name }
```

---

### 2. `courses`
User's courses/subjects.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK) | References `auth.users(id)` |
| `name` | TEXT | Course name |
| `code` | TEXT | Course code (e.g., "CS-101") |
| `color` | TEXT | Tailwind color class (e.g., "bg-indigo-500") |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

**API:**
```
GET    /courses?user_id=eq.{user_id}&select=*&order=created_at.desc
POST   /courses  →  { user_id, name, code, color }
PATCH  /courses?id=eq.{id}  →  { name }
DELETE /courses?id=eq.{id}
```

---

### 3. `lectures`
Lectures within courses. Most complex table. Supports both regular and meta-lectures.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `course_id` | UUID (FK) | References `courses(id)` |
| `user_id` | UUID (FK) | References `auth.users(id)` |
| `title` | TEXT | Lecture title |
| `date` | TEXT | Creation date (Hebrew format string) |
| `status` | TEXT | 'EMPTY', 'ANALYZING', 'READY', 'ERROR' |
| `processing_mode` | TEXT | 'SUMMARY' or 'FULL_LECTURE' |
| `error_msg` | TEXT | Error message if status is ERROR |
| `summary_data` | JSONB | AI analysis output (see structure below) |
| `file_name` | TEXT | Original uploaded file name |
| `file_mime_type` | TEXT | File MIME type |
| `audio_url` | TEXT | Path to audio file in Storage bucket |
| `audio_generated_date` | TEXT | When podcast was generated |
| `lecture_type` | TEXT | 'REGULAR' or 'META' (default: null = REGULAR) |
| `source_lecture_ids` | JSONB | Array of lecture IDs merged into this meta-lecture |
| `meta_synthesis_metadata` | JSONB | Meta-lecture synthesis details |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

**summary_data JSONB structure:**
```json
{
  "summary": "תקציר כללי של ההרצאה...",
  "detailedSummary": "סיכום מפורט מלא עם **מונחים מודגשים**, סעיפים ממוספרים, דוגמאות...",
  "summaryPoints": [
    { "point": "מושג מרכזי", "details": "הסבר מפורט" }
  ],
  "script": [
    { "speaker": "עומרי:", "text": "שלום וברוכים הבאים...", "startTime": 0, "endTime": 5.2, "relatedPointIndex": 0 }
  ]
}
```

**meta_synthesis_metadata JSONB structure (for META lectures):**
```json
{
  "sourceLectures": [
    { "lectureId": "uuid", "title": "הרצאה 1", "conceptMapping": [0, 1, 3] }
  ],
  "conceptOrigins": [
    { "conceptIndex": 0, "sourceLectureIds": ["uuid1", "uuid2"], "mergedFrom": [0, 2] }
  ],
  "synthesisDate": "2025-01-27",
  "synthesisModel": "gemini-2.5-flash"
}
```

**API:**
```
GET    /lectures?user_id=eq.{user_id}&select=*&order=created_at.desc
POST   /lectures  →  { user_id, course_id, title, date, status: 'EMPTY' }
PATCH  /lectures?id=eq.{id}  →  { status, summary_data, audio_url, ... }
DELETE /lectures?id=eq.{id}
```

---

### 4. `chat_messages`
AI chat history for each lecture.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `lecture_id` | UUID (FK) | References `lectures(id)` |
| `user_id` | UUID (FK) | References `auth.users(id)` |
| `role` | TEXT | 'user' or 'ai' |
| `content` | TEXT | Message content |
| `timestamp` | TIMESTAMPTZ | Message timestamp |

**API:**
```
GET    /chat_messages?user_id=eq.{user_id}&select=*&order=timestamp.asc
POST   /chat_messages  →  { user_id, lecture_id, role, content, timestamp }
DELETE /chat_messages?lecture_id=eq.{lecture_id}   (clear chat)
```

---

### 5. `insights`
User's personal notes/insights for lectures.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `lecture_id` | UUID (FK) | References `lectures(id)` |
| `user_id` | UUID (FK) | References `auth.users(id)` |
| `content` | TEXT | Insight content |
| `date` | TEXT | Creation date (Hebrew format) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**API:**
```
GET    /insights?user_id=eq.{user_id}&select=*&order=created_at.desc
POST   /insights  →  { user_id, lecture_id, content, date }
DELETE /insights?id=eq.{id}
```

---

### 6. `highlights`
Text passages marked as "important for exam" in lecture summaries.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `lecture_id` | UUID (FK) | References `lectures(id)` |
| `user_id` | UUID (FK) | References `auth.users(id)` |
| `text` | TEXT | The highlighted text |
| `start_offset` | INT | Character offset start in detailedSummary |
| `end_offset` | INT | Character offset end in detailedSummary |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**API:**
```
GET    /highlights?user_id=eq.{user_id}&select=*&order=created_at.desc
POST   /highlights  →  { user_id, lecture_id, text, start_offset, end_offset }
DELETE /highlights?id=eq.{id}
```

**SQL to create (run in Supabase SQL Editor):**
```sql
CREATE TABLE IF NOT EXISTS highlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  start_offset INT NOT NULL DEFAULT 0,
  end_offset INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own highlights"
  ON highlights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_highlights_lecture_id ON highlights(lecture_id);
CREATE INDEX idx_highlights_user_id ON highlights(user_id);
```

---

### 7. `quiz_sessions`
Quiz state for each lecture. One quiz session per lecture at a time.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `lecture_id` | UUID (FK) | References `lectures(id)` |
| `user_id` | UUID (FK) | References `auth.users(id)` |
| `status` | TEXT | 'SETUP', 'LOADING', 'ACTIVE', 'COMPLETED' |
| `difficulty` | TEXT | 'EASY', 'MEDIUM', 'HARD' |
| `question_count` | INT | Number of questions |
| `questions` | JSONB | Array of question objects |
| `user_answers` | JSONB | Map of questionId → answerIndex |
| `score` | INT | Final score (0-100) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

**questions JSONB structure:**
```json
[
  {
    "id": "q1",
    "text": "מהי הנוסחה לחישוב...?",
    "options": ["אפשרות א", "אפשרות ב", "אפשרות ג", "אפשרות ד"],
    "correctOptionIndex": 2,
    "explanation": "הסבר מדוע זו התשובה הנכונה...",
    "conceptIndex": 0
  }
]
```

**user_answers JSONB structure:**
```json
{ "q1": 2, "q2": 0, "q3": 1 }
```

**API:**
```
GET    /quiz_sessions?user_id=eq.{user_id}&select=*
POST   /quiz_sessions  →  { user_id, lecture_id, status: 'SETUP', ... }
PATCH  /quiz_sessions?lecture_id=eq.{lecture_id}  →  { status, questions, user_answers, score }
DELETE /quiz_sessions?lecture_id=eq.{lecture_id}
```

---

### 8. `flashcard_sessions`
Flashcard learning state per lecture.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `lecture_id` | UUID (FK) | References `lectures(id)` |
| `user_id` | UUID (FK) | References `auth.users(id)` |
| `status` | TEXT | 'IDLE', 'LEARNING', 'COMPLETED' |
| `cards` | JSONB | Array of flashcard objects |
| `current_index` | INT | Current card position |
| `known_count` | INT | Number of cards marked as known |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

**cards JSONB structure:**
```json
[
  { "id": "f1", "front": "מהו מושג X?", "back": "הסבר על מושג X...", "known": false }
]
```

---

### 9. `concept_progress`
Per-concept learning analytics. Tracks mastery from quizzes and flashcards.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (FK) | References `auth.users(id)` |
| `lecture_id` | UUID (FK) | References `lectures(id)` |
| `concept_index` | INT | Index in summaryPoints array |
| `concept_text` | TEXT | The concept text |
| `mastery_level` | TEXT | 'NOT_STARTED', 'WEAK', 'LEARNING', 'STRONG', 'MASTERED' |
| `quiz_correct` | INT | Correct quiz answers for this concept |
| `quiz_total` | INT | Total quiz attempts for this concept |
| `flashcard_known` | INT | Times marked "known" in flashcards |
| `flashcard_total` | INT | Total flashcard reviews |
| `last_practiced` | TIMESTAMPTZ | Last practice timestamp |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

---

## Storage

### Bucket: `audio-files`
Stores generated podcast audio files.

**Path Structure:**
```
audio-files/{user_id}/{lecture_id}.mp3
```

**API:**
```
POST /storage/v1/object/audio-files/{user_id}/{lecture_id}.mp3
  Headers: { 'Content-Type': 'audio/mp3', 'x-upsert': 'true' }
  Body: <audio blob>

GET  /storage/v1/object/audio-files/{audio_url}
  Returns: audio file blob
```

---

## Triggers & Functions

| Trigger | Table | Purpose |
|---------|-------|---------|
| `update_updated_at_column()` | profiles, courses, lectures, quiz_sessions | Auto-update `updated_at` on row change |
| `handle_new_user()` | auth.users (AFTER INSERT) | Auto-create profile for new signups |

---

## Indexes

| Table | Index | Columns |
|-------|-------|---------|
| `courses` | `idx_courses_user_id` | `user_id` |
| `lectures` | `idx_lectures_course_id` | `course_id` |
| `lectures` | `idx_lectures_user_id` | `user_id` |
| `chat_messages` | `idx_chat_messages_lecture_id` | `lecture_id` |
| `insights` | `idx_insights_lecture_id` | `lecture_id` |
| `highlights` | `idx_highlights_lecture_id` | `lecture_id` |
| `highlights` | `idx_highlights_user_id` | `user_id` |
| `quiz_sessions` | `idx_quiz_sessions_lecture_id` | `lecture_id` |
| `concept_progress` | `idx_concept_progress_lecture` | `user_id, lecture_id` |

---

## API Access Pattern

The app uses **direct REST API calls** (not Supabase JS client) via `supabaseFetch` utility.

**Base URL:** `{VITE_SUPABASE_URL}/rest/v1`

**Required Headers:**
```typescript
{
  'apikey': VITE_SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${accessToken}`,  // From session
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'          // For POST/PATCH to return data
}
```

**Session Storage:**
- Key: `sb-{project-ref}-auth-token`
- Location: `localStorage`

---

## Data Loading Strategy

On login, ALL user data is loaded at once for offline-like experience:

```typescript
// In useSupabaseStore, after auth:
1. Fetch courses
2. Fetch lectures
3. Fetch chat_messages
4. Fetch insights
5. Fetch highlights (with try/catch for missing table)
6. Fetch quiz_sessions
7. Fetch flashcard_sessions
8. Fetch concept_progress
9. Fetch audio files from Storage
// Then merge into nested structure: Course[] → Lecture[] → (chat, insights, highlights, quiz, flashcards)
```

## Cascade Deletes
- Deleting a user → deletes profile, courses, lectures, everything
- Deleting a course → deletes all its lectures
- Deleting a lecture → deletes chat_messages, insights, highlights, quiz_sessions, flashcard_sessions, concept_progress
