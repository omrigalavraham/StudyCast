import { Dispatch, SetStateAction } from 'react';
import { Course } from '../types';
import { AppUser } from './storeTypes';

interface UseMigrationDeps {
  user: AppUser | null;
  setCourses: Dispatch<SetStateAction<Course[]>>;
}

export const useMigration = ({ user, setCourses }: UseMigrationDeps) => {

  const migrateData = async (oldCourses: Course[]) => {
    if (!user) return;

    const storedSession = localStorage.getItem('sb-lfqsttzweentcpeyohxu-auth-token');
    const accessToken = storedSession ? JSON.parse(storedSession).access_token : null;
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcXN0dHp3ZWVudGNwZXlvaHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMzk5MjEsImV4cCI6MjA4NDgxNTkyMX0.PHtlJA7lHNxeXQxIBpXFth_0IYRxSzUZjG8bwLtzA78';
    const baseUrl = 'https://lfqsttzweentcpeyohxu.supabase.co/rest/v1';

    const headers = {
      'apikey': apiKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    console.log('[Migration] Starting migration for', oldCourses.length, 'courses');

    for (const course of oldCourses) {
      try {
        // Create course
        console.log('[Migration] Creating course:', course.name);
        const courseResponse = await fetch(`${baseUrl}/courses`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            user_id: user.id,
            name: course.name,
            code: course.code,
            color: course.color
          })
        });
        const [newCourse] = await courseResponse.json();
        console.log('[Migration] Course created:', newCourse?.id);

        if (!newCourse?.id) {
          console.error('[Migration] Failed to create course:', course.name);
          continue;
        }

        // Create lectures
        for (const lecture of course.lectures) {
          console.log('[Migration] Creating lecture:', lecture.title);
          const lectureResponse = await fetch(`${baseUrl}/lectures`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              user_id: user.id,
              course_id: newCourse.id,
              title: lecture.title,
              date: lecture.date,
              status: lecture.status,
              processing_mode: lecture.processingMode || null,
              error_msg: lecture.errorMsg || null,
              summary_data: lecture.summaryData || null,
              file_name: lecture.fileData?.name || null,
              file_mime_type: lecture.fileData?.mimeType || null,
              audio_generated_date: lecture.audioGeneratedDate || null
            })
          });
          const [newLecture] = await lectureResponse.json();
          console.log('[Migration] Lecture created:', newLecture?.id);

          if (!newLecture?.id) {
            console.error('[Migration] Failed to create lecture:', lecture.title);
            continue;
          }

          // Migrate chat history
          if (lecture.chatHistory && lecture.chatHistory.length > 0) {
            console.log('[Migration] Migrating', lecture.chatHistory.length, 'chat messages');
            for (const msg of lecture.chatHistory) {
              await fetch(`${baseUrl}/chat_messages`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  user_id: user.id,
                  lecture_id: newLecture.id,
                  role: msg.role,
                  content: msg.content,
                  timestamp: msg.timestamp
                })
              });
            }
          }

          // Migrate insights
          if (lecture.insights && lecture.insights.length > 0) {
            console.log('[Migration] Migrating', lecture.insights.length, 'insights');
            for (const insight of lecture.insights) {
              await fetch(`${baseUrl}/insights`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  user_id: user.id,
                  lecture_id: newLecture.id,
                  content: insight.content,
                  date: insight.date
                })
              });
            }
          }
        }
      } catch (error) {
        console.error('[Migration] Error migrating course:', course.name, error);
      }
    }

    console.log('[Migration] Complete! Reloading courses...');

    // Reload courses after migration using fetch
    const response = await fetch(
      `${baseUrl}/courses?user_id=eq.${user.id}&select=*&order=created_at.desc`,
      { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${accessToken}` } }
    );
    const coursesData = await response.json();

    // Also fetch lectures for each course
    const migratedCourses: Course[] = [];
    for (const c of coursesData) {
      const lecturesResponse = await fetch(
        `${baseUrl}/lectures?course_id=eq.${c.id}&select=*&order=created_at.desc`,
        { headers: { 'apikey': apiKey, 'Authorization': `Bearer ${accessToken}` } }
      );
      const lecturesData = await lecturesResponse.json();

      migratedCourses.push({
        id: c.id,
        name: c.name,
        code: c.code,
        color: c.color,
        lectures: (lecturesData || []).map((l: any) => ({
          id: l.id,
          title: l.title,
          date: l.date,
          status: l.status,
          processingMode: l.processing_mode,
          errorMsg: l.error_msg,
          summaryData: l.summary_data,
          fileData: l.file_name ? { name: l.file_name, mimeType: l.file_mime_type, base64: '' } : undefined,
          audioGeneratedDate: l.audio_generated_date,
          chatHistory: [],
          insights: []
        }))
      });
    }

    setCourses(migratedCourses);
    console.log('[Migration] Loaded', migratedCourses.length, 'courses');
  };

  return { migrateData };
};
