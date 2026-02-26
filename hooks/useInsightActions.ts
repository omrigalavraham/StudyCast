import { Dispatch, SetStateAction } from 'react';
import { Course, Insight } from '../types';
import { AppUser, SupabaseFetchFn } from './storeTypes';

interface UseInsightDeps {
  user: AppUser | null;
  setCourses: Dispatch<SetStateAction<Course[]>>;
  supabaseFetch: SupabaseFetchFn;
}

export const useInsightActions = ({ user, setCourses, supabaseFetch }: UseInsightDeps) => {

  const addInsight = async (courseId: string, lectureId: string, content: string) => {
    if (!user) return;

    const date = new Date().toLocaleDateString('he-IL', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    try {
      const result = await supabaseFetch('/insights', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          lecture_id: lectureId,
          content,
          date
        })
      });
      const newInsightData = result[0];

      if (newInsightData?.id) {
        const newInsight: Insight = {
          id: newInsightData.id,
          content: newInsightData.content,
          date: newInsightData.date
        };

        setCourses(prev => prev.map(c => {
          if (c.id !== courseId) return c;
          return {
            ...c,
            lectures: c.lectures.map(l => {
              if (l.id !== lectureId) return l;
              return { ...l, insights: [newInsight, ...(l.insights || [])] };
            })
          };
        }));
      }
    } catch (error) {
      console.error('Failed to add insight:', error);
    }
  };

  const deleteInsight = async (courseId: string, lectureId: string, insightId: string) => {
    try {
      await supabaseFetch(`/insights?id=eq.${insightId}`, { method: 'DELETE' });

      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          lectures: c.lectures.map(l => {
            if (l.id !== lectureId) return l;
            return {
              ...l,
              insights: (l.insights || []).filter(i => i.id !== insightId)
            };
          })
        };
      }));
    } catch (error) {
      console.error('Failed to delete insight:', error);
    }
  };

  return { addInsight, deleteInsight };
};
