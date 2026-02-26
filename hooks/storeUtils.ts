import { Dispatch, SetStateAction } from 'react';
import { Course, Lecture } from '../types';

export const createUpdateLectureLocal = (
  setCourses: Dispatch<SetStateAction<Course[]>>
) => {
  return (courseId: string, lectureId: string, updates: Partial<Lecture>) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lectures: c.lectures.map(l => {
          if (l.id !== lectureId) return l;
          return { ...l, ...updates };
        })
      };
    }));
  };
};
