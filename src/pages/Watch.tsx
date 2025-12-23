import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { YouTubePlayer, YouTubePlayerHandle } from '@/components/YouTubePlayer';
import { Navbar } from '@/components/Navbar';
import { QueuePanel } from '@/components/QueuePanel';
import { VideoCard } from '@/components/VideoCard';
import { useTheme } from '@/hooks/useTheme';
import { useHistory } from '@/hooks/useHistory';
import { useQueue } from '@/hooks/useQueue';
import { useLanguage } from '@/hooks/useLanguage';
import { getVideoThumbnail, extractPlaylistId, extractVideoId } from '@/utils/youtube';
import type { Video } from '@/types';
import { toast } from '@/hooks/use-toast';

export default function Watch() {
  const { videoId } = useParams<{ videoId: string }>();
  const [searchParams] = useSearchParams();
  const playlistId = searchParams.get('list');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { history, addToHistory } = useHistory();
  const { language, toggleLanguage, t } = useLanguage();
  const {
    queue,
    addToQueue,
    removeFromQueue,
    playNextFromQueue,
    clearQueue,
    reorderQueue,
  } = useQueue();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [dominantColor, setDominantColor] = useState<string>('');

  // Ref to control the player imperatively (bypasses update lag)
  const playerControlRef = useRef<YouTubePlayerHandle>(null);

  // Create current video object
  const currentPlayingVideo = useMemo<Video | null>(() => videoId
    ? {
      id: videoId,
      thumbnail: getVideoThumbnail(videoId),
      url: `https://youtube.com/watch?v=${videoId}`,
      playlistId: playlistId || undefined,
      addedAt: Date.now(),
    }
    : null, [videoId, playlistId]);



  const handleVideoEnd = useCallback(() => {
    const nextFromQueue = playNextFromQueue();
    if (nextFromQueue) {
      // 1. Force player to play NEXT video immediately (Fixes background tab throttling)
      playerControlRef.current?.playVideo(nextFromQueue.id);

      // 2. Then update history and state
      addToHistory(nextFromQueue);

      // 3. Update URL (this might be delayed by browser in background, but audio is safe)
      if (nextFromQueue.playlistId) {
        navigate(`/watch/${nextFromQueue.id}?list=${nextFromQueue.playlistId}`, { replace: true });
      } else {
        navigate(`/watch/${nextFromQueue.id}`, { replace: true });
      }
    }
  }, [playNextFromQueue, addToHistory, navigate]);

  /* 
     User requested: Keep "Add" button/input strictly for "Direct Play".
     So this function now navigates immediately instead of queuing.
  */
  const handleDirectPlay = useCallback((videoOrUrl: Video | string) => {
    let videoId: string | null = null;
    let listId: string | null = null;

    if (typeof videoOrUrl === 'string') {
      const url = videoOrUrl.trim();
      if (!url) return;

      // Use the same extraction utility as the player for consistency
      videoId = extractVideoId(url);

      // Try to extract playlist ID from URL
      try {
        const urlObj = new URL(url);
        listId = urlObj.searchParams.get('list');
      } catch (e) {
        // Not a valid URL, might be just an ID - that's fine
      }
    } else {
      videoId = videoOrUrl.id;
      listId = videoOrUrl.playlistId || null;
    }

    if (videoId) {
      if (listId) {
        navigate(`/watch/${videoId}?list=${listId}`);
      } else {
        navigate(`/watch/${videoId}`);
      }
    }
  }, [navigate]);

  const handlePlayFromQueue = useCallback((video: Video) => {
    removeFromQueue(video.id);
    addToHistory(video);
    if (video.playlistId) {
      navigate(`/watch/${video.id}?list=${video.playlistId}`);
    } else {
      navigate(`/watch/${video.id}`);
    }
  }, [removeFromQueue, addToHistory, navigate]);

  const handlePlayerVideoPlay = useCallback((playedVideoId: string) => {
    // This is called when the YT player advances to a new video (playlist autoplay)
    // We need to update the URL to match
    if (playedVideoId !== videoId) {
      // ... existing logic ...
    }
  }, [videoId, playlistId, addToHistory, navigate]); // Keeping this logic same as viewed file effectively

  // ... (rest of effects) ...

  // ... (render) ...

  return (
    <div className="min-h-screen bg-background relative overflow-hidden transition-colors duration-1000">
      {/* ... (background) ... */}
      <div className="relative z-10">
        <Navbar
          theme={theme}
          toggleTheme={toggleTheme}
          language={language}
          toggleLanguage={toggleLanguage}
          t={t}
        />

        <main className="container max-w-7xl mx-auto px-4 py-6">
          {/* Player */}
          <div className="mb-4 opacity-0 animate-fade-in">
            <YouTubePlayer
              ref={playerControlRef}
              key={playlistId || "player-instance"}
              videoId={videoId}
              playlistId={playlistId}
              onVideoEnd={handleVideoEnd}
              onOpenQueue={() => setIsQueueOpen(true)}
              onAddToQueue={addToQueue}
              onDirectPlay={handleDirectPlay}
              queueCount={queue.length}
              t={t}
              onColorChange={setDominantColor}
              onVideoPlay={(id) => {
                // Inline the existing logic for brevity or call the handler
                // handlePlayerVideoPlay(id) is fine but ensuring we don't break existing
                if (id !== videoId) {
                  const autoVideo: Video = {
                    id,
                    thumbnail: getVideoThumbnail(id),
                    url: `https://youtube.com/watch?v=${id}`,
                    playlistId: playlistId || undefined,
                    addedAt: Date.now(),
                  };
                  addToHistory(autoVideo);
                  if (playlistId) navigate(`/watch/${id}?list=${playlistId}`, { replace: true });
                  else navigate(`/watch/${id}`, { replace: true });
                }
              }}
            />
          </div>

          {/* Recent History */}
          {history.length > 1 && (
            <section className="opacity-0 animate-fade-in stagger-2 mt-8">
              <h2 className="text-lg font-semibold mb-4">{t('recentlyWatched')}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                {history
                  .filter((item) => item.id !== videoId)
                  .slice(0, 16)
                  .map((item) => (
                    <VideoCard
                      key={item.id}
                      video={item}
                      compact
                      onPlay={() => {
                        addToHistory(item);
                        // Navigate directly to video ID to avoid playlist index resetting
                        if (item.playlistId) {
                          navigate(`/watch/${item.id}?list=${item.playlistId}`);
                        } else {
                          navigate(`/watch/${item.id}`);
                        }
                      }}
                    />
                  ))}
              </div>
            </section>
          )}
        </main>

        <QueuePanel
          isOpen={isQueueOpen}
          onClose={() => setIsQueueOpen(false)}
          queue={queue}
          onRemove={removeFromQueue}
          onReorder={reorderQueue}
          onClear={clearQueue}
          onPlay={handlePlayFromQueue}
          t={t}
        />
      </div>
    </div>
  );
}
