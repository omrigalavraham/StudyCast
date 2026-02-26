import { Dispatch, SetStateAction } from 'react';
import { Course, Lecture, ChatMessage } from '../types';
import { chatWithLecture } from '../services/geminiService';
import { AppUser, SupabaseFetchFn, UpdateLectureLocalFn } from './storeTypes';

interface UseChatDeps {
  user: AppUser | null;
  setCourses: Dispatch<SetStateAction<Course[]>>;
  supabaseFetch: SupabaseFetchFn;
  updateLectureLocal: UpdateLectureLocalFn;
  activeLecture: Lecture | null;
}

export const useChatActions = ({ user, setCourses, supabaseFetch, updateLectureLocal, activeLecture }: UseChatDeps) => {

  const addChatMessageToDB = async (lectureId: string, role: 'user' | 'ai', content: string) => {
    await supabaseFetch('/chat_messages', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user?.id,
        lecture_id: lectureId,
        role,
        content,
        timestamp: new Date().toISOString()
      })
    });
  };

  const sendChatMessage = async (courseId: string, lectureId: string, message: string) => {
    if (!user || !user.apiKey || !activeLecture || !activeLecture.summaryData) return;

    // Add user message locally
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    const currentHistory = activeLecture.chatHistory || [];
    updateLectureLocal(courseId, lectureId, {
      chatHistory: [...currentHistory, userMsg]
    });

    // Save user message to DB
    await addChatMessageToDB(lectureId, 'user', message);

    // Get AI response
    const context = {
      summary: activeLecture.summaryData.summary,
      summaryPoints: activeLecture.summaryData.summaryPoints
    };

    try {
      const aiResponseText = await chatWithLecture(
        user.apiKey,
        context,
        currentHistory,
        message
      );

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'ai',
        content: aiResponseText,
        timestamp: new Date().toISOString()
      };

      // Save AI message to DB
      await addChatMessageToDB(lectureId, 'ai', aiResponseText);

      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          lectures: c.lectures.map(l => {
            if (l.id !== lectureId) return l;
            return { ...l, chatHistory: [...(l.chatHistory || []), aiMsg] };
          })
        };
      }));
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'ai',
        content: 'אופס, נתקלתי בשגיאה בתקשורת. אנא נסה שוב.',
        timestamp: new Date().toISOString()
      };

      await addChatMessageToDB(lectureId, 'ai', errorMsg.content);

      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          lectures: c.lectures.map(l => {
            if (l.id !== lectureId) return l;
            return { ...l, chatHistory: [...(l.chatHistory || []), errorMsg] };
          })
        };
      }));
    }
  };

  const clearChatHistory = async (courseId: string, lectureId: string) => {
    try {
      await supabaseFetch(`/chat_messages?lecture_id=eq.${lectureId}`, { method: 'DELETE' });
      updateLectureLocal(courseId, lectureId, { chatHistory: [] });
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  };

  return { sendChatMessage, clearChatHistory };
};
