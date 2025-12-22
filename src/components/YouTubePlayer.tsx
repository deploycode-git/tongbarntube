import { useRef, useState, useEffect, useCallback } from 'react';
import { Copy, ListEnd, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getVideoThumbnail, extractVideoId } from '@/utils/youtube';
import { cn } from '@/lib/utils';
import type { Video } from '@/types';

// Add global type for YouTube Iframe API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  playlistId?: string | null;
  onVideoEnd?: () => void;
  onOpenQueue?: () => void;
  onAddToQueue?: (video: Video) => void;
  queueCount?: number;
  t?: (key: string) => string;
  onVideoPlay?: (videoId: string) => void;
  onColorChange?: (color: string) => void;
}

export function YouTubePlayer({
  videoId,
  playlistId,
  onVideoEnd,
  onOpenQueue,
  onAddToQueue,
  queueCount = 0,
  t = (key) => key,
  onVideoPlay,
  onColorChange,
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State to track the ACTUAL playing video (syncs with internal player)
  const [currentVideoId, setCurrentVideoId] = useState(videoId);

  const [showCopied, setShowCopied] = useState(false);
  const [dominantColor, setDominantColor] = useState<string>('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // Sync currentVideoId with prop when prop changes (external navigation)
  useEffect(() => {
    if (videoId !== currentVideoId) {
      setCurrentVideoId(videoId);
    }
  }, [videoId, currentVideoId]);

  // Initialize YouTube Player ONCE
  useEffect(() => {
    // Load YouTube IFrame Player API code asynchronously
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!containerRef.current) return;

      // Clean up previous instance if exists
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) { }
      }

      const playerOptions: any = {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          listType: playlistId ? 'playlist' : undefined,
          list: playlistId || undefined,
        },
        events: {
          onReady: (event: any) => {
            // Player ready
          },
          onStateChange: (event: any) => {
            // Sync internal video ID whenever state changes (e.g. playlist advances)
            if (playerRef.current && typeof playerRef.current.getVideoData === 'function') {
              const data = playerRef.current.getVideoData();
              const playingId = data?.video_id;

              // Only update if the playing ID differs from our current state
              if (playingId && playingId !== currentVideoId) {
                setCurrentVideoId(playingId);
                // Notify parent that video changed
                onVideoPlay?.(playingId);
              }
            }

            // YT.PlayerState.ENDED is 0
            if (event.data === 0) {
              onVideoEnd?.();
            }
          }
        }
      };

      playerRef.current = new window.YT.Player(containerRef.current, playerOptions);
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) { console.error(e); }
      }
    };
  }, []); // Only initialize once

  // When videoId/playlistId changes externally, load new video
  useEffect(() => {
    if (playerRef.current && playerRef.current.loadVideoById && videoId !== currentVideoId) {
      if (playlistId) {
        // Load playlist
        playerRef.current.loadPlaylist({
          listType: 'playlist',
          list: playlistId,
          index: 0
        });
      } else {
        // Load single video
        playerRef.current.loadVideoById(videoId);
      }
    }
  }, [videoId, playlistId, currentVideoId]);

  // Extract dominant color from thumbnail
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = getVideoThumbnail(currentVideoId, 'maxres'); // Use currentVideoId

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Sample colors
        const regions = [
          { x: 0, y: 0, w: canvas.width / 3, h: canvas.height / 3 },
          { x: canvas.width / 3, y: 0, w: canvas.width / 3, h: canvas.height / 3 },
          { x: canvas.width * 2 / 3, y: 0, w: canvas.width / 3, h: canvas.height / 3 },
        ];

        let totalR = 0, totalG = 0, totalB = 0, sampleCount = 0;

        regions.forEach(region => {
          const imageData = ctx.getImageData(region.x, region.y, region.w, region.h);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 16) {
            totalR += data[i];
            totalG += data[i + 1];
            totalB += data[i + 2];
            sampleCount++;
          }
        });

        const avgR = Math.round(totalR / sampleCount);
        const avgG = Math.round(totalG / sampleCount);
        const avgB = Math.round(totalB / sampleCount);

        const newColor = `${avgR}, ${avgG}, ${avgB}`;
        setDominantColor(newColor);
        onColorChange?.(newColor);
      } catch (e) {
        setDominantColor('239, 68, 68');
        onColorChange?.('239, 68, 68');
      }
    };

    img.onerror = () => {
      setDominantColor('239, 68, 68');
      onColorChange?.('239, 68, 68');
    };
  }, [currentVideoId]); // Update glow when currentVideoId changes

  const handleCopyUrl = () => {
    // Copy the CURRENT video ID, not the prop ID
    navigator.clipboard.writeText(`https://youtube.com/watch?v=${currentVideoId}`);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleAddToQueue = () => {
    if (!urlInput.trim()) return;

    const extractedId = extractVideoId(urlInput);
    if (!extractedId) return;

    const video: Video = {
      id: extractedId,
      thumbnail: getVideoThumbnail(extractedId),
      url: urlInput.trim(),
      addedAt: Date.now(),
    };

    onAddToQueue?.(video);
    setUrlInput('');
    setShowAddInput(false);
  };

  return (
    <div className="relative w-full">
      {/* Video Container with dynamic glow in dark mode */}
      <div
        className={cn(
          "relative w-full rounded-xl overflow-hidden",
          "dark:ring-1 dark:ring-white/10",
          "transition-all duration-500"
        )}
        style={{
          boxShadow: dominantColor
            ? `0 0 80px rgba(${dominantColor}, 0.3), 0 0 30px rgba(${dominantColor}, 0.2)`
            : undefined
        }}
      >
        {/* Ambient glow effect */}
        <div
          className="absolute -inset-2 rounded-xl blur-2xl opacity-0 dark:opacity-60 transition-opacity duration-500 pointer-events-none"
          style={{
            background: dominantColor
              ? `radial-gradient(circle, rgba(${dominantColor}, 0.4) 0%, transparent 70%)`
              : undefined
          }}
        />

        <div className="relative aspect-video w-full bg-foreground/5 rounded-xl overflow-hidden">
          {/* This div will be replaced by the YouTube IFrame API */}
          <div ref={containerRef} className="absolute inset-0 w-full h-full" />
        </div>
      </div>

      {/* Compact URL bar */}
      <div className="mt-3 flex items-center gap-2">
        {/* Thumbnail + Copy */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-card/80 backdrop-blur-xl border border-border/50">
          <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-muted">
            <img
              src={getVideoThumbnail(currentVideoId, 'default')}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyUrl}
            className="relative h-7 w-7"
            title="Copy URL"
          >
            <Copy className="w-3.5 h-3.5" />
            {showCopied && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-xs rounded whitespace-nowrap animate-fade-in">
                Copied!
              </span>
            )}
          </Button>
        </div>

        {/* Add to Queue */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowAddInput(!showAddInput)}
          title={t('addToQueue')}
          className="h-8 w-8"
        >
          <Plus className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenQueue}
          title={t('queue')}
          className="h-8 w-8 relative"
        >
          <ListEnd className="w-4 h-4" />
          {queueCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] bg-primary text-primary-foreground rounded-full flex items-center justify-center">
              {queueCount}
            </span>
          )}
        </Button>
      </div>

      {/* Add to Queue Input */}
      {showAddInput && (
        <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-card/80 backdrop-blur-xl border border-border/50">
          <Input
            placeholder={t('pasteUrl')}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddToQueue()}
            className="flex-1 h-8 text-sm"
            autoFocus
          />
          <Button size="sm" className="h-8" onClick={handleAddToQueue} disabled={!urlInput.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={() => { setShowAddInput(false); setUrlInput(''); }}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
