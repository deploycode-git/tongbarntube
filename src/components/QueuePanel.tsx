import { X, ListEnd, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoCard } from '@/components/VideoCard';
import type { Video } from '@/types';

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Video[];
  onRemove: (videoId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onClear: () => void;
  onPlay: (video: Video) => void;
  t: (key: string) => string;
}

export function QueuePanel({
  isOpen,
  onClose,
  queue,
  onRemove,
  onReorder,
  onClear,
  onPlay,
  t,
}: QueuePanelProps) {
  const moveVideo = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    onReorder(fromIndex, toIndex);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-card border border-border rounded-2xl shadow-2xl z-30 animate-slide-up overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ListEnd className="w-4 h-4 text-primary" />
          <h3 className="font-medium">{t('queue')}</h3>
          <span className="text-xs text-muted-foreground">({queue.length})</span>
        </div>
        <div className="flex items-center gap-1">
          {queue.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              {t('clear')}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Queue List */}
      <div className="max-h-80 overflow-y-auto p-3 space-y-2">
        {queue.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <ListEnd className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('queueEmpty')}</p>
          </div>
        ) : (
          queue.map((video, index) => (
            <div key={video.id} className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5"
                  onClick={() => moveVideo(index, 'up')}
                  disabled={index === 0}
                >
                  <ChevronUp className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5"
                  onClick={() => moveVideo(index, 'down')}
                  disabled={index === queue.length - 1}
                >
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex-1">
                <VideoCard
                  video={video}
                  compact
                  showRemove
                  onPlay={() => onPlay(video)}
                  onRemove={() => onRemove(video.id)}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
