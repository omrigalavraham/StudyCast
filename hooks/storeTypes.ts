import { Dispatch, SetStateAction } from 'react';
import { Course, Lecture, ViewState } from '../types';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  gender: 'male' | 'female' | null;
  apiKey: string | null;
}

export type SupabaseFetchFn = (endpoint: string, options?: RequestInit) => Promise<any>;

export type UpdateLectureLocalFn = (
  courseId: string,
  lectureId: string,
  updates: Partial<Lecture>
) => void;
