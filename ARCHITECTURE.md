# StudyCast Hebrew - Architecture Documentation

## Overview
StudyCast Hebrew is an AI-powered educational platform that converts lecture materials (presentations, documents) into interactive podcast-style audio content with summaries, chat, quizzes, and flashcards.

**Tech Stack:**
- React 18 + TypeScript
- Vite 6.4
- Tailwind CSS v4 (CSS-first configuration)
- Supabase (Auth + PostgreSQL + Storage)
- Google Gemini API (AI processing)

---

## Project Structure

```
studycast-hebrew/
├── components/          # React UI components
│   ├── modals/         # (Future) Modal components
│   └── views/          # (Future) View components
├── hooks/              # Custom React hooks (State Management)
│   ├── useSupabaseStore.ts      # Main facade (450 lines)
│   ├── storeTypes.ts             # Shared TypeScript types
│   ├── storeUtils.ts             # Utility functions
│   ├── useAuth.ts                # Authentication actions
│   ├── useCourseActions.ts       # Course CRUD
│   ├── useLectureActions.ts      # Lecture CRUD + processing
│   ├── useChatActions.ts         # AI chat with lectures
│   ├── useInsightActions.ts      # User insights
│   ├── useQuizActions.ts         # Quiz generation + answering
│   ├── useFlashcardActions.ts    # Flashcard learning
│   ├── useProgressActions.ts     # Learning progress tracking
│   ├── useMigration.ts           # Data migration helper
│   ├── useModalState.ts          # Modal UI state management
│   ├── useSmartSearch.ts         # Smart search logic
│   ├── useAudioSync.ts           # Audio-script synchronization
│   └── useLectureWorkspace.ts    # Workspace UI state
├── services/
│   ├── supabaseClient.ts         # Supabase client initialization
│   ├── supabaseService.ts        # Supabase API wrappers (647 lines)
│   └── geminiService.ts          # Gemini AI API wrappers (507 lines)
├── AppSupabase.tsx      # Main application component (~970 lines)
├── index.tsx            # App entry point
└── types.ts             # Global TypeScript types
```

---

## Architecture Patterns

### 1. **Facade Pattern (State Management)**

The state management was refactored from a monolithic 1,710-line hook into a modular facade pattern:

```typescript
// hooks/useSupabaseStore.ts (Facade - 450 lines)
export const useSupabaseStore = () => {
  // Core state (useState)
  const [user, setUser] = useState<AppUser | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [viewState, setViewState] = useState<ViewState>({ type: 'DASHBOARD' });

  // Utilities
  const supabaseFetch = useCallback(...);  // Authenticated fetch
  const updateLectureLocal = createUpdateLectureLocal(setCourses);

  // Effects (auth, data loading, theme)
  useEffect(() => { /* auth logic */ }, []);
  useEffect(() => { /* load data */ }, [user?.id]);
  useEffect(() => { /* theme sync */ }, [isDarkMode]);

  // Derived state
  const activeCourse = useMemo(...);
  const activeLecture = useMemo(...);

  // Sub-hooks (order matters - Progress first!)
  const progressActions = useProgressActions({ user, supabaseFetch });
  const authActions = useAuth({ user, setUser, setCourses, setViewState, supabaseFetch });
  const courseActions = useCourseActions({ user, setCourses, viewState, setViewState, supabaseFetch });
  const lectureActions = useLectureActions({ user, courses, setCourses, viewState, setViewState, supabaseFetch, updateLectureLocal });
  const chatActions = useChatActions({ user, setCourses, supabaseFetch, updateLectureLocal, activeLecture });
  const insightActions = useInsightActions({ user, setCourses, supabaseFetch });
  const quizActions = useQuizActions({ user, courses, setCourses, supabaseFetch, activeLecture, updateConceptProgress: progressActions.updateConceptProgress });
  const flashcardActions = useFlashcardActions({ user, courses, setCourses, supabaseFetch, updateLectureLocal, updateConceptProgress: progressActions.updateConceptProgress });
  const migrationActions = useMigration({ user, setCourses });

  // Return unified interface (no breaking changes)
  return {
    user, courses, viewState, activeCourse, activeLecture,
    handleSignUp: authActions.handleSignUp,
    addCourse: courseActions.addCourse,
    processLecture: lectureActions.processLecture,
    sendChatMessage: chatActions.sendChatMessage,
    // ... all other actions
  };
};
```

**Key Benefits:**
- Each domain has its own hook (easier to test & maintain)
- Shared state passed as parameters (no stale closures)
- Zero breaking changes to consumers
- Cross-hook dependencies handled via facade (Quiz/Flashcards depend on Progress)

---

### 2. **Custom Hooks Pattern (UI State)**

AppSupabase.tsx was refactored to extract UI state management into custom hooks:

```typescript
// AppSupabase.tsx
const AppSupabase = () => {
  const { user, courses, activeCourse, activeLecture, ... } = useSupabaseStore();

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const { filteredLectures } = useSmartSearch({ activeCourse, searchQuery });

  // Modals
  const modalState = useModalState();  // All modal states + setters

  // Audio Sync
  const audioSync = useAudioSync({ activeLecture });
  // Returns: parsedScript, activeLineIndex, handleAudioProgress, lineRefs, ...

  // Workspace
  const workspace = useLectureWorkspace();
  // Returns: isGeneratingAudio, forcedTab, chatDraft, ...

  // ... JSX rendering
};
```

**Extracted Hooks:**
- `useModalState()` - Manages 6 modal states (add/edit course/lecture, processing, preview)
- `useSmartSearch()` - Filters lectures by title/summary/concepts/insights
- `useAudioSync()` - Parses script, tracks active line, syncs with audio, auto-scrolls
- `useLectureWorkspace()` - Manages workspace UI states (audio generation, flashcard generation, forced tab navigation, chat draft)

---

## Data Flow

### Authentication Flow
```
1. User → SupabaseAuthScreen (signUp/signIn)
2. useSupabaseStore → auth effect → fetchProfile
3. Supabase session → localStorage
4. User state updated → triggers data loading
5. AppSupabase re-renders with user data
```

### Lecture Processing Flow
```
1. User uploads file → FileUpload component
2. AppSupabase → onFileSelected → opens ProcessingModal
3. User selects mode (FULL_LECTURE | SUMMARY)
4. processLecture → geminiService.analyzePresentation
5. Gemini returns: summary, concepts, script with timestamps
6. Data saved to Supabase → lectures table
7. UI updates with processed lecture
```

### Audio Generation Flow
```
1. User clicks "Generate Audio" → handleGenerateAudioClick
2. generateAudio → geminiService.generatePodcastAudio
3. Gemini TTS API returns base64 audio
4. Audio uploaded to Supabase Storage
5. Lecture updated with audioBase64 + audioUrl
6. AudioPlayer component renders with audio
```

### Audio Sync Flow
```
1. AudioPlayer emits onProgressUpdate(currentTime, duration)
2. useAudioSync.handleAudioProgress → finds active line by:
   - Timestamps (if available)
   - OR text length ratio
3. Updates activeLineIndex → triggers scroll effect
4. Script line highlights + auto-scrolls into view
5. Related concept index updates (activePointIndex)
```

### Smart Search Flow
```
1. User types in SmartSearchBar → setSearchQuery
2. useSmartSearch filters lectures by:
   - Priority 1: Title match → matchType: 'TITLE'
   - Priority 2: Summary text → matchType: 'SUMMARY'
   - Priority 3: Concept (summaryPoints) → matchType: 'CONCEPT'
   - Priority 4: User insights → matchType: 'INSIGHT'
3. Clicking lecture with matchType → forces relevant tab
   - SUMMARY → opens Summary tab
   - CONCEPT → opens Concepts tab
   - INSIGHT → opens Insights tab
```

---

## Key Components

### AppSupabase.tsx (~970 lines)
Main application component with route-based rendering:

**Views:**
- `DASHBOARD` - Grid of courses (CourseCard components)
- `COURSE` - List of lectures with SmartSearchBar (LectureItem components)
- `LECTURE` - Full lecture workspace:
  - SmartBoard (tabs: Concepts, Summary, Chat, Quiz, Flashcards, Insights, Progress)
  - AudioPlayer + Script viewer
  - Context actions (Explain/Ask)

**Conditional Screens (Guards):**
- Auth loading screen
- Login screen (if !user)
- Gender selection (if !user.gender)
- API key setup (if !user.apiKey)
- Data loading screen (if !isDataLoaded)

**Modals (Inline - Future refactor):**
- Processing Mode Selection
- Add/Edit Course
- Add/Edit Lecture
- Preview Lecture
- Expanded Concept Modal

### SmartBoard (~250 lines)
Tabbed interface for lecture interaction:
- **Concepts** - Visual cards for each summaryPoint
- **Summary** - Full summary text
- **Chat** - AI conversation about lecture
- **Quiz** - Generated quiz with progress tracking
- **Flashcards** - Spaced repetition learning
- **Insights** - User-created notes
- **Progress** (NEW) - Learning progress analytics

### AudioPlayer (~350 lines)
Custom audio player with:
- Play/pause controls
- Progress scrubbing
- Speed control (0.5x - 2x)
- Audio regeneration
- Progress tracking callback

---

## Database Schema (Supabase)

### Tables

**profiles**
```sql
id: uuid (PK, references auth.users)
name: text
gender: 'male' | 'female' | null
gemini_api_key: text | null
created_at: timestamp
```

**courses**
```sql
id: uuid (PK)
user_id: uuid (FK → profiles)
name: text
code: text
color: text (Tailwind class)
created_at: timestamp
```

**lectures**
```sql
id: uuid (PK)
user_id: uuid (FK → profiles)
course_id: uuid (FK → courses)
title: text
date: text
status: 'EMPTY' | 'ANALYZING' | 'READY' | 'ERROR'
processing_mode: 'FULL_LECTURE' | 'SUMMARY' | null
error_msg: text | null
summary_data: jsonb (summary, summaryPoints, script with timestamps)
file_name: text | null
file_mime_type: text | null
audio_url: text | null (Storage path)
audio_generated_date: text | null
created_at: timestamp
```

**chat_messages**
```sql
id: uuid (PK)
user_id: uuid (FK → profiles)
lecture_id: uuid (FK → lectures)
role: 'user' | 'ai'
content: text
timestamp: timestamp
```

**insights**
```sql
id: uuid (PK)
user_id: uuid (FK → profiles)
lecture_id: uuid (FK → lectures)
content: text
date: text
created_at: timestamp
```

**quiz_sessions**
```sql
id: uuid (PK)
user_id: uuid (FK → profiles)
lecture_id: uuid (FK → lectures)
status: 'IDLE' | 'ACTIVE' | 'COMPLETED'
difficulty: 'easy' | 'medium' | 'hard'
question_count: int
questions: jsonb[]
user_answers: jsonb
score: int
created_at: timestamp
updated_at: timestamp
```

**flashcard_sessions**
```sql
id: uuid (PK)
user_id: uuid (FK → profiles)
lecture_id: uuid (FK → lectures)
status: 'IDLE' | 'LEARNING' | 'COMPLETED'
cards: jsonb[]
current_index: int
known_count: int
created_at: timestamp
updated_at: timestamp
```

**concept_progress** (NEW - for learning analytics)
```sql
id: uuid (PK)
user_id: uuid (FK → profiles)
lecture_id: uuid (FK → lectures)
concept_index: int
concept_text: text
mastery_level: 'NOT_STARTED' | 'LEARNING' | 'PRACTICING' | 'MASTERED'
quiz_correct: int
quiz_total: int
flashcard_known: int
flashcard_total: int
last_practiced: timestamp
created_at: timestamp
updated_at: timestamp
```

### Storage Buckets

**audio-files**
- Path pattern: `{userId}/{lectureId}.mp3`
- Public read access
- RLS policies for write access

---

## API Integrations

### Supabase API
All calls use authenticated `supabaseFetch` helper:
```typescript
const supabaseFetch = async (endpoint: string, options?: RequestInit) => {
  const token = localStorage.getItem('sb-xxx-auth-token');
  return fetch(`https://xxx.supabase.co/rest/v1${endpoint}`, {
    headers: {
      'apikey': 'xxx',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': options?.method === 'POST' ? 'return=representation' : ''
    }
  });
};
```

### Gemini API (via services/geminiService.ts)

**analyzePresentation(text, mode, apiKey)**
- Input: Raw text from PPT/PDF
- Mode: FULL_LECTURE (in-depth) | SUMMARY (quick)
- Output: `{ summary, summaryPoints[], script[] }`
- Script includes: speaker, text, startTime, endTime, relatedPointIndex

**generatePodcastAudio(script, gender, apiKey)**
- Input: Script array with speaker + text
- Gender: 'male' | 'female' (for voice selection)
- Uses Gemini multimodal model + TTS
- Output: base64 audio string (MP3)

**chatWithLecture(summary, concepts, chatHistory, userMessage, apiKey)**
- Context-aware AI chat about lecture content
- Maintains conversation history
- Output: AI response text

**generateQuiz(summary, concepts, settings, apiKey)**
- Settings: difficulty, questionCount
- Generates multiple-choice questions
- Each question has: conceptIndex for progress tracking
- Output: `{ id, question, options[], correctAnswer, explanation, conceptIndex }`

---

## Important Notes

### Dark Mode (Tailwind v4)
The project uses Tailwind CSS v4 with CSS-first configuration. Dark mode is enabled via:
```css
/* index.css */
@custom-variant dark (&:where(.dark, .dark *));
```
NOT via `tailwind.config.js` (v4 doesn't read config files)

### Migration Status
- ✅ useSupabaseStore split into modules (hooks/)
- ✅ UI state extracted to custom hooks
- ⏸️ Modal components NOT yet extracted (still inline in AppSupabase.tsx)
- ⏸️ View components NOT yet extracted (still inline in AppSupabase.tsx)

### Dead Code Removed
- `App.tsx` (938 lines) - Legacy version using localStorage
- `hooks/useAppStore.ts` (570 lines) - Legacy IndexedDB store
- Total: 1,508 lines of dead code removed

### Cross-Hook Dependencies
**IMPORTANT:** Call order matters in useSupabaseStore facade!
```typescript
// ✅ Correct order
const progressActions = useProgressActions(...);  // FIRST
const quizActions = useQuizActions({
  updateConceptProgress: progressActions.updateConceptProgress  // depends on progress
});

// ❌ Wrong order - will break
const quizActions = useQuizActions({ updateConceptProgress: ??? });
const progressActions = useProgressActions(...);  // Too late!
```

Quiz and Flashcard hooks call `updateConceptProgress` to track learning. Progress hook must be initialized first.

---

## Common Tasks

### Adding a New Feature
1. Determine if it's data or UI related
2. Data feature → Create new hook in `hooks/` + add to facade
3. UI feature → Add to existing component or create new one
4. Update types in `types.ts` if needed
5. Add database migration if needed

### Debugging State Issues
1. Check `useSupabaseStore` facade - is the hook called in correct order?
2. Check if shared state is passed correctly to sub-hooks
3. Use React DevTools to inspect hook state
4. Check browser console for Supabase errors

### Testing a New Agent Session
When starting a new conversation with an AI agent:
1. Point agent to this ARCHITECTURE.md file first
2. Agent reads this file to understand the codebase structure
3. Agent can then navigate to specific files as needed
4. No need to read entire codebase upfront

---

## File Size Reference
Use this to prioritize what to read:

| File | Lines | Purpose |
|------|-------|---------|
| AppSupabase.tsx | ~970 | Main app (needs further splitting) |
| services/supabaseService.ts | 647 | Supabase wrappers |
| services/geminiService.ts | 507 | Gemini AI wrappers |
| hooks/useSupabaseStore.ts | 450 | State management facade |
| components/AudioPlayer.tsx | 352 | Audio player UI |
| components/QuizPanel.tsx | 278 | Quiz interface |
| hooks/useFlashcardActions.ts | 268 | Flashcard logic |
| components/FlashcardPanel.tsx | 268 | Flashcard UI |
| components/ProgressPanel.tsx | 266 | Progress analytics UI |
| components/SmartBoard.tsx | 251 | Main tabbed interface |

---

## Recent Changes (2025-01-27)

### Completed
1. ✅ Removed dead code: App.tsx + useAppStore.ts (-1,508 lines)
2. ✅ Split useSupabaseStore into 9 sub-hooks using Facade Pattern
3. ✅ Extracted UI state management from AppSupabase.tsx:
   - useModalState (modal states)
   - useSmartSearch (search logic)
   - useAudioSync (audio synchronization)
   - useLectureWorkspace (workspace states)
4. ✅ Added dark mode support for Tailwind v4
5. ✅ Fixed React hooks ordering bug in QuizPanel.tsx
6. ✅ Added Progress tracking feature with concept_progress table

### Pending (Next Session)
- Extract Modal components from AppSupabase.tsx
- Extract View components (DashboardView, CourseView, LectureView)
- Final AppSupabase.tsx reduction to ~400 lines

---

## Getting Started (For New Agents)

1. Read this ARCHITECTURE.md file completely
2. Check `types.ts` for data structures
3. Look at `hooks/useSupabaseStore.ts` (facade) to understand state management
4. Check `AppSupabase.tsx` to understand UI flow
5. Use `Grep` or `Read` tools to dive into specific files as needed

**Pro tip:** Don't try to read all files upfront. Use this architecture doc to understand the structure, then navigate to specific files only when needed.
