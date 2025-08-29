import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from '@/api/axios';

interface UseAudioRecordingReturn {
  isRecording: boolean;
  isLoading: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetAudio: () => void;
  sendRecordedAudio: () => Promise<void>;
}

export const useAudioRecording = (onResult?: (text: string) => void): UseAudioRecordingReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedAudioBlobRef = useRef<Blob | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const lastActivityTimeRef = useRef<number>(0);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isAutoStopRef = useRef<boolean>(false); // Flag pour distinguer arrêt auto vs manuel
  
  const { toast } = useToast();

  // Constantes pour la détection de silence
  const SILENCE_DURATION = 1500; // 1.5 secondes (standard mobile)
  const ACTIVITY_CHECK_INTERVAL = 200; // Vérifier toutes les 200ms

  const sendRecordedAudio = useCallback(async () => {
    if (!recordedAudioBlobRef.current) {
      toast({
        title: "Erreur",
        description: "Aucun audio enregistré à envoyer.",
        variant: "destructive",
      });
      return;
    }

    console.log('Sending audio blob:', {
      size: recordedAudioBlobRef.current.size,
      type: recordedAudioBlobRef.current.type,
      chunks: audioChunksRef.current.length
    });

    if (recordedAudioBlobRef.current.size === 0) {
      toast({
        title: "Erreur",
        description: "L'audio enregistré est vide. Veuillez réenregistrer.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Créer un FormData pour envoyer le fichier audio
      const formData = new FormData();
      formData.append('audio_file', recordedAudioBlobRef.current, 'recording.webm');
      
      console.log('FormData created with audio file:', {
        hasAudioFile: formData.has('audio_file'),
        audioFileSize: recordedAudioBlobRef.current.size
      });

      // Appeler l'API backend avec axios
      const response = await axios.post('/assistant/process_audio_user_request/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = response.data;
      
      if (result.error) {
        throw new Error(result.output?.error || 'Erreur inconnue');
      }

      // Extraire l'URL de l'audio de réponse
      if (result.audio_output_url) {
        toast({
          title: "Réponse vocale",
          description: result.output?.message || "Traitement terminé",
        });
        
        onResult?.(result.output?.message || "");
        
        // Lire automatiquement l'audio de réponse
        const audioResponse = new Audio(result.audio_output_url);
        audioResponse.play().catch(error => {
          console.error('Erreur lors de la lecture de la réponse audio:', error);
          toast({
            title: "Erreur de lecture audio",
            description: "Impossible de lire la réponse audio, mais le texte est disponible.",
            variant: "destructive",
          });
        });
        
        // Réinitialiser l'état
        recordedAudioBlobRef.current = null;
      } else {
        toast({
          title: "Erreur",
          description: "Aucune réponse audio reçue",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'audio. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, onResult]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // L'audio sera envoyé automatiquement dans l'événement onstop
    }
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Créer le MediaRecorder avec une configuration simple
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();
      lastActivityTimeRef.current = Date.now();
      isAutoStopRef.current = false; // Reset du flag

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          lastActivityTimeRef.current = Date.now(); // Mettre à jour le temps de dernière activité
          console.log('Audio chunk received:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = async () => {
        // Nettoyer le timer de silence
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        const recordingDuration = Date.now() - recordingStartTimeRef.current;
        console.log('Recording duration:', recordingDuration, 'ms');
        
        if (recordingDuration < 500) {
          toast({
            title: "Enregistrement trop court",
            description: "L'enregistrement doit durer au moins 500ms. Veuillez réessayer.",
            variant: "destructive",
          });
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Recording stopped. Total chunks:', audioChunksRef.current.length);
        console.log('Audio blob size:', audioBlob.size, 'bytes');
        console.log('Audio chunks sizes:', audioChunksRef.current.map(chunk => chunk.size));
        
        if (audioBlob.size === 0) {
          toast({
            title: "Erreur d'enregistrement",
            description: "L'enregistrement audio est vide. Veuillez réessayer.",
            variant: "destructive",
          });
          return;
        }
        
        // Sauvegarder l'audio enregistré
        recordedAudioBlobRef.current = audioBlob;
        
        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Envoyer automatiquement l'audio dans tous les cas
        console.log('Envoi automatique de l\'audio après arrêt d\'enregistrement');
        setTimeout(() => {
          sendRecordedAudio();
        }, 100);
      };

      // Démarrer l'enregistrement avec des chunks plus fréquents
      mediaRecorder.start(100); // Chunks toutes les 100ms
      setIsRecording(true);
      console.log('Recording started with 100ms chunks and 1.5s silence detection');

      // Démarrer la détection de silence basée sur l'activité des chunks
      const silenceDetectionInterval = setInterval(() => {
        if (!isRecording || !mediaRecorderRef.current) return;
        
        const timeSinceLastActivity = Date.now() - lastActivityTimeRef.current;
        console.log('Time since last audio activity:', timeSinceLastActivity, 'ms');
        
        if (timeSinceLastActivity >= SILENCE_DURATION) {
          console.log('Silence de 1.5s détecté, arrêt automatique de l\'enregistrement');
          clearInterval(silenceDetectionInterval);
          isAutoStopRef.current = true; // Marquer comme arrêt automatique
          stopRecording();
        }
      }, ACTIVITY_CHECK_INTERVAL);

      // Nettoyer l'intervalle quand l'enregistrement s'arrête
      const originalOnStop = mediaRecorder.onstop;
      mediaRecorder.onstop = () => {
        clearInterval(silenceDetectionInterval);
        if (originalOnStop) {
          originalOnStop.call(mediaRecorder);
        }
      };

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone. Vérifiez les permissions.",
        variant: "destructive",
      });
    }
  }, [toast, sendRecordedAudio, stopRecording]);

  const resetAudio = useCallback(() => {
    recordedAudioBlobRef.current = null;
  }, []);

  // Nettoyer les ressources au démontage
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    isRecording,
    isLoading,
    startRecording,
    stopRecording,
    resetAudio,
    sendRecordedAudio,
  };
};
