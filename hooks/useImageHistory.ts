
import { useState, useCallback } from 'react';
import { ImageHistoryState } from '../types';

export const useImageHistory = (initialState: ImageHistoryState) => {
  const [history, setHistory] = useState<ImageHistoryState[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const push = useCallback((newState: ImageHistoryState) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      return [...newHistory, newState];
    });
    setCurrentIndex(prevIndex => prevIndex + 1);
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  }, [currentIndex, history.length]);
  
  const reset = useCallback((state: ImageHistoryState) => {
      setHistory([state]);
      setCurrentIndex(0);
  }, []);

  return {
    current: history[currentIndex],
    push,
    undo,
    redo,
    reset,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  };
};
