# StudyCast Hebrew - Architecture Documentation

## Overview
StudyCast Hebrew is an AI-powered educational platform that helps students learn from lecture presentations. It analyzes uploaded presentations, generates summaries, creates podcast-style audio content, provides AI chat assistance, and offers quizzes for self-assessment.

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS
- Backend: Supabase (Auth, Database, Storage)
- AI: Google Gemini API (analysis, chat, quiz generation, TTS)
- Language: Hebrew (RTL interface)

---

## Project Structure

```
studycast-hebrew/
├── src/
│   └── main.tsx              # Entry point, renders AppSupabase
├── AppSupabase.tsx           # Main app component (UI + state orchestration)
├── hooks/
│   └── useSupabaseStore.ts   # Central state management hook (ALL app logic)
├── services/
│   ├── supabaseClient.ts     # Supabase client configuration + DB types
│   ├── supabaseService.ts    # Supabase CRUD operations (mostly unused - using fetch)
│   └── geminiService.ts      # Gemini AI integration (analysis, TTS, chat, quiz)
├── components/
│   ├── AudioPlayer.tsx       # Podcast player with timestamps
│   ├── QuizSection.tsx       # Quiz UI component
│   └── MigrationPrompt.tsx   # Data migration modal (disabled)
├── types/
│   └── index.ts              # TypeScript type definitions
├── supabase/
│   └── schema.sql            # Database schema (run in Supabase SQL Editor)
└── index.html                # HTML template
```

---

## Key Files Explained

### 1. `AppSupabase.tsx` - Main Application Component
**Purpose:** Renders the entire UI and orchestrates user interactions.

**Key Responsibilities:**
- Renders different views based on `viewState` (DASHBOARD, COURSE, LECTURE)
- Handles modals for adding/editing courses and lectures
- Manages file upload for lecture processing
- Renders lecture content (summary, podcast player, chat, quiz)

**State from useSupabaseStore:**
- `user`, `authLoading` - Authentication state
- `courses`, `isDataLoaded` - Data state
- `viewState`, `activeCourse`, `activeLecture` - Navigation state
- All action functions (addCourse, processLecture, etc.)

**Important Sections:**
- Lines 1-60: Imports and hook usage
- Lines 100-200: Auth screens (Login/Signup/API Key)
- Lines 200-400: Dashboard view (course list)
- Lines 400-600: Course view (lecture list)
- Lines 600-890: Lecture view (summary, podcast, chat, quiz)

---

### 2. `hooks/useSupabaseStore.ts` - Central State Management
**Purpose:** Single source of truth for ALL application state and logic.

**Why Direct Fetch Instead of Supabase Client:**
The Supabase JS client's `getSession()` and other methods were hanging indefinitely. Solution: Use direct `fetch()` calls to Supabase REST API with manual auth token handling.

**Key Constants:**
```typescript
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Supabase anon key
const baseUrl = 'https://lfqsttzweentcpeyohxu.supabase.co/rest/v1';
const storageUrl = 'https://lfqsttzweentcpeyohxu.supabase.co/storage/v1';
const sessionKey = 'sb-lfqsttzweentcpeyohxu-auth-token'; // localStorage key
```

**State:**
```typescript
const [user, setUser] = useState<AppUser | null>(null);
const [authLoading, setAuthLoading] = useState(true);
const [courses, setCourses] = useState<Course[]>([]);
const [isDataLoaded, setIsDataLoaded] = useState(false);
const [viewState, setViewState] = useState<ViewState>({ type: 'DASHBOARD' });
const [isDarkMode, setIsDarkMode] = useState(false);
```

**Key Functions by Category:**

| Category | Functions | Description |
|----------|-----------|-------------|
| Auth | `handleSignUp`, `handleSignIn`, `handleSignOut`, `updateApiKey` | User authentication |
| Courses | `addCourse`, `updateCourse`, `deleteCourse` | Course CRUD |
| Lectures | `addLecture`, `deleteLecture`, `processLecture`, `generateAudio` | Lecture management |
| Chat | `sendChatMessage`, `clearChatHistory` | AI chat functionality |
| Insights | `addInsight`, `deleteInsight` | User notes/insights |
| Quiz | `initQuiz`, `generateNewQuiz`, `answerQuizQuestion`, `resetQuiz`, `closeQuiz` | Quiz system |
| Data | `loadData`, `migrateData` | Data loading/migration |

**Important Code Sections:**
- Lines 28-150: Auth initialization and `onAuthStateChange` listener
- Lines 154-170: `supabaseFetch` helper function
- Lines 174-300: `loadData` - Loads all user data from DB
- Lines 220-290: Audio download from Storage
- Lines 500-600: `generateAudio` - Creates and uploads podcast audio
- Lines 600-700: Chat functions
- Lines 700-800: Insight functions
- Lines 800-960: Quiz functions
- Lines 960-1090: Migration function

---

### 3. `services/geminiService.ts` - AI Integration
**Purpose:** All Gemini API interactions.

**Functions:**
1. `analyzePresentation(apiKey, base64, mimeType, mode)` - Analyzes uploaded presentation
   - Mode: 'SUMMARY' (brief) or 'FULL_LECTURE' (detailed)
   - Returns: `{ summary, summaryPoints, script }`

2. `generatePodcastAudio(apiKey, script)` - Generates TTS audio
   - Uses Gemini's audio generation
   - Returns: `{ audioBase64, uniqueScript }`

3. `chatWithLecture(apiKey, context, history, message)` - AI chat
   - Context-aware responses based on lecture content
   - Returns: AI response text

4. `generateQuiz(apiKey, context, settings)` - Quiz generation
   - Settings: difficulty, questionCount
   - Returns: Array of quiz questions

---

### 4. `services/supabaseClient.ts` - Supabase Configuration
**Purpose:** Supabase client setup and TypeScript interfaces.

**Client Config:**
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // Important: prevents hanging
    flowType: 'pkce',
    storage: window.localStorage
  }
});
```

**DB Type Interfaces:**
- `DbProfile` - User profile
- `DbCourse` - Course
- `DbLecture` - Lecture
- `DbChatMessage` - Chat message
- `DbInsight` - User insight
- `DbQuizSession` - Quiz session

---

### 5. `types/index.ts` - TypeScript Types
**Key Types:**

```typescript
interface Course {
  id: string;
  name: string;
  code: string;
  color: string;
  lectures: Lecture[];
}

interface Lecture {
  id: string;
  title: string;
  date: string;
  status: 'EMPTY' | 'ANALYZING' | 'READY' | 'ERROR';
  processingMode?: 'SUMMARY' | 'FULL_LECTURE';
  summaryData?: SummaryData;
  fileData?: FileData;
  audioBase64?: string;
  audioGeneratedDate?: string;
  chatHistory: ChatMessage[];
  insights: Insight[];
  quiz?: QuizSession;
}

type ViewState =
  | { type: 'DASHBOARD' }
  | { type: 'COURSE'; courseId: string }
  | { type: 'LECTURE'; courseId: string; lectureId: string };
```

---

## Data Flow

### 1. Authentication Flow
```
User enters credentials
  → handleSignIn() calls supabase.auth.signIn()
  → onAuthStateChange fires with 'SIGNED_IN'
  → Fetch profile via REST API
  → setUser() with profile data
  → loadData() fetches all user data
```

### 2. Lecture Processing Flow
```
User uploads file
  → processLecture() called
  → Update status to 'ANALYZING'
  → analyzePresentation() via Gemini
  → Save summaryData to DB
  → Update status to 'READY'
```

### 3. Podcast Generation Flow
```
User clicks "Generate Podcast"
  → generateAudio() called
  → generatePodcastAudio() via Gemini
  → Convert base64 to blob
  → Upload to Supabase Storage (audio-files bucket)
  → Save audio_url to lectures table
  → Keep audioBase64 in memory for playback
```

### 4. Data Loading Flow
```
App loads / User signs in
  → loadData() called
  → Fetch: courses, lectures, chat_messages, insights, quiz_sessions
  → For each lecture with audio_url: download from Storage
  → Group and merge data into Course[] structure
  → setCourses()
```

---

## Important Notes for AI Agents

### Known Issues & Solutions
1. **Supabase client hanging:** Use direct `fetch()` to REST API instead of Supabase JS methods
2. **Auth state not updating:** Fixed by using fetch in `onAuthStateChange` listener
3. **Audio not persisting:** Fixed by uploading to Storage bucket

### API Keys & URLs
- Supabase URL: `https://lfqsttzweentcpeyohxu.supabase.co`
- Supabase Anon Key: Stored in code (public key, safe to expose)
- Gemini API Key: Stored per-user in `profiles.gemini_api_key`

### Storage Structure
- Bucket: `audio-files`
- Path pattern: `{user_id}/{lecture_id}.mp3`
- Access: Private (requires auth)

### State Management Pattern
- All state in `useSupabaseStore` hook
- Local state updated immediately for UX
- Database updated asynchronously
- No external state management library (pure React hooks)

### RTL Support
- App is entirely in Hebrew
- Tailwind's RTL utilities used where needed
- Text direction handled by HTML `dir="rtl"`
