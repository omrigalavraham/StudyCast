import { useState } from 'react';

export const useLectureWorkspace = () => {
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [forcedTab, setForcedTab] = useState<'CONCEPTS' | 'SUMMARY' | 'CHAT' | 'FLASHCARDS' | 'QUIZ' | 'INSIGHTS' | 'PROGRESS' | undefined>(undefined);
  const [chatDraft, setChatDraft] = useState<string>('');
  const [isActionProcessing, setIsActionProcessing] = useState(false);
  const [isPodcastPanelHidden, setIsPodcastPanelHidden] = useState(false);

  return {
    isGeneratingAudio,
    setIsGeneratingAudio,
    isGeneratingFlashcards,
    setIsGeneratingFlashcards,
    forcedTab,
    setForcedTab,
    chatDraft,
    setChatDraft,
    isActionProcessing,
    setIsActionProcessing,
    isPodcastPanelHidden,
    setIsPodcastPanelHidden
  };
};
