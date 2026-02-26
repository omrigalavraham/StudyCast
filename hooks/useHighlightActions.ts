import { Dispatch, SetStateAction } from 'react';
import { Course, Highlight } from '../types';
import { AppUser, SupabaseFetchFn } from './storeTypes';

interface UseHighlightDeps {
  user: AppUser | null;
  setCourses: Dispatch<SetStateAction<Course[]>>;
  supabaseFetch: SupabaseFetchFn;
}

export const useHighlightActions = ({ user, setCourses, supabaseFetch }: UseHighlightDeps) => {

  const addHighlight = async (
    courseId: string,
    lectureId: string,
    text: string,
    startOffset: number,
    endOffset: number
  ) => {
    if (!user) {
      console.log('[Highlights] No user, cannot add highlight');
      return;
    }

    console.log('[Highlights] Adding highlight:', { courseId, lectureId, text: text.substring(0, 50) });

    try {
      const result = await supabaseFetch('/highlights', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          lecture_id: lectureId,
          text,
          start_offset: startOffset,
          end_offset: endOffset
        })
      });
      console.log('[Highlights] API response:', result);
      const newHighlightData = result?.[0];

      if (newHighlightData?.id) {
        console.log('[Highlights] Highlight saved:', newHighlightData.id);
        const newHighlight: Highlight = {
          id: newHighlightData.id,
          text: newHighlightData.text,
          startOffset: newHighlightData.start_offset,
          endOffset: newHighlightData.end_offset,
          createdAt: newHighlightData.created_at
        };

        setCourses(prev => prev.map(c => {
          if (c.id !== courseId) return c;
          return {
            ...c,
            lectures: c.lectures.map(l => {
              if (l.id !== lectureId) return l;
              return { ...l, highlights: [...(l.highlights || []), newHighlight] };
            })
          };
        }));

        return newHighlight;
      }
    } catch (error) {
      console.error('[Highlights] Failed to add highlight:', error);
    }
    console.log('[Highlights] No highlight was saved');
    return null;
  };

  const deleteHighlight = async (courseId: string, lectureId: string, highlightId: string) => {
    try {
      await supabaseFetch(`/highlights?id=eq.${highlightId}`, { method: 'DELETE' });

      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          lectures: c.lectures.map(l => {
            if (l.id !== lectureId) return l;
            return {
              ...l,
              highlights: (l.highlights || []).filter(h => h.id !== highlightId)
            };
          })
        };
      }));
    } catch (error) {
      console.error('Failed to delete highlight:', error);
    }
  };

  return { addHighlight, deleteHighlight };
};
