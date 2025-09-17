import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from '@/api/axios';

interface UseAudioRecordingReturn {
  isRecording: boolean;
  isLoading: boolean;
  audioLevel: number;
  isDesktop: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetAudio: () => void;
  sendRecordedAudio: () => Promise<void>;
}

export const useAudioRecording = (onResult?: (text: string) => void): UseAudioRecordingReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedAudioBlobRef = useRef<Blob | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const maxRecordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();
  
  // Détection desktop/mobile basée sur la largeur d'écran
  const isDesktop = window.innerWidth >= 768; // Breakpoint sm de Tailwind
  
  // Durée maximale d'enregistrement sur mobile (1 minute)
  const MAX_RECORDING_DURATION = 60000; // 60 secondes

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
      type: recordedAudioBlobRef.current.type
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
      formData.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
      
      console.log('FormData created with audio file:', {
        hasAudioFile: formData.has('audio_file'),
        audioFileSize: recordedAudioBlobRef.current.size,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });

      // Appeler l'API backend avec axios
      const response = await axios.post('/assistant-run/process_audio_user_request/', formData, {
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

  // Fonction pour analyser le niveau audio
  const setupAudioAnalyser = useCallback((stream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    
    microphone.connect(analyser);
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
  }, []);

  // Fonction pour monitorer le niveau audio
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isRecording) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const checkAudioLevel = () => {
      if (!analyserRef.current || !isRecording) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculer le niveau moyen
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const normalizedLevel = average / 255;
      
      setAudioLevel(normalizedLevel);
      
      // Continuer le monitoring
      animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
    };
    
    checkAudioLevel();
  }, [isRecording]);

  // Fonction pour vérifier le silence sera définie après stopRecording
  // pour éviter la dépendance circulaire

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording) {
      console.log('No recording to stop');
      return;
    }
    
    console.log('Stopping recording...');
    
    // Arrêter le timer de durée maximale
    if (maxRecordingTimerRef.current) {
      clearTimeout(maxRecordingTimerRef.current);
      maxRecordingTimerRef.current = null;
    }
    
    // Arrêter le monitoring du niveau audio
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Vérifier la durée d'enregistrement
    const recordingDuration = Date.now() - recordingStartTimeRef.current;
    console.log(`Recording duration: ${recordingDuration}ms`);
    
    if (recordingDuration < 500) {
      console.log('Recording too short, cancelling');
      
      // Nettoyer sans envoyer
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      
      setIsRecording(false);
      setAudioLevel(0);
      
      toast({
        title: "Enregistrement trop court",
        description: "Maintenez le bouton plus longtemps ou parlez plus longtemps.",
        variant: "destructive",
      });
      return;
    }
    
    // Arrêter l'enregistrement
    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    setAudioLevel(0);
  }, [isRecording, toast]);

  const startRecording = useCallback(async () => {
    try {
      console.log('Starting recording');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          sampleSize: 24,      // 24 bits pour encore meilleure qualité
          channelCount: 1       // Mono pour éviter les problèmes de phase
        } 
      });
      streamRef.current = stream;
      
      // Configurer l'analyseur audio
      setupAudioAnalyser(stream);
      
      // Réinitialiser les chunks audio
      audioChunksRef.current = [];
      
      // Déterminer le meilleur codec disponible
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus', 
        'audio/webm',
        'audio/mp4',
      ];
      
      let selectedMimeType = 'audio/webm';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('Using mime type:', mimeType);
          break;
        }
      }
      
      // Créer le MediaRecorder avec les meilleures options
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000  // 128 kbps pour haute qualité
      });
      
      // Gérer les données audio
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Gérer la fin de l'enregistrement
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
        if (audioBlob.size > 0) {
          recordedAudioBlobRef.current = audioBlob;
          console.log(`Recording stopped successfully, blob size: ${audioBlob.size} bytes`);
          
          // Envoyer automatiquement après un court délai
          setTimeout(() => {
            sendRecordedAudio();
          }, 100);
        } else {
          console.error('No audio data captured');
          toast({
            title: "Erreur d'enregistrement",
            description: "Aucune donnée audio capturée.",
            variant: "destructive",
          });
        }
        
        // Nettoyer les ressources
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
      };
      
      mediaRecorderRef.current = mediaRecorder;
      recordingStartTimeRef.current = Date.now();
      
      // Démarrer l'enregistrement avec un intervalle de temps pour éviter le hachage
      mediaRecorder.start(100); // Collecter les données toutes les 100ms
      setIsRecording(true);
      
      // Démarrer le monitoring du niveau audio
      setTimeout(() => {
        monitorAudioLevel();
      }, 100);
      
      // Sur mobile uniquement : arrêt automatique après 1 minute
      if (!isDesktop) {
        maxRecordingTimerRef.current = setTimeout(() => {
          console.log('Max recording duration reached (1 minute)');
          stopRecording();
        }, MAX_RECORDING_DURATION);
      }
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone. Vérifiez les permissions.",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  }, [toast, setupAudioAnalyser, monitorAudioLevel, isDesktop, stopRecording, sendRecordedAudio]);

  const resetAudio = useCallback(() => {
    recordedAudioBlobRef.current = null;
  }, []);

  // Nettoyer les ressources au démontage
  useEffect(() => {
    return () => {
      if (maxRecordingTimerRef.current) {
        clearTimeout(maxRecordingTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Redémarrer le monitoring quand isRecording change
  useEffect(() => {
    if (isRecording) {
      monitorAudioLevel();
    }
  }, [isRecording, monitorAudioLevel]);

  return {
    isRecording,
    isLoading,
    audioLevel,
    isDesktop,
    startRecording,
    stopRecording,
    resetAudio,
    sendRecordedAudio,
  };
};
