import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Lecture } from '../types';

interface UseAudioSyncParams {
  activeLecture: Lecture | null;
}

export const useAudioSync = ({ activeLecture }: UseAudioSyncParams) => {
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
  const [activePointIndex, setActivePointIndex] = useState<number>(-1);
  const [expandedPointIndex, setExpandedPointIndex] = useState<number | null>(null);

  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scriptContainerRef = useRef<HTMLDivElement>(null);

  // Script Auto-Scroll & Concept Linking Logic
  const parsedScript = useMemo(() => {
    if (!activeLecture?.summaryData?.script) return [];
    const scriptLines = activeLecture.summaryData.script;
    const hasTimestamps = scriptLines.some(l => l.startTime !== undefined);

    if (hasTimestamps) {
      return scriptLines.map(line => ({
        ...line,
        isOmri: line.speaker === 'עומרי',
        isNoa: line.speaker === 'נועה',
        start: line.startTime || 0,
        end: line.endTime || 0
      }));
    }

    const totalLength = scriptLines.reduce((acc, curr) => acc + curr.text.length, 0);
    let currentPos = 0;

    return scriptLines.map(line => {
      const startRatio = currentPos / totalLength;
      const endRatio = (currentPos + line.text.length) / totalLength;
      currentPos += line.text.length;
      return {
        ...line,
        isOmri: line.speaker === 'עומרי',
        isNoa: line.speaker === 'נועה',
        startRatio,
        endRatio,
        start: 0,
        end: 0
      };
    });
  }, [activeLecture?.summaryData?.script]);

  const handleAudioProgress = useCallback((currentTime: number, duration: number) => {
    if (!parsedScript.length) return;
    const usingTimestamps = parsedScript[0].start !== parsedScript[0].end;

    let index = -1;
    if (usingTimestamps) {
      index = parsedScript.findIndex(line => currentTime >= line.start && currentTime < line.end);
    } else {
      const progressRatio = duration > 0 ? currentTime / duration : 0;
      index = parsedScript.findIndex(line => {
        // @ts-ignore
        const s = line.startRatio || 0;
        // @ts-ignore
        const e = line.endRatio || 0;
        return progressRatio >= s && progressRatio < e;
      });
    }

    if (index !== -1 && index !== activeLineIndex) {
      setActiveLineIndex(index);
      const relatedPointIndex = parsedScript[index].relatedPointIndex;
      if (relatedPointIndex !== undefined && relatedPointIndex !== -1) {
        setActivePointIndex(relatedPointIndex);
        if (expandedPointIndex !== null) {
          setExpandedPointIndex(relatedPointIndex);
        }
      } else {
        setActivePointIndex(-1);
      }
    }
  }, [parsedScript, activeLineIndex, expandedPointIndex]);

  useEffect(() => {
    if (activeLineIndex >= 0 && lineRefs.current[activeLineIndex]) {
      lineRefs.current[activeLineIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLineIndex]);

  return {
    activeLineIndex,
    activePointIndex,
    expandedPointIndex,
    setExpandedPointIndex,
    lineRefs,
    scriptContainerRef,
    parsedScript,
    handleAudioProgress
  };
};
