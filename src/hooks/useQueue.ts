import { useState, useCallback } from 'react';
import type { Video } from '@/types';

export function useQueue() {
  const [queue, setQueue] = useState<Video[]>([]);

  const addToQueue = useCallback((video: Video) => {
    setQueue((prev) => {
      // Avoid duplicates
      if (prev.some((v) => v.id === video.id)) return prev;
      return [...prev, video];
    });
  }, []);

  const addToQueueNext = useCallback((video: Video) => {
    setQueue((prev) => {
      const filtered = prev.filter((v) => v.id !== video.id);
      return [video, ...filtered];
    });
  }, []);

  const removeFromQueue = useCallback((videoId: string) => {
    setQueue((prev) => prev.filter((v) => v.id !== videoId));
  }, []);

  const playNextFromQueue = useCallback((): Video | null => {
    if (queue.length === 0) return null;
    const [next, ...rest] = queue;
    setQueue(rest);
    return next;
  }, [queue]);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      return updated;
    });
  }, []);

  return {
    queue,
    addToQueue,
    addToQueueNext,
    removeFromQueue,
    playNextFromQueue,
    clearQueue,
    reorderQueue,
  };
}
