# StudyCast Hebrew - Database Documentation

## Overview
The application uses Supabase as a backend-as-a-service, providing:
- **PostgreSQL Database** - Relational data storage
- **Row Level Security (RLS)** - Per-user data isolation
- **Storage Buckets** - File storage for audio files
- **Authentication** - Email/password auth with session management

**Supabase Project URL:** `https://lfqsttzweentcpeyohxu.supabase.co`

---

## Database Schema

### Entity Relationship Diagram
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
                    └──< quiz_sessions (1:1)
```

---

## Tables

### 1. `profiles`
Extends Supabase Auth users with additional profile data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, references `auth.users(id)` |
| `name` | TEXT | User display name |
| `gemini_api_key` | TEXT | User's Gemini API key (nullable) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**RLS Policies:**
- Users can only SELECT, UPDATE, INSERT their own profile
- Auto-created on user signup via trigger

**Usage in App:**
```typescript
// Fetch profile
GET /profiles?id=eq.{user_id}&select=*

// Update API key
PATCH /profiles?id=eq.{user_id}
Body: { gemini_api_key: "..." }
```

---

### 2. `courses`
User's courses/subjects.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `user_id` | UUID | Owner, references `auth.users(id)` |
| `name` | TEXT | Course name |
| `code` | TEXT | Course code (e.g., "PHY-101") |
| `color` | TEXT | Tailwind color class (e.g., "bg-indigo-500") |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**RLS Policies:**
- Users can only CRUD their own courses
- CASCADE delete to lectures

**Usage in App:**
```typescript
// Fetch all courses
GET /courses?user_id=eq.{user_id}&select=*&order=created_at.desc

// Create course
POST /courses
Body: { user_id, name, code, color }

// Update course
PATCH /courses?id=eq.{course_id}
Body: { name }

// Delete course
DELETE /courses?id=eq.{course_id}
```

---

### 3. `lectures`
Lectures within courses. This is the most complex table.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `course_id` | UUID | Parent course, references `courses(id)` |
| `user_id` | UUID | Owner, references `auth.users(id)` |
| `title` | TEXT | Lecture title |
| `date` | TEXT | Creation date (Hebrew format) |
| `status` | TEXT | Processing status (see below) |
| `processing_mode` | TEXT | 'SUMMARY' or 'FULL_LECTURE' |
| `error_msg` | TEXT | Error message if status is ERROR |
| `summary_data` | JSONB | Analysis results (see below) |
| `file_name` | TEXT | Original uploaded file name |
| `file_mime_type` | TEXT | File MIME type |
| `audio_url` | TEXT | Path to audio in Storage bucket |
| `audio_generated_date` | TEXT | When podcast was generated |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Status Values:**
| Status | Description |
|--------|-------------|
| `EMPTY` | Newly created, no content |
| `ANALYZING` | Currently processing with Gemini |
| `READY` | Analysis complete, content available |
| `ERROR` | Analysis failed |

**summary_data JSONB Structure:**
```json
{
  "summary": "תקציר ההרצאה...",
  "summaryPoints": [
    "נקודה ראשונה",
    "נקודה שנייה"
  ],
  "script": [
    {
      "speaker": "HOST",
      "text": "שלום וברוכים הבאים...",
      "startTime": 0,
      "endTime": 5.2
    },
    {
      "speaker": "GUEST",
      "text": "תודה רבה...",
      "startTime": 5.2,
      "endTime": 10.1
    }
  ]
}
```

**Usage in App:**
```typescript
// Fetch all user lectures
GET /lectures?user_id=eq.{user_id}&select=*&order=created_at.desc

// Create lecture
POST /lectures
Body: { user_id, course_id, title, date, status: 'EMPTY' }

// Update lecture (processing)
PATCH /lectures?id=eq.{lecture_id}
Body: { status, summary_data, audio_url, ... }

// Delete lecture
DELETE /lectures?id=eq.{lecture_id}
```

---

### 4. `chat_messages`
AI chat history for each lecture.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `lecture_id` | UUID | Parent lecture, references `lectures(id)` |
| `user_id` | UUID | Owner, references `auth.users(id)` |
| `role` | TEXT | 'user' or 'ai' |
| `content` | TEXT | Message content |
| `timestamp` | TIMESTAMPTZ | Message timestamp |

**RLS Policies:**
- Users can SELECT, INSERT, DELETE their own messages
- No UPDATE (messages are immutable)
- CASCADE delete when lecture deleted

**Usage in App:**
```typescript
// Fetch chat history
GET /chat_messages?user_id=eq.{user_id}&select=*&order=timestamp.asc

// Add message
POST /chat_messages
Body: { user_id, lecture_id, role, content, timestamp }

// Clear chat
DELETE /chat_messages?lecture_id=eq.{lecture_id}
```

---

### 5. `insights`
User's personal notes/insights for lectures.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `lecture_id` | UUID | Parent lecture, references `lectures(id)` |
| `user_id` | UUID | Owner, references `auth.users(id)` |
| `content` | TEXT | Insight content |
| `date` | TEXT | Creation date (Hebrew format) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Usage in App:**
```typescript
// Fetch insights
GET /insights?user_id=eq.{user_id}&select=*&order=created_at.desc

// Add insight
POST /insights
Body: { user_id, lecture_id, content, date }

// Delete insight
DELETE /insights?id=eq.{insight_id}
```

---

### 6. `quiz_sessions`
Quiz state for each lecture.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `lecture_id` | UUID | Parent lecture, references `lectures(id)` |
| `user_id` | UUID | Owner, references `auth.users(id)` |
| `status` | TEXT | Quiz status (see below) |
| `difficulty` | TEXT | 'EASY', 'MEDIUM', or 'HARD' |
| `question_count` | INT | Number of questions |
| `questions` | JSONB | Array of questions (see below) |
| `user_answers` | JSONB | Map of questionId → answerIndex |
| `score` | INT | Final score (0-100) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Status Values:**
| Status | Description |
|--------|-------------|
| `SETUP` | Configuring quiz settings |
| `LOADING` | Generating questions via Gemini |
| `ACTIVE` | Quiz in progress |
| `COMPLETED` | All questions answered |

**questions JSONB Structure:**
```json
[
  {
    "id": "q1",
    "question": "מהי הנוסחה לחישוב...?",
    "options": ["אפשרות א", "אפשרות ב", "אפשרות ג", "אפשרות ד"],
    "correctOptionIndex": 2
  }
]
```

**user_answers JSONB Structure:**
```json
{
  "q1": 2,
  "q2": 0,
  "q3": 1
}
```

**Usage in App:**
```typescript
// Fetch quiz sessions
GET /quiz_sessions?user_id=eq.{user_id}&select=*

// Create quiz session
POST /quiz_sessions
Body: { user_id, lecture_id, status: 'SETUP', difficulty, question_count, questions: [], user_answers: {}, score: 0 }

// Update quiz
PATCH /quiz_sessions?lecture_id=eq.{lecture_id}
Body: { status, questions, user_answers, score }

// Delete quiz
DELETE /quiz_sessions?lecture_id=eq.{lecture_id}
```

---

## Storage

### Bucket: `audio-files`
Stores generated podcast audio files.

**Configuration:**
- Visibility: Private (not public)
- File type: MP3 audio

**Path Structure:**
```
audio-files/
  └── {user_id}/
        └── {lecture_id}.mp3
```

**RLS Policies:**
- Users can only upload to their own folder (`user_id/`)
- Users can only view/delete files in their own folder

**Usage in App:**
```typescript
// Upload audio
POST /storage/v1/object/audio-files/{user_id}/{lecture_id}.mp3
Headers: { 'Content-Type': 'audio/mp3', 'x-upsert': 'true' }
Body: <audio blob>

// Download audio
GET /storage/v1/object/audio-files/{audio_url}
// Returns audio file blob
```

---

## Triggers & Functions

### 1. `update_updated_at_column()`
Automatically updates `updated_at` timestamp on row update.

**Applied to:**
- `profiles`
- `courses`
- `lectures`
- `quiz_sessions`

### 2. `handle_new_user()`
Automatically creates a profile when a new user signs up.

**Trigger:** `on_auth_user_created` (AFTER INSERT on `auth.users`)

**Behavior:**
```sql
INSERT INTO profiles (id, name)
VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'משתמש חדש'));
```

---

## Indexes

| Table | Index | Columns |
|-------|-------|---------|
| `courses` | `idx_courses_user_id` | `user_id` |
| `lectures` | `idx_lectures_course_id` | `course_id` |
| `lectures` | `idx_lectures_user_id` | `user_id` |
| `chat_messages` | `idx_chat_messages_lecture_id` | `lecture_id` |
| `insights` | `idx_insights_lecture_id` | `lecture_id` |
| `quiz_sessions` | `idx_quiz_sessions_lecture_id` | `lecture_id` |

---

## API Access Pattern

The app uses direct REST API calls instead of the Supabase JS client (due to client hanging issues).

**Base URL:** `https://lfqsttzweentcpeyohxu.supabase.co/rest/v1`

**Required Headers:**
```typescript
{
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',  // Supabase anon key
  'Authorization': `Bearer ${accessToken}`,              // User's JWT from session
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'                      // For POST/PATCH to return data
}
```

**Session Storage:**
- Key: `sb-lfqsttzweentcpeyohxu-auth-token`
- Location: `localStorage`
- Contains: `{ access_token, refresh_token, user, ... }`

---

## Important Notes for AI Agents

### Data Loading Strategy
The app loads ALL user data on login for offline-like experience:
1. Courses
2. Lectures (with audio download from Storage)
3. Chat messages
4. Insights
5. Quiz sessions

Then merges into nested structure: `Course[] → Lecture[] → (chat, insights, quiz)`

### Cascade Deletes
- Deleting a user → deletes profile, courses, lectures, etc.
- Deleting a course → deletes all its lectures
- Deleting a lecture → deletes chat, insights, quiz

### JSONB Fields
- `lectures.summary_data` - Gemini analysis output
- `quiz_sessions.questions` - Generated quiz questions
- `quiz_sessions.user_answers` - User's answers map

### Audio Storage
Audio is stored in Storage bucket, NOT in database. The `lectures.audio_url` field contains the path to the file in Storage.
