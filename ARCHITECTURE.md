# StudyCast Hebrew - Architecture Documentation

## Overview
StudyCast Hebrew is an AI-powered educational platform that converts lecture materials (presentations, documents) into interactive podcast-style audio content with summaries, chat, quizzes, flashcards, highlights, meta-lectures, and learning progress tracking.

**Tech Stack:**
- React 19 + TypeScript 5.8
- Vite 6
- Tailwind CSS v4 (CSS-first configuration)
- Supabase (Auth + PostgreSQL + Storage)
- Google Gemini API (AI processing + TTS)

---

## Project Structure

```
studycast-hebrew/
├── AppSupabase.tsx              # Main app component (~1000 lines) - routing, modals, layout
├── index.tsx                    # App entry point
├── index.css                    # Global styles + animations (meta-lecture gradient, etc.)
├── types.ts                     # ALL TypeScript interfaces
│
├── components/                  # 27 React UI components
│   ├── SmartBoard.tsx              # Main tabbed dashboard (8 tabs)
│   ├── DetailedSummary.tsx         # Rich summary with text highlighting
│   ├── QuizPanel.tsx               # Quiz engine (setup → active → completed)
│   ├── FlashcardPanel.tsx          # Flashcard learning system
│   ├── FlashCard.tsx               # Single flashcard with flip animation
│   ├── AudioPlayer.tsx             # Podcast player with speed control
│   ├── ChatPanel.tsx               # AI chat interface
│   ├── ConceptCard.tsx             # Key concept display card
│   ├── ProgressPanel.tsx           # Learning analytics dashboard
│   ├── InsightsPanel.tsx           # User notes/insights panel
│   ├── HighlightsTab.tsx           # Exam highlights collection tab
│   ├── FloatingHighlightButton.tsx # Floating "mark as important" button
│   ├── MetaLectureModal.tsx        # Modal for creating meta-lectures
│   ├── CourseCard.tsx              # Course card in dashboard
│   ├── LectureItem.tsx             # Lecture row (with meta-lecture gradient)
│   ├── Breadcrumbs.tsx             # Navigation breadcrumbs
│   ├── SmartSearchBar.tsx          # Smart search input
│   ├── FileUpload.tsx              # File upload component
│   ├── ScriptActionMenu.tsx        # Context menu on script lines
│   ├── ExpandedConceptModal.tsx    # Full-screen concept view
│   ├── SummaryPreviewModal.tsx     # Quick lecture preview
│   ├── SupabaseAuthScreen.tsx      # Login/signup screen
│   ├── AuthScreen.tsx              # Legacy auth (unused)
│   ├── ApiKeySetup.tsx             # Gemini API key setup
│   ├── MigrationPrompt.tsx         # Data migration UI
│   ├── ErrorBoundary.tsx           # React error boundary
│   └── ThinkingIndicator.tsx       # AI processing indicator
│
├── hooks/                       # 18 custom React hooks (modular state)
│   ├── useSupabaseStore.ts         # MAIN FACADE (~480 lines) - unifies all hooks
│   ├── storeTypes.ts               # Shared types (AppUser, SupabaseFetchFn, etc.)
│   ├── storeUtils.ts               # Utility: createUpdateLectureLocal
│   ├── useAuth.ts                  # Authentication (signup, signin, signout, profile)
│   ├── useCourseActions.ts         # Course CRUD
│   ├── useLectureActions.ts        # Lecture CRUD + AI processing + audio generation
│   ├── useChatActions.ts           # AI chat with lectures
│   ├── useInsightActions.ts        # User insights CRUD
│   ├── useHighlightActions.ts      # Text highlight CRUD
│   ├── useQuizActions.ts           # Quiz generation + answering + scoring
│   ├── useFlashcardActions.ts      # Flashcard generation + learning flow
│   ├── useProgressActions.ts       # Learning progress tracking per concept
│   ├── useMetaLectureActions.ts    # Meta-lecture creation (merging lectures)
│   ├── useMigration.ts             # Legacy data migration helper
│   ├── useModalState.ts            # All modal open/close states
│   ├── useSmartSearch.ts           # Search across lectures/concepts/insights
│   ├── useAudioSync.ts             # Audio-script synchronization
│   └── useLectureWorkspace.ts      # Workspace UI state (forced tab, drafts, etc.)
│
├── services/
│   ├── supabaseClient.ts           # Supabase client initialization
│   ├── supabaseService.ts          # Supabase API wrappers
│   └── geminiService.ts            # ALL AI interactions (analysis, TTS, chat, quiz, meta)
│
├── utils/
│   └── highlight.ts                # Text highlighting utility
│
├── supabase/
│   └── schema.sql                  # Full database schema (318 lines)
│
└── supabase_migrations/
    ├── create_concept_progress.sql # concept_progress table
    └── create_highlights.sql       # highlights table (needs to be run)
```

---

## TypeScript Interfaces (types.ts)

### Core Data Types
```typescript
// Processing
ProcessingMode = 'SUMMARY' | 'FULL_LECTURE'
LectureType = 'REGULAR' | 'META'

// Summary
SummaryPoint { point: string; details: string }
ScriptLine { speaker: string; text: string; startTime?: number; endTime?: number; relatedPointIndex?: number }
SummaryData { summary: string; detailedSummary?: string; summaryPoints: SummaryPoint[]; script: ScriptLine[] }

// Chat & Notes
ChatMessage { id: string; role: 'user' | 'ai'; content: string; timestamp: string }
Insight { id: string; content: string; date: string }
Highlight { id: string; text: string; startOffset: number; endOffset: number; createdAt: string }

// Quiz
QuizDifficulty = 'EASY' | 'MEDIUM' | 'HARD'
QuizQuestion { id: string; text: string; options: string[]; correctOptionIndex: number; explanation: string; conceptIndex?: number }
QuizSession { status: 'SETUP' | 'LOADING' | 'ACTIVE' | 'COMPLETED'; settings: QuizSettings; questions: QuizQuestion[]; userAnswers: Record<string, number>; score: number }

// Flashcards
Flashcard { id: string; front: string; back: string; known: boolean }
FlashcardSession { status: 'IDLE' | 'LEARNING' | 'COMPLETED'; cards: Flashcard[]; currentIndex: number; knownCount: number }

// Progress
MasteryLevel = 'NOT_STARTED' | 'WEAK' | 'LEARNING' | 'STRONG' | 'MASTERED'
ConceptProgress { id; lectureId; conceptIndex; conceptText; quizCorrect; quizIncorrect; flashcardRatings; masteryScore; masteryLevel; ... }
LectureProgress { lectureId; concepts: ConceptProgress[]; overallMastery; strongCount; weakCount }

// Meta-Lecture
MetaLectureSynthesisMetadata { sourceLectures: [...]; conceptOrigins: [...]; synthesisDate; synthesisModel }
```

### Lecture Interface (central entity)
```typescript
Lecture {
  id: string; title: string; date: string;
  status: 'EMPTY' | 'ANALYZING' | 'READY' | 'ERROR';
  processingMode?: ProcessingMode;
  summaryData?: SummaryData;
  audioBase64?: string; audioGeneratedDate?: string;
  chatHistory?: ChatMessage[];
  insights?: Insight[];
  highlights?: Highlight[];
  quiz?: QuizSession;
  flashcards?: FlashcardSession;
  // Meta-Lecture
  lectureType?: LectureType;          // 'REGULAR' | 'META'
  sourceLectureIds?: string[];         // IDs of lectures merged into this meta
  metaSynthesisMetadata?: MetaLectureSynthesisMetadata;
}
```

### Course & Navigation
```typescript
Course { id: string; name: string; code: string; color: string; lectures: Lecture[] }
ViewState = { type: 'DASHBOARD' } | { type: 'COURSE'; courseId } | { type: 'LECTURE'; courseId; lectureId }
```

---

## Architecture Patterns

### 1. Facade Pattern (State Management)

`useSupabaseStore` is the single entry point for ALL state. It composes 12+ sub-hooks:

```typescript
// hooks/useSupabaseStore.ts
export const useSupabaseStore = () => {
  // Core state
  const [user, setUser] = useState<AppUser | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [viewState, setViewState] = useState<ViewState>({ type: 'DASHBOARD' });

  // Authenticated fetch utility
  const supabaseFetch = useCallback(...);

  // Sub-hooks (ORDER MATTERS - Progress must come first!)
  const progressActions = useProgressActions({ user, supabaseFetch });
  const authActions = useAuth({ ... });
  const courseActions = useCourseActions({ ... });
  const lectureActions = useLectureActions({ ... });
  const chatActions = useChatActions({ ... });
  const insightActions = useInsightActions({ ... });
  const highlightActions = useHighlightActions({ ... });
  const quizActions = useQuizActions({ ..., updateConceptProgress: progressActions.updateConceptProgress });
  const flashcardActions = useFlashcardActions({ ..., updateConceptProgress: progressActions.updateConceptProgress });
  const migrationActions = useMigration({ ... });
  const metaLectureActions = useMetaLectureActions({ ... }); // Used in AppSupabase, not facade

  // Return unified interface
  return { user, courses, viewState, activeCourse, activeLecture, ...allActions };
};
```

**CRITICAL: Hook ordering** — Quiz and Flashcard hooks depend on `progressActions.updateConceptProgress`. Progress hook MUST be initialized first.

### 2. UI State Hooks (AppSupabase.tsx)

```typescript
const modalState = useModalState();          // 6+ modal states
const { filteredLectures } = useSmartSearch({ activeCourse, searchQuery });
const audioSync = useAudioSync({ activeLecture });  // Script parsing, line tracking
const workspace = useLectureWorkspace();     // Forced tabs, audio gen state, drafts
const metaLectureActions = useMetaLectureActions({ ... }); // Meta-lecture creation
```

---

## SmartBoard Tabs (8 tabs)

```typescript
type Tab = 'CONCEPTS' | 'SUMMARY' | 'CHAT' | 'FLASHCARDS' | 'QUIZ' | 'PROGRESS' | 'HIGHLIGHTS' | 'INSIGHTS';
```

| Tab | Component | Purpose |
|-----|-----------|---------|
| CONCEPTS | ConceptCard[] | Key concept cards from summaryPoints |
| SUMMARY | DetailedSummary | Rich formatted summary with text highlighting |
| CHAT | ChatPanel | AI Q&A about lecture content |
| FLASHCARDS | FlashcardPanel | Spaced repetition flashcards |
| QUIZ | QuizPanel | AI-generated quizzes (3-30 questions) |
| PROGRESS | ProgressPanel | Per-concept mastery analytics |
| HIGHLIGHTS | HighlightsTab | All text marked as "important for exam" |
| INSIGHTS | InsightsPanel | User's personal notes |

---

## AI Service Functions (geminiService.ts)

| Function | Model | Purpose |
|----------|-------|---------|
| `analyzePresentation(apiKey, base64, mime, mode, name, gender)` | gemini-2.5-flash | Analyze slides → summary + concepts + script |
| `generatePodcastAudio(apiKey, script, name, gender)` | gemini-2.5-flash-tts | Script → spoken audio (base64 MP3) |
| `chatWithLecture(apiKey, context, history, question)` | gemini-2.5-flash | Context-aware Q&A about lecture |
| `generateQuiz(apiKey, context, settings)` | gemini-2.0-flash | Generate quiz questions |
| `synthesizeMetaLecture(apiKey, lectures, title)` | gemini-2.5-flash | Merge multiple lectures into one |

---

## Data Flows

### Lecture Processing
```
Upload file → FileUpload → AppSupabase.onFileSelected → ProcessingModal
→ User picks mode (FULL_LECTURE / SUMMARY) → processLecture
→ geminiService.analyzePresentation → returns SummaryData
→ Save to Supabase lectures table → UI updates
```

### Audio Generation
```
Click "Generate Audio" → generateAudio → geminiService.generatePodcastAudio
→ Returns base64 MP3 → Upload to Supabase Storage → Update lecture.audio_url
→ AudioPlayer renders with audio
```

### Audio Sync
```
AudioPlayer emits onProgressUpdate(currentTime) → useAudioSync.handleAudioProgress
→ Finds active script line by timestamp → Updates activeLineIndex
→ Auto-scroll script to active line + highlight
```

### Quiz Flow
```
Open QUIZ tab → initQuiz (creates SETUP state in DB)
→ User picks difficulty + count → generateNewQuiz → geminiService.generateQuiz
→ Questions shuffled (randomize answer order) → status: ACTIVE
→ User answers → answerQuizQuestion → updates concept progress
→ All answered → status: COMPLETED → show score + review
→ "New Quiz" → closeQuiz → resets to SETUP (count resets to defaults for lecture type)
```

### Meta-Lecture Flow
```
Course view → "Create Meta-Lecture" → MetaLectureModal
→ Select 2-10 lectures → Enter title → createMetaLecture
→ geminiService.synthesizeMetaLecture → merges/deduplicates concepts
→ Creates new lecture with lectureType: 'META' + metadata
→ Displayed with gold gradient in lecture list
```

### Highlight Flow
```
SUMMARY tab → User selects text → handleMouseUp detects selection
→ FloatingHighlightButton appears → Click "Mark as important"
→ addHighlight → saves to Supabase highlights table
→ Text shows yellow highlight + appears in HIGHLIGHTS tab
```

### Smart Search
```
User types in SmartSearchBar → useSmartSearch filters:
  Priority 1: Title match → matchType: 'TITLE'
  Priority 2: Summary text → matchType: 'SUMMARY'
  Priority 3: Concept (summaryPoints) → matchType: 'CONCEPT'
  Priority 4: User insights → matchType: 'INSIGHT'
→ Click lecture → forces relevant tab
```

---

## Key Component Details

### AppSupabase.tsx (~1000 lines)
Main app with conditional rendering:

**Guard screens (in order):**
1. Auth loading spinner
2. Login screen (`SupabaseAuthScreen`) — if !user
3. Gender selection — if !user.gender
4. API key setup (`ApiKeySetup`) — if !user.apiKey
5. Data loading spinner — if !isDataLoaded

**Main views (by ViewState):**
1. `DASHBOARD` — Grid of CourseCards
2. `COURSE` — LectureItems with SmartSearchBar + MetaLectureModal
3. `LECTURE` — SmartBoard (8 tabs) + AudioPlayer + Script viewer

**Inline Modals:**
- Processing Mode Selection
- Add/Edit Course
- Add/Edit Lecture
- Preview Lecture
- Expanded Concept
- Meta-Lecture Creation

### LectureItem.tsx
- Regular lectures: white/slate background
- Meta-lectures: animated gold gradient (`meta-lecture-gradient` CSS class in index.css), amber icon, amber hover colors

### QuizPanel.tsx
- Regular lectures: question count options [3, 5, 10], default 5
- Meta-lectures: question count options [5, 10, 20, 30], default 10
- Answers are shuffled after AI generation (Fisher-Yates in useQuizActions)
- Flow: SETUP → LOADING → ACTIVE (per-question with feedback) → COMPLETED (score + review)
- "New Quiz" resets to SETUP and restores default count for lecture type

### DetailedSummary.tsx
- Renders `summaryData.detailedSummary` with rich formatting (headers, lists, examples, bold)
- Text selection triggers `handleMouseUp` → shows FloatingHighlightButton
- Existing highlights rendered with yellow background
- Hover on highlight shows delete button

---

## CSS Animations (index.css)

- `animate-fade-in-up` — Fade in with upward motion
- `meta-lecture-gradient` — Animated gold/amber gradient for meta-lecture rows (6s cycle)
- `score-reveal` — Quiz score number reveal animation
- `float-animation` — Subtle floating for empty states

---

## Dark Mode (Tailwind v4)
```css
/* index.css */
@custom-variant dark (&:where(.dark, .dark *));
```
NOT via tailwind.config.js. Theme toggle saves to localStorage.

---

## Cross-Hook Dependencies

```
useProgressActions ──────────────┐
                                 ├─→ useQuizActions (needs updateConceptProgress)
                                 ├─→ useFlashcardActions (needs updateConceptProgress)
                                 │
useSupabaseStore (facade) ───────┘
  ├── useAuth
  ├── useCourseActions
  ├── useLectureActions
  ├── useChatActions
  ├── useInsightActions
  ├── useHighlightActions
  └── useMigration

useMetaLectureActions ──── used directly in AppSupabase (not via facade)
```

---

## Database Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User data | id, name, gender, gemini_api_key |
| `courses` | Course container | id, user_id, name, code, color |
| `lectures` | Lecture data | id, course_id, status, summary_data (JSONB), audio_url, lecture_type, source_lecture_ids |
| `chat_messages` | Chat history | id, lecture_id, role, content |
| `insights` | User notes | id, lecture_id, content |
| `highlights` | Exam highlights | id, lecture_id, text, start_offset, end_offset |
| `quiz_sessions` | Quiz state | id, lecture_id, status, questions (JSONB), user_answers (JSONB), score |
| `flashcard_sessions` | Flashcard state | id, lecture_id, cards (JSONB), current_index, known_count |
| `concept_progress` | Learning analytics | id, lecture_id, concept_index, mastery_level, quiz_correct/total, flashcard ratings |

**Storage Bucket:** `audio-files` — Path: `{userId}/{lectureId}.mp3`

See `DATABASE.md` for full schema details.

---

## Getting Started (For New Agents)

1. Read this **ARCHITECTURE.md** to understand the full system
2. Check **types.ts** for all data structures
3. Check **DATABASE.md** for database schema and API patterns
4. Look at **hooks/useSupabaseStore.ts** to understand state management facade
5. Look at **AppSupabase.tsx** to understand UI flow and view routing
6. Use Grep/Read to dive into specific files as needed

**Pro tip:** Don't try to read all files upfront. Use this doc to navigate, then read specific files only when needed for changes.

---

## Common Tasks

### Adding a New Feature
1. Add TypeScript types in `types.ts`
2. Create hook in `hooks/useXxxActions.ts`
3. Add to facade in `useSupabaseStore.ts` (watch hook ordering!)
4. Create/update components in `components/`
5. Wire up in `AppSupabase.tsx` and/or `SmartBoard.tsx`
6. Add database migration if needed

### Adding a New SmartBoard Tab
1. Add tab ID to `Tab` type in SmartBoard.tsx
2. Add tab config in the `tabs` array (label, color, icon)
3. Create tab component
4. Add conditional render in SmartBoard's tab content area
5. Pass props through from AppSupabase → SmartBoard
