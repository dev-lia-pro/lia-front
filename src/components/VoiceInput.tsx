import React, { useCallback, useRef, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioRecording } from '@/hooks';

interface VoiceInputProps {
  onResult?: (text: string) => void;
  className?: string;
  inTopBar?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onResult, className = '', inTopBar = false }) => {
  const {
    isRecording,
    isLoading,
    audioLevel,
    isDesktop,
    startRecording,
    stopRecording,
  } = useAudioRecording(onResult);
  
  // Double vérification pour éviter les problèmes de détection
  const isMobileDevice = window.innerWidth < 768;

  const isPressedRef = useRef(false);

  // Desktop: clic pour start/stop
  const handleDesktopClick = useCallback(() => {
    if (isLoading) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, isLoading, startRecording, stopRecording]);

  // Mobile: push to talk (hold pour enregistrer, relâcher pour envoyer)
  const handleMobileStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (isLoading || isRecording) return;
    
    isPressedRef.current = true;
    startRecording();
  }, [isLoading, isRecording, startRecording]);

  const handleMobileEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    
    if (isPressedRef.current && isRecording) {
      isPressedRef.current = false;
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  const handleMobileLeave = useCallback(() => {
    if (isPressedRef.current && isRecording) {
      isPressedRef.current = false;
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, []);

  // Styles pour le bouton mobile dans la top bar
  const mobileTopBarStyles = inTopBar ? `
    w-10 h-10 min-w-[40px] max-w-[40px] rounded-full p-0 transition-all duration-200 border-2
    ${isRecording 
      ? 'bg-red-500 hover:bg-red-600 scale-110 border-red-600' 
      : 'border-gold bg-navy-deep hover:bg-navy-muted'
    }
    flex-shrink-0 aspect-square overflow-hidden flex items-center justify-center
  ` : '';

  // Styles pour le bouton flottant (desktop ou mobile hors top bar)
  const floatingButtonStyles = !inTopBar ? `
    relative w-14 h-14 rounded-full p-0 transition-all duration-200
    ${isRecording 
      ? 'bg-red-500 hover:bg-red-600 scale-110' 
      : 'bg-primary hover:bg-primary/90'
    }
    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
    text-primary-foreground shadow-lg
  ` : '';

  // Pour mobile dans la top bar
  if (isMobileDevice && inTopBar) {
    return (
      <Button
        className={`${className} ${mobileTopBarStyles} relative`}
        style={{ width: '40px', height: '40px', minWidth: '40px', maxWidth: '40px' }}
        onTouchStart={handleMobileStart}
        onTouchEnd={handleMobileEnd}
        onTouchCancel={handleMobileEnd}
        onMouseDown={handleMobileStart}
        onMouseUp={handleMobileEnd}
        onMouseLeave={handleMobileLeave}
        disabled={isLoading}
        title="Maintenez pour enregistrer (max 1 minute)"
      >
        {/* Icône ou spinner */}
        {isLoading ? (
          <svg className="w-5 h-5 animate-spin text-gold" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <Mic className={`w-5 h-5 ${isRecording ? 'text-white' : 'text-gold'}`} />
        )}
        
        {/* Simple effet de pulsation quand actif */}
        {isRecording && !isLoading && (
          <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse opacity-30" />
        )}
      </Button>
    );
  }

  // Pour desktop ou mobile hors top bar (bouton flottant)
  const handleClick = isDesktop ? handleDesktopClick : undefined;
  const handleTouchStart = !isDesktop ? handleMobileStart : undefined;
  const handleTouchEnd = !isDesktop ? handleMobileEnd : undefined;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        className={`${className} ${floatingButtonStyles} relative`}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseLeave={!isDesktop ? handleMobileLeave : undefined}
        disabled={isLoading}
        title={
          isDesktop 
            ? (isRecording ? "Cliquez pour arrêter et envoyer" : "Cliquez pour commencer l'enregistrement")
            : "Maintenez pour enregistrer (max 1 minute)"
        }
      >
        {/* Icône ou spinner */}
        {isLoading ? (
          <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <Mic className={`w-6 h-6 ${isRecording ? 'text-white' : ''}`} />
        )}
        
        {/* Effet de pulsation simplifié */}
        {isRecording && !isLoading && (
          <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse opacity-30" />
        )}
      </Button>
    </div>
  );
};