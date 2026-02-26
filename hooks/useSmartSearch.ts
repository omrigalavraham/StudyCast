import { useMemo } from 'react';
import { Course, Lecture } from '../types';

interface UseSmartSearchParams {
  activeCourse: Course | null;
  searchQuery: string;
}

export const useSmartSearch = ({ activeCourse, searchQuery }: UseSmartSearchParams) => {
  const filteredLectures = useMemo(() => {
    if (!activeCourse) return [];
    if (!searchQuery.trim()) return activeCourse.lectures.map(l => ({ lecture: l, matchType: null }));

    const query = searchQuery.toLowerCase();

    return activeCourse.lectures
      .map(lecture => {
        // 1. Check Title (High Priority)
        if (lecture.title.toLowerCase().includes(query)) {
          return { lecture, matchType: 'TITLE' as const };
        }

        // 2. Check Summary
        if (lecture.summaryData?.summary.toLowerCase().includes(query)) {
          return { lecture, matchType: 'SUMMARY' as const };
        }

        // 3. Check Summary Points (Concepts)
        if (lecture.summaryData?.summaryPoints.some(p => p.point.toLowerCase().includes(query) || p.details.toLowerCase().includes(query))) {
          return { lecture, matchType: 'CONCEPT' as const };
        }

        // 4. Check Insights
        if (lecture.insights?.some(insight => insight.content.toLowerCase().includes(query))) {
          return { lecture, matchType: 'INSIGHT' as const };
        }

        return null;
      })
      .filter((item): item is { lecture: Lecture; matchType: 'TITLE' | 'SUMMARY' | 'INSIGHT' | 'CONCEPT' | null } => item !== null);
  }, [activeCourse, searchQuery]);

  return { filteredLectures };
};
