import { Dispatch, SetStateAction } from 'react';
import { Course, Lecture, QuizSession, QuizSettings, QuizQuestion } from '../types';
import { generateQuiz } from '../services/geminiService';
import { AppUser, SupabaseFetchFn } from './storeTypes';

// פונקציה לערבוב סדר התשובות בשאלה
const shuffleQuestionOptions = (question: QuizQuestion): QuizQuestion => {
  const options = [...question.options];
  const correctAnswer = options[question.correctOptionIndex];

  // ערבוב Fisher-Yates
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  // מציאת האינדקס החדש של התשובה הנכונה
  const newCorrectIndex = options.indexOf(correctAnswer);

  return {
    ...question,
    options,
    correctOptionIndex: newCorrectIndex
  };
};

// ערבוב כל השאלות
const shuffleAllQuestions = (questions: QuizQuestion[]): QuizQuestion[] => {
  return questions.map(shuffleQuestionOptions);
};

interface UseQuizDeps {
  user: AppUser | null;
  courses: Course[];
  setCourses: Dispatch<SetStateAction<Course[]>>;
  supabaseFetch: SupabaseFetchFn;
  activeLecture: Lecture | null;
  updateConceptProgress: (
    lectureId: string,
    conceptIndex: number,
    conceptText: string,
    isCorrect: boolean,
    source: 'quiz' | 'flashcard',
    flashcardRating?: number
  ) => Promise<void>;
}

export const useQuizActions = ({ user, courses, setCourses, supabaseFetch, activeLecture, updateConceptProgress }: UseQuizDeps) => {

  const updateQuizInDB = async (lectureId: string, updates: Record<string, any>) => {
    await supabaseFetch(`/quiz_sessions?lecture_id=eq.${lectureId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  };

  const initQuiz = async (courseId: string, lectureId: string) => {
    if (!user) return;

    try {
      const result = await supabaseFetch('/quiz_sessions', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          lecture_id: lectureId,
          status: 'SETUP',
          difficulty: 'MEDIUM',
          question_count: 5,
          questions: [],
          user_answers: {},
          score: 0
        })
      });

      const quiz: QuizSession = {
        status: 'SETUP',
        settings: { difficulty: 'MEDIUM', questionCount: 5 },
        questions: [],
        userAnswers: {},
        score: 0
      };

      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          lectures: c.lectures.map(l => {
            if (l.id !== lectureId) return l;
            if (l.quiz) return l;
            return { ...l, quiz };
          })
        };
      }));
    } catch (error) {
      console.error('Failed to init quiz:', error);
    }
  };

  const generateNewQuiz = async (courseId: string, lectureId: string, settings: QuizSettings) => {
    if (!user || !user.apiKey || !activeLecture || !activeLecture.summaryData) return;

    // Set loading state
    await updateQuizInDB(lectureId, {
      status: 'LOADING',
      difficulty: settings.difficulty,
      question_count: settings.questionCount
    });

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId) return l;
          return {
            ...l,
            quiz: { ...(l.quiz!), status: 'LOADING', settings: settings as any }
          };
        })
      };
    }));

    const context = {
      summary: activeLecture.summaryData.summary,
      summaryPoints: activeLecture.summaryData.summaryPoints
    };

    try {
      const rawQuestions = await generateQuiz(user.apiKey, context, settings);
      // ערבוב סדר התשובות כדי שהתשובה הנכונה לא תהיה תמיד במקום הראשון
      const questions = shuffleAllQuestions(rawQuestions);

      await updateQuizInDB(lectureId, {
        status: 'ACTIVE',
        questions,
        user_answers: {},
        score: 0
      });

      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          lectures: c.lectures.map(l => {
            if (l.id !== lectureId) return l;
            return {
              ...l,
              quiz: {
                status: 'ACTIVE',
                settings: settings as any,
                questions,
                userAnswers: {},
                score: 0
              }
            };
          })
        };
      }));
    } catch (error) {
      console.error(error);
      await updateQuizInDB(lectureId, { status: 'SETUP' });

      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          lectures: c.lectures.map(l => {
            if (l.id !== lectureId) return l;
            return { ...l, quiz: { ...(l.quiz!), status: 'SETUP' } };
          })
        };
      }));
      alert('שגיאה ביצירת הבוחן. נסה שוב.');
    }
  };

  const answerQuizQuestion = async (courseId: string, lectureId: string, questionId: string, answerIdx: number) => {
    const lecture = courses.find(c => c.id === courseId)?.lectures.find(l => l.id === lectureId);
    if (!lecture?.quiz || !user) return;

    const question = lecture.quiz.questions.find(q => q.id === questionId);
    if (!question) return;

    const isCorrect = answerIdx === question.correctOptionIndex;
    const conceptIndex = question.conceptIndex ?? 0;

    // Update concept progress
    await updateConceptProgress(lectureId, conceptIndex, lecture.summaryData?.summaryPoints[conceptIndex]?.point || '', isCorrect, 'quiz');

    const newAnswers = { ...lecture.quiz.userAnswers, [questionId]: answerIdx };
    const isComplete = lecture.quiz.questions.every(q => newAnswers[q.id] !== undefined);

    let status = lecture.quiz.status;
    let score = lecture.quiz.score;

    if (isComplete) {
      status = 'COMPLETED';
      let correctCount = 0;
      lecture.quiz.questions.forEach(q => {
        if (newAnswers[q.id] === q.correctOptionIndex) correctCount++;
      });
      score = Math.round((correctCount / lecture.quiz.questions.length) * 100);
    }

    await updateQuizInDB(lectureId, {
      user_answers: newAnswers,
      status,
      score
    });

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId) return l;
          return {
            ...l,
            quiz: { ...l.quiz!, userAnswers: newAnswers, status: status as any, score }
          };
        })
      };
    }));
  };

  const resetQuiz = async (courseId: string, lectureId: string) => {
    await updateQuizInDB(lectureId, {
      status: 'ACTIVE',
      user_answers: {},
      score: 0
    });

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId) return l;
          return {
            ...l,
            quiz: { ...l.quiz!, status: 'ACTIVE', userAnswers: {}, score: 0 }
          };
        })
      };
    }));
  };

  const closeQuiz = async (courseId: string, lectureId: string) => {
    // Reset quiz to SETUP state instead of deleting it completely
    // This allows the user to start a new quiz with fresh settings
    await updateQuizInDB(lectureId, {
      status: 'SETUP',
      questions: [],
      user_answers: {},
      score: 0
    });

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId) return l;
          return {
            ...l,
            quiz: {
              status: 'SETUP',
              settings: { difficulty: 'MEDIUM', questionCount: 5 },
              questions: [],
              userAnswers: {},
              score: 0
            }
          };
        })
      };
    }));
  };

  return { initQuiz, generateNewQuiz, answerQuizQuestion, resetQuiz, closeQuiz };
};
