export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUMMARIZED = 'SUMMARIZED',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR'
}

export interface SummaryPoint {
  point: string;
  details: string;
}

export interface ScriptLine {
  speaker: string;
  text: string;
  relatedPointIndex?: number; // Index of the SummaryPoint this line discusses (optional, -1 for general chat)
  startTime?: number; // Start time in seconds
  endTime?: number;   // End time in seconds
}

export interface SummaryData {
  summary: string;
  detailedSummary?: string; // סיכום מפורט עם דוגמאות והסברים
  summaryPoints: SummaryPoint[];
  script: ScriptLine[]; // Changed from string to structured array
}

export interface FileData {
  base64: string;
  mimeType: string;
  name: string;
}

export interface AudioState {
  buffer: AudioBuffer | null;
  source: AudioBufferSourceNode | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
}

export type ProcessingMode = 'SUMMARY' | 'FULL_LECTURE';


export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface Insight {
  id: string;
  content: string;
  date: string;
}

// New Types for Course Structure
export interface Lecture {
  id: string;
  title: string;
  date: string;
  status: 'EMPTY' | 'ANALYZING' | 'READY' | 'ERROR';
  processingMode?: ProcessingMode;
  fileData?: FileData;
  summaryData?: SummaryData;
  audioBase64?: string;
  audioGeneratedDate?: string;
  errorMsg?: string;
  // New Fields
  chatHistory?: ChatMessage[];
  insights?: Insight[];
  quiz?: QuizSession;
  flashcards?: FlashcardSession;
  highlights?: Highlight[];      // סימוני טקסט חשוב למבחן

  // 🆕 Meta-Lecture Fields
  lectureType?: LectureType;
  sourceLectureIds?: string[];
  metaSynthesisMetadata?: MetaLectureSynthesisMetadata;
}

export type QuizDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number; // 0-3
  explanation: string;
  conceptIndex?: number; // Index of the concept this question tests (from summaryPoints)
}

export interface QuizSettings {
  difficulty: QuizDifficulty;
  questionCount: number;
}

export interface QuizSession {
  status: 'SETUP' | 'LOADING' | 'ACTIVE' | 'COMPLETED';
  settings: QuizSettings;
  questions: QuizQuestion[];
  userAnswers: Record<string, number>; // questionId -> selectedOptionIndex
  score: number;
}

// 🆕 Meta-Lecture Types
export type LectureType = 'REGULAR' | 'META';

export interface MetaLectureSynthesisMetadata {
  sourceLectures: {
    lectureId: string;
    title: string;
    conceptMapping: number[];  // אינדקסים של קונספטים ששרדו מהרצאה זו
  }[];
  conceptOrigins: {
    conceptIndex: number;           // אינדקס בקונספטים המשולבים
    sourceLectureIds: string[];     // מאיזה הרצאות מקור בא קונספט זה
    mergedFrom: number[];           // אינדקסים מקוריים בהרצאות המקור
  }[];
  synthesisDate: string;
  synthesisModel: string;
}

export interface Course {
  id: string;
  name: string;
  code: string; // e.g., "CS-101"
  color: string; // Tailwind class like "bg-indigo-500"
  lectures: Lecture[];
}

export type ViewState =
  | { type: 'DASHBOARD' }
  | { type: 'COURSE'; courseId: string }
  | { type: 'LECTURE'; courseId: string; lectureId: string };

// Flashcard Types
export interface Flashcard {
  id: string;
  front: string;      // צד קדמי - שאלה/מושג
  back: string;       // צד אחורי - תשובה/הסבר
  known: boolean;     // האם המשתמש יודע את הכרטיסייה
}

export interface FlashcardSession {
  status: 'IDLE' | 'LEARNING' | 'COMPLETED';
  cards: Flashcard[];
  currentIndex: number;
  knownCount: number;
}

// Learning Progress Types
export type MasteryLevel = 'NOT_STARTED' | 'WEAK' | 'LEARNING' | 'STRONG' | 'MASTERED';

export interface ConceptProgress {
  id: string;
  lectureId: string;
  conceptIndex: number;        // Index in summaryPoints array
  conceptText: string;         // The concept name (from summaryPoints.point)

  // Quiz metrics
  quizCorrect: number;         // Times answered correctly in quiz
  quizIncorrect: number;       // Times answered incorrectly in quiz

  // Flashcard metrics
  flashcardRatings: number[];  // Array of ratings (1=hard, 2=medium, 3=easy)
  lastFlashcardRating?: number;

  // Calculated
  masteryScore: number;        // 0-100
  masteryLevel: MasteryLevel;

  // Timestamps
  lastReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LectureProgress {
  lectureId: string;
  concepts: ConceptProgress[];
  overallMastery: number;      // Average of all concept mastery scores
  strongCount: number;         // Concepts with mastery >= 80
  weakCount: number;           // Concepts with mastery < 50
  lastStudiedAt?: string;
}

// Highlight Types - סימון קטעים חשובים למבחן
export interface Highlight {
  id: string;
  text: string;                  // הטקסט שנבחר
  startOffset: number;           // מיקום התחלה ב-detailedSummary
  endOffset: number;             // מיקום סיום ב-detailedSummary
  createdAt: string;             // תאריך יצירה
}
