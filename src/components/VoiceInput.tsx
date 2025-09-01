import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioRecording } from '@/hooks';

interface VoiceInputProps {
  onResult?: (text: string) => void;
  className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onResult, className = '' }) => {
  const {
    isRecording,
    isLoading,
    audioLevel,
    recordingMode,
    startRecording,
    stopRecording,
  } = useAudioRecording(onResult);

  const [isPressed, setIsPressed] = useState(false);
  const pressStartTimeRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldModeRef = useRef(false);
  
  const LONG_PRESS_THRESHOLD = 300; // 300ms pour différencier tap vs hold

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    // Si on est déjà en train d'enregistrer en mode tap
    if (isRecording && recordingMode === 'tap') {
      console.log('Manual stop in tap mode');
      stopRecording();
      return;
    }
    
    // Si on est déjà en train d'enregistrer en mode hold, on ignore
    if (isRecording && recordingMode === 'hold') {
      return;
    }
    
    setIsPressed(true);
    pressStartTimeRef.current = Date.now();
    isHoldModeRef.current = false;
    
    // Timer pour détecter le maintien prolongé
    longPressTimerRef.current = setTimeout(() => {
      if (!isRecording && !isLoading) {
        console.log('Long press detected - starting hold mode');
        isHoldModeRef.current = true;
        startRecording('hold');
      }
    }, LONG_PRESS_THRESHOLD);
  }, [isRecording, isLoading, recordingMode, stopRecording, startRecording]);

  const handleMouseUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    
    setIsPressed(false);
    
    // Nettoyer le timer de long press
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    const pressDuration = pressStartTimeRef.current ? Date.now() - pressStartTimeRef.current : 0;
    
    // Si on est en mode hold et en train d'enregistrer, arrêter et envoyer
    if (isRecording && recordingMode === 'hold') {
      console.log('Releasing hold - stopping and sending');
      stopRecording();
    } 
    // Si c'était un tap court et qu'on n'est pas en train d'enregistrer
    else if (!isRecording && !isHoldModeRef.current && pressDuration < LONG_PRESS_THRESHOLD) {
      console.log(`Short tap detected (${pressDuration}ms) - starting tap mode`);
      startRecording('tap');
    }
    
    pressStartTimeRef.current = null;
    isHoldModeRef.current = false;
  }, [isRecording, recordingMode, stopRecording, startRecording]);

  const handleMouseLeave = useCallback(() => {
    // Si l'utilisateur sort du bouton pendant le maintien
    if (isPressed) {
      // Nettoyer le timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      
      // Si on est en mode hold, arrêter l'enregistrement
      if (isRecording && recordingMode === 'hold') {
        console.log('Mouse left while holding - stopping recording');
        stopRecording();
      }
      
      setIsPressed(false);
      pressStartTimeRef.current = null;
      isHoldModeRef.current = false;
    }
  }, [isPressed, isRecording, recordingMode, stopRecording]);

  // Nettoyer les timers au démontage
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Fonction pour générer les barres d'animation du niveau audio
  const renderAudioBars = () => {
    if (!isRecording) return null;
    
    const barCount = 5;
    const bars = [];
    
    for (let i = 0; i < barCount; i++) {
      const delay = i * 0.05;
      const height = audioLevel * 100 * (0.5 + Math.random() * 0.5);
      
      bars.push(
        <div
          key={i}
          className="w-1 bg-white rounded-full transition-all duration-100"
          style={{
            height: `${Math.max(4, height)}%`,
            animationDelay: `${delay}s`,
            opacity: 0.6 + audioLevel * 0.4
          }}
        />
      );
    }
    
    return (
      <div className="absolute inset-0 flex items-center justify-center gap-0.5 p-3">
        {bars}
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Indicateur de niveau audio */}
      {isRecording && (
        <div className="bg-background/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg animate-in slide-in-from-bottom-2">
          <Volume2 className="w-4 h-4 text-primary" />
          <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-100"
              style={{ width: `${audioLevel * 100}%` }}
            />
          </div>
        </div>
      )}

      <Button
        className={`
          ${className}
          relative w-14 h-14 rounded-full p-0 transition-all duration-200 overflow-hidden
          ${isRecording 
            ? 'bg-red-500 hover:bg-red-600 scale-110' 
            : isPressed
              ? 'bg-primary/80 scale-95'
              : 'bg-primary hover:bg-primary/90'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          text-primary-foreground shadow-lg active:scale-95
        `}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        disabled={isLoading}
        title={
          isRecording 
            ? recordingMode === 'hold' 
              ? "Relâchez pour arrêter et envoyer" 
              : "Cliquez pour arrêter et envoyer (ou attendez le silence)"
            : "Tap: clic puis silence ou reclic | Hold: maintenir puis relâcher"
        }
      >
        {/* Barres de visualisation audio */}
        {isRecording && renderAudioBars()}
        
        {/* Icône du microphone */}
        <div className={`relative z-10 ${isRecording ? 'opacity-0' : ''}`}>
          {isRecording ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </div>
        
        {/* Effet de pulsation amélioré */}
        {isRecording && (
          <>
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
            <div 
              className="absolute inset-0 bg-red-400 rounded-full animate-pulse"
              style={{ animationDuration: '1s' }}
            />
          </>
        )}
        
        {/* Indicateur de mode */}
        {isRecording && recordingMode && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
            <span className="text-[8px] font-bold text-red-500">
              {recordingMode === 'hold' ? 'H' : 'T'}
            </span>
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/90 rounded-full">
            <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </Button>
    </div>
  );
};