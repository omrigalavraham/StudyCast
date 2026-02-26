import { Dispatch, SetStateAction } from 'react';
import { Course, Flashcard } from '../types';
import { AppUser, SupabaseFetchFn, UpdateLectureLocalFn } from './storeTypes';

interface UseFlashcardDeps {
  user: AppUser | null;
  courses: Course[];
  setCourses: Dispatch<SetStateAction<Course[]>>;
  supabaseFetch: SupabaseFetchFn;
  updateLectureLocal: UpdateLectureLocalFn;
  updateConceptProgress: (
    lectureId: string,
    conceptIndex: number,
    conceptText: string,
    isCorrect: boolean,
    source: 'quiz' | 'flashcard',
    flashcardRating?: number
  ) => Promise<void>;
}

export const useFlashcardActions = ({ user, courses, setCourses, supabaseFetch, updateLectureLocal, updateConceptProgress }: UseFlashcardDeps) => {

  const updateFlashcardsInDB = async (lectureId: string, updates: Record<string, any>) => {
    await supabaseFetch(`/flashcard_sessions?lecture_id=eq.${lectureId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  };

  const generateFlashcardsFromSummary = async (courseId: string, lectureId: string) => {
    if (!user) return;

    const course = courses.find(c => c.id === courseId);
    const lecture = course?.lectures.find(l => l.id === lectureId);
    if (!lecture?.summaryData?.summaryPoints) return;

    const cards: Flashcard[] = lecture.summaryData.summaryPoints.map((point, i) => ({
      id: crypto.randomUUID(),
      front: point.point,
      back: point.details,
      known: false
    }));

    try {
      // Create flashcard session in DB
      await supabaseFetch('/flashcard_sessions', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          lecture_id: lectureId,
          cards,
          current_index: 0,
          known_count: 0,
          status: 'IDLE'
        })
      });

      // Update local state
      updateLectureLocal(courseId, lectureId, {
        flashcards: { status: 'IDLE', cards, currentIndex: 0, knownCount: 0 }
      });
    } catch (error) {
      console.error('Failed to generate flashcards:', error);
    }
  };

  const startFlashcardLearning = async (courseId: string, lectureId: string) => {
    await updateFlashcardsInDB(lectureId, { status: 'LEARNING', current_index: 0 });

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId || !l.flashcards) return l;
          return {
            ...l,
            flashcards: { ...l.flashcards, status: 'LEARNING', currentIndex: 0 }
          };
        })
      };
    }));
  };

  const markFlashcardKnown = async (courseId: string, lectureId: string, difficulty: 1 | 2 | 3 = 3) => {
    // difficulty: 1=hard, 2=medium, 3=easy (default is easy since user marked as "known")
    const course = courses.find(c => c.id === courseId);
    const lecture = course?.lectures.find(l => l.id === lectureId);
    if (!lecture?.flashcards) return;

    const { cards, currentIndex, knownCount } = lecture.flashcards;
    const currentCard = cards[currentIndex];

    // Update concept progress with flashcard rating
    if (currentCard && lecture.summaryData?.summaryPoints) {
      const conceptText = currentCard.front;
      const conceptIndex = lecture.summaryData.summaryPoints.findIndex(p => p.point === conceptText);
      if (conceptIndex !== -1) {
        await updateConceptProgress(lectureId, conceptIndex, conceptText, true, 'flashcard', difficulty);
      }
    }

    const updatedCards = cards.map((card, idx) =>
      idx === currentIndex ? { ...card, known: true } : card
    );
    const newKnownCount = knownCount + 1;
    const nextIndex = currentIndex + 1;
    const isComplete = nextIndex >= cards.length;

    await updateFlashcardsInDB(lectureId, {
      cards: updatedCards,
      current_index: nextIndex,
      known_count: newKnownCount,
      status: isComplete ? 'COMPLETED' : 'LEARNING'
    });

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId || !l.flashcards) return l;
          return {
            ...l,
            flashcards: {
              status: isComplete ? 'COMPLETED' : 'LEARNING',
              cards: updatedCards,
              currentIndex: nextIndex,
              knownCount: newKnownCount
            }
          };
        })
      };
    }));
  };

  const markFlashcardUnknown = async (courseId: string, lectureId: string, difficulty: 1 | 2 | 3 = 1) => {
    // difficulty: 1=hard (default since user marked as "unknown"), 2=medium, 3=easy
    const course = courses.find(c => c.id === courseId);
    const lecture = course?.lectures.find(l => l.id === lectureId);
    if (!lecture?.flashcards) return;

    const { cards, currentIndex, knownCount } = lecture.flashcards;
    const currentCard = cards[currentIndex];

    // Update concept progress with flashcard rating (hard)
    if (currentCard && lecture.summaryData?.summaryPoints) {
      const conceptText = currentCard.front;
      const conceptIndex = lecture.summaryData.summaryPoints.findIndex(p => p.point === conceptText);
      if (conceptIndex !== -1) {
        await updateConceptProgress(lectureId, conceptIndex, conceptText, false, 'flashcard', difficulty);
      }
    }

    const updatedCards = cards.map((card, idx) =>
      idx === currentIndex ? { ...card, known: false } : card
    );
    const nextIndex = currentIndex + 1;
    const isComplete = nextIndex >= cards.length;

    await updateFlashcardsInDB(lectureId, {
      cards: updatedCards,
      current_index: nextIndex,
      status: isComplete ? 'COMPLETED' : 'LEARNING'
    });

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId || !l.flashcards) return l;
          return {
            ...l,
            flashcards: {
              status: isComplete ? 'COMPLETED' : 'LEARNING',
              cards: updatedCards,
              currentIndex: nextIndex,
              knownCount
            }
          };
        })
      };
    }));
  };

  const resetFlashcards = async (courseId: string, lectureId: string) => {
    const course = courses.find(c => c.id === courseId);
    const lecture = course?.lectures.find(l => l.id === lectureId);
    if (!lecture?.flashcards) return;

    const resetCards = lecture.flashcards.cards.map(card => ({ ...card, known: false }));

    await updateFlashcardsInDB(lectureId, {
      cards: resetCards,
      current_index: 0,
      known_count: 0,
      status: 'IDLE'
    });

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId || !l.flashcards) return l;
          return {
            ...l,
            flashcards: {
              status: 'IDLE',
              cards: resetCards,
              currentIndex: 0,
              knownCount: 0
            }
          };
        })
      };
    }));
  };

  const retryUnknownFlashcards = async (courseId: string, lectureId: string) => {
    const course = courses.find(c => c.id === courseId);
    const lecture = course?.lectures.find(l => l.id === lectureId);
    if (!lecture?.flashcards) return;

    // Filter only unknown cards and reset their known state
    const unknownCards = lecture.flashcards.cards
      .filter(card => !card.known)
      .map(card => ({ ...card, known: false }));

    if (unknownCards.length === 0) return;

    await updateFlashcardsInDB(lectureId, {
      cards: unknownCards,
      current_index: 0,
      known_count: 0,
      status: 'LEARNING'
    });

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId || !l.flashcards) return l;
          return {
            ...l,
            flashcards: {
              status: 'LEARNING',
              cards: unknownCards,
              currentIndex: 0,
              knownCount: 0
            }
          };
        })
      };
    }));
  };

  return {
    generateFlashcardsFromSummary,
    startFlashcardLearning,
    markFlashcardKnown,
    markFlashcardUnknown,
    resetFlashcards,
    retryUnknownFlashcards
  };
};
