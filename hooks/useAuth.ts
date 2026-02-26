import { Dispatch, SetStateAction } from 'react';
import { Course, ViewState } from '../types';
import * as db from '../services/supabaseService';
import { AppUser, SupabaseFetchFn } from './storeTypes';

interface UseAuthDeps {
  user: AppUser | null;
  setUser: Dispatch<SetStateAction<AppUser | null>>;
  setCourses: Dispatch<SetStateAction<Course[]>>;
  setViewState: Dispatch<SetStateAction<ViewState>>;
  supabaseFetch: SupabaseFetchFn;
}

export const useAuth = ({ user, setUser, setCourses, setViewState, supabaseFetch }: UseAuthDeps) => {

  const handleSignUp = async (email: string, password: string, name: string) => {
    const result = await db.signUp(email, password, name);
    return result;
  };

  const handleSignIn = async (email: string, password: string) => {
    const result = await db.signIn(email, password);
    return result;
  };

  const handleSignOut = async () => {
    // Clear localStorage session
    localStorage.removeItem('sb-lfqsttzweentcpeyohxu-auth-token');
    setUser(null);
    setCourses([]);
    setViewState({ type: 'DASHBOARD' });
  };

  const updateApiKey = async (apiKey: string) => {
    if (!user) return;
    await supabaseFetch(`/profiles?id=eq.${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ gemini_api_key: apiKey })
    });
    setUser({ ...user, apiKey });
  };

  const updateGender = async (gender: 'male' | 'female') => {
    if (!user) return;
    await supabaseFetch(`/profiles?id=eq.${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ gender })
    });
    setUser({ ...user, gender });
  };

  return { handleSignUp, handleSignIn, handleSignOut, updateApiKey, updateGender };
};
