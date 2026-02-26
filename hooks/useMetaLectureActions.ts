import { Dispatch, SetStateAction } from 'react';
import { Course, Lecture } from '../types';
import { synthesizeMetaLecture } from '../services/geminiService';
import { AppUser, SupabaseFetchFn, UpdateLectureLocalFn } from './storeTypes';

interface UseMetaLectureDeps {
  user: AppUser | null;
  courses: Course[];
  setCourses: Dispatch<SetStateAction<Course[]>>;
  supabaseFetch: SupabaseFetchFn;
  updateLectureLocal: UpdateLectureLocalFn;
}

export const useMetaLectureActions = ({
  user, courses, setCourses, supabaseFetch, updateLectureLocal
}: UseMetaLectureDeps) => {

  const createMetaLecture = async (
    courseId: string,
    metaTitle: string,
    sourceLectureIds: string[]
  ) => {
    if (!user || !user.apiKey) {
      throw new Error('נדרש API Key');
    }

    if (sourceLectureIds.length < 2 || sourceLectureIds.length > 10) {
      throw new Error('יש לבחור 2-10 הרצאות');
    }

    const today = new Date().toLocaleDateString('he-IL', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    try {
      // 1. יצירת מטה-הרצאה ריקה ב-DB
      const result = await supabaseFetch('/lectures', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          course_id: courseId,
          title: metaTitle,
          date: today,
          status: 'ANALYZING',
          lecture_type: 'META',
          source_lecture_ids: sourceLectureIds
        })
      });

      const newLectureData = result[0];
      console.log('[createMetaLecture] Created:', newLectureData);

      if (!newLectureData?.id) throw new Error('Failed to create meta-lecture');

      const metaLectureId = newLectureData.id;

      // 2. הוספה ל-state מקומי (optimistic update)
      const newLecture: Lecture = {
        id: metaLectureId,
        title: metaTitle,
        date: today,
        status: 'ANALYZING',
        lectureType: 'META',
        sourceLectureIds,
        chatHistory: [],
        insights: []
      };

      setCourses(prev => prev.map(c => {
        if (c.id === courseId) {
          return { ...c, lectures: [newLecture, ...c.lectures] };
        }
        return c;
      }));

      // 3. שליפת הרצאות מקור
      const course = courses.find(c => c.id === courseId);
      const sourceLectures = sourceLectureIds
        .map(id => course?.lectures.find(l => l.id === id))
        .filter(l => l?.summaryData) as Lecture[];

      if (sourceLectures.length !== sourceLectureIds.length) {
        throw new Error('חסר summaryData בחלק מההרצאות');
      }

      // 4. סינתזה עם Gemini
      const { summaryData, metadata } = await synthesizeMetaLecture(
        user.apiKey,
        sourceLectures.map(l => ({ title: l.title, summaryData: l.summaryData! })),
        metaTitle
      );

      // 5. מילוי metadata עם IDs אמיתיים
      metadata.sourceLectures = sourceLectures.map((lec, idx) => ({
        lectureId: lec.id,
        title: lec.title,
        conceptMapping: metadata.conceptOrigins
          .filter((co: any) => co.mergedFrom.includes(idx))
          .map((co: any) => co.conceptIndex)
      }));

      metadata.conceptOrigins = metadata.conceptOrigins.map((co: any) => ({
        ...co,
        sourceLectureIds: co.mergedFrom.map((idx: number) => sourceLectures[idx].id)
      }));

      // 6. עדכון DB עם תוצאות
      await supabaseFetch(`/lectures?id=eq.${metaLectureId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'READY',
          summary_data: summaryData,
          meta_synthesis_metadata: metadata
        })
      });

      // 7. עדכון state מקומי
      updateLectureLocal(courseId, metaLectureId, {
        status: 'READY',
        summaryData,
        metaSynthesisMetadata: metadata
      });

      return metaLectureId;

    } catch (err) {
      console.error('[createMetaLecture] Error:', err);
      throw err;
    }
  };

  return { createMetaLecture };
};
