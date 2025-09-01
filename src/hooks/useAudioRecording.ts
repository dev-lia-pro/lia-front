import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from '@/api/axios';
import RecordRTC, { StereoAudioRecorder } from 'recordrtc';

interface UseAudioRecordingReturn {
  isRecording: boolean;
  isLoading: boolean;
  audioLevel: number;
  recordingMode: 'tap' | 'hold' | null;
  startRecording: (mode?: 'tap' | 'hold') => Promise<void>;
  stopRecording: () => void;
  resetAudio: () => void;
  sendRecordedAudio: () => Promise<void>;
}

export const useAudioRecording = (onResult?: (text: string) => void): UseAudioRecordingReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingMode, setRecordingMode] = useState<'tap' | 'hold' | null>(null);
  
  const recorderRef = useRef<RecordRTC | null>(null);
  const recordedAudioBlobRef = useRef<Blob | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // Constantes pour la détection de silence
  const SILENCE_DURATION = 2000; // 2 secondes de silence avant arrêt automatique
  const SILENCE_THRESHOLD = 0.02; // Seuil de détection du silence (ajusté pour être moins sensible)
  const SILENCE_CHECK_INTERVAL = 100; // Vérifier toutes les 100ms

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
    if (!recorderRef.current || !isRecording) {
      console.log('No recording to stop');
      return;
    }
    
    console.log(`Stopping recording in ${recordingMode} mode...`);
    
    // Arrêter le monitoring du silence immédiatement
    if (silenceCheckIntervalRef.current) {
      clearInterval(silenceCheckIntervalRef.current);
      silenceCheckIntervalRef.current = null;
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
      
      recorderRef.current?.destroy();
      recorderRef.current = null;
      
      setIsRecording(false);
      setRecordingMode(null);
      setAudioLevel(0);
      silenceStartRef.current = null;
      
      toast({
        title: "Enregistrement trop court",
        description: "Maintenez le bouton plus longtemps ou parlez plus longtemps.",
        variant: "destructive",
      });
      return;
    }
    
    recorderRef.current.stopRecording(() => {
      const blob = recorderRef.current?.getBlob();
      if (blob && blob.size > 0) {
        recordedAudioBlobRef.current = blob;
        console.log(`Recording stopped successfully, blob size: ${blob.size} bytes`);
        
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
      
      // Détruire le recorder
      recorderRef.current?.destroy();
      recorderRef.current = null;
    });
    
    setIsRecording(false);
    setRecordingMode(null);
    setAudioLevel(0);
    silenceStartRef.current = null;
  }, [isRecording, recordingMode, sendRecordedAudio, toast]);

  // Fonction pour vérifier le silence (mode tap uniquement)
  const checkForSilence = useCallback(() => {
    if (!analyserRef.current || !isRecording || recordingMode !== 'tap') {
      return;
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculer le niveau moyen du signal
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    const normalizedLevel = average / 255;
    
    // Vérifier si c'est du silence
    if (normalizedLevel < SILENCE_THRESHOLD) {
      if (!silenceStartRef.current) {
        silenceStartRef.current = Date.now();
        console.log(`Silence detected (level: ${normalizedLevel.toFixed(3)}), starting timer`);
      } else {
        const silenceDuration = Date.now() - silenceStartRef.current;
        if (silenceDuration >= SILENCE_DURATION) {
          console.log(`${SILENCE_DURATION}ms de silence détecté, arrêt automatique`);
          // Nettoyer l'intervalle avant d'arrêter
          if (silenceCheckIntervalRef.current) {
            clearInterval(silenceCheckIntervalRef.current);
            silenceCheckIntervalRef.current = null;
          }
          stopRecording();
        }
      }
    } else {
      if (silenceStartRef.current) {
        const silenceDuration = Date.now() - silenceStartRef.current;
        console.log(`Sound detected (level: ${normalizedLevel.toFixed(3)}), was silent for ${silenceDuration}ms`);
        silenceStartRef.current = null;
      }
    }
  }, [isRecording, recordingMode, stopRecording]);

  const startRecording = useCallback(async (mode: 'tap' | 'hold' = 'tap') => {
    try {
      console.log(`Starting recording in ${mode} mode`);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      streamRef.current = stream;
      
      // Configurer l'analyseur audio
      setupAudioAnalyser(stream);
      
      // Configuration RecordRTC
      const options: RecordRTC.Options = {
        type: 'audio',
        mimeType: 'audio/webm',
        recorderType: StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
        bufferSize: 16384,
        timeSlice: 100, // Chunks toutes les 100ms
      };
      
      const recorder = new RecordRTC(stream, options);
      recorderRef.current = recorder;
      recordingStartTimeRef.current = Date.now();
      silenceStartRef.current = null;
      
      // Démarrer l'enregistrement
      recorder.startRecording();
      setIsRecording(true);
      setRecordingMode(mode);
      
      // Démarrer le monitoring du niveau audio
      setTimeout(() => {
        monitorAudioLevel();
      }, 100);
      
      // Si mode tap, démarrer la détection de silence après un délai
      if (mode === 'tap') {
        console.log('Starting silence detection for tap mode');
        // Attendre 500ms avant de commencer à détecter le silence
        setTimeout(() => {
          if (isRecording && recordingMode === 'tap') {
            silenceCheckIntervalRef.current = setInterval(() => {
              checkForSilence();
            }, SILENCE_CHECK_INTERVAL);
          }
        }, 500);
      }
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone. Vérifiez les permissions.",
        variant: "destructive",
      });
      setIsRecording(false);
      setRecordingMode(null);
    }
  }, [toast, setupAudioAnalyser, monitorAudioLevel, checkForSilence]);

  const resetAudio = useCallback(() => {
    recordedAudioBlobRef.current = null;
  }, []);

  // Nettoyer les ressources au démontage
  useEffect(() => {
    return () => {
      if (silenceCheckIntervalRef.current) {
        clearInterval(silenceCheckIntervalRef.current);
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
    recordingMode,
    startRecording,
    stopRecording,
    resetAudio,
    sendRecordedAudio,
  };
};
