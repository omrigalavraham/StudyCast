# StudyCast Hebrew - AI Agent Guide

## What Is This Project?
StudyCast is a Hebrew-first AI study platform. Users upload lecture slides/PDFs → AI (Google Gemini) generates summaries, podcast audio, flashcards, quizzes, and tracks learning progress. Built with React 19 + TypeScript + Supabase + Tailwind v4.

## Quick Navigation
- **Full architecture details:** `ARCHITECTURE.md`
- **Database schema & API patterns:** `DATABASE.md`
- **All TypeScript types:** `types.ts`
- **State management facade:** `hooks/useSupabaseStore.ts`
- **Main app layout/routing:** `AppSupabase.tsx`
- **AI service functions:** `services/geminiService.ts`
- **Global CSS & animations:** `index.css`

## Project Structure (key files)
```
AppSupabase.tsx          ← Main app: routing, modals, guard screens, layout
types.ts                 ← ALL interfaces (Lecture, Course, Quiz, Flashcard, Highlight, etc.)
index.css                ← Tailwind imports + custom animations

components/ (27 files)
  SmartBoard.tsx         ← 8-tab dashboard (CONCEPTS|SUMMARY|CHAT|FLASHCARDS|QUIZ|PROGRESS|HIGHLIGHTS|INSIGHTS)
  DetailedSummary.tsx    ← Rich summary renderer + text selection for highlights
  QuizPanel.tsx          ← Quiz UI (setup → active → completed). Meta-lectures get [5,10,20,30] options
  LectureItem.tsx        ← Lecture row. Meta-lectures have animated gold gradient
  MetaLectureModal.tsx   ← Modal for creating meta-lectures (merge 2-10 lectures)
  FloatingHighlightButton.tsx ← Appears on text selection to mark as important

hooks/ (18 files)
  useSupabaseStore.ts    ← FACADE that composes all hooks. Single entry point for state
  useQuizActions.ts      ← Quiz CRUD + answer shuffling (Fisher-Yates)
  useHighlightActions.ts ← Highlight CRUD
  useMetaLectureActions.ts ← Meta-lecture synthesis
  useProgressActions.ts  ← Per-concept mastery tracking
  useLectureActions.ts   ← Lecture CRUD + AI processing + audio generation
  [see ARCHITECTURE.md for all 18 hooks]

services/
  geminiService.ts       ← ALL AI calls (analyzePresentation, generatePodcastAudio, chatWithLecture, generateQuiz, synthesizeMetaLecture)
```

## Critical Rules

### Hook Ordering in useSupabaseStore.ts
`useProgressActions` MUST be initialized BEFORE `useQuizActions` and `useFlashcardActions` — they depend on `progressActions.updateConceptProgress`.

### Dark Mode
Uses Tailwind v4 CSS-first config: `@custom-variant dark (&:where(.dark, .dark *));` in index.css. NOT via tailwind.config.js.

### Database API
Uses direct REST calls via `supabaseFetch()`, NOT the Supabase JS client. All endpoints are relative to `/rest/v1/`.

### Highlights Table
May not exist yet in Supabase — code has try/catch fallback. SQL migration is in `DATABASE.md` under the highlights section.

### Meta-Lectures
- `lecture.lectureType === 'META'` — created by merging 2-10 lectures
- Has different quiz options (5/10/20/30 vs 3/5/10)
- Displayed with animated gold gradient CSS class `meta-lecture-gradient`
- No podcast audio (script panel hidden for META type)

### Quiz Answer Shuffling
After AI generates questions, `shuffleAllQuestions()` in useQuizActions.ts randomizes answer order using Fisher-Yates so the correct answer isn't always first.

## Feature Map → Files

| Feature | Key Files |
|---------|-----------|
| Lecture upload & processing | `FileUpload.tsx`, `useLectureActions.ts`, `geminiService.analyzePresentation` |
| Podcast audio | `AudioPlayer.tsx`, `useAudioSync.ts`, `geminiService.generatePodcastAudio` |
| Summary display | `DetailedSummary.tsx`, `SmartBoard.tsx` (SUMMARY tab) |
| Text highlights | `DetailedSummary.tsx`, `FloatingHighlightButton.tsx`, `HighlightsTab.tsx`, `useHighlightActions.ts` |
| Quiz system | `QuizPanel.tsx`, `useQuizActions.ts`, `geminiService.generateQuiz` |
| Flashcards | `FlashcardPanel.tsx`, `FlashCard.tsx`, `useFlashcardActions.ts` |
| AI Chat | `ChatPanel.tsx`, `useChatActions.ts`, `geminiService.chatWithLecture` |
| Progress tracking | `ProgressPanel.tsx`, `useProgressActions.ts` |
| Meta-lectures | `MetaLectureModal.tsx`, `useMetaLectureActions.ts`, `geminiService.synthesizeMetaLecture` |
| Smart search | `SmartSearchBar.tsx`, `useSmartSearch.ts` |
| User insights | `InsightsPanel.tsx`, `useInsightActions.ts` |
| Auth | `SupabaseAuthScreen.tsx`, `ApiKeySetup.tsx`, `useAuth.ts` |
| Course management | `CourseCard.tsx`, `useCourseActions.ts` |
| Lecture list | `LectureItem.tsx` (with meta-lecture gradient) |
| Modals | `useModalState.ts` (state), inline in `AppSupabase.tsx` (rendering) |

## Language
- UI is fully in Hebrew (RTL)
- Variable names and code comments mix Hebrew and English
- AI prompts in geminiService.ts are in Hebrew
