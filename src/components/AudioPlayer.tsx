import React, { useState, useRef, useCallback } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioPlayerProps {
  audioUrl?: string;
  label: string;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, label, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, audioUrl]);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  if (!audioUrl) {
    return (
      <div className={`flex items-center gap-2 text-foreground/50 ${className}`}>
        <Volume2 className="w-4 h-4" />
        <span className="text-sm">{label}: Non disponible</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        onClick={togglePlayback}
        size="sm"
        variant="outline"
        className="w-8 h-8 p-0"
        disabled={!audioUrl}
      >
        {isPlaying ? (
          <Pause className="w-3 h-3" />
        ) : (
          <Play className="w-3 h-3" />
        )}
      </Button>
      <span className="text-sm text-foreground">{label}</span>
      
      {/* Élément audio caché */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={handleAudioEnded}
        style={{ display: 'none' }}
      />
    </div>
  );
};
