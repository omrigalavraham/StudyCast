<div align="center">

# <img src="https://img.icons8.com/color/48/000000/podcast.png" width="36"/> StudyCast AI

### **Turn Any Presentation Into a Personalized Learning Experience**

*AI-Powered Study Platform | Hebrew-First | Built for Students*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

---

**StudyCast AI** transforms your lecture slides and notes into a complete study ecosystem — summaries, podcasts, flashcards, quizzes, and progress tracking — all powered by Google Gemini AI.

[Features](#-features) · [How It Works](#-how-it-works) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Architecture](#-architecture)

</div>

---

## The Problem

Students spend hours reading through slides, making summaries, and creating study materials. What if AI could do all of that — and more — in minutes?

## The Solution

**StudyCast AI** takes a single presentation file and generates an entire learning suite:

```
📄 Upload Slides  →  🧠 AI Analysis  →  📝 Summary + 🎙️ Podcast + 🃏 Flashcards + 📊 Quiz + 📈 Progress
```

---

## ✨ Features

### 🎙️ AI Podcast Generation
> *Your lectures, as an engaging conversation*

Upload your slides and get a fully voiced podcast-style dialogue between two hosts discussing the material. The AI creates a natural, easy-to-follow conversation that explains concepts as if a friend is teaching you.

- Natural Hebrew TTS with Google Gemini voices
- Dual-host format (male & female voices)
- Synchronized transcript with auto-scrolling
- Adjustable playback speed (0.75x - 2x)
- Audio regeneration on demand

### 📝 Intelligent Summaries
> *Hours of content, distilled into minutes*

The AI generates comprehensive, exam-ready summaries with structured formatting:

- **Big Picture Overview** — 2-3 sentence recap
- **Key Concepts** — extracted and explained individually
- **Detailed Summary** — full structured document with examples, bold terms, numbered sections
- Two processing modes: **Full Lecture** (deep analysis) or **Quick Summary**

### 🖍️ Exam Highlights
> *Mark what matters most*

Select any text in the summary and mark it as "important for exam." All highlights are collected in a dedicated tab for focused review.

- Text selection with floating action button
- Yellow highlight visualization
- Dedicated "For Exam" tab with all marked passages
- One-click delete

### 🃏 Smart Flashcards
> *Active recall, powered by AI*

Auto-generated flashcards from lecture concepts with a spaced repetition system:

- AI generates cards from key concepts
- Flip animation to reveal answers
- Mark as "Known" or "Need Review"
- Retry mode for struggling concepts
- Visual progress tracking

### 📊 Adaptive Quiz System
> *Test yourself, track your mastery*

AI-generated quizzes that adapt to lecture complexity:

- **3 difficulty levels**: Basic (recall) → Understanding (connections) → Application (scenarios)
- **Flexible question count**: 3-10 for lectures, 5-30 for meta-lectures
- Instant feedback with explanations for every answer
- Randomized answer order to prevent pattern memorization
- Score tracking and performance review

### 📈 Learning Progress Analytics
> *Know exactly where you stand*

Real-time tracking of concept mastery across all learning activities:

- Per-concept mastery levels (Not Started → Weak → Learning → Strong → Mastered)
- Visual progress bars and percentages
- Identifies weak areas and suggests focused practice
- Integrates data from quizzes and flashcards

### 🧠 Meta-Lectures
> *Combine multiple lectures into one study unit*

Select 2-10 lectures and merge them into a comprehensive meta-lecture:

- AI intelligently deduplicates overlapping concepts
- Creates unified summaries showing cross-topic relationships
- Perfect for studying entire units before an exam
- Premium gold gradient design to distinguish from regular lectures

### 💬 AI Chat Assistant
> *Your personal tutor, available 24/7*

Ask questions about the lecture material and get instant, context-aware explanations:

- Full conversation history
- Context-aware answers based on lecture content
- Save helpful explanations as personal insights
- Click any line in the podcast transcript to ask "explain this"

### 🔍 Smart Search
> *Find anything, across all your lectures*

Search across titles, summaries, concepts, and personal notes — with smart navigation to the exact match location.

### 🌙 Beautiful UI
> *Designed to make studying feel good*

- Neural glass design with gradients and blur effects
- Full dark mode support
- Responsive layout (mobile → desktop)
- RTL-first Hebrew interface
- Smooth animations throughout

---

## 🔄 How It Works

```
┌──────────────┐     ┌───────────────┐     ┌──────────────────────────┐
│              │     │               │     │                          │
│  Upload PPT  │────▶│  Gemini AI    │────▶│  Learning Dashboard      │
│  or PDF      │     │  Processing   │     │                          │
│              │     │               │     │  ┌────┐ ┌────┐ ┌─────┐  │
└──────────────┘     └───────────────┘     │  │Sum │ │Pod │ │Flash│  │
                                           │  │mary│ │cast│ │cards│  │
                                           │  └────┘ └────┘ └─────┘  │
                                           │  ┌────┐ ┌────┐ ┌─────┐  │
                                           │  │Quiz│ │Chat│ │Prog │  │
                                           │  │    │ │    │ │ress │  │
                                           │  └────┘ └────┘ └─────┘  │
                                           └──────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + TypeScript | UI framework with type safety |
| **Styling** | Tailwind CSS v4 | Utility-first CSS with dark mode |
| **AI Engine** | Google Gemini (Flash 2.0 / 2.5 / 3.0) | Content generation, quizzes, TTS |
| **Database** | Supabase (PostgreSQL) | User data, lectures, progress |
| **Storage** | Supabase Storage | Audio file hosting |
| **Auth** | Supabase Auth | User authentication |
| **Build** | Vite 6 | Fast development and bundling |
| **Deploy** | Netlify | Edge deployment with SSR |

### AI Models Used

| Model | Usage |
|-------|-------|
| `gemini-2.5-flash-preview-05-20` | Lecture analysis, summaries, chat |
| `gemini-2.0-flash` | Quiz generation |
| `gemini-2.5-flash-preview-tts` | Text-to-speech podcast audio |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Google Gemini API key](https://ai.google.dev/)
- A [Supabase project](https://supabase.com/) (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/omrigalavraham/StudyCast.git
cd StudyCast

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
```

### Environment Variables

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

Run the SQL migrations in `supabase_migrations/` in your Supabase SQL Editor to create the required tables.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — sign up, enter your Gemini API key, and start uploading lectures!

---

## 🏗️ Architecture

```
StudyCast/
├── components/           # React UI components
│   ├── SmartBoard.tsx       # Main learning dashboard (8 tabs)
│   ├── DetailedSummary.tsx  # Rich summary viewer with highlights
│   ├── QuizPanel.tsx        # Quiz engine UI
│   ├── FlashcardPanel.tsx   # Flashcard learning system
│   ├── AudioPlayer.tsx      # Podcast player with speed control
│   └── ...                  # 20+ components
│
├── hooks/                # Custom React hooks (modular state)
│   ├── useSupabaseStore.ts  # Main store facade
│   ├── useQuizActions.ts    # Quiz CRUD + scoring
│   ├── useHighlightActions.ts # Text highlight management
│   ├── useProgressActions.ts  # Learning analytics
│   └── ...                  # 15+ hooks
│
├── services/
│   └── geminiService.ts     # All AI interactions
│
├── types.ts              # TypeScript interfaces
└── AppSupabase.tsx       # Root application component
```

### Design Patterns

- **Facade Pattern** — `useSupabaseStore` unifies 10+ specialized hooks into one interface
- **Modular Hooks** — Each feature (quiz, flashcards, highlights, chat) has its own hook
- **Optimistic Updates** — UI updates instantly, syncs to database in background
- **Type-Safe** — Full TypeScript coverage across all modules

---

## 📱 Responsive Design

StudyCast works seamlessly across all devices:

- **Desktop** — Side-by-side podcast + learning dashboard layout
- **Tablet** — Stacked layout with full functionality
- **Mobile** — Optimized touch-friendly interface

---

## 🔐 Security

- Supabase Row-Level Security (RLS) on all tables
- API keys stored securely per-user in the database
- No server-side secrets exposed to the client
- Authentication via Supabase Auth with email/password

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

### Built with ❤️ for students who want to study smarter, not harder.

**[⬆ Back to Top](#-studycast-ai)**

</div>
