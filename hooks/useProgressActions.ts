import { ConceptProgress, MasteryLevel, LectureProgress } from '../types';
import { AppUser, SupabaseFetchFn } from './storeTypes';

interface UseProgressDeps {
  user: AppUser | null;
  supabaseFetch: SupabaseFetchFn;
}

export const useProgressActions = ({ user, supabaseFetch }: UseProgressDeps) => {

  const calculateMasteryLevel = (score: number): MasteryLevel => {
    if (score >= 90) return 'MASTERED';
    if (score >= 70) return 'STRONG';
    if (score >= 50) return 'LEARNING';
    if (score > 0) return 'WEAK';
    return 'NOT_STARTED';
  };

  const calculateMasteryScore = (quizCorrect: number, quizIncorrect: number, flashcardRatings: number[]): number => {
    let score = 50; // Start at 50%

    // Quiz impact: +15 for correct, -20 for incorrect
    score += quizCorrect * 15;
    score -= quizIncorrect * 20;

    // Flashcard impact: ratings are 1=hard, 2=medium, 3=easy
    if (flashcardRatings.length > 0) {
      const avgRating = flashcardRatings.reduce((a, b) => a + b, 0) / flashcardRatings.length;
      // avgRating 1 -> -10, avgRating 2 -> 0, avgRating 3 -> +10
      score += (avgRating - 2) * 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const updateConceptProgress = async (
    lectureId: string,
    conceptIndex: number,
    conceptText: string,
    isCorrect: boolean,
    source: 'quiz' | 'flashcard',
    flashcardRating?: number
  ) => {
    if (!user) return;

    try {
      // First, try to get existing progress
      const existingResponse = await supabaseFetch(
        `/concept_progress?lecture_id=eq.${lectureId}&user_id=eq.${user.id}&concept_index=eq.${conceptIndex}`,
        { method: 'GET' }
      );

      const existing = existingResponse?.[0];

      let quizCorrect = existing?.quiz_correct || 0;
      let quizIncorrect = existing?.quiz_incorrect || 0;
      let flashcardRatings: number[] = existing?.flashcard_ratings || [];

      if (source === 'quiz') {
        if (isCorrect) {
          quizCorrect++;
        } else {
          quizIncorrect++;
        }
      } else if (source === 'flashcard' && flashcardRating) {
        flashcardRatings.push(flashcardRating);
        // Keep only last 10 ratings
        if (flashcardRatings.length > 10) {
          flashcardRatings = flashcardRatings.slice(-10);
        }
      }

      const masteryScore = calculateMasteryScore(quizCorrect, quizIncorrect, flashcardRatings);
      const masteryLevel = calculateMasteryLevel(masteryScore);

      const progressData = {
        user_id: user.id,
        lecture_id: lectureId,
        concept_index: conceptIndex,
        concept_text: conceptText,
        quiz_correct: quizCorrect,
        quiz_incorrect: quizIncorrect,
        flashcard_ratings: flashcardRatings,
        last_flashcard_rating: flashcardRating || existing?.last_flashcard_rating || null,
        mastery_score: masteryScore,
        mastery_level: masteryLevel,
        last_reviewed_at: new Date().toISOString()
      };

      if (existing) {
        // Update existing
        await supabaseFetch(
          `/concept_progress?id=eq.${existing.id}`,
          { method: 'PATCH', body: JSON.stringify(progressData) }
        );
      } else {
        // Insert new
        await supabaseFetch('/concept_progress', {
          method: 'POST',
          body: JSON.stringify(progressData)
        });
      }

      console.log(`[Progress] Updated concept "${conceptText}" - Score: ${masteryScore}%, Level: ${masteryLevel}`);
    } catch (error) {
      console.error('[Progress] Failed to update concept progress:', error);
    }
  };

  const getLectureProgress = async (lectureId: string): Promise<LectureProgress | null> => {
    if (!user) return null;

    try {
      const response = await supabaseFetch(
        `/concept_progress?lecture_id=eq.${lectureId}&user_id=eq.${user.id}`,
        { method: 'GET' }
      );

      if (!response || response.length === 0) {
        return null;
      }

      const concepts: ConceptProgress[] = response.map((row: any) => ({
        id: row.id,
        lectureId: row.lecture_id,
        conceptIndex: row.concept_index,
        conceptText: row.concept_text,
        quizCorrect: row.quiz_correct,
        quizIncorrect: row.quiz_incorrect,
        flashcardRatings: row.flashcard_ratings || [],
        lastFlashcardRating: row.last_flashcard_rating,
        masteryScore: row.mastery_score,
        masteryLevel: row.mastery_level,
        lastReviewedAt: row.last_reviewed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      const overallMastery = concepts.length > 0
        ? Math.round(concepts.reduce((sum, c) => sum + c.masteryScore, 0) / concepts.length)
        : 0;

      const strongCount = concepts.filter(c => c.masteryScore >= 70).length;
      const weakCount = concepts.filter(c => c.masteryScore < 50 && c.masteryScore > 0).length;

      const lastStudiedAt = concepts
        .map(c => c.lastReviewedAt)
        .filter(Boolean)
        .sort()
        .reverse()[0];

      return {
        lectureId,
        concepts,
        overallMastery,
        strongCount,
        weakCount,
        lastStudiedAt
      };
    } catch (error) {
      console.error('[Progress] Failed to get lecture progress:', error);
      return null;
    }
  };

  return {
    calculateMasteryLevel,
    calculateMasteryScore,
    updateConceptProgress,
    getLectureProgress
  };
};
