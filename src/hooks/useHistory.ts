import { useState, useEffect, useCallback } from 'react';
import type { HistoryItem, Video } from '@/types';

const HISTORY_KEY = 'tongbarntube-history';
const MAX_HISTORY_ITEMS = 20;

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const addToHistory = useCallback((video: Video) => {
    setHistory((prev) => {
      // Remove existing entry for this video
      const filtered = prev.filter((item) => item.id !== video.id);
      
      // Add to beginning with timestamp
      const newItem: HistoryItem = {
        ...video,
        watchedAt: Date.now(),
      };
      
      const updated = [newItem, ...filtered];
      
      // Keep only last MAX_HISTORY_ITEMS
      return updated.slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  const removeFromHistory = useCallback((videoId: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== videoId));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
