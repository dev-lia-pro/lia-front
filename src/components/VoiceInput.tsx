import React, { useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
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
    startRecording,
    stopRecording,
  } = useAudioRecording(onResult);

  const handleMicrophoneClick = useCallback(() => {
    if (isRecording) {
      // Si on est en train d'enregistrer, arrêter l'enregistrement (envoi automatique)
      stopRecording();
    } else if (!isLoading) {
      // Sinon, commencer un nouvel enregistrement
      startRecording();
    }
  }, [isRecording, isLoading, stopRecording, startRecording]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <Button
        className={`
          ${className}
          relative w-14 h-14 rounded-full p-0 transition-all duration-200
          ${isRecording 
            ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse' 
            : 'bg-gold hover:bg-gold/90'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          text-navy shadow-lg active:scale-95
        `}
        onClick={handleMicrophoneClick}
        disabled={isLoading}
        title={
          isRecording 
            ? "Cliquez pour arrêter l'enregistrement et envoyer" 
            : "Cliquez pour commencer l'enregistrement (envoi automatique après 1.5s de silence ou clic manuel)"
        }
      >
        {isRecording ? (
          <MicOff className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gold/90 rounded-full">
            <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </Button>
    </div>
  );
};