import { Dispatch, SetStateAction } from 'react';
import { Course, ViewState } from '../types';
import { AppUser, SupabaseFetchFn } from './storeTypes';

interface UseCourseDeps {
  user: AppUser | null;
  setCourses: Dispatch<SetStateAction<Course[]>>;
  viewState: ViewState;
  setViewState: Dispatch<SetStateAction<ViewState>>;
  supabaseFetch: SupabaseFetchFn;
}

export const useCourseActions = ({ user, setCourses, viewState, setViewState, supabaseFetch }: UseCourseDeps) => {

  const addCourse = async (name: string) => {
    if (!user) return;

    const colors = ['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-purple-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const code = name.substring(0, 3).toUpperCase() + '-101';

    const storedSession = localStorage.getItem('sb-lfqsttzweentcpeyohxu-auth-token');
    const accessToken = storedSession ? JSON.parse(storedSession).access_token : null;

    try {
      console.log('[addCourse] Creating course:', name);
      const response = await fetch('https://lfqsttzweentcpeyohxu.supabase.co/rest/v1/courses', {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcXN0dHp3ZWVudGNwZXlvaHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMzk5MjEsImV4cCI6MjA4NDgxNTkyMX0.PHtlJA7lHNxeXQxIBpXFth_0IYRxSzUZjG8bwLtzA78',
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: user.id,
          name,
          code,
          color: randomColor
        })
      });
      const [newCourseData] = await response.json();
      console.log('[addCourse] Created:', newCourseData);

      if (newCourseData?.id) {
        const newCourse: Course = {
          id: newCourseData.id,
          name: newCourseData.name,
          code: newCourseData.code,
          color: newCourseData.color,
          lectures: []
        };
        setCourses(prev => [newCourse, ...prev]);
      }
    } catch (error) {
      console.error('Failed to add course:', error);
      throw error;
    }
  };

  const updateCourse = async (id: string, name: string) => {
    try {
      await supabaseFetch(`/courses?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name })
      });
      setCourses(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    } catch (error) {
      console.error('Failed to update course:', error);
      throw error;
    }
  };

  const deleteCourse = async (courseId: string) => {
    try {
      await supabaseFetch(`/courses?id=eq.${courseId}`, { method: 'DELETE' });
      setCourses(prev => prev.filter(c => c.id !== courseId));
      if (viewState.type !== 'DASHBOARD' && viewState.courseId === courseId) {
        setViewState({ type: 'DASHBOARD' });
      }
    } catch (error) {
      console.error('Failed to delete course:', error);
      throw error;
    }
  };

  return { addCourse, updateCourse, deleteCourse };
};
