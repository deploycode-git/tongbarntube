import { useRef, useState, useEffect } from 'react';
import { Copy, ListEnd, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getEmbedUrl, getVideoThumbnail, extractVideoId, extractPlaylistId } from '@/utils/youtube';
import { cn } from '@/lib/utils';
import type { Video } from '@/types';

interface YouTubePlayerProps {
  videoId: string;
  playlistId?: string | null;
  onVideoEnd?: () => void;
  onOpenQueue?: () => void;
  onAddToQueue?: (video: Video) => void;
  queueCount?: number;
  t?: (key: string) => string;
}

export function YouTubePlayer({
  videoId,
  playlistId,
  onVideoEnd,
  onOpenQueue,
  onAddToQueue,
  queueCount = 0,
  t = (key) => key,
}: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showCopied, setShowCopied] = useState(false);
  const [dominantColor, setDominantColor] = useState<string>('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // Extract dominant color from thumbnail
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = getVideoThumbnail(videoId, 'maxres');
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Sample colors from different regions
        const regions = [
          { x: 0, y: 0, w: canvas.width / 3, h: canvas.height / 3 },
          { x: canvas.width / 3, y: 0, w: canvas.width / 3, h: canvas.height / 3 },
          { x: canvas.width * 2 / 3, y: 0, w: canvas.width / 3, h: canvas.height / 3 },
        ];
        
        let totalR = 0, totalG = 0, totalB = 0, sampleCount = 0;
        
        regions.forEach(region => {
          const imageData = ctx.getImageData(region.x, region.y, region.w, region.h);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 16) { // Sample every 16th pixel
            totalR += data[i];
            totalG += data[i + 1];
            totalB += data[i + 2];
            sampleCount++;
          }
        });
        
        const avgR = Math.round(totalR / sampleCount);
        const avgG = Math.round(totalG / sampleCount);
        const avgB = Math.round(totalB / sampleCount);
        
        setDominantColor(`${avgR}, ${avgG}, ${avgB}`);
      } catch (e) {
        // CORS error fallback
        setDominantColor('239, 68, 68');
      }
    };
    
    img.onerror = () => {
      setDominantColor('239, 68, 68');
    };
  }, [videoId]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`https://youtube.com/watch?v=${videoId}`);
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
          <iframe
            ref={iframeRef}
            src={getEmbedUrl(videoId, playlistId)}
            title="YouTube video player"
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>

      {/* Compact URL bar */}
      <div className="mt-3 flex items-center gap-2">
        {/* Thumbnail + Copy */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-card/80 backdrop-blur-xl border border-border/50">
          <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-muted">
            <img 
              src={getVideoThumbnail(videoId, 'default')} 
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
